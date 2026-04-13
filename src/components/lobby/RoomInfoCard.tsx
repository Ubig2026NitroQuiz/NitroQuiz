"use client";

/**
 * RoomInfoCard.tsx
 * ────────────────
 * Kartu informasi room di sisi kiri lobby.
 * Menampilkan:
 * - Kode room (klik untuk copy)
 * - QR Code (klik untuk fullscreen)
 * - Link join (klik untuk copy)
 * - Tombol Exit & Start Game
 *
 * Memiliki 2 layout:
 * - Mobile/Tablet (< lg): layout horizontal kompak
 * - Desktop (lg+): layout vertikal penuh
 *
 * Props:
 * - roomCode: kode room saat ini
 * - joinLink: URL link untuk bergabung
 * - copiedRoom: status copy kode room
 * - copiedJoin: status copy link join
 * - countdown: nilai countdown (null jika belum dimulai)
 * - participantCount: jumlah peserta (untuk disable tombol start)
 * - onCopyRoom: fungsi copy kode room
 * - onCopyJoin: fungsi copy link join
 * - onQrOpen: fungsi buka QR fullscreen
 * - onExit: fungsi buka dialog exit
 * - onStart: fungsi mulai game
 */

import { Play, LogOut, Copy, Check, Maximize2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import QRCode from "react-qr-code";

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
  onExit: () => void;
  onStart: () => void;
}

