import { motion } from "framer-motion";

const CHARS = ["🏰", "⭐", "🌙", "✨", "🪄", "🦋", "🌟", "💫", "🎆", "🌈"];

export default function FloatingChars() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {CHARS.map((c, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl md:text-3xl opacity-20"
          style={{
            left: `${5 + (i * 9)}%`,
            bottom: -40,
          }}
          animate={{
            y: [0, -1200],
            x: [0, Math.sin(i) * 60],
            rotate: [0, 360],
          }}
          transition={{
            duration: 15 + i * 2,
            repeat: Infinity,
            delay: i * 2,
            ease: "linear",
          }}
        >
          {c}
        </motion.div>
      ))}
    </div>
  );
}
