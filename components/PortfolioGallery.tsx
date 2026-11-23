"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import axios from "axios";
import { X, MapPin, Calendar, Maximize, Tag } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FALLBACK_PROJECTS = [
  {
    id: "proj-1",
    title: "The Sahyadri Courtyard Pavilion",
    category: "Residential",
    location: "Pune, MH",
    year: "2025",
    area: "6,500 sq.ft",
    image:
      "https://images.unsplash.com/photo-1647341159891-302156d1bbdf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBsdXh1cnklMjBpbnRlcmlvciUyMGFyY2hpdGVjdHVyZSUyMGNvdXJ0eWFyZCUyMHN0b25lJTIwd29vZHxlbnwwfHx8fDE3OTE0ODc1ODJ8MA&ixlib=rb-4.1.0&q=85",
    description:
      "A climate-responsive bungalow utilizing basalt stone masonry and deep shaded verandas to naturally cool internal spaces during Maharashtrian summers.",
  },
  {
    id: "proj-2",
    title: "Solapur Textural Concrete Villa",
    category: "Commercial",
    location: "Solapur, MH",
    year: "2024",
    area: "12,000 sq.ft",
    image:
      "https://images.unsplash.com/photo-1614595737476-42487331b8a1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBhcmNoaXRlY3R1cmFsJTIwY29uY3JldGUlMjBleHRlcmlvciUyMGJydXRhbGlzdCUyMGJ1aWxkaW5nfGVufDB8fHx8MTc5MTQ4NzU4Mnww&ixlib=rb-4.1.0&q=85",
    description:
      "Raw board-formed concrete shuttering integrated with terracotta jali screens for ventilation and glare control.",
  },
  {
    id: "proj-3",
    title: "Sambhajinagar Heritage Cultural Hub",
    category: "Cultural",
    location: "Chh. Sambhajinagar, MH",
    year: "2025",
    area: "24,000 sq.ft",
    image:
      "https://images.unsplash.com/photo-1614595737683-1740e41bfaac?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHw0fHxtb2Rlcm4lMjBhcmNoaXRlY3R1cmFsJTIwY29uY3JldGUlMjBleHRlcmlvciUyMGJydXRhbGlzdCUyMGJ1aWxkaW5nfGVufDB8fHx8MTc5MTQ4NzU4Mnww&ixlib=rb-4.1.0&q=85",
    description:
      "Modern urban cultural center celebrating Deccan architectural heritage through contemporary geometric skylights and open-air plazas.",
  },
  {
    id: "proj-4",
    title: "Veranda Stone Patio Residence",
    category: "Residential",
    location: "Pune, MH",
    year: "2023",
    area: "4,800 sq.ft",
    image:
      "https://images.unsplash.com/photo-1786204685672-e344095e5b49?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBsdXh1cnklMjBpbnRlcmlvciUyMGFyY2hpdGVjdHVyZSUyMGNvdXJ0eWFyZCUyMHN0b25lJTIwd29vZHxlbnwwfHx8fDE3OTE0ODc1ODJ8MA&ixlib=rb-4.1.0&q=85",
    description:
      "Seamless indoors-to-outdoors living space using locally quarried slate floors and teak louvers.",
  },
  {
    id: "proj-5",
    title: "Deccan Atrium Business Center",
    category: "Commercial",
    location: "Solapur, MH",
    year: "2024",
    area: "18,500 sq.ft",
    image:
      "https://images.unsplash.com/photo-1746173098001-2ae330a6a763?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHw0fHxtb2Rlcm4lMjBsdXh1cnklMjBpbnRlcmlvciUyMGFyY2hpdGVjdHVyZSUyMGNvdXJ0eWFyZCUyMHN0b25lJTIwd29vZHxlbnwwfHx8fDE3OTE0ODc1ODJ8MA&ixlib=rb-4.1.0&q=85",
    description:
      "High-density workplace featuring a central green courtyard chimney effect for low-energy air exchange.",
  },
];

const FILTERS = ["All", "Residential", "Commercial", "Cultural", "Healthcare", "Hospitality", "Educational", "IT Sectors", "Land Development"];
const ease = [0.22, 1, 0.36, 1];

const imgFor = (p) => (p.storage_path ? `${API}/files/${p.storage_path}` : p.image);

