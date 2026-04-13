"use client";

/**
 * SideButtons.tsx
 * ───────────────
 * Tombol navigasi melayang di sisi kiri dan kanan layar (hanya desktop).
 *
 * Tombol kiri:
 * - Home → Kembali ke halaman utama
 * - Play Again → Restart kuis dengan soal acak baru
 *
 * Tombol kanan:
 * - Statistics → Buka halaman statistik di tab baru
 *
 * Props:
 * - onHome: fungsi navigasi ke halaman utama
 * - onRestart: fungsi untuk restart kuis
 * - onViewStats: fungsi untuk membuka statistik
 * - isRestarting: apakah sedang proses restart
 */

import { Button } from "@/components/ui/button";
import { House, RotateCw, BarChart2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SideButtonsProps {
  onHome: () => void;
  onRestart: () => void;
  onViewStats: () => void;
  isRestarting: boolean;
}

export default function SideButtons({
  onHome,
  onRestart,
  onViewStats,
  isRestarting,
}: SideButtonsProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* ── Tombol sisi kiri: Home & Play Again ── */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50 hidden md:flex">
        {/* Tombol kembali ke beranda */}
        <Button
          onClick={onHome}
          className="w-12 h-12 rounded-full p-0 bg-black/60 backdrop-blur-md border border-[#2d6af2]/50 hover:bg-[#2d6af2]/20 hover:scale-110 flex items-center justify-center text-[#2d6af2] shadow-[0_0_15px_rgba(45,106,242,0.4)] transition-all"
          title={t("host_leaderboard.home_tooltip")}
        >
          <House size={20} />
        </Button>

        {/* Tombol main lagi (restart dengan soal acak baru) */}
        <Button
          onClick={onRestart}
          disabled={isRestarting}
          className={`w-12 h-12 rounded-full p-0 bg-black/60 backdrop-blur-md border border-[#00ff9d]/50 hover:bg-[#00ff9d]/20 hover:scale-110 flex items-center justify-center text-[#00ff9d] shadow-[0_0_15px_rgba(0,255,157,0.4)] transition-all ${isRestarting ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={t("host_leaderboard.play_again_tooltip")}
        >
          <RotateCw size={20} className={isRestarting ? 'animate-spin' : ''} />
        </Button>
      </div>

      {/* ── Tombol sisi kanan: Statistics ── */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50 hidden md:flex">
        {/* Tombol lihat statistik di tab baru */}
        <Button
          onClick={onViewStats}
          className="w-12 h-12 rounded-full p-0 bg-black/60 backdrop-blur-md border border-[#f59e0b]/50 hover:bg-[#f59e0b]/20 hover:scale-110 flex items-center justify-center text-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all"
          title={t("host_leaderboard.stats_tooltip")}
        >
          <BarChart2 size={20} />
        </Button>
      </div>
    </>
  );
}
