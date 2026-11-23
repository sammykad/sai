from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import re
import uuid
import logging
import ipaddress
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import bcrypt
import jwt
import httpx
import requests
from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Depends, UploadFile, File
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ---------- Auth ----------

JWT_ALGORITHM = "HS256"


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email,
               "exp": datetime.now(timezone.utc) + timedelta(minutes=15), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def seed_admin():
    admin_email = os.environ["ADMIN_EMAIL"].lower().strip()
    admin_password = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Studio Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Admin user seeded")


class LoginInput(BaseModel):
    email: str
    password: str


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


@api_router.post("/auth/login")
async def login(payload: LoginInput, request: Request, response: Response):
    email = payload.email.lower().strip()
    identifier = f"{request.client.host}:{email}"
    now = datetime.now(timezone.utc)
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("lockout_until"):
        lu = attempt["lockout_until"]
        if isinstance(lu, str):
            lu = datetime.fromisoformat(lu)
        if lu > now:
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        count = (attempt or {}).get("count", 0) + 1
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$set": {"identifier": identifier, "count": count,
                      "lockout_until": (now + timedelta(minutes=15)).isoformat() if count >= 5 else None}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.login_attempts.delete_one({"identifier": identifier})
    response.set_cookie(key="access_token", value=create_access_token(user["id"], email),
                        httponly=True, secure=True, samesite="none", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=create_refresh_token(user["id"]),
                        httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return {"email": email, "name": user.get("name", "Admin"), "role": user.get("role", "admin")}


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"success": True}


@api_router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return {"email": user["email"], "name": user.get("name"), "role": user.get("role")}