const PortfolioGallery = () => {
  const [filter, setFilter] = useState("All");
  const [active, setActive] = useState(null);
  const [projects, setProjects] = useState(FALLBACK_PROJECTS);

  useEffect(() => {
    axios
      .get(`${API}/projects`)
      .then(({ data }) => {
        if (Array.isArray(data) && data.length) setProjects(data);
      })
      .catch(() => {});
  }, []);

  const visible =
    filter === "All" ? projects : projects.filter((p) => p.category === filter);

  return (
    <section id="portfolio" className="relative py-28 lg:py-40" data-testid="portfolio-section">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10 mb-14 lg:mb-20">
          <div className="max-w-xl">
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease }}
              className="overline-label mb-6"
            >
              Selected Works
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.1, ease }}
              className="ff-serif text-2xl sm:text-3xl lg:text-4xl font-light text-white leading-tight"
              data-testid="portfolio-heading"
            >
              Built across the{" "}
              <span className="italic text-[#C8A97E]">Deccan horizon</span>
            </motion.h2>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease }}
            className="flex flex-wrap gap-2"
            data-testid="portfolio-filters"
          >
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                data-testid={`portfolio-filter-${f.toLowerCase()}`}
                className={`ff-mono text-[10px] uppercase tracking-[0.2em] px-4 py-2 border transition-all duration-300 ${
                  filter === f
                    ? "bg-[#C8A97E] text-[#0A0B0E] border-[#C8A97E]"
                    : "text-[#9EA3B0] border-white/15 hover:border-[#C8A97E]/50 hover:text-[#C8A97E]"
                }`}
              >
                {f}
              </button>
            ))}
          </motion.div>
        </div>

        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {visible.map((p, i) => (
              <motion.article
                layout
                key={p.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.6, delay: i * 0.06, ease }}
                className={`group cursor-pointer ${i % 3 === 1 ? "lg:translate-y-10" : ""}`}
                onClick={() => setActive(p)}
                data-testid={`project-card-${p.id}`}
              >
                <div className="relative overflow-hidden border border-white/10">
                  {imgFor(p) ? (
                    <img
                      src={imgFor(p)}
                      alt={p.title}
                      loading="lazy"
                      className="w-full h-72 object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-72 drafting-grid bg-[#121419] flex items-center justify-center">
                      <span className="ff-serif italic text-xl text-[#C8A97E]/40">{p.title}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0E]/85 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  {p.year && (
                    <span className="absolute top-4 left-4 ff-mono text-[9px] uppercase tracking-[0.2em] text-[#0A0B0E] bg-[#C8A97E] px-2.5 py-1">
                      {p.year}
                    </span>
                  )}
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="ff-mono text-[9px] uppercase tracking-[0.2em] text-[#C8A97E]">
                      {p.category}
                      {p.location ? ` — ${p.location}` : ""}
                    </p>
                    <h3 className="ff-display text-lg font-medium text-white mt-1.5 leading-snug">
                      {p.title}
                    </h3>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#0A0B0E]/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
            onClick={() => setActive(null)}
            data-testid="project-modal"
          >
            <motion.div
              initial={{ opacity: 0, y: 48, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 32, scale: 0.97 }}
              transition={{ duration: 0.5, ease }}
              className="relative bg-[#121419] border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setActive(null)}
                className="absolute top-4 right-4 z-10 bg-[#0A0B0E]/70 backdrop-blur p-2.5 text-white hover:text-[#C8A97E] transition-colors border border-white/10"
                data-testid="project-modal-close"
                aria-label="Close project details"
              >
                <X size={18} />
              </button>
              <div className="relative">
                {imgFor(active) ? (
                  <img
                    src={imgFor(active)}
                    alt={active.title}
                    className="w-full h-64 sm:h-96 object-cover"
                  />
                ) : (
                  <div className="w-full h-64 sm:h-96 drafting-grid bg-[#0C0D11] flex items-center justify-center">
                    <span className="ff-serif italic text-2xl text-[#C8A97E]/40">{active.title}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#121419] via-transparent to-transparent" />
              </div>
              <div className="p-6 sm:p-10 -mt-10 relative">
                <p className="overline-label mb-3">{active.category}</p>
                <h3
                  className="ff-serif text-2xl sm:text-3xl font-light text-white"
                  data-testid="project-modal-title"
                >
                  {active.title}
                </h3>
                <div className="grid grid-cols-3 gap-4 mt-8 border-y border-white/10 py-5">
                  <div data-testid="project-modal-location">
                    <MapPin size={14} className="text-[#C8A97E] mb-2" />
                    <p className="ff-mono text-[9px] uppercase tracking-[0.18em] text-[#9EA3B0]">
                      Location
                    </p>
                    <p className="ff-display text-xs sm:text-sm text-white mt-1">
                      {active.location || "—"}
                    </p>
                  </div>
                  <div data-testid="project-modal-year">
                    <Calendar size={14} className="text-[#C8A97E] mb-2" />
                    <p className="ff-mono text-[9px] uppercase tracking-[0.18em] text-[#9EA3B0]">
                      Year
                    </p>
                    <p className="ff-display text-xs sm:text-sm text-white mt-1">
                      {active.year || "—"}
                    </p>
                  </div>
                  <div data-testid="project-modal-area">
                    <Maximize size={14} className="text-[#C8A97E] mb-2" />
                    <p className="ff-mono text-[9px] uppercase tracking-[0.18em] text-[#9EA3B0]">
                      Area
                    </p>
                    <p className="ff-display text-xs sm:text-sm text-white mt-1">
                      {active.area || "—"}
                    </p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-[#9EA3B0] mt-6">
                  {active.description}
                </p>
                <div className="flex items-center gap-2 mt-8">
                  <Tag size={12} className="text-[#C8A97E]" />
                  <span className="ff-mono text-[9px] uppercase tracking-[0.2em] text-[#9EA3B0]">
                    SAI Studio for Architectural Innovations
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default PortfolioGallery;
