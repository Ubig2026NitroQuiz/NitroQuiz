/**
 * ============================================================================
 *  KOMPONEN RPM BAR (Indikator Putaran Mesin)
 * ============================================================================
 *
 *  Menampilkan 12 batang vertikal yang beranimasi menyerupai indikator
 *  RPM pada dashboard mobil balap. Warna berubah dari hijau → kuning → merah
 *  seiring bertambahnya bar, sesuai konvensi tachometer F1.
 *
 *  - Batang ke-0 s.d. ke-5  : Hijau  (#00ff9d)
 *  - Batang ke-6 s.d. ke-8  : Kuning (#f59e0b)
 *  - Batang ke-9 s.d. ke-11 : Merah  (#E10600) — zona redline
 * ============================================================================
 */

'use client';

import { motion } from "framer-motion";

/** Jumlah total batang pada RPM bar */
const TOTAL_BARS = 12;

/** Batas awal zona kuning (indeks bar) */
const YELLOW_ZONE_START = 6;

/** Batas awal zona merah / redline (indeks bar) */
const RED_ZONE_START = 9;

interface RpmBarProps {
  /** Jika true, batang akan beranimasi naik-turun secara acak */
  active: boolean;
}

export default function RpmBar({ active }: RpmBarProps) {
  const bars = Array.from({ length: TOTAL_BARS });

  return (
    <div className="flex items-end gap-[2px] h-4">
      {bars.map((_, i) => {
        // Tentukan warna berdasarkan zona RPM
        const isRed = i >= RED_ZONE_START;
        const isYellow = i >= YELLOW_ZONE_START;
        const barColor = isRed ? "#E10600" : isYellow ? "#f59e0b" : "#00ff9d";

        // Bar selalu dianggap aktif jika prop active bernilai true
        const isActive = active && true;

        return (
          <motion.div
            key={i}
            className="w-[3px] rounded-[1px]"
            style={{ background: barColor }}
            animate={{
              // Tinggi bar bervariasi secara acak saat aktif
              height: isActive
                ? `${Math.min(100, 30 + i * 6 + Math.random() * 10)}%`
                : `${15 + i * 3}%`,
              opacity: isActive ? 1 : 0.25,
            }}
            transition={{
              duration: 0.3,
              delay: i * 0.04,
              repeat: isActive ? Infinity : 0,
              repeatType: "reverse",
              repeatDelay: 0.1 + i * 0.05,
            }}
          />
        );
      })}
    </div>
  );
}
