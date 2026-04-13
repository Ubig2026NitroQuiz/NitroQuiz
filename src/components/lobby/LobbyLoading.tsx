"use client";

/**
 * LobbyLoading.tsx
 * ────────────────
 * Layar loading lobby saat data session belum siap.
 */

import { useTranslation } from "react-i18next";

export default function LobbyLoading() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f] text-white">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#2d6af2]/30 rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-[#2d6af2] text-xl tracking-widest uppercase animate-pulse">
          {t('host_lobby.loading')}
        </p>
      </div>
    </div>
  );
}
