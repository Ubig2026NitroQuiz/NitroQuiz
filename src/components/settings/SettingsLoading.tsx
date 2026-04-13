"use client";

/**
 * SettingsLoading.tsx
 * ───────────────────
 * Layar loading yang ditampilkan saat data kuis
 * sedang dimuat dari database.
 */

import { useTranslation } from "react-i18next";

export default function SettingsLoading() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0d1b3e] relative overflow-hidden font-display text-white">
      <div className="text-center z-10">
        {/* Spinner animasi berputar */}
        <div className="w-16 h-16 border-4 border-[#4a3d8f]/30 border-t-[#a98dc5] rounded-full animate-spin mx-auto mb-6"></div>

        {/* Teks status loading */}
        <p className="mt-4 text-[#a98dc5] text-xl tracking-[0.2em] uppercase animate-pulse">
          {t('room_settings.loading')}
        </p>
      </div>
    </div>
  );
}
