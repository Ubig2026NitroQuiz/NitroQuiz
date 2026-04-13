"use client";

/**
 * Speedometer.tsx
 * ───────────────
 * Komponen speedometer animasi di header kartu login.
 * Menampilkan jarum speedometer yang bergerak saat proses login aktif.
 *
 * Props:
 * - active: true saat sedang proses login (jarum bergerak ke kanan)
 */

import { motion } from "framer-motion";

interface SpeedometerProps {
  active: boolean;
}

export default function Speedometer({ active }: SpeedometerProps) {
  return (
    <div className="relative w-20 h-10 overflow-hidden">
      <svg viewBox="0 0 80 40" className="w-full h-full" fill="none">
        {/* Jalur busur (track) */}
        <path d="M4 40 A36 36 0 0 1 76 40" stroke="rgba(255,255,255,0.06)" strokeWidth="6" strokeLinecap="round" />

        {/* Busur terisi (animated) */}
        <motion.path
          d="M4 40 A36 36 0 0 1 76 40"
          stroke="url(#speedGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="113"
          animate={{ strokeDashoffset: active ? 0 : 90 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />

        {/* Definisi gradien warna */}
        <defs>
          <linearGradient id="speedGrad" x1="0" y1="0" x2="80" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="50%" stopColor="#2d6af2" />
            <stop offset="100%" stopColor="#00ff9d" />
          </linearGradient>
        </defs>

        {/* Jarum speedometer */}
        <motion.line
          x1="40" y1="40" x2="40" y2="8"
          stroke="#00ff9d"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ transformOrigin: "40px 40px" }}
          animate={{ rotate: active ? 80 : -80 }}
          transition={{ duration: 1.2, ease: "easeOut", type: "spring", stiffness: 60 }}
        />

        {/* Titik pusat jarum */}
        <circle cx="40" cy="40" r="3" fill="#00ff9d" />
      </svg>
    </div>
  );
}
