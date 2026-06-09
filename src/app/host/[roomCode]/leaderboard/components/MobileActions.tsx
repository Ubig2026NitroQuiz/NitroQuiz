/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KOMPONEN: MobileActions
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Bar aksi fixed di bagian bawah layar untuk perangkat mobile (sm ke bawah).
 * Hanya tampil pada breakpoint di bawah md.
 *
 * Berisi 3 tombol:
 * 1. Home — navigasi ke halaman utama
 * 2. Play Again — restart game dengan sesi baru
 * 3. Stat — buka halaman statistik di tab baru
 *
 * Semua tombol menggunakan style skewed cyberpunk dengan border glow.
 */

"use client";

import { House, RotateCw, BarChart2 } from "lucide-react";
import { TFunction } from "i18next";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

// ═══════════════════════════════════════════════════════════════════════════
// TIPE PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface MobileActionsProps {
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

export function MobileActions({
  router,
  sessionId,
  isRestarting,
  handleRestart,
  t,
}: MobileActionsProps) {
  return (
    <div className="md:hidden bg-[#04060f]/90 backdrop-blur-xl w-full text-center py-5 fixed bottom-0 left-0 z-50 flex items-center justify-center space-x-3 border-t border-white/10 px-4 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
      {/* Tombol Home */}
      <button
        onClick={() => router.push("/")}
        className="flex-1 bg-[#0d1a3a]/60 border-2 border-[#2d6af2] shadow-[0_0_15px_rgba(45,106,242,0.3)] rounded-sm text-[#60a5fa] py-3.5 text-[10px] font-display font-bold tracking-[0.15em] uppercase hover:bg-[#2d6af2]/20 transition-all flex items-center justify-center gap-2 transform -skew-x-[15deg]"
      >
        <div className="transform skew-x-[15deg] flex items-center gap-1.5">
          <House size={14} />
          {t("host_leaderboard.home_tooltip")}
        </div>
      </button>

      {/* Tombol Play Again (Restart) */}
      <button
        onClick={handleRestart}
        disabled={isRestarting}
        className={`flex-1 bg-[#0a2a1f]/60 border-2 border-[#00ff9d] shadow-[0_0_15px_rgba(0,255,157,0.3)] rounded-sm text-[#00ff9d] py-3.5 text-[10px] font-display font-bold tracking-[0.15em] uppercase hover:bg-[#00ff9d]/20 transition-all flex items-center justify-center gap-2 transform -skew-x-[15deg] ${isRestarting ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="transform skew-x-[15deg] flex items-center gap-1.5">
          <RotateCw size={14} className={isRestarting ? 'animate-spin' : ''} />
          {isRestarting ? "WAIT..." : t("host_leaderboard.play_again_tooltip")}
        </div>
      </button>

      {/* Tombol Statistics */}
      <button
        onClick={() =>
          sessionId &&
          window.open(
            `https://app.gameforsmart.com/stat/${sessionId}`,
            "_blank",
          )
        }
        className="flex-1 bg-[#2a1a00]/60 border-2 border-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.3)] rounded-sm text-[#fbbf24] py-3.5 text-[10px] font-display font-bold tracking-[0.15em] uppercase hover:bg-[#f59e0b]/20 transition-all flex items-center justify-center gap-2 transform -skew-x-[15deg]"
      >
        <div className="transform skew-x-[15deg] flex items-center gap-1.5">
          <BarChart2 size={14} />
          STAT
        </div>
      </button>
    </div>
  );
}
