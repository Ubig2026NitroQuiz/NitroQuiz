"use client";
/**
 * =====================================================
 * TAMPILAN HASIL DESKTOP - DesktopResultView
 * =====================================================
 * Menampilkan layout hasil permainan untuk layar desktop
 * (>= md breakpoint) dengan tata letak 3 kolom:
 * - Kiri: Kartu profil pemain (avatar + nama)
 * - Tengah: Showcase karakter mobil
 * - Kanan: Panel statistik telemetri
 *
 * Termasuk tombol navigasi floating (Home + Stats).
 * Tampilan 100% identik dengan versi monolitik.
 * =====================================================
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Home, BarChart2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import type { Participant } from '../_types';
import { STATS_BASE_URL } from '../_constants';
import { getRankSuffix, formatDuration } from '../_utils';
import { InitialsAvatar } from './InitialsAvatar';

interface DesktopResultViewProps {
  currentPlayerData: Participant | undefined;
  currentPlayerRank: number;
  displayName: string;
  currentPlayerCarSrc: string;
  totalQuestions: number;
  allFinished: boolean;
  sessionId: string | null;
  showResults: boolean;
}

export const DesktopResultView = ({
  currentPlayerData, currentPlayerRank, displayName,
  currentPlayerCarSrc, totalQuestions, allFinished,
  sessionId, showResults,
}: DesktopResultViewProps) => {
  const router = useRouter();
  const { t } = useTranslation();

  /** Warna dinamis berdasarkan skor (hijau >= 75, merah < 75) */
  const scoreColor = (currentPlayerData?.score ?? 0) >= 75 ? "#22c55e" : "#ef4444";
  const scoreColorAlpha = (currentPlayerData?.score ?? 0) >= 75 ? "rgba(34,197,94," : "rgba(239,68,68,";

  return (
    <>
      {/* ── Logo Floating ── */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-8 py-6">
        <button onClick={() => router.push("/")}
          className="cursor-pointer hover:opacity-80 active:opacity-60 transition-opacity duration-200"
          title="Ke Halaman Utama" aria-label="Ke halaman utama">
          <img src="/assets/logo/logo1.png" alt="Logo" className="h-14 object-contain" />
        </button>
        <img src="/assets/logo/logo2.png" alt="NitroQuiz" className="h-10 object-contain ml-auto opacity-90 pointer-events-none" />
      </div>

      {showResults && (
        <>
          {/* ── KIRI: Kartu Profil Pemain ── */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 90 }}
            className="absolute z-10"
            style={{ top: "calc(50% - 160px)", left: "12%", width: "min(260px, 17vw)", height: "320px" }}>
            <div className="w-full h-full overflow-hidden flex flex-col"
              style={{
                background: "linear-gradient(170deg, #0a1628 0%, #050a18 100%)",
                border: "1px solid rgba(45,106,242,0.4)",
                boxShadow: "0 0 50px rgba(45,106,242,0.12), inset 0 1px 0 rgba(255,255,255,0.05)",
                backdropFilter: "blur(20px)",
                clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%)',
              }}>
              {/* Racing stripe atas */}
              <div className="h-[3px] w-full flex-shrink-0" style={{ background: "linear-gradient(90deg, #7c3aed, #2d6af2, #06b6d4)" }} />

              {/* Zona avatar */}
              <div className="relative flex-1 flex items-center justify-center" style={{ background: "rgba(2,5,15,0.4)" }}>
                <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(45,106,242,0.12) 0%, transparent 65%)" }} />
                <div className="relative">
                  {/* Cincin pulse luar */}
                  <motion.div className="absolute rounded-full"
                    style={{ inset: "-18px", border: "1px solid rgba(45,106,242,0.2)" }}
                    animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.8, 0.3] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} />
                  {/* Cincin putus-putus berputar */}
                  <motion.div className="absolute rounded-full"
                    style={{ inset: "-8px", border: "1.5px dashed rgba(96,165,250,0.3)" }}
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 10, ease: "linear" }} />
                  {/* Lingkaran avatar */}
                  <div className="w-28 h-28 rounded-full overflow-hidden relative z-10"
                    style={{ border: "2.5px solid rgba(45,106,242,0.9)", boxShadow: "0 0 25px rgba(45,106,242,0.5), 0 0 50px rgba(45,106,242,0.15)" }}>
                    {currentPlayerData?.avatar_url ? (
                      <img src={currentPlayerData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (<InitialsAvatar name={displayName} size="lg" />)}
                  </div>
                </div>
              </div>

              {/* Garis pemisah */}
              <div className="flex-shrink-0 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(45,106,242,0.5), transparent)" }} />

              {/* Nama + status */}
              <div className="flex-shrink-0 flex flex-col items-center justify-center gap-3 px-5 py-6"
                style={{ background: "rgba(4,8,20,0.6)" }}>
                <p className="font-display text-white font-black uppercase tracking-widest text-center leading-snug"
                  style={{ fontSize: "clamp(13px,1.2vw,17px)", textShadow: "0 0 20px rgba(255,255,255,0.15)" }}
                  title={displayName}>
                  {displayName}
                </p>
              </div>

              {/* Racing stripe bawah */}
              <div className="h-[3px] w-full flex-shrink-0" style={{ background: "linear-gradient(90deg, #06b6d4, #2d6af2, #7c3aed)" }} />
            </div>
          </motion.div>

          {/* ── TENGAH: Showcase Karakter ── */}
          <div className="absolute z-10 flex items-center justify-center"
            style={{ top: "60px", left: "26%", right: "26%", bottom: "20px" }}>
            <motion.div className="relative flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 80 }}>
              {/* Glow di belakang karakter */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at 50% 55%, rgba(45,106,242,0.15) 0%, transparent 65%)", filter: "blur(20px)" }} />
              {/* Gambar karakter dengan animasi mengambang */}
              <motion.img src={currentPlayerCarSrc} alt="Your Car"
                className="object-contain relative z-10"
                style={{ width: "clamp(280px,36vw,500px)", maxHeight: "52vh", filter: "drop-shadow(0 12px 40px rgba(0,0,0,0.55))" }}
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }} />
              {/* Bayangan tanah */}
              <div className="relative z-10 flex-shrink-0"
                style={{ width: "clamp(180px,22vw,320px)", height: "18px", marginTop: "-6px", background: "radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, transparent 70%)", filter: "blur(8px)" }} />
            </motion.div>
          </div>

          {/* ── KANAN: Panel Telemetri Statistik ── */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, type: "spring", stiffness: 90 }}
            className="absolute z-10 flex flex-col"
            style={{
              top: "20%", right: "12%", bottom: "18%", width: "min(280px, 19vw)",
              background: "linear-gradient(170deg, #0a1628 0%, #050a18 100%)",
              border: "1px solid rgba(45,106,242,0.4)", backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 0 50px rgba(45,106,242,0.12), inset 0 1px 0 rgba(255,255,255,0.05)",
              clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%)',
              overflow: "hidden",
            }}>
            <div className="h-[3px] w-full flex-shrink-0" style={{ background: "linear-gradient(90deg, #7c3aed, #2d6af2, #06b6d4)" }} />

            {/* RANK */}
            <div className="flex-[1.6] flex flex-col items-center justify-center relative"
              style={{ background: "rgba(250,204,21,0.06)", borderBottom: "1px solid rgba(250,204,21,0.2)" }}>
              <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(250,204,21,0.08) 0%, transparent 65%)" }} />
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.4em] mb-1" style={{ color: "rgba(250,204,21,0.6)" }}>{t("player_result.rank")}</p>
              <motion.p className="font-display font-black text-white leading-none"
                style={{ fontSize: "clamp(52px,5.5vw,72px)", textShadow: "0 0 30px rgba(250,204,21,0.6), 0 0 60px rgba(250,204,21,0.2)" }}
                initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}>
                {allFinished ? currentPlayerRank : "?"}
              </motion.p>
              <p className="font-display font-bold mt-0.5" style={{ fontSize: "13px", letterSpacing: "0.25em", color: "#facc15" }}>
                {allFinished ? getRankSuffix(currentPlayerRank) : t("player_result.wait_for_host")}
              </p>
            </div>

            {/* SCORE */}
            <div className="flex-1 flex items-center justify-between px-5 relative"
              style={{ borderBottom: `1px solid ${scoreColorAlpha}0.15)` }}>
              <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: `linear-gradient(to bottom, transparent, ${scoreColor}, transparent)` }} />
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: `${scoreColorAlpha}0.65)` }}>{t("player_result.score")}</p>
              <p className="font-display font-black" style={{ color: scoreColor, fontSize: "clamp(24px,2.8vw,36px)", textShadow: `0 0 18px ${scoreColorAlpha}0.5)` }}>
                {currentPlayerData?.score ?? 0}
              </p>
            </div>

            {/* CORRECT */}
            <div className="flex-1 flex items-center justify-between px-5 relative"
              style={{ borderBottom: "1px solid rgba(34,211,238,0.15)" }}>
              <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: "linear-gradient(to bottom, transparent, #22d3ee, transparent)" }} />
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: "rgba(34,211,238,0.65)" }}>{t("player_result.correct")}</p>
              <p className="font-display font-black text-white" style={{ fontSize: "clamp(22px,2.6vw,34px)", textShadow: "0 0 16px rgba(34,211,238,0.5)" }}>
                {totalQuestions > 0 ? `${currentPlayerData?.correct ?? 0}/${totalQuestions}` : (currentPlayerData?.correct ?? 0)}
              </p>
            </div>

            {/* TIME */}
            <div className="flex-1 flex items-center justify-between px-5 relative">
              <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: `linear-gradient(to bottom, transparent, ${scoreColor}, transparent)` }} />
              <p className="font-display text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: `${scoreColorAlpha}0.65)` }}>{t("player_result.time")}</p>
              <p className="font-display font-black font-mono" style={{ color: scoreColor, fontSize: "clamp(20px,2.4vw,30px)", textShadow: `0 0 16px ${scoreColorAlpha}0.5)` }}>
                {formatDuration(currentPlayerData?.duration)}
              </p>
            </div>

            <div className="h-[3px] w-full flex-shrink-0" style={{ background: "linear-gradient(90deg, #06b6d4, #2d6af2, #7c3aed)" }} />
          </motion.div>
        </>
      )}

      {/* ── Tombol Floating Kiri: Home ── */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-4">
        <button onClick={() => router.push("/")}
          className="w-12 h-12 flex items-center justify-center rounded-sm bg-[#0d1a3a] backdrop-blur-md border-2 border-[#2d6af2] shadow-[0_0_12px_rgba(45,106,242,0.5)] hover:bg-[#2d6af2]/40 hover:shadow-[0_0_22px_rgba(45,106,242,0.8)] text-[#60a5fa] transition-all transform -skew-x-[15deg] active:scale-95"
          title={t("player_result.home")}>
          <div className="transform skew-x-[15deg]"><Home className="w-5 h-5" /></div>
        </button>
      </div>

      {/* ── Tombol Floating Kanan: Statistik ── */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-4">
        <button disabled={!allFinished}
          onClick={() => sessionId && (window.location.href = `${STATS_BASE_URL}/${sessionId}`)}
          className="w-12 h-12 flex items-center justify-center rounded-sm backdrop-blur-md transition-all transform -skew-x-[15deg] active:scale-95 disabled:active:scale-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:shadow-none"
          style={{
            backgroundColor: allFinished ? "#2a1a00" : "#1f2937",
            borderColor: allFinished ? "#f59e0b" : "#4b5563", borderWidth: "2px",
            boxShadow: allFinished ? "0 0 12px rgba(245,158,11,0.5)" : "none",
            color: allFinished ? "#fbbf24" : "#9ca3af",
          }}
          title={allFinished ? t("player_result.stats") : t("player_result.wait_for_host")}>
          <div className="transform skew-x-[15deg]"><BarChart2 className="w-5 h-5" /></div>
        </button>
      </div>
    </>
  );
};
