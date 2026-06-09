/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KOMPONEN: LeaderboardTable
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Tabel ranking lengkap semua peserta dengan animasi masuk bertahap.
 * Menampilkan: peringkat, avatar + nama, skor, dan durasi.
 *
 * Fitur:
 * - Baris top 3 diberi warna highlight sesuai posisi (emas/perak/perunggu)
 * - Badge peringkat dengan warna dan border sesuai posisi
 * - Skor diberi warna hijau (≥75) atau merah (<75) sebagai indikator
 * - Durasi diberi warna hijau/cyan (selesai) atau merah (skor rendah)
 * - Container dengan clipPath untuk efek cyberpunk
 * - Scrollable jika peserta banyak (max-height 470px)
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TFunction } from "i18next";
import { Participant } from "../types";
import { InitialsAvatar } from "./InitialsAvatar";

// ═══════════════════════════════════════════════════════════════════════════
// TIPE PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface LeaderboardTableProps {
  /** Daftar peserta yang sudah diurutkan berdasarkan peringkat */
  rankedPlayers: Participant[];
  /** Fungsi format durasi (detik → "MM:SS") */
  formatDuration: (seconds: number | undefined | null) => string;
  /** Fungsi terjemahan i18n */
  t: TFunction;
}

// ═══════════════════════════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════════════════

export function LeaderboardTable({ rankedPlayers, formatDuration, t }: LeaderboardTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: 2.2,
        type: "spring",
        stiffness: 100,
        damping: 14,
      }}
      className="bg-[#111729]/80 backdrop-blur-xl border border-white/5 p-0 shadow-[0_15px_40px_rgba(0,0,0,0.6)] relative overflow-hidden group md:max-w-xl lg:max-w-3xl xl:max-w-5xl w-full mx-auto"
      style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%)' }}
    >
      {/* Aksen laser di atas tabel */}
      <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-[#2d6af2] to-transparent" />

      {/* Tekstur cyber halus di belakang tabel */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '16px 16px',
        }}
      />

      <div className="p-4 sm:p-6">
        <div className="overflow-x-auto w-full custom-scrollbar max-h-[470px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            {/* ── Header Tabel ── */}
            <thead>
              <tr className="border-b border-[#2d6af2]/20 text-gray-400 font-display text-[10px] sm:text-xs tracking-wider">
                <th className="px-2 sm:px-4 py-3 w-12 sm:w-16 text-center">
                  {t("host_leaderboard.rank")}
                </th>
                <th className="px-2 sm:px-4 py-3 text-left rtl:text-right">
                  {t("host_leaderboard.player")}
                </th>
                <th className="px-2 sm:px-4 py-3 text-right">
                  {t("host_leaderboard.score")}
                </th>
                <th className="px-2 sm:px-4 py-3 text-center">
                  {t("host_leaderboard.time")}
                </th>
              </tr>
            </thead>

            {/* ── Body Tabel dengan Animasi ── */}
            <tbody>
              <AnimatePresence>
                {rankedPlayers.map((player, index) => (
                  <PlayerRow
                    key={player.id}
                    player={player}
                    index={index}
                    formatDuration={formatDuration}
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: Baris Pemain
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Baris individual untuk setiap pemain di tabel leaderboard.
 * Animasi slide-in dari kiri dengan delay bertahap berdasarkan index.
 */
function PlayerRow({
  player,
  index,
  formatDuration,
}: {
  player: Participant;
  index: number;
  formatDuration: (seconds: number | undefined | null) => string;
}) {
  const isTop3 = index < 3;

  return (
    <motion.tr
      key={player.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 2.5 + index * 0.1 }}
      className={`border-b border-white/[0.03] transition-colors ${
        isTop3
          ? index === 0
            ? "bg-yellow-500/5 hover:bg-yellow-500/10"
            : index === 1
              ? "bg-slate-300/5 hover:bg-slate-300/10"
              : "bg-orange-600/5 hover:bg-orange-600/10"
          : "hover:bg-white/[0.02]"
      }`}
    >
      {/* Kolom: Badge Peringkat */}
      <td className="px-2 sm:px-4 py-3 text-center">
        <RankBadge index={index} />
      </td>

      {/* Kolom: Avatar + Nama Pemain */}
      <td className="px-2 sm:px-4 py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Avatar lingkaran kecil */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-lg shadow-inner overflow-hidden flex-shrink-0">
            {player.avatar_url ? (
              <img src={player.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <InitialsAvatar name={player.nickname} size="sm" />
            )}
          </div>

          {/* Nama pemain */}
          <p
            className={`font-display tracking-wider text-xs sm:text-sm truncate ${
              isTop3 ? "text-white" : "text-gray-300"
            } ${index === 0 && "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"}`}
            title={player.nickname}
          >
            {player.nickname}
          </p>
        </div>
      </td>

      {/* Kolom: Skor */}
      <td className="px-2 sm:px-4 py-3 text-right">
        <span
          className={`font-mono font-bold text-sm sm:text-base ${
            player.score >= 75 ? "text-green-400" : "text-red-400"
          }`}
        >
          {player.score.toLocaleString()}
        </span>
      </td>

      {/* Kolom: Durasi */}
      <td className="px-2 sm:px-4 py-3 text-center">
        <span
          className={`font-mono text-xs sm:text-sm ${
            player.score >= 75
              ? player.finished_at ? "text-[#00ff9d]" : "text-cyan-400"
              : "text-red-400"
          }`}
        >
          {formatDuration(player.duration)}
        </span>
      </td>
    </motion.tr>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: Badge Peringkat
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Badge lingkaran yang menunjukkan nomor peringkat.
 * Warna berubah berdasarkan posisi:
 * - 1st → Emas
 * - 2nd → Perak
 * - 3rd → Perunggu
 * - Lainnya → Abu-abu
 */
function RankBadge({ index }: { index: number }) {
  // Tentukan kelas warna berdasarkan posisi
  const colorClass =
    index === 0
      ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/50"
      : index === 1
        ? "bg-slate-300/20 text-slate-300 border border-slate-300/50"
        : index === 2
          ? "bg-orange-600/20 text-orange-400 border border-orange-600/50"
          : "bg-white/5 text-gray-500";

  return (
    <div
      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mx-auto font-display text-xs sm:text-sm ${colorClass}`}
    >
      {index + 1}
    </div>
  );
}
