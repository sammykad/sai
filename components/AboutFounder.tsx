"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import axios from "axios";
import { GraduationCap, BadgeCheck, MapPin } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PORTRAIT =
  "https://images.unsplash.com/photo-1598367815092-a2c0cbc1ea3d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHwzfHxhcmNoaXRlY3R1cmFsJTIwbW9kZWwlMjBzdHVkaW8lMjBza2V0Y2glMjBibHVlcHJpbnQlMjB3b3JrZXIlMjBhcmNoaXRlY3R8ZW58MHx8fHwxNzkxNDg3NTgyfDA&ixlib=rb-4.1.0&q=85";
const DRAFTING =
  "https://images.unsplash.com/photo-1599420186985-5c3d1a038e84?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHwyfHxhcmNoaXRlY3R1cmFsJTIwbW9kZWwlMjBzdHVkaW8lMjBza2V0Y2glMjBibHVlcHJpbnQlMjB3b3JrZXIlMjBhcmNoaXRlY3R8ZW58MHx8fHwxNzkxNDg3NTgyfDA&ixlib=rb-4.1.0&q=85";

const CREDENTIALS = [
  { icon: GraduationCap, label: "Education", value: "B.Arch." },
  { icon: BadgeCheck, label: "COA Registration", value: "CA/2006/39225" },
  { icon: MapPin, label: "Practice", value: "Solapur · Pune · Chh. Sambhajinagar" },
];

const ease = [0.22, 1, 0.36, 1] as const;

const AboutFounder = () => {
  const [founderImg, setFounderImg] = useState(PORTRAIT);
  const [studioImg, setStudioImg] = useState(DRAFTING);

  useEffect(() => {
    axios
      .get(`${API}/settings`)
      .then(({ data }) => {
        if (data?.founder_image_path) {
          setFounderImg(`${API}/files/${data.founder_image_path}`);
        }
        if (data?.studio_image_path) {
          setStudioImg(`${API}/files/${data.studio_image_path}`);
        }
      })
      .catch(() => { });
  }, []);

  return (
    <section id="about" className="relative py-28 lg:py-40" data-testid="founder-section">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1, ease }}
          className="relative"
        >
          <div className="absolute -top-4 -left-4 w-full h-full border border-[#C8A97E]/30 pointer-events-none" />
          <div className="relative overflow-hidden" data-testid="founder-image-frame">
            <motion.img
              src={founderImg}
              alt="Ar. Kedar Vilasrao Mahamuni — founder of SAI Studio"
              className="w-full h-[420px] lg:h-[560px] object-cover"
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.8, ease }}
              data-testid="founder-image"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0E]/70 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5">
              <p className="ff-mono text-[10px] uppercase tracking-[0.22em] text-[#C8A97E]">
                The Atelier — Est. 2006
              </p>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.25, ease }}
            className="hidden lg:block absolute -bottom-10 -right-10 w-48 border border-white/10 overflow-hidden"
          >
            <img
              src={studioImg}
              alt="Studio drafting detail"
              className="w-full h-32 object-cover"
              data-testid="studio-detail-image"
            />
          </motion.div>
        </motion.div>

        <div>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease }}
            className="overline-label mb-6"
          >
            The Founder
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.1, ease }}
            className="ff-serif text-2xl sm:text-3xl lg:text-4xl font-light text-white leading-tight"
            data-testid="founder-name"
          >
            Ar. Kedar Vilasrao{" "}
            <span className="italic text-[#C8A97E]">Mahamuni</span>
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.2, ease }}
            className="mt-8 space-y-5 text-sm sm:text-base leading-relaxed"
          >
            <p>
              SAI Studio for Architectural Innovations was founded on a singular conviction — that
              architecture is not an object to be seen, but an experience to be lived. Every wall,
              every threshold, every shaft of daylight is composed for the human being who moves
              through it.
            </p>
            <p>
              Practising across Solapur, Pune and Chhatrapati Sambhajinagar, the studio roots each
              commission in the culture, climate and geography of Maharashtra — then sharpens it
              with modern structural engineering and digital workflows.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.3, ease }}
            className="mt-10 border-t border-white/10"
            data-testid="founder-credentials"
          >
            {CREDENTIALS.map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-5 py-5 border-b border-white/10 group"
                data-testid={`founder-credential-${i}`}
              >
                <c.icon size={18} className="text-[#C8A97E] shrink-0" strokeWidth={1.5} />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-1">
                  <span className="ff-mono text-[10px] uppercase tracking-[0.2em] text-[#9EA3B0]">
                    {c.label}
                  </span>
                  <span className="ff-display text-sm text-white group-hover:text-[#C8A97E] transition-colors duration-300">
                    {c.value}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutFounder;
