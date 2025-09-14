"use client";

import { motion } from "framer-motion";

export default function TechSpinner1() {
  return (
    <div className="flex items-center justify-center w-full h-screen bg-gray-900">
      <div className="relative w-24 h-24">
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 border-4 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)]"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />

        {/* Middle ring */}
        <motion.div
          className="absolute inset-2 border-4 border-r-teal-500 border-t-transparent border-b-transparent border-l-transparent rounded-full shadow-[0_0_10px_rgba(20,184,166,0.5)]"
          animate={{ rotate: -360 }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />

        {/* Inner ring */}
        <motion.div
          className="absolute inset-4 border-4 border-b-blue-500 border-t-transparent border-r-transparent border-l-transparent rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />

        {/* Center dot */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.8,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        >
          <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
        </motion.div>

        {/* Orbiting dots */}
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]"
            initial={{
              x: 0,
              y: 0,
              opacity: 0,
            }}
            animate={{
              x: Math.cos((i * Math.PI) / 2) * 40,
              y: Math.sin((i * Math.PI) / 2) * 40,
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              delay: i * 0.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            style={{
              top: "calc(50% - 4px)",
              left: "calc(50% - 4px)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
