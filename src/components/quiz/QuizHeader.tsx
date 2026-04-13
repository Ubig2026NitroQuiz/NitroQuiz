/**
 * QuizHeader.tsx — Header halaman kuis
 * ═════════════════════════════════════
 *
 * Menampilkan:
 * - Progress bar (gradient biru → hijau)
 * - Nomor soal saat ini / total soal
 * - Timer countdown global
 * - Skor pemain saat ini
 */

'use client';

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// ════════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════════

interface QuizHeaderProps {
  /** Indeks soal saat ini (0-based) */
  currentIndex: number;
  /** Total jumlah soal */
  totalQuestions: number;
  /** Sisa waktu global dalam detik (null jika belum siap) */
  globalTimeLeft: number | null;
  /** Skor pemain saat ini */
  score: number;
}

// ════════════════════════════════════════════════════════════════
// KOMPONEN
// ════════════════════════════════════════════════════════════════

export function QuizHeader({ currentIndex, totalQuestions, globalTimeLeft, score }: QuizHeaderProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* ── Progress Bar ── */}
      <div className="w-full h-1 bg-white/5">
        <motion.div
          className="h-full bg-gradient-to-r from-[#2d6af2] to-[#00ff9d]"
          style={{ boxShadow: '0 0 10px rgba(45,106,242,0.4)' }}
          initial={{ width: `${((currentIndex) / totalQuestions) * 100}%` }}
          animate={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      {/* ── Grid Header: Nomor Soal | Timer | Skor ── */}
      <div className="grid grid-cols-3 items-center px-4 md:px-10 py-3 md:py-5 border-b border-white/5">
        {/* KIRI: Nomor soal */}
        <div className="flex flex-col">
          <span className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-[#2d6af2] font-black">
            {t("player_quiz.questions_label") || "Questions"}
          </span>
          <div className="flex items-baseline gap-1 md:gap-1.5">
            <span className="text-lg md:text-2xl font-black text-white leading-none">
              {(currentIndex + 1).toString().padStart(2, '0')}
            </span>
            <span className="text-[10px] md:text-base font-bold text-white/20">
              / {totalQuestions.toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* TENGAH: Timer countdown */}
        <div className="flex justify-center">
          {globalTimeLeft !== null && (
            <div className={`flex items-center px-4 md:px-8 py-1.5 md:py-2.5 rounded-lg md:rounded-full bg-white/[0.03] border transition-all duration-300 ${
              globalTimeLeft <= 30
                ? 'border-red-500/40 bg-red-500/5 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                : 'border-white/10 text-white'
            }`}>
              <span
                className="text-base md:text-2xl font-black leading-none"
                style={{
                  fontFamily: 'Orbitron, sans-serif',
                  letterSpacing: '0.15em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {Math.floor(globalTimeLeft / 60).toString().padStart(2, '0')}:
                {(globalTimeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        {/* KANAN: Skor */}
        <div className="flex flex-col items-end">
          <span className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-[#f59e0b] font-black text-right">
            {t("player_quiz.score_label") || "Score"}
          </span>
          <div className="flex items-center h-auto">
            <span className="text-lg md:text-2xl font-black text-white leading-none tracking-tight">
              {score}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
