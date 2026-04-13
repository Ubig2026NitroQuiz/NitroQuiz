"use client";

/**
 * Podium.tsx
 * ──────────
 * Komponen podium untuk menampilkan 3 peringkat teratas.
 * Posisi visual podium (dari kiri ke kanan):
 * - Peringkat 2 (silver) — tinggi sedang
 * - Peringkat 1 (gold)   — paling tinggi, di tengah
 * - Peringkat 3 (bronze) — paling rendah
 *
 * Setiap podium memiliki animasi spring yang muncul dari bawah
 * dengan delay berbeda sesuai peringkat.
 *
 * Props:
 * - rankedPlayers: array peserta yang sudah diurutkan berdasarkan peringkat
 */

import { Crown } from "lucide-react";
import { motion } from "framer-motion";
import { Participant } from "./types";
import { PODIUM_VARIANTS } from "./constants";
import InitialsAvatar from "./InitialsAvatar";

interface PodiumProps {
  rankedPlayers: Participant[];
}

export default function Podium({ rankedPlayers }: PodiumProps) {
  const firstPlace = rankedPlayers[0];
  const secondPlace = rankedPlayers[1];
  const thirdPlace = rankedPlayers[2];

  if (!firstPlace) return null;

  return (
    <div className="relative flex items-end justify-center w-full h-[220px] sm:h-[300px] mb-4 px-2">
      {/* Efek cahaya difus di bawah podium */}
      <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-2/3 h-16 bg-[#2d6af2]/20 blur-[30px] rounded-full pointer-events-none" />

      {/* ══════════════════════════════════════ */}
      {/* PERINGKAT 2 — Silver (sisi kiri)      */}
      {/* ══════════════════════════════════════ */}
      {secondPlace && (
        <motion.div
          custom={2}
          variants={PODIUM_VARIANTS}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center relative z-10 mx-[-8px] sm:mx-1"
        >
          {/* Nama pemain */}
          <div className="mb-2 text-center">
            <div className="bg-black/60 border border-slate-300/40 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
              <p className="font-display text-slate-200 text-xs sm:text-sm tracking-wider truncate max-w-[100px]" title={secondPlace.nickname}>
                {secondPlace.nickname}
              </p>
            </div>
          </div>

          {/* Kolom podium */}
          <div className="w-[85px] sm:w-[120px] h-[110px] sm:h-[140px] bg-gradient-to-b from-[#1a2235] to-[#0a0f1a] border-t-4 border-l border-r border-[#64748b] rounded-t-xl flex flex-col items-center justify-between py-2 sm:py-3">
            {/* Avatar pemain */}
            <div className="relative">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-slate-400/30 bg-black/40 overflow-hidden flex items-center justify-center p-0 shadow-inner relative z-10">
                {secondPlace.avatar_url ? (
                  <img
                    src={secondPlace.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <InitialsAvatar name={secondPlace.nickname} size="sm" />
                )}
              </div>
            </div>
            {/* Skor */}
            <span className="font-display text-2xl sm:text-4xl text-slate-300 font-bold mb-1 drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
              {secondPlace.score.toLocaleString()}
            </span>
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════ */}
      {/* PERINGKAT 1 — Gold (tengah, tertinggi) */}
      {/* ══════════════════════════════════════ */}
      {firstPlace && (
        <motion.div
          custom={3}
          variants={PODIUM_VARIANTS}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center relative z-20 mx-0 sm:mx-2"
        >
          {/* Ikon mahkota mengambang */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="mb-1"
          >
            <Crown className="w-7 h-7 sm:w-9 sm:h-9 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
          </motion.div>

          {/* Nama pemain juara */}
          <div className="mb-2 text-center">
            <div className="bg-[#1a1500]/80 border border-yellow-500/60 backdrop-blur-md px-4 sm:px-5 py-2 rounded-xl shadow-[0_0_25px_rgba(250,204,21,0.3)]">
              <p className="font-display text-yellow-500 text-sm sm:text-lg font-bold tracking-widest uppercase truncate max-w-[130px]" title={firstPlace.nickname}>
                {firstPlace.nickname}
              </p>
            </div>
          </div>

          {/* Kolom podium emas (paling tinggi) */}
          <div className="w-[100px] sm:w-[140px] h-[160px] sm:h-[200px] bg-gradient-to-b from-[#2a1f0a] to-[#0a0f1a] border-t-8 border-l-2 border-r-2 border-[#eab308] rounded-t-xl relative overflow-hidden flex flex-col items-center justify-between py-3 sm:py-5">
            {/* Aksen garis emas di atas */}
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-[#eab308] to-transparent" />
            {/* Efek cahaya emas radial */}
            <div className="absolute inset-0 bg-yellow-500/5 opacity-50 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-yellow-500/40 to-transparent" />

            {/* Avatar pemain juara */}
            <div className="relative z-10">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-yellow-500/30 bg-black/40 overflow-hidden flex items-center justify-center p-0 shadow-inner relative z-10">
                {firstPlace.avatar_url ? (
                  <img
                    src={firstPlace.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <InitialsAvatar name={firstPlace.nickname} size="md" />
                )}
              </div>
            </div>

            {/* Skor juara */}
            <span className="font-display text-3xl sm:text-5xl text-yellow-400 font-bold relative z-10 pb-0 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]">
              {firstPlace.score.toLocaleString()}
            </span>
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════ */}
      {/* PERINGKAT 3 — Bronze (sisi kanan)     */}
      {/* ══════════════════════════════════════ */}
      {thirdPlace && (
        <motion.div
          custom={1}
          variants={PODIUM_VARIANTS}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center relative z-10 mx-[-8px] sm:mx-1"
        >
          {/* Nama pemain */}
          <div className="mb-2 text-center">
            <div className="bg-black/60 border border-orange-700/40 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
              <p className="font-display text-orange-200 text-xs sm:text-sm tracking-wider truncate max-w-[100px]" title={thirdPlace.nickname}>
                {thirdPlace.nickname}
              </p>
            </div>
          </div>

          {/* Kolom podium perunggu (paling pendek) */}
          <div className="w-[75px] sm:w-[110px] h-[80px] sm:h-[110px] bg-gradient-to-b from-[#25140b] to-[#0a0f1a] border-t-4 border-l border-r border-[#c2410c] rounded-t-xl flex flex-col items-center justify-between py-2 sm:py-3">
            {/* Avatar pemain */}
            <div className="relative">
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 border-orange-700/30 bg-black/40 overflow-hidden flex items-center justify-center p-0 shadow-inner relative z-10">
                {thirdPlace.avatar_url ? (
                  <img
                    src={thirdPlace.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <InitialsAvatar name={thirdPlace.nickname} size="sm" />
                )}
              </div>
            </div>
            {/* Skor */}
            <span className="font-display text-xl sm:text-3xl text-orange-300 font-bold mb-1 drop-shadow-[0_0_10px_rgba(251,146,60,0.4)]">
              {thirdPlace.score.toLocaleString()}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
