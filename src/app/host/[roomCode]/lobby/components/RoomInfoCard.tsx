/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KOMPONEN: RoomInfoCard
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Kartu informasi ruangan di sisi kiri (desktop) / atas (mobile).
 * Menampilkan kode ruangan, QR code, link bergabung, dan tombol aksi.
 *
 * Terdapat 2 layout:
 * - Mobile/Tablet (< lg): Layout horizontal split (info + QR)
 * - Desktop (≥ lg): Layout vertikal penuh
 *
 * Fitur:
 * - Klik kode ruangan → salin ke clipboard
 * - Klik link bergabung → salin ke clipboard
 * - Klik QR → buka dialog fullscreen
 * - Tombol Exit → buka dialog konfirmasi keluar
 * - Tombol Start → mulai countdown game
 */

import { Play, LogOut, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import QRCode from "react-qr-code";
import { Maximize2 } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// TIPE PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface RoomInfoCardProps {
  roomCode: string;
  joinLink: string;
  copiedRoom: boolean;
  copiedJoin: boolean;
  countdown: number | null;
  participantCount: number;
  onCopyRoom: () => void;
  onCopyJoin: () => void;
  onQrOpen: () => void;
  onExitOpen: () => void;
  onStartGame: () => void;
  t: (key: string) => string;
}

// ═══════════════════════════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════════════════

