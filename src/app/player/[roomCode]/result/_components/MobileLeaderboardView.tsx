"use client";
/**
 * =====================================================
 * TAMPILAN LEADERBOARD MOBILE - MobileLeaderboardView
 * =====================================================
 * Menampilkan podium 3 besar dan daftar peringkat semua
 * pemain untuk layar mobile.
 * Tampilan 100% identik dengan versi monolitik.
 * =====================================================
 */

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Participant } from '../_types';
import { CAR_IMAGE_MAP, STATS_BASE_URL } from '../_constants';
import { formatDuration, getDisplayName } from '../_utils';
import { InitialsAvatar } from './InitialsAvatar';

// --- Varian animasi podium ---
const podiumVariants: any = {
  hidden: { y: 150, opacity: 0 },
  visible: (custom: number) => ({
    y: 0, opacity: 1,
    transition: { type: "spring", stiffness: 70, damping: 12, delay: custom * 0.35 + 0.4 },
  }),
};

interface MobileLeaderboardViewProps {
  rankedPlayers: Participant[];
  storedParticipantId: string | null;
  profileUsername: string | undefined;
  allFinished: boolean;
  sessionId: string | null;
  profile: { fullname?: string; username?: string } | null;
  userEmail: string | undefined;
  fallbackName: string;
  onBack: () => void;
}

