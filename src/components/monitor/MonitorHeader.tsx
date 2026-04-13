"use client";

/**
 * MonitorHeader.tsx
 * ─────────────────
 * Header halaman monitor yang berisi:
 * - Logo NitroQuiz (kiri)
 * - Timer countdown (tengah)
 * - Tombol End Race (kanan)
 *
 * Props:
 * - timeLeft: sisa waktu dalam detik
 * - isEnding: apakah permainan sedang diakhiri
 * - onEndRace: fungsi untuk membuka dialog akhiri permainan
 */

import { useTranslation } from "react-i18next";
import { formatTime } from "./utils";

interface MonitorHeaderProps {
  timeLeft: number;
  isEnding: boolean;
  onEndRace: () => void;
}

export default function MonitorHeader({ timeLeft, isEnding, onEndRace }: MonitorHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="relative z-30 flex flex-col md:flex-row items-center justify-between gap-6 px-6 pt-10 pb-6">
      {/* ── Kiri: Logo NitroQuiz ── */}
      <div className="flex items-center gap-4">
        <img
          src="/assets/logo/logo1.png"
          alt="NitroQuiz Logo"
          className="h-10 md:h-12 object-contain drop-shadow-[0_0_8px_rgba(45,106,242,0.5)]"
        />
      </div>

      {/* ── Tengah: Timer (selalu terlihat) ── */}
      <div className="relative md:absolute md:left-1/2 md:-translate-x-1/2">
        <div className="px-8 py-2 md:px-10 md:py-3 rounded-xl bg-[#0a0e1e]/95 border-2 border-blue-500/60 shadow-[0_0_20px_rgba(45,106,242,0.3)]">
          <span
            style={{
              fontFamily: "Orbitron, monospace",
              fontSize: "28px",
              fontWeight: 700,
              letterSpacing: "0.18em",
              fontVariantNumeric: "tabular-nums",
              color: timeLeft < 60 ? "#ef4444" : "#93c5fd",
              textShadow: `0 0 12px ${timeLeft < 60 ? "#ef4444" : "#93c5fd"}`,
            }}
          >
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* ── Kanan: Tombol End Race ── */}
      <div className="flex items-center">
        <button
          onClick={onEndRace}
          disabled={isEnding}
          className="px-6 py-2 md:px-8 md:py-2.5 rounded-xl bg-gradient-to-br from-red-600 to-red-900 border border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.35)] text-[#fecaca] font-body font-bold text-xs md:text-sm tracking-[0.15em] uppercase cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isEnding ? t("host_monitor.ending") : t("host_monitor.end_race")}
        </button>
      </div>
    </div>
  );
}