export default function RoomInfoCard({
  roomCode,
  joinLink,
  copiedRoom,
  copiedJoin,
  countdown,
  participantCount,
  onCopyRoom,
  onCopyJoin,
  onQrOpen,
  onExit,
  onStart,
}: RoomInfoCardProps) {
  const { t } = useTranslation();
  const isStartDisabled = participantCount === 0 || countdown !== null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full lg:w-[340px] xl:w-[390px] shrink-0 flex flex-col bg-black/60 backdrop-blur-3xl rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(45,106,242,0.15)] overflow-hidden relative"
    >
      {/* Efek gradien dekoratif di pojok kanan atas */}
      <div className="absolute top-0 end-0 w-48 h-48 bg-gradient-to-bl from-[#2d6af2]/10 to-transparent rounded-bl-full pointer-events-none z-0"></div>

      {/* ══════════════════════════════════════════════════ */}
      {/* LAYOUT MOBILE / TABLET (di bawah lg)              */}
      {/* ══════════════════════════════════════════════════ */}
      <div className="lg:hidden flex flex-col overflow-hidden">
        {/* Baris atas: Info kiri & QR kanan */}
        <div className="flex border-b border-white/5">
          {/* Sisi kiri: Kode room & link */}
          <div className="flex-1 flex flex-col p-4 md:p-8 gap-3 md:gap-6 border-r border-white/5">
            {/* Kode room (klik untuk copy) */}
            <div
              className="group/code cursor-pointer bg-white/5 rounded-xl md:rounded-2xl py-3 md:py-8 px-4 md:px-12 border border-white/10 hover:border-[#2d6af2]/50 transition-all flex items-center justify-center relative overflow-hidden"
              onClick={onCopyRoom}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#2d6af2]/5 to-transparent opacity-0 group-hover/code:opacity-100 transition-opacity"></div>
              <h1 className="font-display text-2xl md:text-5xl font-black text-white tracking-widest drop-shadow-[0_0_15px_rgba(45,106,242,0.3)] text-center">
                {roomCode}
              </h1>
              <div className="absolute top-1/2 -translate-y-1/2 end-2 md:end-5 opacity-40 group-hover:opacity-100 transition-opacity">
                {copiedRoom ? <Check size={16} className="md:size-5 text-[#00ff9d]" /> : <Copy size={16} className="md:size-5 text-white/20 group-hover/code:text-[#2d6af2]" />}
              </div>
            </div>

            {/* Link join (klik untuk copy) */}
            <div
              className="flex items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 bg-white/5 rounded-lg md:rounded-xl border border-white/5 cursor-pointer group/link hover:border-[#2d6af2]/30 transition-all relative"
              onClick={onCopyJoin}
            >
              <p className="text-white/50 text-[9px] md:text-xs font-mono truncate tracking-wide text-center max-w-[85%]">{joinLink}</p>
              <div className="absolute top-1/2 -translate-y-1/2 end-2 md:end-4">
                {copiedJoin ? <Check size={12} className="md:size-3.5 text-[#00ff9d] shrink-0" /> : <Copy size={12} className="md:size-3.5 text-white/20 group-hover/link:text-[#2d6af2] shrink-0" />}
              </div>
            </div>

            {/* Tombol Exit & Start — hanya di tablet (md+) */}
            <div className="hidden md:flex gap-3 mt-auto">
              <Button onClick={onExit} className="bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl h-14 xl:h-16 px-6 font-display text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center shrink-0">
                <LogOut size={22} className="rtl:rotate-180" />
              </Button>
              <Button onClick={onStart} disabled={isStartDisabled} className="flex-1 bg-gradient-to-r from-[#2d6af2] to-[#00ff9d] hover:brightness-110 text-black font-display font-black h-14 xl:h-16 rounded-xl shadow-[0_10px_25px_rgba(45,106,242,0.3)] tracking-[0.2em] uppercase text-lg transition-all disabled:opacity-50 active:scale-[0.98]">
                <div className="flex items-center justify-center gap-3">
                  <Play className="fill-current w-6 h-6" />
                  <span>{countdown !== null ? t('host_lobby.starting') : t('host_lobby.start')}</span>
                </div>
              </Button>
            </div>
          </div>

          {/* Sisi kanan: QR Code */}
          <div
            className="w-[100px] sm:w-[140px] md:w-[320px] lg:w-[360px] flex flex-col items-center justify-center p-3 md:p-8 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors shrink-0"
            onClick={onQrOpen}
          >
            <div className="bg-white p-2 md:p-5 rounded-xl md:rounded-[2rem] shadow-xl md:shadow-[0_0_50px_rgba(255,255,255,0.1)]">
              <div className="w-[70px] sm:w-[110px] md:w-[220px] lg:w-[260px] aspect-square">
                <QRCode value={joinLink} style={{ height: 'auto', maxWidth: '100%', width: '100%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Tombol Exit & Start — hanya di mobile (< md) */}
        <div className="md:hidden p-4 flex gap-3">
          <Button onClick={onExit} className="bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl h-12 md:h-16 px-4 md:px-6 font-display text-xs md:text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center shrink-0">
            <LogOut size={20} className="md:size-6 rtl:rotate-180" />
          </Button>
          <Button onClick={onStart} disabled={isStartDisabled} className="flex-1 bg-gradient-to-r from-[#2d6af2] to-[#00ff9d] hover:brightness-110 text-black font-display font-black h-12 md:h-16 rounded-xl shadow-[0_10px_25px_rgba(45,106,242,0.3)] tracking-[0.2em] uppercase text-sm md:text-lg transition-all disabled:opacity-50 active:scale-[0.98]">
            <div className="flex items-center justify-center gap-2 md:gap-3">
              <Play className="fill-current w-5 h-5 md:w-6 md:h-6" />
              <span>{countdown !== null ? t('host_lobby.starting') : t('host_lobby.start')}</span>
            </div>
          </Button>
        </div>
      </div>

      {/* Spacer untuk mobile */}
      <div className="lg:hidden h-2 shrink-0" />

      {/* ══════════════════════════════════════════════════ */}
      {/* LAYOUT DESKTOP (lg ke atas)                       */}
      {/* ══════════════════════════════════════════════════ */}
      <div className="hidden lg:flex flex-col gap-4 p-5 flex-1 relative z-10">
        {/* Kode room */}
        <div
          className="group/code cursor-pointer bg-white/5 rounded-xl py-5 border border-white/10 hover:border-[#2d6af2]/50 transition-all flex items-center justify-center relative overflow-hidden"
          onClick={onCopyRoom}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#2d6af2]/5 to-transparent opacity-0 group-hover/code:opacity-100 transition-opacity"></div>
          <h1 className="font-display text-5xl lg:text-6xl font-black text-white text-center drop-shadow-[0_0_15px_rgba(45,106,242,0.5)] tracking-widest">
            {roomCode}
          </h1>
          <div className="absolute top-1/2 -translate-y-1/2 end-5">
            {copiedRoom ? <Check size={20} className="text-[#00ff9d]" /> : <Copy size={20} className="text-white/20 group-hover/code:text-[#2d6af2]" />}
          </div>
        </div>

        {/* QR Code */}
        <div
          className="group/qr cursor-pointer bg-white rounded-2xl p-2 shadow-[0_0_40px_rgba(255,255,255,0.08)] transition-all hover:shadow-[0_0_60px_rgba(255,255,255,0.15)] relative overflow-hidden flex items-center justify-center"
          onClick={onQrOpen}
        >
          <QRCode value={joinLink} style={{ width: '100%', height: 'auto', maxWidth: 320 }} />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/qr:opacity-100 transition-opacity rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Maximize2 size={36} className="text-white" />
          </div>
        </div>

        {/* Link join */}
        <div
          className="bg-white/5 rounded-xl py-3 px-4 border border-white/10 hover:border-[#2d6af2]/30 transition-all cursor-pointer group/link flex items-center gap-2"
          onClick={onCopyJoin}
        >
          <p className="flex-1 text-white/70 text-xs font-mono tracking-wide truncate">{joinLink}</p>
          <div className="shrink-0">
            {copiedJoin ? <Check size={14} className="text-[#00ff9d]" /> : <Copy size={14} className="text-white/20 group-hover/link:text-[#2d6af2]" />}
          </div>
        </div>

        {/* Tombol Exit & Start */}
        <div className="shrink-0 border-white/5 bg-gradient-to-t from-black/40 to-transparent relative z-10">
          <div className="flex gap-2">
            <Button onClick={onExit} className="bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl h-12 px-3 sm:px-4 font-display text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0">
              <LogOut size={16} className="rtl:rotate-180" />
              <span className="hidden sm:inline text-[11px]">{t('host_lobby.exit')}</span>
            </Button>
            <Button onClick={onStart} disabled={isStartDisabled} className="flex-1 bg-gradient-to-r from-[#2d6af2] to-[#00ff9d] hover:brightness-110 text-black font-display font-black h-12 rounded-xl shadow-[0_10px_25px_rgba(45,106,242,0.3)] tracking-[0.15em] uppercase text-sm transition-all disabled:opacity-50">
              <Play className="fill-current w-4 h-4 me-2" />
              {countdown !== null ? t('host_lobby.starting') : t('host_lobby.start')}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
