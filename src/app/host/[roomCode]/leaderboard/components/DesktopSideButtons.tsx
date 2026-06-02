/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KOMPONEN: DesktopSideButtons
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Tombol aksi mengambang di sisi kiri dan kanan layar (desktop only).
 * Hanya tampil pada breakpoint md ke atas.
 *
 * Sisi kiri:
 * - Tombol Home → navigasi ke halaman utama
 * - Tombol Play Again → restart game dengan sesi baru
 *
 * Sisi kanan:
 * - Tombol Statistics → buka halaman statistik di tab baru
 *
 * Semua tombol menggunakan style cyberpunk skewed dengan glow effect.
 */

"use client";

import { Button } from "@/components/ui/button";
import { House, RotateCw, BarChart2 } from "lucide-react";
import { TFunction } from "i18next";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

// ═══════════════════════════════════════════════════════════════════════════
// TIPE PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface DesktopSideButtonsProps {
  /** Instance router Next.js untuk navigasi */
  router: AppRouterInstance;
  /** ID sesi saat ini, digunakan untuk URL statistik */
  sessionId: string | null;
  /** Apakah sedang dalam proses restart */
  isRestarting: boolean;
  /** Handler untuk aksi restart game */
  handleRestart: () => void;
  /** Fungsi terjemahan i18n */
  t: TFunction;
}

// ═══════════════════════════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════════════════

export function DesktopSideButtons({
  router,
  sessionId,
  isRestarting,
  handleRestart,
  t,
}: DesktopSideButtonsProps) {
  return (
    <>
      {/* ── Tombol Sisi Kiri ── */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50 hidden md:flex">
        {/* Tombol Home — navigasi ke halaman utama */}
        <Button
          onClick={() => router.push("/")}
          className="w-12 h-12 rounded-sm p-0 bg-[#0d1a3a] backdrop-blur-md border-2 border-[#2d6af2] shadow-[0_0_12px_rgba(45,106,242,0.5)] hover:bg-[#2d6af2]/40 hover:shadow-[0_0_22px_rgba(45,106,242,0.8)] flex items-center justify-center text-[#60a5fa] transition-all transform -skew-x-[15deg]"
          title={t("host_leaderboard.home_tooltip")}
        >
          <div className="transform skew-x-[15deg]"><House size={20} /></div>
        </Button>

        {/* Tombol Play Again — restart game */}
        <Button
          onClick={handleRestart}
          disabled={isRestarting}
          className={`w-12 h-12 rounded-sm p-0 bg-[#0a2a1f] backdrop-blur-md border-2 border-[#00ff9d] shadow-[0_0_12px_rgba(0,255,157,0.5)] hover:bg-[#00ff9d]/30 hover:shadow-[0_0_22px_rgba(0,255,157,0.8)] flex items-center justify-center text-[#00ff9d] transition-all transform -skew-x-[15deg] ${isRestarting ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={t("host_leaderboard.play_again_tooltip")}
        >
          <div className="transform skew-x-[15deg]">
            <RotateCw size={20} className={isRestarting ? 'animate-spin' : ''} />
          </div>
        </Button>
      </div>

      {/* ── Tombol Sisi Kanan ── */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50 hidden md:flex">
        {/* Tombol Statistics — buka statistik di tab baru */}
        <Button
          onClick={() =>
            sessionId &&
            window.open(
              `https://app.gameforsmart.com/stat/${sessionId}`,
              "_blank",
            )
          }
          className="w-12 h-12 rounded-sm p-0 bg-[#2a1a00] backdrop-blur-md border-2 border-[#f59e0b] shadow-[0_0_12px_rgba(245,158,11,0.5)] hover:bg-[#f59e0b]/30 hover:shadow-[0_0_22px_rgba(245,158,11,0.8)] flex items-center justify-center text-[#fbbf24] transition-all transform -skew-x-[15deg]"
          title={t("host_leaderboard.stats_tooltip")}
        >
          <div className="transform skew-x-[15deg]"><BarChart2 size={20} /></div>
        </Button>
      </div>
    </>
  );
}
