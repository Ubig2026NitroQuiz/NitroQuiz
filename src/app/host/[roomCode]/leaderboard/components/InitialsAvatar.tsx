/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KOMPONEN: InitialsAvatar
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Avatar lingkaran dengan inisial nama pemain.
 * Warna ditentukan berdasarkan hash dari nickname agar konsisten.
 * Digunakan di podium dan tabel leaderboard sebagai fallback
 * ketika pemain tidak memiliki avatar_url.
 */

import { AVATAR_COLORS } from "../types";

// ═══════════════════════════════════════════════════════════════════════════
// FUNGSI UTILITAS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Menghasilkan inisial dari nama pemain.
 * - Jika nama kosong → "?"
 * - Jika ada 2+ kata → ambil huruf pertama dari 2 kata pertama
 * - Jika 1 kata → ambil 2 karakter pertama
 */
const getInitials = (name: string): string => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

/**
 * Menentukan warna avatar berdasarkan hash sederhana dari nama.
 * Menggunakan palet AVATAR_COLORS agar warnanya konsisten dan menarik.
 */
const getAvatarColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// ═══════════════════════════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════════════════

interface InitialsAvatarProps {
  /** Nama pemain untuk menghasilkan inisial dan warna */
  name: string;
  /** Ukuran avatar: 'sm' (kecil), 'md' (sedang), 'lg' (besar) */
  size?: "sm" | "md" | "lg";
}

export const InitialsAvatar = ({ name, size = "md" }: InitialsAvatarProps) => {
  // Tentukan ukuran font berdasarkan ukuran avatar
  const fontSize =
    size === "lg" ? "text-2xl" : size === "md" ? "text-base" : "text-xs";

  return (
    <div
      className={`w-full h-full rounded-full flex items-center justify-center ${fontSize} font-black text-white select-none`}
      style={{ backgroundColor: getAvatarColor(name) }}
    >
      {getInitials(name)}
    </div>
  );
};
