/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TIPE DATA: Host Leaderboard
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Definisi tipe-tipe data dan konstanta yang digunakan di seluruh modul
 * halaman leaderboard. Memisahkan tipe dari logika untuk mempermudah
 * maintenance dan type-safety.
 */

import { Variants } from "framer-motion";

// ═══════════════════════════════════════════════════════════════════════════
// TIPE PESERTA (PARTICIPANT)
// ═══════════════════════════════════════════════════════════════════════════

/** Struktur data peserta yang diterima dari database */
export interface Participant {
  id: string;
  nickname: string;
  car_character: string;
  score: number;
  current_question: number;
  finished_at: string | null;
  duration: number;
  joined_at: string;
  avatar_url?: string | null;
  eliminated?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// KONSTANTA PEMETAAN GAMBAR KARAKTER
// ═══════════════════════════════════════════════════════════════════════════

/** Peta gambar showroom berdasarkan warna karakter */
export const CAR_IMAGE_MAP: Record<string, string> = {
  purple: "/assets/characters/rico/showroom/showroom1.png",
  white: "/assets/characters/rico/showroom/showroom2.png",
  black: "/assets/characters/rico/showroom/showroom1.png",
  aqua: "/assets/characters/rico/showroom/showroom2.png",
  blue: "/assets/characters/rico/showroom/showroom1.png",
};

// ═══════════════════════════════════════════════════════════════════════════
// KONSTANTA AVATAR
// ═══════════════════════════════════════════════════════════════════════════

/** Palet warna untuk avatar inisial berdasarkan hash nama */
export const AVATAR_COLORS = [
  "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6",
  "#10b981", "#ec4899", "#06b6d4", "#f97316",
];

// ═══════════════════════════════════════════════════════════════════════════
// VARIAN ANIMASI FRAMER MOTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Animasi podium naik dari bawah — seperti mobil meluncur dari garis start.
 * Custom delay digunakan untuk stagger: posisi ke-3 → ke-2 → ke-1.
 */
export const standVariants: Variants = {
  hidden: { y: 500, opacity: 0 },
  visible: (custom: number) => ({
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 28,
      mass: 1.5,
      delay: custom * 0.55,
    },
  }),
};

/**
 * Animasi nama pemain slide dari kiri — seperti panel telemetri terbuka.
 * Delay dihitung berdasarkan custom + offset 0.5 detik setelah podium naik.
 */
export const nameplateVariants: Variants = {
  hidden: { x: -60, opacity: 0 },
  visible: (custom: number) => ({
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 22,
      delay: custom * 0.55 + 0.5,
    },
  }),
};

/**
 * Animasi gauge RPM melingkar — seperti jarum tachometer yang bergerak.
 * PathLength beranimasi dari 0 ke 1 untuk efek stroke-dasharray.
 */
export const rpmGaugeVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (custom: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      duration: 1.2,
      ease: [0.12, 0, 0.39, 0],
      delay: custom * 0.55 + 0.2,
    },
  }),
};

/**
 * Animasi mahkota jatuh dan memantul — seperti bendera finish dikibarkan.
 * Muncul terakhir setelah semua podium naik.
 */
export const crownVariants: Variants = {
  hidden: { y: -120, opacity: 0, scale: 1.6 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 150,
      damping: 14,
      delay: 3 * 0.55 + 1.0,
    },
  },
};
