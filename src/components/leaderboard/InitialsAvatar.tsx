"use client";

/**
 * InitialsAvatar.tsx
 * ──────────────────
 * Komponen avatar inisial yang digunakan sebagai fallback
 * ketika pengguna tidak memiliki foto profil.
 *
 * Menampilkan 2 huruf inisial dari nama pengguna di dalam
 * lingkaran berwarna. Warna ditentukan secara konsisten
 * berdasarkan hash dari nama.
 *
 * Props:
 * - name: nama pengguna untuk menghitung inisial & warna
 * - size: ukuran avatar ('sm' | 'md' | 'lg')
 */

import { getInitials, getAvatarColor } from "./utils";

/** Mapping ukuran ke class CSS font */
const SIZE_CLASSES = {
  sm: "text-xs",
  md: "text-base",
  lg: "text-2xl",
} as const;

interface InitialsAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
}

export default function InitialsAvatar({ name, size = "md" }: InitialsAvatarProps) {
  return (
    <div
      className={`w-full h-full rounded-full flex items-center justify-center ${SIZE_CLASSES[size]} font-black text-white select-none`}
      style={{ backgroundColor: getAvatarColor(name) }}
    >
      {getInitials(name)}
    </div>
  );
}
