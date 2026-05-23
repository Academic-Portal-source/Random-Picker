import { motion } from "framer-motion";

export default function Sparkle({ count = 20, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {[...Array(count)].map((_, i) => {
        const size = 2 + Math.random() * 4;
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const delay = Math.random() * 5;
        const dur = 2 + Math.random() * 3;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              left: `${left}%`,
              top: `${top}%`,
              background: `radial-gradient(circle, rgba(255,215,0,1) 0%, rgba(255,215,0,0) 70%)`,
              boxShadow: `0 0 ${size * 2}px ${size}px rgba(255,215,0,0.3)`,
            }}
            animate={{
              opacity: [0, 1, 0.5, 1, 0],
              scale: [0, 1.2, 0.8, 1.3, 0],
            }}
            transition={{
              duration: dur,
              delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        );
      })}
    </div>
  );
}
