import { motion } from "framer-motion";

const PARTICLES = 30;
const COLORS = ["#FFD700", "#FF69B4", "#00CED1", "#FF6347", "#9370DB", "#00FA9A", "#FFB347", "#87CEEB"];

export default function MagicBurst({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-50">
      {[...Array(PARTICLES)].map((_, i) => {
        const angle = (i / PARTICLES) * Math.PI * 2;
        const dist = 120 + Math.random() * 200;
        const size = 4 + Math.random() * 8;
        return (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: size,
              height: size,
              background: COLORS[i % COLORS.length],
              boxShadow: `0 0 ${size * 2}px ${COLORS[i % COLORS.length]}`,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist + 40,
              opacity: 0,
              scale: 0,
            }}
            transition={{ duration: 1.2, ease: "easeOut", delay: Math.random() * 0.2 }}
          />
        );
      })}
      {/* Stars burst */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <motion.div
            key={`star-${i}`}
            className="absolute left-1/2 top-1/2 text-3xl"
            initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
            animate={{
              x: Math.cos(angle) * 160,
              y: Math.sin(angle) * 130,
              opacity: 0,
              scale: 1.5,
              rotate: 360,
            }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
          >
            ✨
          </motion.div>
        );
      })}
    </div>
  );
}
