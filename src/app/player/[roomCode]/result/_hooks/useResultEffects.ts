/**
 * =====================================================
 * HOOK EFEK VISUAL - useResultEffects
 * =====================================================
 * Hook ini menangani:
 * 1. Animasi entrance (delay tampilkan hasil)
 * 2. Efek confetti saat semua pemain selesai
 * 3. Reset orientasi layar dan keluar fullscreen
 *
 * CATATAN: Semua efek visual dipertahankan 100% identik
 * dengan versi monolitik sebelumnya.
 * =====================================================
 */

import { useState, useEffect } from "react";
import confetti from "canvas-confetti";

/**
 * Meluncurkan animasi confetti selama 4 detik.
 * Confetti ditembakkan dari sisi kiri dan kanan layar secara bergantian.
 */
const triggerConfetti = () => {
  const duration = 4000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 50 };

  /** Menghasilkan angka acak dalam rentang tertentu */
  const randomInRange = (min: number, max: number) =>
    Math.random() * (max - min) + min;

  const interval: any = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(interval);

    const particleCount = 40 * (timeLeft / duration);

    // Tembak confetti dari sisi kiri
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    // Tembak confetti dari sisi kanan
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);
};

/**
 * Hook untuk mengelola efek visual halaman hasil.
 *
 * @param isLoading - Apakah data masih dimuat
 * @param hasPlayers - Apakah ada peserta yang terdaftar
 * @param allFinished - Apakah semua pemain sudah selesai
 * @returns showResults - true jika animasi entrance sudah selesai dan hasil boleh ditampilkan
 */
export function useResultEffects(
  isLoading: boolean,
  hasPlayers: boolean,
  allFinished: boolean,
): boolean {
  const [showResults, setShowResults] = useState(false);

  // --- Efek Entrance dan Confetti ---
  /**
   * Setelah loading selesai:
   * 1. Tunggu 600ms untuk transisi visual
   * 2. Tampilkan hasil (setShowResults = true)
   * 3. Jika semua selesai, tembak confetti setelah 1 detik
   */
  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        setShowResults(true);
        if (hasPlayers && allFinished) setTimeout(() => triggerConfetti(), 1000);
      }, 600);
    }
  }, [isLoading, hasPlayers, allFinished]);

  // --- Reset Orientasi Layar ---
  /**
   * Saat masuk halaman hasil:
   * 1. Hapus preferensi orientasi dari localStorage
   * 2. Buka kunci orientasi layar (jika tersedia)
   * 3. Keluar dari mode fullscreen (jika aktif)
   *
   * Ini memastikan pemain kembali ke orientasi portrait setelah game.
   */
  useEffect(() => {
    localStorage.removeItem('nitroquiz_orientation');
    try {
      if (screen.orientation && (screen.orientation as any).unlock) {
        (screen.orientation as any).unlock();
      }
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => { });
      }
    } catch (e) { }
  }, []);

  return showResults;
}
