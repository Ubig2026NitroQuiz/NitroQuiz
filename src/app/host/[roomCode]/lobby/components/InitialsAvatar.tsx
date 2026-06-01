/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KOMPONEN: InitialsAvatar
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Avatar lingkaran yang menampilkan inisial nama pemain.
 * Digunakan sebagai fallback ketika pemain tidak memiliki avatar_url.
 *
 * Fitur:
 * - Warna background konsisten berdasarkan hash nama
 * - Mendukung 3 ukuran: 'sm', 'md', 'lg'
 * - Menampilkan 2 huruf pertama (atau inisial dari nama depan & belakang)
 */

import { AVATAR_COLORS } from "../types";

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Menghasilkan inisial dari nama
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Menghasilkan inisial 2 karakter dari nama.
 * - Jika ada 2+ kata: ambil huruf pertama dari kata pertama & kedua
 * - Jika hanya 1 kata: ambil 2 huruf pertama
 * - Jika kosong: kembalikan "?"
 */
export const getInitials = (name: string): string => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Menentukan warna avatar berdasarkan nama
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Menghasilkan warna konsisten untuk avatar berdasarkan hash nama.
 * Nama yang sama akan selalu menghasilkan warna yang sama.
 */
export const getAvatarColor = (name: string): string => {
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
  name: string;
  size?: "sm" | "md" | "lg";
}

export const InitialsAvatar = ({ name, size = "md" }: InitialsAvatarProps) => {
  // Tentukan ukuran font berdasarkan variant
  const fontSize =
    size === "lg"
      ? "text-[20px]"
      : size === "md"
        ? "text-[16px]"
        : "text-[10px]";

  return (
    <div
      className="w-full h-full rounded-full flex items-center justify-center font-black text-white"
      style={{ backgroundColor: getAvatarColor(name), fontSize }}
    >
      {getInitials(name)}
    </div>
  );
};