export function RoomInfoCard({
  roomCode,
  joinLink,
  copiedRoom,
  copiedJoin,
  countdown,
  participantCount,
  onCopyRoom,
  onCopyJoin,
  onQrOpen,
  onExitOpen,
  onStartGame,
  t,
}: RoomInfoCardProps) {
  /** Apakah tombol start dinonaktifkan */
  const isStartDisabled = participantCount === 0 || countdown !== null;

  /** Label tombol start berdasarkan status countdown */
  const startLabel =
    countdown !== null ? t("host_lobby.starting") : t("host_lobby.start");

  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full lg:w-[340px] xl:w-[390px] shrink-0 flex flex-col bg-[#111729]/95 backdrop-blur-xl rounded-xl border border-white/[0.08] shadow-[0_15px_40px_rgba(0,0,0,0.6)] overflow-hidden relative group"
    >
      {/* ── Tekstur Cyber animasi ── */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
          backgroundSize: "16px 16px",
        }}
      />
      <div className="absolute top-0 end-0 w-48 h-48 bg-gradient-to-bl from-[#2d6af2]/10 to-transparent rounded-bl-full pointer-events-none z-0" />

      {/* ═══ LAYOUT MOBILE / TABLET (< lg) ═══ */}
      <MobileTabletLayout
        roomCode={roomCode}
        joinLink={joinLink}
        copiedRoom={copiedRoom}
        copiedJoin={copiedJoin}
        isStartDisabled={isStartDisabled}
        startLabel={startLabel}
        onCopyRoom={onCopyRoom}
        onCopyJoin={onCopyJoin}
        onQrOpen={onQrOpen}
        onExitOpen={onExitOpen}
        onStartGame={onStartGame}
      />

      {/* Spacer untuk mobile */}
      <div className="lg:hidden h-2 shrink-0" />

      {/* ═══ LAYOUT DESKTOP (≥ lg) ═══ */}
      <DesktopLayout
        roomCode={roomCode}
        joinLink={joinLink}
        copiedRoom={copiedRoom}
        copiedJoin={copiedJoin}
        isStartDisabled={isStartDisabled}
        startLabel={startLabel}
        onCopyRoom={onCopyRoom}
        onCopyJoin={onCopyJoin}
        onQrOpen={onQrOpen}
        onExitOpen={onExitOpen}
        onStartGame={onStartGame}
        t={t}
      />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: Layout Mobile / Tablet (< lg)
// ═══════════════════════════════════════════════════════════════════════════

interface LayoutProps {
  roomCode: string;
  joinLink: string;
  copiedRoom: boolean;
  copiedJoin: boolean;
  isStartDisabled: boolean;
  startLabel: string;
  onCopyRoom: () => void;
  onCopyJoin: () => void;
  onQrOpen: () => void;
  onExitOpen: () => void;
  onStartGame: () => void;
  t?: (key: string) => string;
}

function MobileTabletLayout({
  roomCode,
  joinLink,
  copiedRoom,
  copiedJoin,
  isStartDisabled,
  startLabel,
  onCopyRoom,
  onCopyJoin,
  onQrOpen,
  onExitOpen,
  onStartGame,
}: LayoutProps) {
  return (
    <div className="lg:hidden flex flex-col overflow-hidden">
      {/* ── Baris Atas: Info + QR Code ── */}
      <div className="flex border-b border-white/5">
        {/* Sisi Kiri: Kode Ruangan & Link */}
        <div className="flex-1 flex flex-col p-2.5 md:p-8 gap-3 md:gap-6 border-r border-white/5 min-w-0">
          {/* Kode Ruangan (klik untuk salin) */}
          <div
            className="group/code cursor-pointer bg-white/5 rounded-xl md:rounded-2xl py-4 md:py-8 px-3 md:px-12 border border-white/10 hover:border-[#2d6af2]/50 transition-all flex items-center justify-center relative overflow-hidden"
            onClick={onCopyRoom}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#2d6af2]/5 to-transparent opacity-0 group-hover/code:opacity-100 transition-opacity" />
            <h1 className="font-display text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-wider sm:tracking-widest drop-shadow-[0_0_15px_rgba(45,106,242,0.3)] text-center">
              {roomCode}
            </h1>
            <div className="absolute top-1/2 -translate-y-1/2 end-2 md:end-5 opacity-40 group-hover:opacity-100 transition-opacity">
              {copiedRoom ? (
                <Check size={16} className="md:size-5 text-[#00ff9d]" />
              ) : (
                <Copy
                  size={16}
                  className="md:size-5 text-white/20 group-hover/code:text-[#2d6af2]"
                />
              )}
            </div>
          </div>

          {/* Link Bergabung (klik untuk salin) */}
          <div
            className="flex items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 bg-white/5 rounded-lg md:rounded-xl border border-white/5 cursor-pointer group/link hover:border-[#2d6af2]/30 transition-all relative"
            onClick={onCopyJoin}
          >
            <p className="text-white text-[10px] md:text-xs font-mono truncate tracking-wide text-center max-w-[85%]">
              {joinLink}
            </p>
            <div className="absolute top-1/2 -translate-y-1/2 end-2 md:end-4">
              {copiedJoin ? (
                <Check
                  size={12}
                  className="md:size-3.5 text-[#00ff9d] shrink-0"
                />
              ) : (
                <Copy
                  size={12}
                  className="md:size-3.5 text-white/20 group-hover/link:text-[#2d6af2] shrink-0"
                />
              )}
            </div>
          </div>

          {/* TOMBOL TABLET: Hanya tampil di ukuran md ke atas (dalam kolom kiri) */}
          <div className="hidden md:flex gap-3 mt-auto">
            <ExitButton onClick={onExitOpen} size="tablet" />
            <StartButton
              onClick={onStartGame}
              disabled={isStartDisabled}
              label={startLabel}
              size="tablet"
            />
          </div>
        </div>

        {/* Sisi Kanan: Area QR Code */}
        <div
          className="w-[100px] sm:w-[160px] md:w-[320px] lg:w-[360px] flex flex-col items-center justify-center p-2 sm:p-4 md:p-8 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors shrink-0"
          onClick={onQrOpen}
        >
          <div className="bg-white p-1.5 sm:p-3 md:p-5 rounded-lg sm:rounded-xl md:rounded-[2rem] shadow-xl md:shadow-[0_0_50px_rgba(255,255,255,0.1)]">
            <div className="w-[65px] sm:w-[110px] md:w-[220px] lg:w-[260px] aspect-square">
              <QRCode
                value={joinLink}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* TOMBOL MOBILE: Baris penuh hanya untuk ponsel (< md) */}
      <div className="md:hidden p-4 flex gap-3">
        <ExitButton onClick={onExitOpen} size="mobile" />
        <StartButton
          onClick={onStartGame}
          disabled={isStartDisabled}
          label={startLabel}
          size="mobile"
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: Layout Desktop (≥ lg)
// ═══════════════════════════════════════════════════════════════════════════

function DesktopLayout({
  roomCode,
  joinLink,
  copiedRoom,
  copiedJoin,
  isStartDisabled,
  startLabel,
  onCopyRoom,
  onCopyJoin,
  onQrOpen,
  onExitOpen,
  onStartGame,
  t,
}: LayoutProps) {
  return (
    <div className="hidden lg:flex flex-col gap-3 p-4 relative z-10">
      {/* Kode Ruangan */}
      <div
        className="group/code cursor-pointer bg-white/5 rounded-xl py-3 border border-white/10 hover:border-[#2d6af2]/50 transition-all flex items-center justify-center relative overflow-hidden"
        onClick={onCopyRoom}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#2d6af2]/5 to-transparent opacity-0 group-hover/code:opacity-100 transition-opacity" />
        <h1 className="font-display text-5xl lg:text-6xl font-black text-white text-center drop-shadow-[0_0_15px_rgba(45,106,242,0.5)] tracking-widest">
          {roomCode}
        </h1>
        <div className="absolute top-1/2 -translate-y-1/2 end-5">
          {copiedRoom ? (
            <Check size={20} className="text-[#00ff9d]" />
          ) : (
            <Copy
              size={20}
              className="text-white/20 group-hover/code:text-[#2d6af2]"
            />
          )}
        </div>
      </div>

      {/* QR Code — lebar penuh */}
      <div
        className="group/qr cursor-pointer bg-white rounded-2xl p-2 shadow-[0_0_40px_rgba(255,255,255,0.08)] transition-all hover:shadow-[0_0_60px_rgba(255,255,255,0.15)] relative overflow-hidden flex items-center justify-center"
        onClick={onQrOpen}
      >
        <QRCode
          value={joinLink}
          style={{ width: "100%", height: "auto", maxWidth: 320 }}
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/qr:opacity-100 transition-opacity rounded-2xl flex items-center justify-center backdrop-blur-sm">
          <Maximize2 size={36} className="text-white" />
        </div>
      </div>

      {/* Link Bergabung */}
      <div
        className="bg-white/5 rounded-xl py-3 px-4 border border-white/10 hover:border-[#2d6af2]/30 transition-all cursor-pointer group/link flex items-center gap-2"
        onClick={onCopyJoin}
      >
        <p className="flex-1 text-white text-xs font-mono tracking-wide truncate">
          {joinLink}
        </p>
        <div className="shrink-0">
          {copiedJoin ? (
            <Check size={14} className="text-[#00ff9d]" />
          ) : (
            <Copy
              size={14}
              className="text-white/20 group-hover/link:text-[#2d6af2]"
            />
          )}
        </div>
      </div>

      {/* Tombol Aksi */}
      <div className="shrink-0 border-white/5 bg-gradient-to-t relative z-10">
        <div className="flex gap-2">
          <button
            onClick={onExitOpen}
            className="bg-red-500/25 border border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] rounded-sm h-12 px-3 sm:px-4 font-display text-sm font-bold uppercase tracking-wider transition-all shrink-0 transform -skew-x-[15deg] group/btn overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
            <div className="relative z-10 transform skew-x-[15deg] flex items-center gap-1.5">
              <LogOut size={16} className="rtl:rotate-180" />
              <span className="hidden sm:inline text-[11px]">
                {t!("host_lobby.exit")}
              </span>
            </div>
          </button>

          <button
            onClick={onStartGame}
            disabled={isStartDisabled}
            className="flex-1 bg-gradient-to-r from-[#2d6af2] to-[#1e40af] hover:from-[#3b7ff6] hover:to-[#2d6af2] text-white border border-[#2d6af2]/50 font-display font-black h-12 rounded-sm shadow-[0_10px_25px_rgba(45,106,242,0.3)] tracking-[0.15em] uppercase text-sm transition-all disabled:opacity-50 group/btn overflow-hidden relative transform -skew-x-[15deg]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
            <div className="relative z-10 flex items-center justify-center transform skew-x-[15deg]">
              <Play className="fill-current w-4 h-4 me-2" />
              <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                {startLabel}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: Tombol Exit (digunakan di mobile & tablet)
// ═══════════════════════════════════════════════════════════════════════════

function ExitButton({
  onClick,
  size,
}: {
  onClick: () => void;
  size: "mobile" | "tablet";
}) {
  const heightClass = size === "tablet" ? "h-14 xl:h-16" : "h-12 md:h-16";
  const paddingClass = size === "tablet" ? "px-6" : "px-4 md:px-6";
  const iconSize = size === "tablet" ? 22 : 20;

  return (
    <button
      onClick={onClick}
      className={`group/btn bg-red-500/25 border border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] rounded-sm ${heightClass} ${paddingClass} font-display text-xs md:text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center shrink-0 transform -skew-x-[15deg] overflow-hidden relative`}
    >
      <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
      <div className="relative z-10 transform skew-x-[15deg]">
        <LogOut size={iconSize} className="md:size-6 rtl:rotate-180" />
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: Tombol Start (digunakan di mobile & tablet)
// ═══════════════════════════════════════════════════════════════════════════

function StartButton({
  onClick,
  disabled,
  label,
  size,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  size: "mobile" | "tablet";
}) {
  const heightClass = size === "tablet" ? "h-14 xl:h-16" : "h-12 md:h-16";
  const textClass =
    size === "tablet" ? "text-lg" : "text-sm md:text-lg";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 bg-gradient-to-r from-[#2d6af2] to-[#1e40af] hover:from-[#3b7ff6] hover:to-[#2d6af2] text-white border border-[#2d6af2]/50 font-display font-black ${heightClass} rounded-sm shadow-[0_10px_25px_rgba(45,106,242,0.3)] tracking-[0.2em] uppercase ${textClass} transition-all disabled:opacity-50 active:scale-[0.98] group/btn overflow-hidden relative transform -skew-x-[15deg]`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
      <div className="relative z-10 flex items-center justify-center gap-2 md:gap-3 transform skew-x-[15deg]">
        <Play className="fill-current w-5 h-5 md:w-6 md:h-6" />
        <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
          {label}
        </span>
      </div>
    </button>
  );
}
