/**
 * =====================================================
 * KONSTANTA HALAMAN HASIL - NitroQuiz Result Page
 * =====================================================
 * File ini berisi semua konstanta tetap yang digunakan
 * di halaman hasil, termasuk peta gambar karakter dan
 * palet warna avatar.
 * =====================================================
 */

// --- Peta Gambar Karakter ---
/**
 * Memetakan nama karakter ke path gambar showroom.
 * Termasuk fallback untuk nama karakter lama (legacy).
 */
export const CAR_IMAGE_MAP: Record<string, string> = {
  rico: "/assets/characters/rico/showroom/showroom1.png",
  gecho: "/assets/characters/gecho/showroom/showroom1.png",
  roadhog: "/assets/characters/roadhog/showroom/showroom1.png",
  // Fallback untuk nama karakter lama (legacy)
  purple: "/assets/characters/rico/showroom/showroom1.png",
  white: "/assets/characters/gecho/showroom/showroom1.png",
  black: "/assets/characters/roadhog/showroom/showroom1.png",
  aqua: "/assets/characters/rico/showroom/showroom1.png",
  blue: "/assets/characters/rico/showroom/showroom1.png",
};

// --- Palet Warna Avatar ---
/**
 * Daftar warna untuk avatar inisial.
 * Warna dipilih berdasarkan hash dari nama pemain.
 */
export const AVATAR_COLORS = [
  '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6',
  '#10b981', '#ec4899', '#06b6d4', '#f97316',
];

// --- URL Statistik Eksternal ---
/** Base URL untuk halaman statistik permainan di gameforsmart */
export const STATS_BASE_URL = "https://app.gameforsmart.com/stat";
