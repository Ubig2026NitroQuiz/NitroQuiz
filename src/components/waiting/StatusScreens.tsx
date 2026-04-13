"use client";

/**
 * StatusScreens.tsx
 * ─────────────────
 * Layar status non-waiting:
 * 1. LoadingScreen — spinner saat menghubungkan
 * 2. ErrorScreen — pesan error koneksi
 * 3. CountdownScreen — overlay hitung mundur 3-2-1
 * 4. GoScreen — tampilan "GO!" sebelum redirect
 */

import { Loader2, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

// ════════════════════════════════════════════════════════════════
// 1. LOADING
// ════════════════════════════════════════════════════════════════
export function LoadingScreen() {
  const { t } = useTranslation();
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
      <Loader2 className="w-16 h-16 text-[#00ff9d] animate-spin mb-6" />
      <h2 className="font-display text-2xl tracking-widest text-[#00ff9d] uppercase glow-text">{t("player_waiting.connecting")}</h2>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
// 2. ERROR
// ════════════════════════════════════════════════════════════════
interface ErrorScreenProps {
  message: string;
  onGoHome: () => void;
}

export function ErrorScreen({ message, onGoHome }: ErrorScreenProps) {
  const { t } = useTranslation();
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-500/10 border border-red-500/50 p-6 rounded-2xl backdrop-blur-md">
      <Zap className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h2 className="font-display text-xl text-red-400 mb-2 uppercase tracking-widest">{t("player_waiting.connection_lost")}</h2>
      <p className="text-gray-400 text-sm font-mono">{message}</p>
      <button onClick={onGoHome} className="mt-6 px-6 py-2 bg-red-500/20 hover:bg-red-500 text-white rounded-xl transition-colors font-display text-xs uppercase tracking-wider">
        {t("player_waiting.back_home")}
      </button>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
// 3. COUNTDOWN
// ════════════════════════════════════════════════════════════════
interface CountdownScreenProps {
  value: number;
}

/** Warna teks berdasarkan nilai countdown */
function getCountdownColor(val: number): string {
  if (val === 3) return "text-red-500";
  if (val === 2) return "text-yellow-400";
  return "text-[#00ff9d]";
}

export function CountdownScreen({ value }: CountdownScreenProps) {
  const { t } = useTranslation();

  /** Label teks berdasarkan nilai countdown */
  const label = value === 3 ? t("player_waiting.ready")
    : value === 2 ? t("player_waiting.steady")
    : value === 1 ? t("player_waiting.go_race")
    : t("player_waiting.go");

  /** Konfigurasi lampu lalu lintas */
  const lights = [
    { color: "#ef4444", activeAt: 3 },
    { color: "#facc15", activeAt: 2 },
    { color: "#00ff9d", activeAt: 1 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
      style={{ animation: 'fadeIn 0.3s ease-out' }}>

      {/* Lampu lalu lintas */}
      <div className="flex gap-4 mb-8">
        {lights.map((light, i) => {
          const isGo = value <= 0;
          const isLit = isGo || value <= light.activeAt;
          const displayColor = isGo ? "#00ff9d" : light.color;
          return (
            <div key={i} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2" style={{
              borderColor: isLit ? displayColor : '#374151',
              backgroundColor: isLit ? displayColor : 'rgba(55,65,81,0.3)',
              boxShadow: isLit ? `0 0 25px ${displayColor}` : 'none',
              transform: isLit ? 'scale(1.15)' : 'scale(1)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
          );
        })}
      </div>

      {/* Angka countdown */}
      <span key={value}
        className={`font-display font-black py-4 ${getCountdownColor(value)} drop-shadow-[0_0_40px_currentColor]`}
        style={{ animation: 'countdown-pop 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)', willChange: 'transform, opacity', display: 'block', fontSize: 'clamp(80px, 16vw, 150px)', lineHeight: '1.2' }}>
        {value > 0 ? value : t("player_waiting.go")}
      </span>

      {/* Label */}
      <p className="font-display text-lg text-gray-400 mt-6" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
        {label}
      </p>

      {/* Pemilih orientasi mobile saat countdown */}
      <div className="md:hidden mt-6 flex gap-3 w-full max-w-[320px] px-4">
        <button
          onClick={() => localStorage.setItem('nitroquiz_orientation', 'portrait')}
          className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${(typeof window !== 'undefined' && localStorage.getItem('nitroquiz_orientation') === 'portrait')
            ? 'border-[#2d6af2] bg-[#2d6af2]/15'
            : 'border-white/10 bg-white/5'
            }`}
        >
          <span style={{ fontSize: '1.5rem' }}>📱</span>
          <span className="font-display text-[9px] text-white font-bold uppercase tracking-widest">{t('player_game.portrait')}</span>
        </button>
        <button
          onClick={() => localStorage.setItem('nitroquiz_orientation', 'landscape')}
          className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${(typeof window !== 'undefined' && localStorage.getItem('nitroquiz_orientation') === 'landscape')
            ? 'border-[#00ff9d] bg-[#00ff9d]/10'
            : 'border-white/10 bg-white/5'
            }`}
        >
          <span style={{ fontSize: '1.5rem', transform: 'rotate(90deg)', display: 'inline-block' }}>📱</span>
          <span className="font-display text-[9px] text-white font-bold uppercase tracking-widest">{t('player_game.landscape')}</span>
        </button>
      </div>

      {/* Efek lingkaran pulsasi */}
      <div className="absolute w-64 h-64 rounded-full border border-[#2d6af2]/20" style={{ animation: 'pulseRing 2s ease-in-out infinite' }} />

      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes countdown-pop{0%{transform:scale(1.5) translateY(-30px);opacity:0}60%{transform:scale(0.95) translateY(5px);opacity:1}100%{transform:scale(1) translateY(0);opacity:1}}
        @keyframes pulseRing{0%{transform:scale(1);opacity:0.3}50%{transform:scale(1.5);opacity:0}100%{transform:scale(1);opacity:0.3}}
      `}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 4. GO!
// ════════════════════════════════════════════════════════════════
export function GoScreen() {
  const { t } = useTranslation();
  return (
    <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
      <motion.h1 animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 0.5 }}
        className="font-display text-transparent bg-clip-text bg-gradient-to-b from-[#00ff9d] to-[#2d6af2] font-black drop-shadow-[0_0_50px_rgba(0,255,157,0.6)] py-4 px-2"
        style={{ fontSize: 'clamp(60px, 14vw, 120px)' }}>
        {t("player_waiting.go")}
      </motion.h1>
      <p className="font-display text-[#00ff9d] text-sm mt-4 animate-pulse">{t("player_waiting.launching")}</p>
    </motion.div>
  );
}
