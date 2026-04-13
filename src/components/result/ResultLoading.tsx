/**
 * ResultLoading.tsx — Layar loading halaman Result
 * ════════════════════════════════════════════════
 *
 * Ditampilkan selama data peserta dan session
 * sedang di-fetch dari database.
 */

'use client';

import { useTranslation } from 'react-i18next';

// ════════════════════════════════════════════════════════════════
// KOMPONEN
// ════════════════════════════════════════════════════════════════

export function ResultLoading() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f] font-display text-white">
      <div className="text-center z-10">
        {/* Spinner biru */}
        <div className="w-16 h-16 border-4 border-[#2d6af2]/30 border-t-[#2d6af2] rounded-full animate-spin mx-auto mb-6" />
        <p className="mt-4 text-[#2d6af2] text-xl tracking-[0.2em] uppercase animate-pulse">
          {t("player_result.establishing_signal")}
        </p>
      </div>
    </div>
  );
}
