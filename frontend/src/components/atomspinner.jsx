"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function AtomSpinner() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Fixed settings
  const size = 200;
  const primaryColor = "#06b6d4"; // cyan
  const secondaryColor = "#0891b2";
  const glowColor = "rgba(6, 182, 212, 0.6)";
  const backgroundColor = "#111827"; // dark gray

  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: size,
        height: size,
        backgroundColor,
        borderRadius: "50%",
        boxShadow: `0 0 ${size / 10}px ${glowColor}`,
        overflow: "hidden",
      }}
    >
      <div
        className="relative"
        style={{ width: size * 0.8, height: size * 0.8 }}
      >
        {/* Main circle */}
        <motion.div
          className="absolute inset-0"
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            border: `${size / 40}px solid ${primaryColor}`,
            boxShadow: `0 0 ${size / 20}px ${glowColor}`,
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />

        {/* Horizontal ellipse */}
        <motion.div
          className="absolute inset-0"
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            border: `${size / 60}px solid ${secondaryColor}`,
            boxShadow: `0 0 ${size / 30}px ${glowColor}`,
            transform: "rotateX(75deg)",
          }}
          animate={{ rotateY: 360 }}
          transition={{
            duration: 15,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />

        {/* Vertical ellipse */}
        <motion.div
          className="absolute inset-0"
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            border: `${size / 60}px solid ${secondaryColor}`,
            boxShadow: `0 0 ${size / 30}px ${glowColor}`,
            transform: "rotateY(75deg)",
          }}
          animate={{ rotateX: 360 }}
          transition={{
            duration: 12,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />

        {/* Diagonal ellipse */}
        <motion.div
          className="absolute inset-0"
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            border: `${size / 60}px solid ${secondaryColor}`,
            boxShadow: `0 0 ${size / 30}px ${glowColor}`,
            transform: "rotate3d(1, 1, 0, 75deg)",
          }}
          animate={{ rotate: -360 }}
          transition={{
            duration: 18,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />

        {/* Center dot */}
        <motion.div
          className="absolute"
          style={{
            width: size / 15,
            height: size / 15,
            borderRadius: "50%",
            backgroundColor: primaryColor,
            boxShadow: `0 0 ${size / 20}px ${glowColor}`,
            top: "50%",
            left: "50%",
            marginLeft: -size / 30,
            marginTop: -size / 30,
          }}
          animate={{
            scale: [1, 1.5, 1],
            boxShadow: [
              `0 0 ${size / 20}px ${glowColor}`,
              `0 0 ${size / 10}px ${glowColor}`,
              `0 0 ${size / 20}px ${glowColor}`,
            ],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />

        {/* Orbiting dots */}
        {[0, 1, 2, 3].map((i) => {
          const angle = (i * Math.PI) / 2;
          const orbitSize = size * 0.35;
          const dotSize = size / 25;

          return (
            <motion.div
              key={i}
              className="absolute"
              style={{
                width: dotSize,
                height: dotSize,
                borderRadius: "50%",
                backgroundColor: primaryColor,
                boxShadow: `0 0 ${size / 30}px ${glowColor}`,
                top: "50%",
                left: "50%",
                marginLeft: -dotSize / 2,
                marginTop: -dotSize / 2,
              }}
              animate={{
                x: [
                  Math.cos(angle) * orbitSize,
                  Math.cos(angle + Math.PI / 4) * orbitSize,
                  Math.cos(angle + Math.PI / 2) * orbitSize,
                  Math.cos(angle + (3 * Math.PI) / 4) * orbitSize,
                  Math.cos(angle + Math.PI) * orbitSize,
                  Math.cos(angle + (5 * Math.PI) / 4) * orbitSize,
                  Math.cos(angle + (3 * Math.PI) / 2) * orbitSize,
                  Math.cos(angle + (7 * Math.PI) / 4) * orbitSize,
                  Math.cos(angle + 2 * Math.PI) * orbitSize,
                ],
                y: [
                  Math.sin(angle) * orbitSize,
                  Math.sin(angle + Math.PI / 4) * orbitSize,
                  Math.sin(angle + Math.PI / 2) * orbitSize,
                  Math.sin(angle + (3 * Math.PI) / 4) * orbitSize,
                  Math.sin(angle + Math.PI) * orbitSize,
                  Math.sin(angle + (5 * Math.PI) / 4) * orbitSize,
                  Math.sin(angle + (3 * Math.PI) / 2) * orbitSize,
                  Math.sin(angle + (7 * Math.PI) / 4) * orbitSize,
                  Math.sin(angle + 2 * Math.PI) * orbitSize,
                ],
                scale: [1, 1.2, 1],
                boxShadow: [
                  `0 0 ${size / 30}px ${glowColor}`,
                  `0 0 ${size / 20}px ${glowColor}`,
                  `0 0 ${size / 30}px ${glowColor}`,
                ],
              }}
              transition={{
                duration: 8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
                delay: i * 0.5,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
