"use client";

/**
 * RpmBar.tsx
 * ──────────
 * Komponen bar RPM animasi di header kartu login.
 * Menampilkan 12 bar vertikal yang beranimasi saat proses login aktif.
 * Warna bar: hijau (low) → kuning (mid) → merah (high).
 *
 * Props:
 * - active: true saat sedang proses login
 */

import { motion } from "framer-motion";

interface RpmBarProps {
  active: boolean;
}

export default function RpmBar({ active }: RpmBarProps) {
  const bars = Array.from({ length: 12 });

  return (
    <div className="flex items-end gap-[2px] h-4">
      {bars.map((_, i) => {
        // Warna bar berdasarkan posisi: hijau → kuning → merah
        const isRed = i >= 9;
        const color = isRed ? "#E10600" : i >= 6 ? "#f59e0b" : "#00ff9d";

        return (
          <motion.div
            key={i}
            className="w-[3px] rounded-[1px]"
            style={{ background: color }}
            animate={{
              height: active
                ? `${Math.min(100, 30 + i * 6 + Math.random() * 10)}%`
                : `${15 + i * 3}%`,
              opacity: active ? 1 : 0.25,
            }}
            transition={{
              duration: 0.3,
              delay: i * 0.04,
              repeat: active ? Infinity : 0,
              repeatType: "reverse",
              repeatDelay: 0.1 + i * 0.05,
            }}
          />
        );
      })}
    </div>
  );
}
