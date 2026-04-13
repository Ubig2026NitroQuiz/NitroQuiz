/**
 * QuizLoading.tsx — Layar loading halaman kuis
 * ══════════════════════════════════════════════
 *
 * Ditampilkan saat:
 * - Soal belum dimuat dari database
 * - Timer belum sinkron dengan server
 */

'use client';

import { Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ════════════════════════════════════════════════════════════════
// KOMPONEN
// ════════════════════════════════════════════════════════════════

export function QuizLoading() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#04060f] flex items-center justify-center text-white font-rajdhani">
      <div className="flex flex-col items-center gap-6">
        {/* Spinner dengan ikon trophy */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#2d6af2]/10 border-t-[#2d6af2] rounded-full animate-spin" />
          <Trophy className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-[#2d6af2]/40" />
        </div>
        <p className="text-[#2d6af2] text-base font-bold uppercase tracking-[0.4em] animate-pulse">
          {t("player_quiz.establishing_signal")}
        </p>
      </div>
    </div>
  );
}
