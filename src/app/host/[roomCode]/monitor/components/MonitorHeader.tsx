/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KOMPONEN: MonitorHeader
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Header halaman monitor yang menampilkan:
 * - Logo NitroQuiz (kiri)
 * - Timer countdown game (tengah, selalu terlihat)
 * - Tombol End Race (kanan)
 *
 * Timer berubah warna menjadi merah saat sisa waktu < 60 detik.
 */

import { useTranslation } from "react-i18next";

// ═══════════════════════════════════════════════════════════════════════════
// TIPE PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface MonitorHeaderProps {
  timeLeft: number;
  isEnding: boolean;
  formattedTime: string;
  onEndRaceClick: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════════════════

export function MonitorHeader({
  timeLeft,
  isEnding,
  formattedTime,
  onEndRaceClick,
}: MonitorHeaderProps) {
  const { t } = useTranslation();

  // Apakah waktu sudah kritis (< 60 detik)
  const isCritical = timeLeft < 60;

  // Warna berdasarkan status waktu
  const timerColor = isCritical ? "#ef4444" : "#93c5fd";
  const borderColor = isCritical
    ? "rgba(239,68,68,0.6)"
    : "rgba(59,130,246,0.6)";

  return (
    <div className="relative z-30 flex flex-col md:flex-row items-center justify-between gap-6 px-6 pt-10 pb-6">
      {/* ── Kiri: Logo ── */}
      <div className="flex items-center gap-4">
        <img
          src="/assets/logo/logo1.png"
          alt="NitroQuiz Logo"
          className="h-10 md:h-12 object-contain drop-shadow-[0_0_8px_rgba(45,106,242,0.5)]"
        />
      </div>

      {/* ── Tengah: Timer (selalu terlihat) ── */}
      <div className="relative md:absolute md:left-1/2 md:-translate-x-1/2">
        <div
          className="px-8 py-2 md:px-10 md:py-3 bg-[#0a0e1e]/95 border-2 shadow-[0_0_25px_rgba(45,106,242,0.3)] transform -skew-x-[10deg]"
          style={{ borderColor }}
        >
          <span
            className="transform skew-x-[10deg] block"
            style={{
              fontFamily: "Orbitron, monospace",
              fontSize: "28px",
              fontWeight: 700,
              letterSpacing: "0.18em",
              fontVariantNumeric: "tabular-nums",
              color: timerColor,
              textShadow: `0 0 12px ${timerColor}`,
            }}
          >
            {formattedTime}
          </span>
        </div>
      </div>

      {/* ── Kanan: Tombol End Race ── */}
      <div className="flex items-center">
        <button
          onClick={onEndRaceClick}
          disabled={isEnding}
          className="group/btn relative h-10 md:h-11 px-6 md:px-8 font-display font-bold text-xs md:text-sm tracking-[0.15em] uppercase text-[#fecaca] cursor-pointer transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transform -skew-x-[12deg] overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(239,68,68,0.25), rgba(127,29,29,0.4))",
            border: "1px solid rgba(239,68,68,0.5)",
            boxShadow: "0 0 20px rgba(220,38,38,0.3)",
          }}
        >
          {/* Efek shine saat hover */}
          <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
          <span className="relative z-10 transform skew-x-[12deg]">
            {isEnding
              ? t("host_monitor.ending")
              : t("host_monitor.end_race")}
          </span>
        </button>
      </div>
    </div>
  );
}
