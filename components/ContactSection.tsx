"use client";

import { useState } from "react";
import { motion } from "motion/react";
import axios from "axios";
import { toast } from "sonner";
import { Phone, Copy, MapPin, ArrowUpRight, ArrowUp } from "lucide-react";
import Link from "next/link";
import LogoMark from "./Logo";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const PHONE_DISPLAY = "+91 96999 40176";
const PHONE_RAW = "+919699940176";
const CITIES = ["Solapur", "Pune", "Chh. Sambhajinagar"];
const ease = [0.22, 1, 0.36, 1] as const;

interface ContactForm {
  name: string;
  contact: string;
  location: string;
  scope: string;
  message: string;
}

const EMPTY: ContactForm = { name: "", contact: "", location: "", scope: "", message: "" };

const ContactSection = () => {
  const [form, setForm] = useState<ContactForm>(EMPTY);
  const [sending, setSending] = useState(false);

  const set = (k: keyof ContactForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(PHONE_RAW);
      toast.success("Phone number copied to clipboard");
    } catch {
      toast.error("Could not copy — please note the number down");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.contact.trim() || !form.message.trim()) {
      toast.error("Please fill in your name, contact and a short message");
      return;
    }
    setSending(true);
    try {
      await axios.post(`${API}/inquiries`, form);
      toast.success("Inquiry received — the studio will reach out shortly.");
      setForm(EMPTY);
    } catch {
      toast.error("Something went wrong. Please call the studio directly.");
    } finally {
      setSending(false);
    }
  };

  const inputCls =
    "w-full bg-[#0C0D11] border border-white/10 focus:border-[#C8A97E]/60 outline-none px-4 py-3.5 text-sm text-white placeholder:text-[#9EA3B0]/50 transition-colors duration-300";

  return (
    <section
      id="contact"
      className="relative bg-[#0C0D11] border-t border-white/5"
      data-testid="contact-section"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-28 lg:py-36 grid lg:grid-cols-2 gap-16 lg:gap-24">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease }}
            className="overline-label mb-6"
          >
            Begin a Conversation
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.1, ease }}
            className="ff-serif text-2xl sm:text-3xl lg:text-4xl font-light text-white leading-tight"
            data-testid="contact-heading"
          >
            Let's shape your site into{" "}
            <span className="italic text-[#C8A97E]">an experience</span>
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.2, ease }}
            className="mt-12"
          >
            <p className="ff-mono text-[10px] uppercase tracking-[0.22em] text-[#9EA3B0] mb-4">
              Studios
            </p>
            <div className="flex flex-wrap gap-3" data-testid="contact-locations">
              {CITIES.map((c) => (
                <span
                  key={c}
                  className="flex items-center gap-2 border border-white/10 px-4 py-2.5 text-sm text-white"
                >
                  <MapPin size={13} className="text-[#C8A97E]" />
                  {c}
                </span>
              ))}
            </div>

            <div className="mt-10 border border-white/10 p-6 sm:p-8" data-testid="contact-phone-card">
              <p className="ff-mono text-[10px] uppercase tracking-[0.22em] text-[#9EA3B0]">
                Direct Line
              </p>
              <div className="flex flex-wrap items-center justify-between gap-4 mt-3">
                <a
                  href={`tel:${PHONE_RAW}`}
                  className="ff-serif text-2xl sm:text-3xl text-white hover:text-[#C8A97E] transition-colors"
                  data-testid="contact-phone-link"
                >
                  {PHONE_DISPLAY}
                </a>
                <button
                  onClick={copyPhone}
                  className="flex items-center gap-2 ff-mono text-[10px] uppercase tracking-[0.18em] text-[#C8A97E] border border-[#C8A97E]/40 px-4 py-2.5 hover:bg-[#C8A97E] hover:text-[#0A0B0E] transition-all duration-300"
                  data-testid="copy-phone-btn"
                >
                  <Copy size={13} /> Copy
                </button>
              </div>
              <p className="flex items-center gap-2 ff-mono text-[10px] uppercase tracking-[0.18em] text-[#9EA3B0] mt-5">
                <Phone size={12} className="text-[#C8A97E]" /> Ar. Kedar Vilasrao Mahamuni — B.Arch,
                COA CA/2006/39225
              </p>
            </div>
          </motion.div>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.15, ease }}
          onSubmit={submit}
          className="space-y-5 lg:pt-16"
          data-testid="inquiry-form"
        >
          <div className="grid sm:grid-cols-2 gap-5">
            <input
              className={inputCls}
              placeholder="Your name *"
              value={form.name}
              onChange={set("name")}
              data-testid="inquiry-name-input"
            />
            <input
              className={inputCls}
              placeholder="Phone or email *"
              value={form.contact}
              onChange={set("contact")}
              data-testid="inquiry-contact-input"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <input
              className={inputCls}
              placeholder="Project location"
              value={form.location}
              onChange={set("location")}
              data-testid="inquiry-location-input"
            />
            <input
              className={inputCls}
              placeholder="Scope — residence, commercial…"
              value={form.scope}
              onChange={set("scope")}
              data-testid="inquiry-scope-input"
            />
          </div>
          <textarea
            className={`${inputCls} min-h-[140px] resize-y`}
            placeholder="Tell us about your site and vision *"
            value={form.message}
            onChange={set("message")}
            data-testid="inquiry-message-input"
          />
          <button
            type="submit"
            disabled={sending}
            className="group w-full flex items-center justify-center gap-3 bg-[#C8A97E] text-[#0A0B0E] ff-display text-xs font-semibold uppercase tracking-[0.2em] py-4 hover:bg-[#F4F4F6] transition-colors duration-300 disabled:opacity-60"
            data-testid="inquiry-submit-btn"
          >
            {sending ? "Sending…" : "Send Inquiry"}
            <ArrowUpRight
              size={15}
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </button>
        </motion.form>
      </div>

      <footer className="border-t border-white/10" data-testid="site-footer">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <LogoMark size={28} />
            <div className="leading-none">
              <p className="ff-display text-xs font-semibold tracking-[0.2em] text-white">
                SAI STUDIO
              </p>
              <p className="ff-mono text-[9px] tracking-[0.16em] text-[#9EA3B0] mt-1 uppercase">
                For Architectural Innovations
              </p>
            </div>
          </div>
          <p className="ff-mono text-[10px] tracking-[0.14em] text-[#9EA3B0] text-center uppercase">
            ? 2026 SAI Studio ? Ar. Kedar V. Mahamuni ? COA CA/2006/39225
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="ff-mono text-[10px] uppercase tracking-[0.2em] text-[#9EA3B0] hover:text-[#C8A97E] transition-colors"
              data-testid="footer-admin-link"
            >
              Studio Login
            </Link>
            <button
              onClick={() =>
                window.__lenis
                  ? window.__lenis.scrollTo(0, { duration: 1.6 })
                  : window.scrollTo({ top: 0, behavior: "smooth" })
              }
              className="flex items-center gap-2 ff-mono text-[10px] uppercase tracking-[0.2em] text-[#C8A97E] hover:text-white transition-colors"
              data-testid="scroll-top-btn"
            >
              Back to top <ArrowUp size={13} />
            </button>
          </div>
        </div>
      </footer>
    </section>
  );
};

export default ContactSection;
