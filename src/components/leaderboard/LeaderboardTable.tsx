"use client";

/**
 * LeaderboardTable.tsx
 * ────────────────────
 * Tabel peringkat lengkap yang menampilkan semua peserta.
 * Kolom yang ditampilkan:
 * - Peringkat (dengan badge warna untuk top 3)
 * - Nama pemain (dengan avatar)
 * - Skor
 * - Waktu penyelesaian
 *
 * Baris top 3 memiliki latar belakang warna khusus:
 * - Peringkat 1: kuning (gold)
 * - Peringkat 2: abu-abu (silver)
 * - Peringkat 3: oranye (bronze)
 *
 * Props:
 * - rankedPlayers: array peserta yang sudah diurutkan
 */

import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Participant } from "./types";
import { formatDuration } from "./utils";
import InitialsAvatar from "./InitialsAvatar";

interface LeaderboardTableProps {
  rankedPlayers: Participant[];
}

/**
 * Menentukan warna latar baris berdasarkan peringkat.
 * Top 3 mendapat warna khusus, sisanya hover biasa.
 */
function getRowBackground(index: number): string {
  if (index === 0) return "bg-yellow-500/5";
  if (index === 1) return "bg-slate-300/5";
  if (index === 2) return "bg-orange-600/5";
  return "hover:bg-[#2d6af2]/5";
}

/**
 * Menentukan style badge peringkat berdasarkan posisi.
 */
function getRankBadgeStyle(index: number): string {
  if (index === 0) return "bg-yellow-500/20 text-yellow-500 border border-yellow-500/50";
  if (index === 1) return "bg-slate-300/20 text-slate-300 border border-slate-300/50";
  if (index === 2) return "bg-orange-600/20 text-orange-400 border border-orange-600/50";
  return "bg-white/5 text-gray-500";
}

export default function LeaderboardTable({ rankedPlayers }: LeaderboardTableProps) {
  const { t } = useTranslation();

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
      className="bg-black/40 backdrop-blur-xl border border-[#2d6af2]/30 rounded-2xl p-4 sm:p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
    >
      <div className="overflow-x-auto w-full custom-scrollbar max-h-[470px] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          {/* ── Header tabel ── */}
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

          {/* ── Baris data pemain ── */}
          <tbody>
            <AnimatePresence>
              {rankedPlayers.map((player, index) => {
                const isTop3 = index < 3;

                return (
                  <motion.tr
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 2.5 + index * 0.1 }}
                    className={`border-b border-[#2d6af2]/10 transition-colors ${getRowBackground(index)}`}
                  >
                    {/* Kolom peringkat */}
                    <td className="px-2 sm:px-4 py-3 text-center">
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mx-auto font-display text-xs sm:text-sm ${getRankBadgeStyle(index)}`}
                      >
                        {index + 1}
                      </div>
                    </td>

                    {/* Kolom nama pemain + avatar */}
                    <td className="px-2 sm:px-4 py-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        {/* Avatar pemain */}
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-lg shadow-inner overflow-hidden flex-shrink-0">
                          {player.avatar_url ? (
                            <img
                              src={player.avatar_url}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <InitialsAvatar name={player.nickname} size="sm" />
                          )}
                        </div>

                        {/* Nama pemain */}
                        <p
                          className={`font-display tracking-wider text-xs sm:text-sm truncate ${isTop3 ? "text-white" : "text-gray-300"} ${index === 0 && "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"}`}
                          title={player.nickname}
                        >
                          {player.nickname}
                        </p>
                      </div>
                    </td>

                    {/* Kolom skor */}
                    <td className="px-2 sm:px-4 py-3 text-right">
                      <span
                        className={`font-mono font-bold text-sm sm:text-base ${index === 0 ? "text-yellow-400" : "text-[#00ff9d]"}`}
                      >
                        {player.score.toLocaleString()}
                      </span>
                    </td>

                    {/* Kolom durasi waktu */}
                    <td className="px-2 sm:px-4 py-3 text-center">
                      <span className="text-cyan-400 font-mono text-xs sm:text-sm">
                        {formatDuration(player.duration)}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
