/**
 * types.ts — Tipe & Konstanta Waiting Room
 * ═════════════════════════════════════════
 *
 * Berisi tipe data, konstanta karakter, dan helper functions
 * yang digunakan di halaman waiting room pemain.
 */

// ════════════════════════════════════════════════════════════════
// KONSTANTA
// ════════════════════════════════════════════════════════════════

/** Data karakter pemain yang tersedia untuk dipilih */
export const PLAYER_CHARACTERS = [
  {
    id: 'rico',
    name: 'RICO',
    imageSrc: '/assets/characters/rico/showroom/showroom1.png',
    gifSrc: '/assets/characters/rico/showroom/pose1.gif',
    stats: { speed: 80, accel: 60, handling: 70 },
  },
  {
    id: 'gecho',
    name: 'NINJA GECKO',
    imageSrc: '/assets/characters/gecho/showroom/showroom1.png',
    gifSrc: '/assets/characters/gecho/showroom/pose1.gif',
    stats: { speed: 70, accel: 90, handling: 80 },
  },
  {
    id: 'roadhog',
    name: 'ROADHOG',
    imageSrc: '/assets/characters/roadhog/showroom/showroom1.png',
    gifSrc: '/assets/characters/roadhog/showroom/pose1.gif',
    stats: { speed: 60, accel: 80, handling: 50 },
  },
];

/** Tipe karakter pemain */
export type PlayerCharacter = typeof PLAYER_CHARACTERS[number];

/** Status halaman waiting room */
export type WaitingStatus = "loading" | "waiting" | "countdown" | "go" | "error";

/** Data peserta di daftar pemain */
export interface WaitingParticipant {
  id?: string;
  nickname: string;
  car_character: string;
  avatar_url?: string | null;
}

// ════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════

/** Daftar warna untuk avatar inisial */
const AVATAR_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#10b981', '#ec4899', '#06b6d4', '#f97316'];

/** Menghasilkan 2 huruf inisial dari nama */
export function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** Menentukan warna avatar berdasarkan hash nama */
export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
