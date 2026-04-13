"use client";

/**
 * LoadingScreen.tsx
 * ─────────────────
 * Komponen layar pemuatan (loading screen) yang ditampilkan saat:
 * - Autentikasi sedang dimuat (authLoading)
 * - Pengguna sedang membuat room baru (isHosting)
 * - Pengguna sedang dialihkan ke room lewat QR code (isRedirecting)
 *
 * Menampilkan animasi spinner dan teks loading.
 */

import { useTranslation } from "react-i18next";

export default function LoadingScreen() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#04060f] relative overflow-hidden font-body text-white">
      {/* Garis dekoratif atas (racing stripe) */}
      <div className="racing-stripe"></div>

      {/* Konten loading di tengah layar */}
      <div className="text-center z-10">
        {/* Spinner animasi berputar */}
        <div className="w-14 h-14 border-[3px] border-white/10 border-t-[#7C3AED] rounded-full animate-spin mx-auto mb-6"></div>

        {/* Teks status loading */}
        <p className="mt-4 text-white/60 text-sm tracking-[0.3em] uppercase font-body">
          {t('homepage.loading')}
        </p>
      </div>
    </div>
  );
}