@api_router.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = await db.users.find_one({"id": payload["sub"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    response.set_cookie(key="access_token", value=create_access_token(user["id"], user["email"]),
                        httponly=True, secure=True, samesite="none", max_age=900, path="/")
    return {"success": True}


@api_router.post("/auth/change-password")
async def change_password(payload: PasswordChange, user=Depends(get_current_user)):
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
    record = await db.users.find_one({"id": user["id"]})
    if not record or not verify_password(payload.current_password, record["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    await db.users.update_one({"id": user["id"]},
                              {"$set": {"password_hash": hash_password(payload.new_password)}})
    logger.info(f"Password changed for {user['email']}")
    return {"success": True}

# ---------- Object Storage (Emergent managed) ----------

STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "sai-studio"
storage_key = None


def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120,
    )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    if resp.status_code == 404:
        init_storage(force=True)
        resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": storage_key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_UPLOAD_BYTES = 8 * 1024 * 1024


@api_router.get("/files/{path:path}")
async def download_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        data, content_type = get_object(path)
    except Exception:
        raise HTTPException(status_code=404, detail="File not found in storage")
    return Response(content=data, media_type=record.get("content_type", content_type))

# ---------- Projects ----------


class ProjectInput(BaseModel):
    title: str
    category: str
    location: Optional[str] = ""
    year: Optional[str] = ""
    area: Optional[str] = ""
    description: Optional[str] = ""


class Project(ProjectInput):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    image: str = ""
    storage_path: Optional[str] = None
    order: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ReorderInput(BaseModel):
    ids: List[str]


SEED_PROJECTS = [
    {"id": "proj-1", "title": "The Sahyadri Courtyard Pavilion", "category": "Residential",
     "location": "Pune, MH", "year": "2025", "area": "6,500 sq.ft", "order": 1,
     "image": "https://images.unsplash.com/photo-1647341159891-302156d1bbdf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBsdXh1cnklMjBpbnRlcmlvciUyMGFyY2hpdGVjdHVyZSUyMGNvdXJ0eWFyZCUyMHN0b25lJTIwd29vZHxlbnwwfHx8fDE3OTE0ODc1ODJ8MA&ixlib=rb-4.1.0&q=85",
     "description": "A climate-responsive bungalow utilizing basalt stone masonry and deep shaded verandas to naturally cool internal spaces during Maharashtrian summers."},
    {"id": "proj-2", "title": "Solapur Textural Concrete Villa", "category": "Commercial",
     "location": "Solapur, MH", "year": "2024", "area": "12,000 sq.ft", "order": 2,
     "image": "https://images.unsplash.com/photo-1614595737476-42487331b8a1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBhcmNoaXRlY3R1cmFsJTIwY29uY3JldGUlMjBleHRlcmlvciUyMGJydXRhbGlzdCUyMGJ1aWxkaW5nfGVufDB8fHx8MTc5MTQ4NzU4Mnww&ixlib=rb-4.1.0&q=85",
     "description": "Raw board-formed concrete shuttering integrated with terracotta jali screens for ventilation and glare control."},
    {"id": "proj-3", "title": "Sambhajinagar Heritage Cultural Hub", "category": "Cultural",
     "location": "Chh. Sambhajinagar, MH", "year": "2025", "area": "24,000 sq.ft", "order": 3,
     "image": "https://images.unsplash.com/photo-1614595737683-1740e41bfaac?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHw0fHxtb2Rlcm4lMjBhcmNoaXRlY3R1cmFsJTIwY29uY3JldGUlMjBleHRlcmlvciUyMGJydXRhbGlzdCUyMGJ1aWxkaW5nfGVufDB8fHx8MTc5MTQ4NzU4Mnww&ixlib=rb-4.1.0&q=85",
     "description": "Modern urban cultural center celebrating Deccan architectural heritage through contemporary geometric skylights and open-air plazas."},
    {"id": "proj-4", "title": "Veranda Stone Patio Residence", "category": "Residential",
     "location": "Pune, MH", "year": "2023", "area": "4,800 sq.ft", "order": 4,
     "image": "https://images.unsplash.com/photo-1786204685672-e344095e5b49?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBsdXh1cnklMjBpbnRlcmlvciUyMGFyY2hpdGVjdHVyZSUyMGNvdXJ0eWFyZCUyMHN0b25lJTIwd29vZHxlbnwwfHx8fDE3OTE0ODc1ODJ8MA&ixlib=rb-4.1.0&q=85",
     "description": "Seamless indoors-to-outdoors living space using locally quarried slate floors and teak louvers."},
    {"id": "proj-5", "title": "Deccan Atrium Business Center", "category": "Commercial",
     "location": "Solapur, MH", "year": "2024", "area": "18,500 sq.ft", "order": 5,
     "image": "https://images.unsplash.com/photo-1746173098001-2ae330a6a763?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHw0fHxtb2Rlcm4lMjBsdXh1cnklMjBpbnRlcmlvciUyMGFyY2hpdGVjdHVyZSUyMGNvdXJ0eWFyZCUyMHN0b25lJTIwd29vZHxlbnwwfHx8fDE3OTE0ODc1ODJ8MA&ixlib=rb-4.1.0&q=85",
     "description": "High-density workplace featuring a central green courtyard chimney effect for low-energy air exchange."},
]


async def seed_projects():
    if await db.projects.count_documents({}) == 0:
        now = datetime.now(timezone.utc).isoformat()
        await db.projects.insert_many([
            {**p, "storage_path": None, "created_at": now} for p in SEED_PROJECTS
        ])
        logger.info("Seeded 5 portfolio projects")


@api_router.get("/projects", response_model=List[Project])
async def list_projects():
    return await db.projects.find({}, {"_id": 0}).sort("order", 1).to_list(200)


@api_router.post("/projects", response_model=Project)
async def create_project(payload: ProjectInput, user=Depends(get_current_user)):
    top = await db.projects.find({}, {"_id": 0, "order": 1}).sort("order", -1).limit(1).to_list(1)
    project = Project(**payload.model_dump(), order=(top[0]["order"] + 1 if top else 1))
    await db.projects.insert_one(project.model_dump())
    return project


@api_router.post("/projects/reorder")
async def reorder_projects(payload: ReorderInput, user=Depends(get_current_user)):
    for i, pid in enumerate(payload.ids, start=1):
        await db.projects.update_one({"id": pid}, {"$set": {"order": i}})
    return {"success": True}


@api_router.patch("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, payload: ProjectInput, user=Depends(get_current_user)):
    res = await db.projects.update_one({"id": project_id}, {"$set": payload.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return await db.projects.find_one({"id": project_id}, {"_id": 0})


@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, user=Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.get("storage_path"):
        await db.files.update_one({"storage_path": project["storage_path"]},
                                  {"$set": {"is_deleted": True}})
    await db.projects.delete_one({"id": project_id})
    return {"success": True}


@api_router.post("/projects/{project_id}/image", response_model=Project)
async def upload_project_image(project_id: str, file: UploadFile = File(...),
                               user=Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, WEBP or GIF images are allowed")
    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="Image must be under 8 MB")
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    path = f"{APP_NAME}/projects/{project_id}/{uuid.uuid4()}.{ext}"
    try:
        result = put_object(path, data, content_type)
    except Exception as e:
        logger.error(f"Storage upload failed: {e}")
        raise HTTPException(status_code=502, detail="Upload to storage failed")
    if project.get("storage_path"):
        await db.files.update_one({"storage_path": project["storage_path"]},
                                  {"$set": {"is_deleted": True}})
    await db.files.insert_one({
        "id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": content_type,
        "size": result["size"],
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await db.projects.update_one({"id": project_id}, {"$set": {"storage_path": result["path"]}})
    return await db.projects.find_one({"id": project_id}, {"_id": 0})

# ---------- Site Settings ----------


async def _store_upload(file: UploadFile, path_prefix: str) -> dict:
    content_type = file.content_type or "application/octet-stream"
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, WEBP or GIF images are allowed")
    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="Image must be under 8 MB")
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    path = f"{APP_NAME}/{path_prefix}/{uuid.uuid4()}.{ext}"
    try:
        result = put_object(path, data, content_type)
    except Exception as e:
        logger.error(f"Storage upload failed: {e}")
        raise HTTPException(status_code=502, detail="Upload to storage failed")
    await db.files.insert_one({
        "id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": content_type,
        "size": result["size"],
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return result


IMAGE_SLOTS = ("hero", "founder", "studio")


@api_router.get("/settings")
async def get_settings():
    doc = await db.site_settings.find_one({"key": "site"}, {"_id": 0})
    return doc or {"key": "site", "hero_image_path": None,
                   "founder_image_path": None, "studio_image_path": None}


@api_router.post("/settings/image/{slot}")
async def upload_site_image(slot: str, file: UploadFile = File(...), user=Depends(get_current_user)):
    if slot not in IMAGE_SLOTS:
        raise HTTPException(status_code=400, detail="Unknown image slot")
    result = await _store_upload(file, "site")
    field = f"{slot}_image_path"
    old = await db.site_settings.find_one({"key": "site"})
    if old and old.get(field):
        await db.files.update_one({"storage_path": old[field]}, {"$set": {"is_deleted": True}})
    await db.site_settings.update_one({"key": "site"},
                                      {"$set": {"key": "site", field: result["path"]}}, upsert=True)
    return {field: result["path"]}


@api_router.delete("/settings/image/{slot}")
async def reset_site_image(slot: str, user=Depends(get_current_user)):
    if slot not in IMAGE_SLOTS:
        raise HTTPException(status_code=400, detail="Unknown image slot")
    field = f"{slot}_image_path"
    old = await db.site_settings.find_one({"key": "site"})
    if old and old.get(field):
        await db.files.update_one({"storage_path": old[field]}, {"$set": {"is_deleted": True}})
    await db.site_settings.update_one({"key": "site"}, {"$set": {field: None}}, upsert=True)
    return {"success": True}

# ---------- Email (Emergent managed Resend proxy) ----------

EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ["EMERGENT_EMAIL_KEY"]
EMAIL_FROM_NAME = os.environ["EMAIL_FROM_NAME"]
OWNER_EMAIL = os.environ.get("OWNER_EMAIL", "")

_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan()
    scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} != real link host {real!r} (G3)")


async def send_email(*, to: str, subject: str, html: str) -> Optional[str]:
    _assert_safe_email(subject, html)
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    try:
        async with httpx.AsyncClient(timeout=30) as http_client:
            resp = await http_client.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": EMAIL_KEY},
                json=payload,
            )
        resp.raise_for_status()
        return resp.json().get("id")
    except httpx.HTTPStatusError as e:
        try:
            code = e.response.json().get("code", "")
        except ValueError:
            code = ""
        if code in ("insufficient_credits", "integration_disabled", "daily_limit_reached"):
            logger.warning(f"Email paused: {code} ({e.response.status_code})")
            raise HTTPException(status_code=503, detail="Email is temporarily unavailable")
        logger.error(f"Email send failed: {e.response.status_code} {e.response.text}")
        raise HTTPException(status_code=502, detail="Failed to send email")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Email send error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send email")


def inquiry_email_html(inq: "Inquiry") -> str:
    rows = [
        ("Name", inq.name),
        ("Contact", inq.contact),
        ("Project Location", inq.location or "—"),
        ("Scope", inq.scope or "—"),
        ("Received", inq.created_at),
    ]
    row_html = "".join(
        f'<tr><td style="padding:10px 16px;color:#8a8a8a;font-size:11px;text-transform:uppercase;'
        f'letter-spacing:1.5px;border-bottom:1px solid #eee;white-space:nowrap">{k}</td>'
        f'<td style="padding:10px 16px;color:#111;font-size:14px;border-bottom:1px solid #eee">{escape(v)}</td></tr>'
        for k, v in rows
    )
    return (
        '<table role="presentation" width="100%" style="background:#f6f4f0;padding:24px 0">'
        '<tr><td align="center"><table role="presentation" width="560" '
        'style="background:#ffffff;font-family:Arial,sans-serif;border:1px solid #e5e0d8">'
        '<tr><td style="background:#0A0B0E;padding:20px 24px">'
        '<span style="color:#C8A97E;font-size:13px;letter-spacing:3px;text-transform:uppercase">'
        'SAI Studio — New Inquiry</span></td></tr>'
        f'<tr><td style="padding:8px 8px 0"><table role="presentation" width="100%">{row_html}</table></td></tr>'
        '<tr><td style="padding:16px 24px">'
        '<p style="color:#8a8a8a;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 6px">Message</p>'
        f'<p style="color:#111;font-size:14px;line-height:1.6;margin:0">{escape(inq.message)}</p></td></tr>'
        '<tr><td style="padding:16px 24px;border-top:1px solid #eee">'
        '<p style="font-size:11px;color:#999;margin:0">Sent by SAI Studio for Architectural Innovations. '
        'We never ask for passwords or card details by email.</p></td></tr>'
        '</table></td></tr></table>'
    )

# ---------- Inquiries ----------


class InquiryCreate(BaseModel):
    name: str
    contact: str
    location: Optional[str] = ""
    scope: Optional[str] = ""
    message: str


class Inquiry(InquiryCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "new"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class InquiryUpdate(BaseModel):
    status: str


@api_router.get("/")
async def root():
    return {"message": "SAI Studio API"}


@api_router.post("/inquiries", response_model=Inquiry)
async def create_inquiry(payload: InquiryCreate):
    inquiry = Inquiry(**payload.model_dump())
    await db.inquiries.insert_one(inquiry.model_dump())
    if OWNER_EMAIL:
        try:
            subject = f"New inquiry: {payload.name.strip()[:80].splitlines()[0]}"
            await send_email(to=OWNER_EMAIL, subject=subject, html=inquiry_email_html(inquiry))
        except HTTPException:
            pass
        except Exception as e:
            logger.error(f"Inquiry email alert failed: {e}")
    return inquiry


@api_router.get("/inquiries", response_model=List[Inquiry])
async def list_inquiries(user=Depends(get_current_user)):
    return await db.inquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)


@api_router.patch("/inquiries/{inquiry_id}")
async def update_inquiry(inquiry_id: str, payload: InquiryUpdate, user=Depends(get_current_user)):
    if payload.status not in ("new", "read"):
        raise HTTPException(status_code=400, detail="Invalid status")
    res = await db.inquiries.update_one({"id": inquiry_id}, {"$set": {"status": payload.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    return {"success": True}


@api_router.delete("/inquiries/{inquiry_id}")
async def delete_inquiry(inquiry_id: str, user=Depends(get_current_user)):
    res = await db.inquiries.delete_one({"id": inquiry_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    return {"success": True}


app.include_router(api_router)

_cors_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "*").split(",") if o.strip()]
_frontend_url = os.environ.get("FRONTEND_URL", "").strip()
if _frontend_url and _frontend_url not in _cors_origins:
    _cors_origins.append(_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=_cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await seed_admin()
    await seed_projects()
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.inquiries.create_index("id", unique=True)
    await db.projects.create_index("id", unique=True)
    try:
        init_storage()
        logger.info("Object storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
