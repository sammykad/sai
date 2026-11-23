"use client";

import { motion } from "motion/react";
import { Compass, Ruler, Leaf } from "lucide-react";

const PRINCIPLES = [
  {
    id: "01",
    icon: Compass,
    title: "Contextual Innovation",
    tagline: "Rooted in Soil & Sun",
    description:
      "Rooting every design in local culture, climate, and geography while integrating modern structural engineering and digital workflows. Every building belongs to its landscape, blending regional identity with modern efficiency.",
  },
  {
    id: "02",
    icon: Ruler,
    title: "Functional Craftsmanship",
    tagline: "Precision in Every Metre",
    description:
      "Prioritizing spatial fluidity, human movement, and precise material execution. Aesthetic value stems directly from structural purpose — ensuring every detail enhances the daily living experience from blueprint to completion.",
  },
  {
    id: "03",
    icon: Leaf,
    title: "Purposeful Sustainability",
    tagline: "Passive Comfort & Resilience",
    description:
      "Designing with environmental responsibility at the forefront — maximizing passive cooling, natural daylighting, and durable local materials to deliver resilient, energy-conscious spaces across Maharashtra's evolving horizons.",
  },
];

const ease = [0.22, 1, 0.36, 1];

const StudioPrinciples = () => (
  <section
    id="principles"
    className="relative py-28 lg:py-40 bg-[#0C0D11] border-y border-white/5"
    data-testid="principles-section"
  >
    <div className="absolute inset-0 drafting-grid opacity-40 pointer-events-none" />
    <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
      <div className="max-w-2xl mb-16 lg:mb-24">
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease }}
          className="overline-label mb-6"
        >
          Studio Principles
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.1, ease }}
          className="ff-serif text-2xl sm:text-3xl lg:text-4xl font-light text-white leading-tight"
          data-testid="principles-heading"
        >
          Three convictions that shape{" "}
          <span className="italic text-[#C8A97E]">every line we draw</span>
        </motion.h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
        {PRINCIPLES.map((p, i) => (
          <motion.article
            key={p.id}
            initial={{ opacity: 0, y: 56 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.9, delay: i * 0.15, ease }}
            className={`group relative bg-[#121419] border border-white/10 p-8 lg:p-10 hover:border-[#C8A97E]/40 transition-colors duration-500 ${
              i === 1 ? "lg:translate-y-12" : ""
            }`}
            data-testid={`principle-card-${p.id}`}
          >
            <div className="flex items-start justify-between">
              <p.icon
                size={26}
                strokeWidth={1.2}
                className="text-[#C8A97E] transition-transform duration-500 group-hover:-translate-y-1"
              />
              <span className="ff-serif text-5xl font-light text-stroke-gold select-none">
                {p.id}
              </span>
            </div>
            <h3 className="ff-display text-xl sm:text-2xl font-medium text-white mt-10">
              {p.title}
            </h3>
            <p className="ff-mono text-[10px] uppercase tracking-[0.22em] text-[#C8A97E] mt-3">
              {p.tagline}
            </p>
            <span className="block w-10 h-px bg-[#C8A97E]/50 mt-6 transition-all duration-500 group-hover:w-full group-hover:bg-[#C8A97E]" />
            <p className="text-sm leading-relaxed text-[#9EA3B0] mt-6">{p.description}</p>
          </motion.article>
        ))}
      </div>
    </div>
  </section>
);

export default StudioPrinciples;
