"use client";

/**
 * HostCard.tsx
 * ────────────
 * Kartu "Host Game" yang memungkinkan pengguna untuk membuat room kuis baru.
 * Menampilkan tombol dengan efek animasi glow yang berkedip.
 *
 * Props:
 * - onHost: fungsi yang dipanggil saat tombol "Start Race" diklik
 */

import { Flag } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface HostCardProps {
  onHost: () => void;
}

export default function HostCard({ onHost }: HostCardProps) {
  const { t } = useTranslation();

  return (
    <div className="host-card race-card flex-1 flex flex-col p-8 relative group">
      {/* Elemen dekoratif kartu balapan */}
      <div className="motion-texture"></div>
      <div className="laser-edge text-[#7C3AED]"></div>
      <div className="checkered-tag"></div>

      <div className="relative z-10 flex flex-col">
        {/* ── Header kartu: ikon & judul ── */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            {/* Ikon bendera */}
            <div className="w-10 h-10 flex items-center justify-center bg-[#7C3AED]/10 text-[#a78bfa] border border-[#7C3AED]/20">
              <Flag className="w-5 h-5" />
            </div>
            <div className="flex items-baseline gap-4">
              {/* Judul utama */}
              <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none">
                {t('homepage.host.title')}
              </h2>
              {/* Subjudul (tersembunyi di layar kecil) */}
              <p className="text-white/40 text-[10px] font-bold tracking-[0.1em] leading-none uppercase hidden sm:block">
                {t('homepage.host.subtitle')}
              </p>
            </div>
          </div>

          {/* Indikator dekoratif garis & titik */}
          <div className="flex items-center gap-6 mt-1">
            <div className="h-0.5 w-12 bg-[#7C3AED] group-hover:w-20 transition-all duration-500"></div>
            <div className="flex gap-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`h-1 w-4 ${i < 3 ? 'bg-[#7C3AED]' : 'bg-white/10'}`}></div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tombol aksi: mulai balapan ── */}
        <div className="mb-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              boxShadow: ["0 0 10px rgba(124,58,237,0.3)", "0 0 25px rgba(124,58,237,0.6)", "0 0 10px rgba(124,58,237,0.3)"],
            }}
            transition={{
              boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            onClick={onHost}
            className="px-8 py-3.5 bg-gradient-to-r from-[#7C3AED] to-[#5b21b6] border border-[#7C3AED]/50 rounded-xl transition-all duration-300 relative group overflow-hidden"
          >
            {/* Efek kilau (shimmer) saat hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
            <span className="text-lg font-black text-white uppercase tracking-[0.15em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
              {t('homepage.host.button')}
            </span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
