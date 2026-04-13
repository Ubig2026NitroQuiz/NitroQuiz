"use client";

/**
 * JoinCard.tsx
 * ────────────
 * Kartu "Join Game" yang memungkinkan pengguna untuk bergabung ke room
 * dengan memasukkan kode room.
 *
 * Props:
 * - roomCode: nilai input kode room saat ini
 * - onRoomCodeChange: fungsi saat nilai kode room berubah
 * - onJoin: fungsi yang dipanggil saat tombol "Go" diklik atau Enter ditekan
 */

import { PlayCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface JoinCardProps {
  roomCode: string;
  onRoomCodeChange: (value: string) => void;
  onJoin: () => void;
}

export default function JoinCard({ roomCode, onRoomCodeChange, onJoin }: JoinCardProps) {
  const { t } = useTranslation();

  return (
    <div className="join-card race-card flex-1 flex flex-col p-8 relative group">
      {/* Elemen dekoratif kartu balapan */}
      <div className="motion-texture"></div>
      <div className="laser-edge text-[#2d6af2]"></div>
      <div className="checkered-tag"></div>

      <div className="relative z-10 flex flex-col">
        {/* ── Header kartu: ikon & judul ── */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            {/* Ikon play */}
            <div className="w-10 h-10 flex items-center justify-center bg-[#2d6af2]/10 text-[#5a9cff] border border-[#2d6af2]/20">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div className="flex items-baseline gap-4">
              {/* Judul utama */}
              <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none">
                {t('homepage.join.title')}
              </h2>
              {/* Subjudul (tersembunyi di layar kecil) */}
              <p className="text-white/40 text-[10px] font-bold tracking-[0.1em] leading-none uppercase hidden sm:block">
                {t('homepage.join.subtitle')}
              </p>
            </div>
          </div>

          {/* Garis dekoratif dengan efek hover */}
          <div className="mt-1 h-0.5 w-12 bg-[#2d6af2] group-hover:w-20 transition-all duration-500"></div>
        </div>

        {/* ── Input kode room & tombol gabung ── */}
        <div className="flex items-end gap-4">
          {/* Input untuk memasukkan kode room */}
          <div className="flex-1 relative">
            <input
              className="w-full bg-white/[0.03] border-b border-white/10 text-white font-bold text-lg py-2 focus:outline-none focus:border-[#2d6af2] transition-colors placeholder:text-[10px] placeholder:font-bold uppercase tracking-[0.3em] placeholder:text-white/20 text-center"
              maxLength={6}
              placeholder={t('homepage.join.placeholder')}
              type="text"
              value={roomCode}
              onChange={(e) => onRoomCodeChange(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && onJoin()}
            />
          </div>

          {/* Tombol gabung dengan efek animasi glow */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              boxShadow: ["0 0 10px rgba(45,106,242,0.3)", "0 0 25px rgba(45,106,242,0.6)", "0 0 10px rgba(45,106,242,0.3)"],
            }}
            transition={{
              boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            onClick={onJoin}
            className="px-10 py-3 bg-gradient-to-r from-[#2d6af2] to-[#1e40af] border border-[#2d6af2]/50 rounded-xl transition-all duration-300 relative group overflow-hidden whitespace-nowrap"
          >
            {/* Efek kilau (shimmer) saat hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
            <span className="text-base font-black text-white uppercase tracking-[0.15em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
              {t('homepage.join.button')}
            </span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
