"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import axios from "axios";
import { ArrowDown } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HERO_IMG =
  "https://images.unsplash.com/photo-1546414701-81cc6963c67f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcmNoaXRlY3R1cmFsJTIwY29uY3JldGUlMjBleHRlcmlvciUyMGJydXRhbGlzdCUyMGJ1aWxkaW5nfGVufDB8fHx8MTc5MTQ4NzU4Mnww&ixlib=rb-4.1.0&q=85";

const LINES = [
  { text: "Architecture", cls: "ff-serif italic font-light text-[#F4F4F6]" },
  { text: "crafted for the", cls: "ff-display font-extralight text-[#C8A97E] tracking-tight" },
  { text: "Human Experience.", cls: "ff-serif font-medium text-[#F4F4F6]" },
];

const STATS = [
  { value: "2006", label: "COA Registered Since" },
  { value: "03", label: "Regional Hubs — Maharashtra" },
  { value: "B.Arch", label: "Founding Principal" },
];

const KineticHero = () => {
  const ref = useRef(null);
  const [heroImg, setHeroImg] = useState(HERO_IMG);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    axios
      .get(`${API}/settings`)
      .then(({ data }) => {
        if (data?.hero_image_path) {
          setHeroImg(`${API}/files/${data.hero_image_path}`);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section
      id="top"
      ref={ref}
      className="relative min-h-screen flex flex-col justify-end overflow-hidden"
      data-testid="hero-section"
    >
      <motion.div className="absolute inset-0" style={{ y: bgY }}>
        <motion.img
          src={heroImg}
          alt="Brutalist concrete architecture facade"
          className="w-full h-[120%] object-cover"
          initial={{ scale: 1.15, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
          data-testid="hero-bg-image"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0B0E]/80 via-[#0A0B0E]/55 to-[#0A0B0E]" />
        <div className="absolute inset-0 drafting-grid opacity-60" />
      </motion.div>

      <motion.div
        style={{ opacity: fade }}
        className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 w-full pb-16 pt-40"
      >
        <div className="overflow-hidden mb-6">
          <motion.p
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="overline-label"
            data-testid="hero-overline"
          >
            SAI Studio for Architectural Innovations — Solapur · Pune · Chh. Sambhajinagar
          </motion.p>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl leading-[1.08]" data-testid="hero-heading">
          {LINES.map((line, i) => (
            <span key={i} className="block overflow-hidden pb-1">
              <motion.span
                className={`block ${line.cls}`}
                initial={{ y: "115%" }}
                animate={{ y: 0 }}
                transition={{
                  duration: 1.1,
                  delay: 0.7 + i * 0.16,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {line.text}
              </motion.span>
            </span>
          ))}
        </h1>

        <div className="overflow-hidden mt-8 max-w-xl">
          <motion.p
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{ duration: 1, delay: 1.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-sm sm:text-base text-[#9EA3B0] leading-relaxed"
            data-testid="hero-subtext"
          >
            Every building belongs to its landscape. We blend regional identity with modern
            structural precision — from blueprint to completion, across Maharashtra's evolving
            horizons.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1 }}
          className="mt-14 grid grid-cols-1 sm:grid-cols-3 border-t border-white/10"
          data-testid="hero-stats-bar"
        >
          {STATS.map((s, i) => (
            <div
              key={i}
              className="py-6 sm:py-7 sm:pr-8 border-b sm:border-b-0 sm:border-r last:border-r-0 border-white/10 sm:pl-8 sm:first:pl-0"
              data-testid={`hero-stat-${i}`}
            >
              <p className="ff-serif text-3xl text-[#C8A97E]">{s.value}</p>
              <p className="ff-mono text-[10px] uppercase tracking-[0.2em] text-[#9EA3B0] mt-2">
                {s.label}
              </p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2 }}
        className="absolute bottom-6 right-6 lg:right-10 z-10 hidden sm:flex items-center gap-3"
        data-testid="hero-scroll-hint"
      >
        <span className="ff-mono text-[10px] uppercase tracking-[0.25em] text-[#9EA3B0]">
          Scroll
        </span>
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <ArrowDown size={14} className="text-[#C8A97E]" />
        </motion.span>
      </motion.div>
    </section>
  );
};

export default KineticHero;
