/**
 * types.ts — Tipe data & konstanta halaman Result
 * ═══════════════════════════════════════════════
 *
 * Berisi tipe data peserta, pemetaan gambar karakter,
 * dan helper functions yang digunakan di seluruh
 * komponen halaman result.
 */

// ════════════════════════════════════════════════════════════════
// TIPE DATA PESERTA
// ════════════════════════════════════════════════════════════════

/** Struktur data satu peserta dari database */
export interface Participant {
  id: string;
  nickname: string;
  car_character: string;
  score: number;
  correct: number;
  current_question: number;
  finished_at: string | null;
  duration: number;
  eliminated: boolean;
  avatar_url?: string | null;
  user_id?: string | null;
}

// ════════════════════════════════════════════════════════════════
// PEMETAAN GAMBAR KARAKTER
// ════════════════════════════════════════════════════════════════

/**
 * Peta nama karakter → path gambar showroom.
 * Termasuk nama legacy (purple, white, dll) untuk backward-compat.
 */
export const CAR_IMAGE_MAP: Record<string, string> = {
  rico: "/assets/characters/rico/showroom/showroom1.png",
  gecho: "/assets/characters/gecho/showroom/showroom1.png",
  roadhog: "/assets/characters/roadhog/showroom/showroom1.png",
  // Fallback nama lama
  purple: "/assets/characters/rico/showroom/showroom1.png",
  white: "/assets/characters/gecho/showroom/showroom1.png",
  black: "/assets/characters/roadhog/showroom/showroom1.png",
  aqua: "/assets/characters/rico/showroom/showroom1.png",
  blue: "/assets/characters/rico/showroom/showroom1.png",
};

// ════════════════════════════════════════════════════════════════
// FUNGSI UTILITAS
// ════════════════════════════════════════════════════════════════

/** Ambil inisial dari nama (maks 2 huruf) */
export const getInitials = (name: string): string => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

/** Palet warna untuk avatar inisial */
const AVATAR_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#10b981', '#ec4899', '#06b6d4', '#f97316'];

/** Pilih warna avatar berdasarkan hash nama */
export const getAvatarColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

/** Suffix peringkat (1st, 2nd, 3rd, 4th, ...) */
export const getRankSuffix = (rank: number): string => {
  if (rank === 1) return "st";
  if (rank === 2) return "nd";
  if (rank === 3) return "rd";
  return "th";
};

/** Format durasi (detik) → "mm:ss" */
export const formatDuration = (seconds: number | undefined | null): string => {
  if (!seconds || seconds === Infinity) return "--:--";
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};