export const MobileLeaderboardView = ({
  rankedPlayers, storedParticipantId, profileUsername,
  allFinished, sessionId, profile, userEmail, fallbackName, onBack,
}: MobileLeaderboardViewProps) => {
  const { t } = useTranslation();
  const firstPlace = rankedPlayers[0];
  const secondPlace = rankedPlayers[1];
  const thirdPlace = rankedPlayers[2];

  /** Cek apakah peserta ini adalah pemain saat ini (untuk highlight) */
  const isMe = (p: Participant) =>
    p.id === storedParticipantId || (p.nickname === profileUsername && !storedParticipantId);

  return (
    <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
      className="relative z-10 flex flex-col min-h-screen px-4 pt-6 pb-8">
      {/* Header dengan tombol kembali */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <button onClick={onBack}
          className="w-10 h-10 bg-white/10 border border-white/20 flex items-center justify-center text-white text-lg active:scale-95 transition-transform transform -skew-x-[10deg]">
          <span className="transform skew-x-[10deg]">←</span>
        </button>
        <h2 className="font-display text-lg font-black uppercase tracking-widest text-white">
          {t("player_result.leaderboard")}
        </h2>
      </div>

      {/* ── Podium 3 Besar ── */}
      <div className="relative flex items-end justify-center w-full h-[200px] mb-4 flex-shrink-0">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-8 bg-[#2d6af2]/20 blur-[18px] rounded-full pointer-events-none" />

        {/* Peringkat 2 (kiri) */}
        {secondPlace && (
          <motion.div custom={2} variants={podiumVariants} initial="hidden" animate="visible"
            className="flex flex-col items-center z-10 mx-[-4px]">
            <div className="mb-1 text-center">
              <div className="bg-black/60 border border-slate-300/40 backdrop-blur-md px-2 py-0.5 rounded-lg">
                <p className={`font-display text-[9px] tracking-wider truncate max-w-[68px] ${isMe(secondPlace) ? "text-[#00ff9d] font-bold" : "text-slate-200"}`}
                  title={secondPlace.nickname}>
                  {secondPlace.nickname}{isMe(secondPlace) && t("player_result.you")}
                </p>
                <p className={`font-mono text-[8px] ${secondPlace.score >= 75 ? "text-green-500" : "text-red-500"}`}>
                  {secondPlace.score.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="relative mb-2">
              <div className="w-16 h-16 rounded-full border-2 border-slate-400/50 bg-black/40 overflow-hidden flex items-center justify-center p-0 shadow-lg relative z-10">
                {secondPlace.avatar_url ? (
                  <img src={secondPlace.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (<InitialsAvatar name={secondPlace.nickname} size="sm" />)}
              </div>
              <div className="absolute -right-2 -bottom-1 w-10 h-10 bg-black/60 rounded-full border border-white/20 p-1 flex items-center justify-center z-20 shadow-xl">
                <img src={CAR_IMAGE_MAP[(secondPlace.car_character || "white").replace("-bot", "")] || CAR_IMAGE_MAP["white"]} alt="Car" className="w-full h-full object-contain" />
              </div>
            </div>
            <div className="w-[62px] h-[95px] bg-gradient-to-b from-[#1a2235] to-[#0a0f1a] border-t-2 border-l border-r border-[#64748b] rounded-t-xl flex items-end justify-center pb-2">
              <span className="font-display text-2xl text-slate-600/40 font-bold">2</span>
            </div>
          </motion.div>
        )}

        {/* Peringkat 1 (tengah) */}
        {firstPlace && (
          <motion.div custom={3} variants={podiumVariants} initial="hidden" animate="visible"
            className="flex flex-col items-center z-20 mx-0.5 -mb-1">
            <div className="mb-1 text-center">
              <div className="bg-[#1a1500]/80 border border-yellow-500/60 backdrop-blur-md px-2.5 py-1 rounded-xl">
                <p className={`font-display text-[9px] font-bold tracking-widest uppercase truncate max-w-[88px] ${isMe(firstPlace) ? "text-[#00ff9d]" : "text-yellow-500"}`}
                  title={firstPlace.nickname}>
                  {firstPlace.nickname}{isMe(firstPlace) && t("player_result.you")}
                </p>
                <p className={`font-mono text-[8px] mt-0.5 font-bold ${firstPlace.score >= 75 ? "text-green-500" : "text-red-500"}`}>
                  {firstPlace.score.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="relative mb-2">
              <div className="w-20 h-20 rounded-full border-2 border-yellow-500/50 bg-black/40 overflow-hidden flex items-center justify-center p-0 shadow-[0_0_20px_rgba(250,204,21,0.3)] relative z-10">
                {firstPlace.avatar_url ? (
                  <img src={firstPlace.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (<InitialsAvatar name={firstPlace.nickname} size="md" />)}
              </div>
              <div className="absolute -right-3 -bottom-1 w-12 h-12 bg-black/60 rounded-full border border-yellow-500/40 p-1.5 flex items-center justify-center z-20 shadow-xl">
                <img src={CAR_IMAGE_MAP[(firstPlace.car_character || "purple").replace("-bot", "")] || CAR_IMAGE_MAP["purple"]} alt="Car" className="w-full h-full object-contain" />
              </div>
            </div>
            <div className="w-[76px] h-[140px] bg-gradient-to-b from-[#2a1f0a] to-[#0a0f1a] border-t-4 border-l-2 border-r-2 border-[#eab308] rounded-t-xl relative overflow-hidden flex items-end justify-center pb-4">
              <div className="absolute top-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#eab308] to-transparent" />
              <span className="font-display text-4xl text-yellow-600/40 font-bold">1</span>
            </div>
          </motion.div>
        )}

        {/* Peringkat 3 (kanan) */}
        {thirdPlace && (
          <motion.div custom={1} variants={podiumVariants} initial="hidden" animate="visible"
            className="flex flex-col items-center z-10 mx-[-4px]">
            <div className="mb-1 text-center">
              <div className="bg-black/60 border border-orange-700/40 backdrop-blur-md px-2 py-0.5 rounded-lg">
                <p className={`font-display text-[9px] tracking-wider truncate max-w-[68px] ${isMe(thirdPlace) ? "text-[#00ff9d] font-bold" : "text-orange-200"}`}
                  title={thirdPlace.nickname}>
                  {thirdPlace.nickname}{isMe(thirdPlace) && t("player_result.you")}
                </p>
                <p className={`font-mono text-[8px] ${thirdPlace.score >= 75 ? "text-green-500" : "text-red-500"}`}>
                  {thirdPlace.score.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="relative mb-2">
              <div className="w-14 h-14 rounded-full border-2 border-orange-700/50 bg-black/40 overflow-hidden flex items-center justify-center p-0 shadow-lg relative z-10">
                {thirdPlace.avatar_url ? (
                  <img src={thirdPlace.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (<InitialsAvatar name={thirdPlace.nickname} size="sm" />)}
              </div>
              <div className="absolute -right-2 -bottom-1 w-9 h-9 bg-black/60 rounded-full border border-white/20 p-1 flex items-center justify-center z-20 shadow-xl">
                <img src={CAR_IMAGE_MAP[(thirdPlace.car_character || "black").replace("-bot", "")] || CAR_IMAGE_MAP["black"]} alt="Car" className="w-full h-full object-contain" />
              </div>
            </div>
            <div className="w-[52px] h-[75px] bg-gradient-to-b from-[#25140b] to-[#0a0f1a] border-t-2 border-l border-r border-[#c2410c] rounded-t-xl flex items-end justify-center pb-1.5">
              <span className="font-display text-2xl text-orange-700/40 font-bold">3</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Daftar Peringkat Lengkap ── */}
      <div className="bg-black/40 backdrop-blur-xl border border-[#2d6af2]/30 p-3 shadow-[0_0_30px_rgba(0,0,0,0.5)] mb-4 overflow-y-auto flex-1"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)' }}>
        <div className="space-y-1.5">
          {rankedPlayers.map((player, index) => {
            const playerIsMe = isMe(player);
            const rankColors = [
              "border-yellow-500/50 bg-yellow-500/5",
              "border-slate-300/50 bg-slate-300/5",
              "border-orange-600/50 bg-orange-600/5",
            ];
            return (
              <div key={player.id}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${playerIsMe ? "bg-[#2d6af2]/15 border-[#2d6af2]/50" : index < 3 ? rankColors[index] : "border-white/5 bg-white/[0.02]"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-display text-[10px] font-bold flex-shrink-0 ${index === 0 ? "bg-yellow-500/20 text-yellow-500" : index === 1 ? "bg-slate-300/20 text-slate-300" : index === 2 ? "bg-orange-600/20 text-orange-400" : "bg-white/5 text-gray-500"}`}>
                  {index + 1}
                </div>
                <div className="w-8 h-8 rounded-full bg-black/40 border border-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {player.avatar_url ? (
                    <img src={player.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (<InitialsAvatar name={player.nickname} size="sm" />)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-display text-[10px] tracking-wider uppercase truncate ${playerIsMe ? "text-[#00ff9d] font-bold" : index === 0 ? "text-yellow-400" : "text-gray-300"}`}
                    title={player.nickname}>
                    {getDisplayName(player, profile, userEmail, fallbackName)} {playerIsMe && t("player_result.you")}
                  </p>
                </div>
                <span className={`font-mono font-bold text-xs flex-shrink-0 ${player.score >= 75 ? "text-green-500" : "text-red-500"}`}>
                  {player.score.toLocaleString()}
                </span>
                <span className={`font-mono text-[10px] flex-shrink-0 ${player.score >= 75 ? "text-green-500/70" : "text-red-500/70"}`}>
                  {formatDuration(player.duration)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tombol Statistik */}
      <button disabled={!allFinished}
        onClick={() => sessionId && (window.location.href = `${STATS_BASE_URL}/${sessionId}`)}
        className="group/btn w-full h-12 flex items-center justify-center gap-2 font-display text-sm uppercase tracking-widest active:scale-95 disabled:active:scale-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all flex-shrink-0 transform -skew-x-[10deg] relative overflow-hidden"
        style={{
          border: allFinished ? "1px solid rgba(245,158,11,0.5)" : "1px solid rgba(156, 163, 175, 0.2)",
          color: allFinished ? "#f59e0b" : "#9ca3af",
        }}
        title={allFinished ? t("player_result.stats") : t("player_result.wait_for_host")}>
        <div className="absolute inset-0 bg-[#f59e0b]/10 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
        <span className="relative z-10 transform skew-x-[10deg] flex items-center gap-2"><BarChart2 className="w-4 h-4" /> {t("player_result.stats")}</span>
      </button>
    </motion.div>
  );
};
