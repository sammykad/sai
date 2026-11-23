"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowUpRight } from "lucide-react";
import LogoMark from "./Logo";

const LINKS = [
  { label: "Founder", href: "#about" },
  { label: "Principles", href: "#principles" },
  { label: "Portfolio", href: "#portfolio" },
  { label: "Contact", href: "#contact" },
];

const scrollTo = (href: string) => {
  if (window.__lenis) {
    window.__lenis.scrollTo(href, { offset: -72, duration: 1.4 });
  } else {
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  }
};

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    scrollTo(href);
  };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 border-b transition-colors duration-500 ${
          scrolled
            ? "bg-black/70 backdrop-blur-xl border-white/10"
            : "bg-transparent border-transparent"
        }`}
        data-testid="main-navbar"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-[72px] flex items-center justify-between">
          <button
            onClick={() => go("#top")}
            className="flex items-center gap-3 group"
            data-testid="nav-logo-btn"
          >
            <LogoMark size={34} />
            <div className="text-left leading-none">
              <span className="ff-display block text-sm font-semibold tracking-[0.22em] text-white">
                SAI STUDIO
              </span>
              <span className="ff-mono block text-[9px] tracking-[0.18em] text-[#9EA3B0] mt-1 uppercase">
                Architectural Innovations
              </span>
            </div>
          </button>

          <nav className="hidden lg:flex items-center gap-9">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={(e) => {
                  e.preventDefault();
                  go(l.href);
                }}
                data-testid={`nav-link-${l.label.toLowerCase()}`}
                className="ff-mono text-[11px] uppercase tracking-[0.22em] text-[#9EA3B0] hover:text-[#C8A97E] transition-colors duration-300"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-5">
            <span
              className="ff-mono text-[10px] tracking-[0.14em] text-[#C8A97E]/80 border border-[#C8A97E]/30 px-2.5 py-1"
              data-testid="nav-coa-badge"
            >
              COA CA/2006/39225
            </span>
            <button
              onClick={() => go("#contact")}
              data-testid="nav-inquire-btn"
              className="group flex items-center gap-2 bg-[#C8A97E] text-[#0A0B0E] ff-display text-xs font-semibold tracking-[0.14em] uppercase px-5 py-2.5 hover:bg-[#F4F4F6] transition-colors duration-300"
            >
              Inquire Studio
              <ArrowUpRight
                size={14}
                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </button>
          </div>

          <button
            className="lg:hidden text-white p-2"
            onClick={() => setOpen(!open)}
            data-testid="nav-mobile-menu-btn"
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 bg-[#0A0B0E]/97 backdrop-blur-2xl flex flex-col justify-center px-8 lg:hidden"
            data-testid="mobile-menu-overlay"
          >
            <div className="space-y-2">
              {LINKS.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  onClick={(e) => {
                    e.preventDefault();
                    go(l.href);
                  }}
                  data-testid={`mobile-nav-link-${l.label.toLowerCase()}`}
                  className="block ff-serif text-4xl text-white hover:text-[#C8A97E] transition-colors py-3 border-b border-white/5 w-full text-left"
                >
                  {l.label}
                </motion.a>
              ))}
            </div>
            <p className="ff-mono text-[10px] tracking-[0.2em] text-[#9EA3B0] mt-10 uppercase">
              Solapur — Pune — Chh. Sambhajinagar
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
