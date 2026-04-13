"use client";

/**
 * LobbyDialogs.tsx
 * ────────────────
 * Kumpulan dialog kecil yang digunakan di lobby:
 * 1. KickDialog — Konfirmasi kick pemain
 * 2. ExitDialog — Konfirmasi keluar dari lobby
 * 3. QrFullscreen — QR Code fullscreen overlay
 * 4. InviteToast — Notifikasi toast setelah mengundang
 * 5. CountdownOverlay — Overlay hitung mundur sebelum mulai
 * 6. FullscreenButton — Tombol toggle fullscreen melayang
 */

import { LogOut, Check, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogOverlay } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import QRCode from "react-qr-code";

// ════════════════════════════════════════════════════════════════
// 1. KICK DIALOG
// ════════════════════════════════════════════════════════════════

interface KickDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  playerName: string;
}

export function KickDialog({ isOpen, onClose, onConfirm, playerName }: KickDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="bg-black/90 backdrop-blur-md" />
      <DialogContent className="bg-[#11111a] border border-red-500/30 text-white p-8 max-w-sm rounded-[2rem] shadow-[0_0_100px_rgba(239,68,68,0.2)]">
        <DialogTitle className="text-2xl font-body font-bold uppercase tracking-[0.10em] text-center mb-6">
          {t('host_lobby.kick')} {playerName}?
        </DialogTitle>
        <div className="flex gap-4">
          <Button onClick={onClose} variant="ghost" className="flex-1 border border-white/10 h-12 rounded-xl font-body font-bold uppercase text-xs tracking-widest text-gray-400">
            {t('host_lobby.cancel') ?? 'Cancel'}
          </Button>
          <Button onClick={onConfirm} className="flex-1 bg-red-500 hover:bg-red-600 text-white h-12 rounded-xl font-body font-bold uppercase text-xs tracking-widest">
            KICK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ════════════════════════════════════════════════════════════════
// 2. EXIT DIALOG
// ════════════════════════════════════════════════════════════════

interface ExitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ExitDialog({ isOpen, onClose, onConfirm }: ExitDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="bg-black/90 backdrop-blur-md" />
      <DialogContent className="bg-[#11111a] border border-red-500/30 text-white p-8 max-w-sm rounded-[2rem] shadow-[0_0_100px_rgba(239,68,68,0.2)]">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
            <LogOut size={32} className="text-red-500" />
          </div>
          <DialogTitle className="text-2xl font-body font-bold uppercase tracking-[0.15em] text-center mb-2">
            {t('host_lobby.exit_dialog_title')}
          </DialogTitle>
          <p className="text-white/60 text-sm text-center font-body tracking-wider mb-8 uppercase">
            {t('host_lobby.exit_dialog_desc')}
          </p>
          <div className="flex gap-4 w-full">
            <Button onClick={onClose} variant="ghost" className="flex-1 border border-white/10 h-12 rounded-xl font-body font-bold uppercase text-xs tracking-widest text-gray-400 hover:bg-white/5 hover:text-white">
              {t('host_lobby.cancel')}
            </Button>
            <Button onClick={onConfirm} className="flex-1 bg-red-500 hover:bg-red-600 text-white h-12 rounded-xl font-body font-bold uppercase text-xs tracking-widest shadow-[0_5px_15px_rgba(239,68,68,0.3)] transition-all hover:scale-105 active:scale-95">
              {t('host_lobby.confirm_exit')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ════════════════════════════════════════════════════════════════
// 3. QR FULLSCREEN
// ════════════════════════════════════════════════════════════════

interface QrFullscreenProps {
  isOpen: boolean;
  onClose: () => void;
  joinLink: string;
}

export function QrFullscreen({ isOpen, onClose, joinLink }: QrFullscreenProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center cursor-pointer" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 shadow-[0_0_80px_rgba(255,255,255,0.15)] cursor-default" onClick={(e) => e.stopPropagation()}>
        <QRCode value={joinLink} style={{ width: 'min(80vw, 80vh)', height: 'auto', maxWidth: 500 }} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 4. INVITE TOAST
// ════════════════════════════════════════════════════════════════

interface InviteToastProps {
  isVisible: boolean;
}

export function InviteToast({ isVisible }: InviteToastProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          className="fixed top-8 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none"
        >
          <div className="flex items-center gap-4 bg-[#0a0f16] border border-[#00ff9d]/40 rounded-2xl px-6 py-4 shadow-[0_0_50px_rgba(0,255,157,0.15)] min-w-[280px]">
            <div className="w-8 h-8 rounded-full border border-[#00ff9d] flex items-center justify-center bg-[#00ff9d]/10 shrink-0">
              <Check size={16} className="text-[#00ff9d]" />
            </div>
            <span className="font-display font-bold uppercase tracking-[0.2em] text-white text-sm mt-0.5">
              Invited
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ════════════════════════════════════════════════════════════════
// 5. COUNTDOWN OVERLAY
// ════════════════════════════════════════════════════════════════

interface CountdownOverlayProps {
  countdown: number | null;
}

export function CountdownOverlay({ countdown }: CountdownOverlayProps) {
  const { t } = useTranslation();
  if (countdown === null) return null;

  /** Konfigurasi lampu lalu lintas (merah, kuning, hijau) */
  const lights = [
    { color: "#ef4444", activeAt: 3 },
    { color: "#facc15", activeAt: 2 },
    { color: "#00ff9d", activeAt: 1 },
  ];

  /** Menentukan warna teks angka berdasarkan countdown */
  const numberColor = countdown === 3 ? 'text-red-500' : countdown === 2 ? 'text-yellow-400' : 'text-[#00ff9d]';

  /** Menentukan label teks berdasarkan countdown */
  const label = countdown === 3
    ? (t('player_waiting.ready') ?? 'READY')
    : countdown === 2
      ? (t('player_waiting.steady') ?? 'STEADY')
      : (t('player_waiting.go_race') ?? 'GO RACE!');

  return (
    <div className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Lampu lalu lintas */}
      <div className="flex gap-4 mb-8">
        {lights.map((light, i) => {
          const isGo = countdown <= 0;
          const isLit = isGo || countdown <= light.activeAt;
          const displayColor = isGo ? "#00ff9d" : light.color;
          return (
            <div key={i} className="w-10 h-10 md:w-14 md:h-14 rounded-full border-2" style={{
              borderColor: isLit ? displayColor : '#374151',
              backgroundColor: isLit ? displayColor : 'rgba(55,65,81,0.3)',
              boxShadow: isLit ? `0 0 30px ${displayColor}, 0 0 60px ${displayColor}55` : 'none',
              transform: isLit ? 'scale(1.15)' : 'scale(1)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
          );
        })}
      </div>

      {/* Angka countdown */}
      <span
        key={countdown}
        className={`font-display font-black py-2 drop-shadow-[0_0_40px_currentColor] ${numberColor}`}
        style={{
          fontSize: 'clamp(120px, 22vw, 220px)',
          lineHeight: '1.1',
          display: 'block',
          animation: 'countdown-pop 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)',
        }}
      >
        {countdown > 0 ? countdown : t('host_lobby.go') ?? 'GO!'}
      </span>

      {/* Label teks */}
      <p className="font-display text-xl text-gray-400 mt-4 tracking-[0.3em] uppercase" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
        {label}
      </p>

      {/* Efek lingkaran pulsasi */}
      <div className="absolute w-72 h-72 rounded-full border border-[#2d6af2]/30" style={{ animation: 'pulseRing 2s ease-in-out infinite' }} />

      {/* CSS animasi */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes countdown-pop { 0% { transform: scale(1.6) translateY(-20px); opacity: 0 } 60% { transform: scale(0.95) translateY(4px); opacity: 1 } 100% { transform: scale(1) translateY(0); opacity: 1 } }
        @keyframes pulseRing { 0% { transform: scale(1); opacity: 0.3 } 50% { transform: scale(1.8); opacity: 0 } 100% { transform: scale(1); opacity: 0.3 } }
      `}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 6. FULLSCREEN BUTTON
// ════════════════════════════════════════════════════════════════

interface FullscreenButtonProps {
  isFullscreen: boolean;
  onToggle: () => void;
}

export function FullscreenButton({ isFullscreen, onToggle }: FullscreenButtonProps) {
  return (
    <div className="fixed bottom-6 end-6 z-[250] flex">
      <Button
        onClick={onToggle}
        variant="outline"
        className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-black/60 backdrop-blur-xl border-white/10 hover:border-[#2d6af2]/50 hover:bg-[#2d6af2]/10 text-white/50 hover:text-white transition-all shadow-2xl group flex items-center justify-center p-0"
      >
        {isFullscreen ? (
          <Minimize2 size={20} className="md:size-6 group-hover:scale-110 transition-transform" />
        ) : (
          <Maximize2 size={20} className="md:size-6 group-hover:scale-110 transition-transform" />
        )}
      </Button>
    </div>
  );
}
