/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KOMPONEN: Odometer
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Komponen penghitung skor dengan efek odometer motorsport.
 * Angka berputar naik dari 0 ke nilai target selama 1.5 detik,
 * memberikan kesan speedometer yang dramatis di halaman leaderboard.
 *
 * Bisa diberi delay agar animasi terjadi berurutan sesuai
 * urutan kemunculan podium.
 */

"use client";

import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════════════════

interface OdometerProps {
  /** Nilai akhir yang akan dicapai oleh odometer */
  value: number;
  /** Delay sebelum animasi dimulai (dalam detik) */
  delay?: number;
}

export const Odometer = ({ value, delay = 0 }: OdometerProps) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Tunda animasi sesuai delay (dalam detik → milidetik)
    let timeout = setTimeout(() => {
      let start = 0;
      const end = value;
      const duration = 1500; // Durasi animasi: 1.5 detik
      const increment = end / (duration / 16); // Increment per frame (~60fps)

      // Jalankan interval untuk mengupdate nilai secara bertahap
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setDisplayValue(end);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }, delay * 1000);

    // Bersihkan timeout saat komponen di-unmount
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return <span>{displayValue.toLocaleString()}</span>;
};
