/**
 * constants.ts — Konstanta Leaderboard
 * ═════════════════════════════════════
 *
 * Berisi konstanta dan konfigurasi yang digunakan
 * oleh komponen-komponen halaman leaderboard.
 */

/**
 * Peta gambar karakter mobil berdasarkan warna.
 * Digunakan untuk menampilkan mobil pemain di podium.
 */
export const CAR_IMAGE_MAP: Record<string, string> = {
  purple: "/assets/characters/rico/showroom/showroom1.png",
  white: "/assets/characters/rico/showroom/showroom2.png",
  black: "/assets/characters/rico/showroom/showroom1.png",
  aqua: "/assets/characters/rico/showroom/showroom2.png",
  blue: "/assets/characters/rico/showroom/showroom1.png",
};

/** Palet warna untuk avatar inisial (fallback jika tidak punya foto profil) */
export const AVATAR_COLORS = [
  '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6',
  '#10b981', '#ec4899', '#06b6d4', '#f97316',
];

/**
 * Konfigurasi animasi podium menggunakan Framer Motion.
 * Setiap podium muncul dari bawah dengan efek spring.
 * Parameter `custom` mengontrol delay kemunculan (peringkat 3 muncul duluan).
 */
export const PODIUM_VARIANTS: any = {
  hidden: { y: 150, opacity: 0 },
  visible: (custom: number) => ({
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 70,
      damping: 12,
      delay: custom * 0.35 + 0.4,
    },
  }),
};
