"use client";

/**
 * MobileActions.tsx
 * ─────────────────
 * Bar aksi di bagian bawah layar untuk perangkat mobile.
 * Menampilkan 3 tombol:
 * 1. Home — Kembali ke halaman utama
 * 2. Play Again — Restart kuis
 * 3. Statistics — Lihat statistik
 *
 * Bar ini hanya terlihat di layar kecil (md ke bawah).
 * Di desktop, fungsi ini digantikan oleh SideButtons.
 *
 * Props:
 * - onHome: fungsi navigasi ke halaman utama
 * - onRestart: fungsi untuk restart kuis
 * - onViewStats: fungsi untuk membuka statistik
 * - isRestarting: apakah sedang proses restart
 */

import { House, RotateCw, BarChart2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface MobileActionsProps {
  onHome: () => void;
  onRestart: () => void;
  onViewStats: () => void;
  isRestarting: boolean;
}

export default function MobileActions({
  onHome,
  onRestart,
  onViewStats,
  isRestarting,
}: MobileActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="md:hidden bg-black/40 backdrop-blur-md w-full text-center py-4 fixed bottom-0 left-0 z-50 flex items-center justify-center space-x-4 border-t border-white/5 px-4 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
      {/* Tombol Home */}
      <button
        onClick={onHome}
        className="flex-1 bg-black/40 border border-[#2d6af2]/50 rounded-xl text-[#2d6af2] py-3.5 text-xs font-display font-bold tracking-widest uppercase hover:bg-[#2d6af2]/10 transition-all flex items-center justify-center gap-2"
      >
        <House size={16} />
        {t("host_leaderboard.home_tooltip")}
      </button>

      {/* Tombol Play Again (Restart) */}
      <button
        onClick={onRestart}
        disabled={isRestarting}
        className={`flex-1 bg-[#00ff9d] border border-white/20 rounded-xl text-black py-3.5 text-xs font-display font-bold tracking-widest uppercase hover:bg-[#00ff9d]/80 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,255,157,0.3)] ${isRestarting ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        <RotateCw size={16} className={isRestarting ? 'animate-spin' : ''} />
        {isRestarting ? "Restarting..." : t("host_leaderboard.play_again_tooltip")}
      </button>

      {/* Tombol Statistics */}
      <button
        onClick={onViewStats}
        className="flex-1 bg-black/40 border border-[#f59e0b]/50 rounded-xl text-[#f59e0b] py-3.5 text-xs font-display font-bold tracking-widest uppercase hover:bg-[#f59e0b]/10 transition-all flex items-center justify-center gap-2"
      >
        <BarChart2 size={16} />
        {t("host_leaderboard.stats_tooltip")}
      </button>
    </div>
  );
}
