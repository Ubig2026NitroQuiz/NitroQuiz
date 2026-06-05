/**
 * =====================================================
 * KOMPONEN LAYAR LOADING - ResultLoadingScreen
 * =====================================================
 * Menampilkan spinner dan teks "Loading..." saat data
 * hasil permainan sedang dimuat dari server.
 *
 * Digunakan sebagai early return di halaman utama
 * sebelum data siap ditampilkan.
 * =====================================================
 */

import React from 'react';

/**
 * Layar loading fullscreen dengan spinner dan teks animasi.
 * Menggunakan tema gelap (#0a0a0f) yang konsisten dengan halaman hasil.
 */
export const ResultLoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f] font-display text-white">
    <div className="text-center z-10">
      {/* Spinner berputar */}
      <div className="w-16 h-16 border-4 border-[#2d6af2]/30 border-t-[#2d6af2] rounded-full animate-spin mx-auto mb-6" />
      {/* Teks loading dengan efek pulse */}
      <p className="mt-4 text-[#2d6af2] text-xl tracking-[0.2em] uppercase animate-pulse">
        {/* {t("player_result.establishing_signal")} */}
        Loading...
      </p>
    </div>
  </div>
);
