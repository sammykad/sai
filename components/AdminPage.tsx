import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LogOut, Trash2, MailOpen, Mail, RefreshCw, ArrowLeft, Plus, Pencil, Upload, X,
  GripVertical, KeyRound,
} from "lucide-react";
import LogoMark from "../components/Logo";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const client = axios.create({ baseURL: API, withCredentials: true });

export interface AdminUser {
  email: string;
  [key: string]: unknown;
}

export interface Inquiry {
  id: string;
  name: string;
  contact: string;
  location?: string;
  scope?: string;
  message: string;
  status?: string;
  created_at?: string;
}

export interface AdminProject {
  id: string;
  title: string;
  category: string;
  location?: string;
  year?: string;
  area?: string;
  description?: string;
  image?: string;
  storage_path?: string;
}

export type ProjectForm = {
  title: string;
  category: string;
  location: string;
  year: string;
  area: string;
  description: string;
};

function formatApiErrorDetail(detail: unknown): string {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail
      .map((e) => (e && typeof e === "object" && "msg" in e && typeof (e as { msg: unknown }).msg === "string" ? (e as { msg: string }).msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
  if (typeof detail === "object" && "msg" in detail && typeof (detail as { msg: unknown }).msg === "string") {
    return (detail as { msg: string }).msg;
  }
  return String(detail);
}

const fmtDate = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

const imgFor = (p: { storage_path?: string; image?: string }) => (p.storage_path ? `${API}/files/${p.storage_path}` : p.image);

const CATEGORIES = ["Residential", "Commercial", "Cultural", "Healthcare", "Hospitality", "Educational", "IT Sectors", "Land Development"];
const EMPTY_PROJECT: ProjectForm = { title: "", category: "Residential", location: "", year: "", area: "", description: "" };

const DEFAULT_IMAGES: Record<string, string> = {
  hero: "https://images.unsplash.com/photo-1546414701-81cc6963c67f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcmNoaXRlY3R1cmFsJTIwY29uY3JldGUlMjBleHRlcmlvciUyMGJydXRhbGlzdCUyMGJ1aWxkaW5nfGVufDB8fHx8MTc5MTQ4NzU4Mnww&ixlib=rb-4.1.0&q=85",
  founder: "https://images.unsplash.com/photo-1598367815092-a2c0cbc1ea3d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHwzfHxhcmNoaXRlY3R1cmFsJTIwbW9kZWwlMjBzdHVkaW8lMjBza2V0Y2glMjBibHVlcHJpbnQlMjB3b3JrZXIlMjBhcmNoaXRlY3R8ZW58MHx8fHwxNzkxNDg3NTgyfDA&ixlib=rb-4.1.0&q=85",
  studio: "https://images.unsplash.com/photo-1599420186985-5c3d1a038e84?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHwyfHxhcmNoaXRlY3R1cmFsJTIwbW9kZWwlMjBzdHVkaW8lMjBza2V0Y2glMjBibHVlcHJpbnQlMjB3b3JrZXIlMjBhcmNoaXRlY3R8ZW58MHx8fHwxNzkxNDg3NTgyfDA&ixlib=rb-4.1.0&q=85",
};

const IMAGE_SLOTS = [
  { id: "hero", label: "Hero Background", hint: "The large opening image at the top of the site" },
  { id: "founder", label: "Founder Photo", hint: "Main photo in the About the Founder section" },
  { id: "studio", label: "Studio Detail Photo", hint: "Small inset photo in the About section" },
];

const AdminPage = () => {
  const [user, setUser] = useState<AdminUser | false | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState("inquiries");

  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(false);

  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [editing, setEditing] = useState<AdminProject | Partial<AdminProject> | null>(null);
  const [form, setForm] = useState<ProjectForm>(EMPTY_PROJECT);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const dragId = useRef<string | null>(null);
  const projectsRef = useRef<AdminProject[]>([]);

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);

  const [siteImgs, setSiteImgs] = useState<Record<string, string>>({});
  const [slotFiles, setSlotFiles] = useState<Record<string, { file: File; preview: string } | null>>({});
  const [slotSaving, setSlotSaving] = useState("");

  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  const loadInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get("/inquiries");
      setInquiries(data);
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.status === 401) setUser(false);
      else toast.error("Could not load inquiries");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const { data } = await client.get("/projects");
      setProjects(data);
    } catch {
      toast.error("Could not load projects");
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const { data } = await client.get("/settings");
      const map: Record<string, string> = {};
      for (const s of ["hero", "founder", "studio"]) {
        if (data?.[`${s}_image_path`]) map[s] = `${API}/files/${data[`${s}_image_path`]}`;
      }
      setSiteImgs(map);
    } catch {}
  }, []);

  useEffect(() => {
    client
      .get("/auth/me")
      .then(({ data }) => {
        setUser(data);
        loadInquiries();
        loadProjects();
        loadSettings();
      })
      .catch(() => setUser(false));
  }, [loadInquiries, loadProjects, loadSettings]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await client.post("/auth/login", { email, password });
      setUser(data);
      loadInquiries();
      loadProjects();
      loadSettings();
      toast.success("Welcome back");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
      } else {
        setError("Login failed");
      }
    }
  };

  const logout = async () => {
    await client.post("/auth/logout").catch(() => {});
    setUser(false);
  };

  const toggleStatus = async (inq: Inquiry) => {
    const next = (inq.status || "new") === "new" ? "read" : "new";
    try {
      await client.patch(`/inquiries/${inq.id}`, { status: next });
      setInquiries((prev) => prev.map((i) => (i.id === inq.id ? { ...i, status: next } : i)));
    } catch {
      toast.error("Could not update status");
    }
  };

  const removeInquiry = async (inq: Inquiry) => {
    if (!window.confirm(`Delete inquiry from ${inq.name}?`)) return;
    try {
      await client.delete(`/inquiries/${inq.id}`);
      setInquiries((prev) => prev.filter((i) => i.id !== inq.id));
      toast.success("Inquiry deleted");
    } catch {
      toast.error("Could not delete inquiry");
    }
  };

  const startAdd = () => {
    setEditing({});
    setForm(EMPTY_PROJECT);
    setFile(null);
    setPreview("");
  };

  const startEdit = (p: AdminProject) => {
    setEditing(p);
    setForm({
      title: p.title, category: p.category, location: p.location || "",
      year: p.year || "", area: p.area || "", description: p.description || "",
    });
    setFile(null);
    setPreview(imgFor(p) || "");
  };

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      toast.error("Image must be under 8 MB");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const saveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Project title is required");
      return;
    }
    setSaving(true);
    try {
      let projectId = editing?.id;
      if (projectId) {
        await client.patch(`/projects/${projectId}`, form);
      } else {
        const { data } = await client.post("/projects", form);
        projectId = data.id;
      }
      if (file && projectId) {
        const fd = new FormData();
        fd.append("file", file);
        await client.post(`/projects/${projectId}/image`, fd);
      }
      toast.success(editing?.id ? "Project updated" : "Project added");
      setEditing(null);
      setFile(null);
      setPreview("");
      loadProjects();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(formatApiErrorDetail(err.response?.data?.detail));
      } else {
        toast.error("Could not save project");
      }
    } finally {
      setSaving(false);
    }
  };

  const removeProject = async (p: AdminProject) => {
    if (!window.confirm(`Delete "${p.title}" from the portfolio?`)) return;
    try {
      await client.delete(`/projects/${p.id}`);
      setProjects((prev) => prev.filter((x) => x.id !== p.id));
      toast.success("Project deleted");
    } catch {
      toast.error("Could not delete project");
    }
  };

  const onDragStartCard = (id: string) => () => {
    dragId.current = id;
  };

  const onDragOverCard = (id: string) => (e: React.DragEvent) => {
    e.preventDefault();
    if (!dragId.current || dragId.current === id) return;
    setProjects((prev) => {
      const from = prev.findIndex((p) => p.id === dragId.current);
      const to = prev.findIndex((p) => p.id === id);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const onDragEndCard = async () => {
    if (!dragId.current) return;
    dragId.current = null;
    try {
      await client.post("/projects/reorder", { ids: projectsRef.current.map((p) => p.id) });
      toast.success("Portfolio order saved");
    } catch {
      toast.error("Could not save order");
      loadProjects();
    }
  };

  const pickSlotFile = (slot: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      toast.error("Image must be under 8 MB");
      return;
    }
    setSlotFiles((prev) => ({ ...prev, [slot]: { file: f, preview: URL.createObjectURL(f) } }));
  };

  const saveSlot = async (slot: string) => {
    const pending = slotFiles[slot];
    if (!pending) return;
    setSlotSaving(slot);
    try {
      const fd = new FormData();
      fd.append("file", pending.file);
      const { data } = await client.post(`/settings/image/${slot}`, fd);
      setSiteImgs((prev) => ({ ...prev, [slot]: `${API}/files/${data[`${slot}_image_path`]}` }));
      setSlotFiles((prev) => ({ ...prev, [slot]: null }));
      toast.success("Image updated — it is live on the site");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(formatApiErrorDetail(err.response?.data?.detail));
      } else {
        toast.error("Could not save image");
      }
    } finally {
      setSlotSaving("");
    }
  };

  const resetSlot = async (slot: string) => {
    if (!window.confirm("Remove your photo and return to the default image?")) return;
    setSlotSaving(slot);
    try {
      await client.delete(`/settings/image/${slot}`);
      setSiteImgs((prev) => {
        const next = { ...prev };
        delete next[slot];
        return next;
      });
      toast.success("Default image restored");
    } catch {
      toast.error("Could not remove image");
    } finally {
      setSlotSaving("");
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.next.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    setPwSaving(true);
    try {
      await client.post("/auth/change-password", {
        current_password: pwForm.current,
        new_password: pwForm.next,
      });
      toast.success("Password updated — use it on your next sign in");
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(formatApiErrorDetail(err.response?.data?.detail));
      } else {
        toast.error("Could not update password");
      }
    } finally {
      setPwSaving(false);
    }
  };

  const inputCls =
    "w-full bg-[#0C0D11] border border-white/10 focus:border-[#C8A97E]/60 outline-none px-4 py-3 text-sm text-white placeholder:text-[#9EA3B0]/50 transition-colors duration-300";

  if (user === null) {
    return (
      <div className="min-h-screen bg-[#0A0B0E] flex items-center justify-center">
        <p className="ff-mono text-xs tracking-[0.25em] text-[#9EA3B0] uppercase">Loading…</p>
      </div>
    );
  }

  if (user === false) {
    return (
      <div
        className="min-h-screen bg-[#0A0B0E] flex items-center justify-center px-6 relative"
        data-testid="admin-login-page"
      >
        <div className="absolute inset-0 drafting-grid opacity-40 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-sm bg-[#121419] border border-white/10 p-8 sm:p-10"
        >
          <div className="flex items-center gap-3 mb-8">
            <LogoMark size={32} />
            <div className="leading-none">
              <p className="ff-display text-sm font-semibold tracking-[0.2em] text-white">
                SAI STUDIO
              </p>
              <p className="ff-mono text-[9px] tracking-[0.18em] text-[#9EA3B0] mt-1 uppercase">
                Studio Dashboard
              </p>
            </div>
          </div>
          <form onSubmit={login} className="space-y-4" data-testid="admin-login-form">
            <input
              type="email"
              className={inputCls}
              placeholder="Admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="admin-email-input"
              required
            />
            <input
              type="password"
              className={inputCls}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="admin-password-input"
              required
            />
            {error && (
              <p className="text-xs text-red-400" data-testid="admin-login-error">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="w-full bg-[#C8A97E] text-[#0A0B0E] ff-display text-xs font-semibold uppercase tracking-[0.2em] py-3.5 hover:bg-[#F4F4F6] transition-colors duration-300"
              data-testid="admin-login-submit"
            >
              Sign In
            </button>
          </form>
          <Link
            href="/"
            className="flex items-center gap-2 ff-mono text-[10px] uppercase tracking-[0.2em] text-[#9EA3B0] hover:text-[#C8A97E] transition-colors mt-8"
            data-testid="admin-back-home-link"
          >
            <ArrowLeft size={12} /> Back to site
          </Link>
        </motion.div>
      </div>
    );
  }

  const newCount = inquiries.filter((i) => (i.status || "new") === "new").length;

  return (
    <div className="min-h-screen bg-[#0A0B0E]" data-testid="admin-dashboard">
      <header className="border-b border-white/10 bg-[#0C0D11]">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LogoMark size={30} />
            <div className="leading-none">
              <p className="ff-display text-sm font-semibold tracking-[0.2em] text-white">
                STUDIO DASHBOARD
              </p>
              <p className="ff-mono text-[9px] tracking-[0.18em] text-[#9EA3B0] mt-1 uppercase">
                {inquiries.length} inquiries · {projects.length} projects
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="ff-mono text-[10px] uppercase tracking-[0.18em] text-[#9EA3B0] hover:text-[#C8A97E] transition-colors"
              data-testid="admin-view-site-link"
            >
              View site
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-2 ff-mono text-[10px] uppercase tracking-[0.18em] text-[#C8A97E] border border-[#C8A97E]/40 px-3.5 py-2 hover:bg-[#C8A97E] hover:text-[#0A0B0E] transition-all duration-300"
              data-testid="admin-logout-btn"
            >
              <LogOut size={12} /> Logout
            </button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 flex gap-6 overflow-x-auto">
          {[
            { id: "inquiries", label: `Inquiries (${newCount} new)` },
            { id: "projects", label: `Portfolio (${projects.length})` },
            { id: "images", label: "Site Images" },
            { id: "settings", label: "Settings" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              data-testid={`admin-tab-${t.id}`}
              className={`ff-mono text-[11px] uppercase tracking-[0.2em] pb-4 border-b-2 whitespace-nowrap transition-colors duration-300 ${
                tab === t.id
                  ? "text-[#C8A97E] border-[#C8A97E]"
                  : "text-[#9EA3B0] border-transparent hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {tab === "inquiries" && (
          <>
            <div className="flex justify-end mb-6">
              <button
                onClick={loadInquiries}
                className="flex items-center gap-2 ff-mono text-[10px] uppercase tracking-[0.18em] text-[#9EA3B0] hover:text-[#C8A97E] transition-colors"
                data-testid="admin-refresh-btn"
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
              </button>
            </div>
            {inquiries.length === 0 && !loading && (
              <div className="border border-white/10 p-16 text-center" data-testid="inquiries-empty">
                <p className="ff-serif text-2xl text-white font-light">No inquiries yet</p>
                <p className="text-sm text-[#9EA3B0] mt-3">
                  New messages from the contact form will appear here.
                </p>
              </div>
            )}
            <div className="space-y-4">
              {inquiries.map((inq) => {
                const isNew = (inq.status || "new") === "new";
                return (
                  <motion.article
                    key={inq.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`border p-6 sm:p-7 transition-colors duration-300 ${
                      isNew ? "border-[#C8A97E]/40 bg-[#121419]" : "border-white/10 bg-[#0C0D11]"
                    }`}
                    data-testid={`inquiry-row-${inq.id}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="ff-display text-base font-medium text-white">{inq.name}</h3>
                          <span
                            className={`ff-mono text-[9px] uppercase tracking-[0.18em] px-2 py-0.5 ${
                              isNew
                                ? "bg-[#C8A97E] text-[#0A0B0E]"
                                : "border border-white/15 text-[#9EA3B0]"
                            }`}
                            data-testid={`inquiry-status-${inq.id}`}
                          >
                            {isNew ? "New" : "Read"}
                          </span>
                        </div>
                        <p className="ff-mono text-[11px] text-[#C8A97E] mt-1.5">{inq.contact}</p>
                      </div>
                      <p className="ff-mono text-[10px] text-[#9EA3B0]">{fmtDate(inq.created_at)}</p>
                    </div>
                    <div className="flex flex-wrap gap-x-8 gap-y-1 mt-4">
                      {inq.location && (
                        <p className="text-xs text-[#9EA3B0]">
                          <span className="text-[#9EA3B0]/60 uppercase tracking-wider text-[10px] ff-mono">
                            Location ·{" "}
                          </span>
                          {inq.location}
                        </p>
                      )}
                      {inq.scope && (
                        <p className="text-xs text-[#9EA3B0]">
                          <span className="text-[#9EA3B0]/60 uppercase tracking-wider text-[10px] ff-mono">
                            Scope ·{" "}
                          </span>
                          {inq.scope}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-[#9EA3B0] leading-relaxed mt-4 border-l-2 border-[#C8A97E]/40 pl-4">
                      {inq.message}
                    </p>
                    <div className="flex gap-3 mt-5">
                      <button
                        onClick={() => toggleStatus(inq)}
                        className="flex items-center gap-2 ff-mono text-[10px] uppercase tracking-[0.16em] text-[#9EA3B0] border border-white/15 px-3.5 py-2 hover:border-[#C8A97E]/50 hover:text-[#C8A97E] transition-all duration-300"
                        data-testid={`inquiry-toggle-${inq.id}`}
                      >
                        {isNew ? <MailOpen size={12} /> : <Mail size={12} />}
                        {isNew ? "Mark read" : "Mark new"}
                      </button>
                      <button
                        onClick={() => removeInquiry(inq)}
                        className="flex items-center gap-2 ff-mono text-[10px] uppercase tracking-[0.16em] text-[#9EA3B0] border border-white/15 px-3.5 py-2 hover:border-red-400/60 hover:text-red-400 transition-all duration-300"
                        data-testid={`inquiry-delete-${inq.id}`}
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </>
        )}

        {tab === "projects" && (
          <div data-testid="projects-panel">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <p className="text-sm text-[#9EA3B0]">
                Add real projects and photos — they appear on the site instantly.{" "}
                <span className="text-[#C8A97E]">Drag cards to reorder; the order saves automatically.</span>
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={loadProjects}
                  className="flex items-center gap-2 ff-mono text-[10px] uppercase tracking-[0.18em] text-[#9EA3B0] hover:text-[#C8A97E] transition-colors"
                  data-testid="projects-refresh-btn"
                >
                  <RefreshCw size={13} className={projectsLoading ? "animate-spin" : ""} />
                </button>
                <button
                  onClick={startAdd}
                  className="flex items-center gap-2 bg-[#C8A97E] text-[#0A0B0E] ff-display text-[11px] font-semibold uppercase tracking-[0.18em] px-4 py-2.5 hover:bg-[#F4F4F6] transition-colors duration-300"
                  data-testid="project-add-btn"
                >
                  <Plus size={14} /> Add Project
                </button>
              </div>
            </div>

            {editing !== null && (
              <motion.form
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={saveProject}
                className="border border-[#C8A97E]/40 bg-[#121419] p-6 sm:p-8 mb-10"
                data-testid="project-form"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="ff-display text-lg text-white font-medium">
                    {editing?.id ? "Edit Project" : "New Project"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="text-[#9EA3B0] hover:text-white transition-colors"
                    data-testid="project-form-cancel"
                    aria-label="Close form"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input
                    className={inputCls}
                    placeholder="Project title *"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    data-testid="project-title-input"
                  />
                  <select
                    className={inputCls}
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    data-testid="project-category-select"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-[#0C0D11]">
                        {c}
                      </option>
                    ))}
                  </select>
                  <input
                    className={inputCls}
                    placeholder="Location — e.g. Pune, MH"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    data-testid="project-location-input"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      className={inputCls}
                      placeholder="Year"
                      value={form.year}
                      onChange={(e) => setForm({ ...form, year: e.target.value })}
                      data-testid="project-year-input"
                    />
                    <input
                      className={inputCls}
                      placeholder="Area"
                      value={form.area}
                      onChange={(e) => setForm({ ...form, area: e.target.value })}
                      data-testid="project-area-input"
                    />
                  </div>
                </div>
                <textarea
                  className={`${inputCls} min-h-[100px] resize-y mt-4`}
                  placeholder="Short description of the project"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  data-testid="project-description-input"
                />
                <div className="flex flex-wrap items-center gap-5 mt-5">
                  <label
                    className="flex items-center gap-2 ff-mono text-[10px] uppercase tracking-[0.16em] text-[#C8A97E] border border-[#C8A97E]/40 px-4 py-2.5 cursor-pointer hover:bg-[#C8A97E] hover:text-[#0A0B0E] transition-all duration-300"
                    data-testid="project-image-upload-label"
                  >
                    <Upload size={13} /> {file ? file.name : "Upload photo"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={pickFile}
                      data-testid="project-image-input"
                    />
                  </label>
                  {preview && (
                    <img
                      src={preview}
                      alt="Project preview"
                      className="h-16 w-24 object-cover border border-white/10"
                      data-testid="project-image-preview"
                    />
                  )}
                  <span className="ff-mono text-[9px] text-[#9EA3B0] uppercase tracking-[0.14em]">
                    JPG / PNG / WEBP · max 8 MB
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="mt-6 bg-[#C8A97E] text-[#0A0B0E] ff-display text-xs font-semibold uppercase tracking-[0.2em] px-8 py-3.5 hover:bg-[#F4F4F6] transition-colors duration-300 disabled:opacity-60"
                  data-testid="project-save-btn"
                >
                  {saving ? "Saving…" : editing?.id ? "Save Changes" : "Add to Portfolio"}
                </button>
              </motion.form>
            )}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map((p) => (
                <article
                  key={p.id}
                  draggable
                  onDragStart={onDragStartCard(p.id)}
                  onDragOver={onDragOverCard(p.id)}
                  onDragEnd={onDragEndCard}
                  className="border border-white/10 bg-[#0C0D11] group cursor-grab active:cursor-grabbing"
                  data-testid={`admin-project-${p.id}`}
                >
                  <div className="relative overflow-hidden h-44">
                    {imgFor(p) ? (
                      <img
                        src={imgFor(p)}
                        alt={p.title}
                        className="w-full h-full object-cover pointer-events-none"
                        draggable={false}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#9EA3B0] ff-mono text-[10px] uppercase tracking-[0.2em]">
                        No photo yet
                      </div>
                    )}
                    <span className="absolute top-3 left-3 ff-mono text-[9px] uppercase tracking-[0.18em] text-[#0A0B0E] bg-[#C8A97E] px-2 py-0.5">
                      {p.category}
                    </span>
                    <span className="absolute top-3 right-3 text-white/50 bg-[#0A0B0E]/60 p-1.5">
                      <GripVertical size={13} />
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="ff-display text-sm font-medium text-white leading-snug">
                      {p.title}
                    </h3>
                    <p className="ff-mono text-[10px] text-[#9EA3B0] mt-1.5 uppercase tracking-[0.14em]">
                      {[p.location, p.year].filter(Boolean).join(" · ")}
                    </p>
                    <div className="flex gap-2.5 mt-4">
                      <button
                        onClick={() => startEdit(p)}
                        className="flex items-center gap-1.5 ff-mono text-[10px] uppercase tracking-[0.14em] text-[#9EA3B0] border border-white/15 px-3 py-1.5 hover:border-[#C8A97E]/50 hover:text-[#C8A97E] transition-all duration-300"
                        data-testid={`project-edit-${p.id}`}
                      >
                        <Pencil size={11} /> Edit
                      </button>
                      <button
                        onClick={() => removeProject(p)}
                        className="flex items-center gap-1.5 ff-mono text-[10px] uppercase tracking-[0.14em] text-[#9EA3B0] border border-white/15 px-3 py-1.5 hover:border-red-400/60 hover:text-red-400 transition-all duration-300"
                        data-testid={`project-delete-${p.id}`}
                      >
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {tab === "images" && (
          <div data-testid="images-panel">
            <p className="text-sm text-[#9EA3B0] mb-8">
              Change any photo on the site.{" "}
              <span className="text-[#C8A97E]">Remove returns the slot to its default photo.</span>{" "}
              Portfolio project photos are managed in the Portfolio tab.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {IMAGE_SLOTS.map((s) => {
                const pending = slotFiles[s.id];
                const current = pending?.preview || siteImgs[s.id] || DEFAULT_IMAGES[s.id];
                const isCustom = Boolean(siteImgs[s.id]);
                return (
                  <article
                    key={s.id}
                    className="border border-white/10 bg-[#0C0D11]"
                    data-testid={`image-slot-${s.id}`}
                  >
                    <div className="relative overflow-hidden h-44">
                      <img src={current} alt={s.label} className="w-full h-full object-cover" />
                      <span
                        className={`absolute top-3 left-3 ff-mono text-[9px] uppercase tracking-[0.18em] px-2 py-0.5 ${
                          isCustom
                            ? "bg-[#C8A97E] text-[#0A0B0E]"
                            : "bg-[#0A0B0E]/70 text-[#9EA3B0]"
                        }`}
                        data-testid={`image-slot-badge-${s.id}`}
                      >
                        {isCustom ? "Your photo" : "Default"}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="ff-display text-sm font-medium text-white">{s.label}</h3>
                      <p className="text-xs text-[#9EA3B0] mt-1">{s.hint}</p>
                      <div className="flex flex-wrap gap-2.5 mt-4">
                        <label
                          className="flex items-center gap-1.5 ff-mono text-[10px] uppercase tracking-[0.14em] text-[#C8A97E] border border-[#C8A97E]/40 px-3 py-1.5 cursor-pointer hover:bg-[#C8A97E] hover:text-[#0A0B0E] transition-all duration-300"
                          data-testid={`image-slot-choose-${s.id}`}
                        >
                          <Upload size={11} /> {pending ? pending.file.name : "Choose photo"}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={pickSlotFile(s.id)}
                            data-testid={`image-slot-input-${s.id}`}
                          />
                        </label>
                        {pending && (
                          <button
                            onClick={() => saveSlot(s.id)}
                            disabled={slotSaving === s.id}
                            className="bg-[#C8A97E] text-[#0A0B0E] ff-mono text-[10px] uppercase tracking-[0.14em] px-3 py-1.5 hover:bg-[#F4F4F6] transition-colors duration-300 disabled:opacity-50"
                            data-testid={`image-slot-save-${s.id}`}
                          >
                            {slotSaving === s.id ? "Saving…" : "Save"}
                          </button>
                        )}
                        {isCustom && !pending && (
                          <button
                            onClick={() => resetSlot(s.id)}
                            disabled={slotSaving === s.id}
                            className="flex items-center gap-1.5 ff-mono text-[10px] uppercase tracking-[0.14em] text-[#9EA3B0] border border-white/15 px-3 py-1.5 hover:border-red-400/60 hover:text-red-400 transition-all duration-300"
                            data-testid={`image-slot-remove-${s.id}`}
                          >
                            <Trash2 size={11} /> Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {tab === "settings" && (
          <div className="max-w-md" data-testid="settings-panel">
            <div className="flex items-center gap-3 mb-6">
              <KeyRound size={18} className="text-[#C8A97E]" />
              <h3 className="ff-display text-lg text-white font-medium">Change Admin Password</h3>
            </div>
            <form
              onSubmit={changePassword}
              className="space-y-4 border border-white/10 bg-[#121419] p-6 sm:p-8"
              data-testid="change-password-form"
            >
              <input
                type="password"
                className={inputCls}
                placeholder="Current password"
                value={pwForm.current}
                onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                data-testid="current-password-input"
                required
              />
              <input
                type="password"
                className={inputCls}
                placeholder="New password (min 8 characters)"
                value={pwForm.next}
                onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                data-testid="new-password-input"
                required
              />
              <input
                type="password"
                className={inputCls}
                placeholder="Confirm new password"
                value={pwForm.confirm}
                onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                data-testid="confirm-password-input"
                required
              />
              <button
                type="submit"
                disabled={pwSaving}
                className="w-full bg-[#C8A97E] text-[#0A0B0E] ff-display text-xs font-semibold uppercase tracking-[0.2em] py-3.5 hover:bg-[#F4F4F6] transition-colors duration-300 disabled:opacity-60"
                data-testid="change-password-btn"
              >
                {pwSaving ? "Updating…" : "Update Password"}
              </button>
              <p className="ff-mono text-[9px] text-[#9EA3B0] uppercase tracking-[0.14em]">
                Signed in as {user.email}
              </p>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPage;
