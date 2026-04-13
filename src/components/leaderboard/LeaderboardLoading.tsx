"use client";

/**
 * LeaderboardLoading.tsx
 * ──────────────────────
 * Layar loading yang ditampilkan saat data leaderboard
 * sedang dimuat dari database.
 */

import { useTranslation } from "react-i18next";

export default function LeaderboardLoading() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f] font-display text-white">
      <div className="text-center z-10">
        {/* Spinner animasi berputar */}
        <div className="w-16 h-16 border-4 border-[#2d6af2]/30 border-t-[#2d6af2] rounded-full animate-spin mx-auto mb-6"></div>

        {/* Teks status loading */}
        <p className="mt-4 text-[#2d6af2] text-xl tracking-[0.2em] uppercase animate-pulse">
          {t("host_leaderboard.loading")}
        </p>
      </div>
    </div>
  );
}
