"use client";
/**
 * =====================================================
 * TAMPILAN HASIL MOBILE - MobileResultView
 * =====================================================
 * Menampilkan profil pemain, statistik, dan tombol aksi
 * untuk layar mobile (< md breakpoint).
 * Tampilan 100% identik dengan versi monolitik.
 * =====================================================
 */

import React from 'react';
import { motion } from 'framer-motion';
import { House, BarChart2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import type { Participant } from '../_types';
import { STATS_BASE_URL } from '../_constants';
import { getRankSuffix, formatDuration } from '../_utils';
import { InitialsAvatar } from './InitialsAvatar';
import { MobileStatCard } from './StatCards';

interface MobileResultViewProps {
  currentPlayerData: Participant | undefined;
  currentPlayerRank: number;
  displayName: string;
  totalQuestions: number;
  allFinished: boolean;
  sessionId: string | null;
}

export const MobileResultView = ({
  currentPlayerData, currentPlayerRank, displayName,
  totalQuestions, allFinished, sessionId,
}: MobileResultViewProps) => {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="relative z-10 flex flex-col min-h-[100dvh] px-4 pt-8 pb-8">
      {/* Logo */}
      <div className="flex justify-center mb-5 flex-shrink-0">
        <button onClick={() => router.push("/")}
          className="cursor-pointer hover:opacity-80 active:opacity-60 transition-opacity duration-200"
          title="Ke Halaman Utama" aria-label="Ke halaman utama">
          <img src="/assets/logo/logo1.png" alt="NitroQuiz"
            className="h-14 object-contain drop-shadow-[0_0_30px_rgba(45,106,242,0.8)]" />
        </button>
      </div>

      {/* Kartu Profil */}
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 80 }}
        className="relative w-full rounded-2xl overflow-hidden mb-4 flex-shrink-0"
        style={{
          background: "linear-gradient(155deg,#0d1b3e 0%,#091428 55%,#05101f 100%)",
          border: "1.5px solid rgba(45,106,242,0.55)",
          boxShadow: "0 0 40px rgba(45,106,242,0.18),inset 0 0 40px rgba(0,0,0,0.25)",
        }}>
        <div className="absolute top-5 left-7 w-5 h-5 rounded-full bg-slate-700/30 border border-slate-600/20" />
        <div className="absolute top-12 right-10 w-3.5 h-3.5 rounded-full bg-blue-900/35 border border-blue-700/20" />
        <div className="absolute bottom-16 left-5 w-2 h-2 rounded-full bg-slate-600/25" />
        <div className="absolute top-8 right-5 w-1.5 h-1.5 rounded-full bg-white/15" />
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-32 h-16 bg-[#2d6af2]/15 blur-2xl rounded-full" />
        <div className="flex justify-center pt-10 pb-4">
          <div className="relative">
            <motion.div className="w-32 h-32 rounded-full border-4 border-[#2d6af2]/50 bg-black/40 overflow-hidden flex items-center justify-center p-0 shadow-[0_0_30px_rgba(45,106,242,0.3)] relative z-10"
              animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}>
              {currentPlayerData?.avatar_url ? (
                <img src={currentPlayerData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <InitialsAvatar name={displayName} size="lg" />
              )}
            </motion.div>
          </div>
        </div>
        <div className="text-center pb-8">
          <p className="font-display text-[#00d4ff] text-xl font-bold tracking-[0.18em] uppercase"
            style={{ textShadow: "0 0 12px rgba(0,212,255,0.55)" }}>{displayName}</p>
        </div>
      </motion.div>

      {/* Grid Statistik */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: "spring" }} className="grid grid-cols-4 gap-2 mb-6 flex-shrink-0">
        <MobileStatCard>
          <div className="flex items-baseline gap-0.5">
            <span className="font-display text-white text-2xl font-black leading-none">{allFinished ? currentPlayerRank : "?"}</span>
            <span className="font-display text-[#00ff9d] text-xs font-bold">{allFinished ? getRankSuffix(currentPlayerRank) : ""}</span>
          </div>
          <span className="text-gray-400 text-[9px] uppercase tracking-widest mt-1.5 font-mono">{t("player_result.rank")}</span>
        </MobileStatCard>
        <MobileStatCard>
          <span className={`font-display text-2xl font-black leading-none ${(currentPlayerData?.score ?? 0) >= 75 ? "text-green-500" : "text-red-500"}`}>{currentPlayerData?.score ?? 0}</span>
          <span className="text-gray-400 text-[9px] uppercase tracking-widest mt-1.5 font-mono">{t("player_result.score")}</span>
        </MobileStatCard>
        <MobileStatCard>
          <span className="font-display text-white text-2xl font-black leading-none">{totalQuestions > 0 ? `${currentPlayerData?.correct ?? 0}/${totalQuestions}` : (currentPlayerData?.correct ?? 0)}</span>
          <span className="text-gray-400 text-[9px] uppercase tracking-widest mt-1.5 font-mono">{t("player_result.correct")}</span>
        </MobileStatCard>
        <MobileStatCard>
          <span className={`font-display text-2xl font-black leading-none ${(currentPlayerData?.score ?? 0) >= 75 ? "text-green-500" : "text-red-500"}`}>{formatDuration(currentPlayerData?.duration)}</span>
          <span className="text-gray-400 text-[9px] uppercase tracking-widest mt-1.5 font-mono">{t("player_result.time")}</span>
        </MobileStatCard>
      </motion.div>

      <div className="flex-1" />

      {/* Tombol Aksi */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }} className="flex gap-3 flex-shrink-0">
        <button onClick={() => router.push("/")}
          className="group/btn flex-1 h-14 flex items-center justify-center gap-2 font-display text-sm font-bold uppercase tracking-widest text-white active:scale-95 transition-all transform -skew-x-[12deg] relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#00bcd4,#0288d1)", boxShadow: "0 0 24px rgba(0,188,212,0.38)" }}>
          <div className="absolute inset-0 bg-white/15 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
          <span className="relative z-10 transform skew-x-[12deg] flex items-center gap-2"><House className="w-5 h-5" /> {t("player_result.home")}</span>
        </button>
        <button disabled={!allFinished}
          onClick={() => sessionId && (window.location.href = `${STATS_BASE_URL}/${sessionId}`)}
          className="group/btn flex-1 h-14 flex items-center justify-center gap-2 font-display text-sm font-bold uppercase tracking-widest text-white active:scale-95 disabled:active:scale-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all transform -skew-x-[12deg] relative overflow-hidden"
          style={{
            background: allFinished ? "linear-gradient(135deg,#f59e0b,#d97706)" : "linear-gradient(135deg,#374151,#1f2937)",
            boxShadow: allFinished ? "0 0 24px rgba(245,158,11,0.38)" : "none",
            border: allFinished ? "none" : "1px solid rgba(156, 163, 175, 0.2)",
          }}
          title={allFinished ? t("player_result.stats") : t("player_result.wait_for_host")}>
          <div className="absolute inset-0 bg-white/15 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
          <span className="relative z-10 transform skew-x-[12deg] flex items-center gap-2"><BarChart2 className="w-5 h-5" /> {t("player_result.stats")}</span>
        </button>
      </motion.div>
    </motion.div>
  );
};
