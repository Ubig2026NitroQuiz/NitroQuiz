"use client";

/**
 * InitialsAvatar.tsx
 * ──────────────────
 * Komponen avatar inisial untuk lobby.
 * Menampilkan 2 huruf inisial dari nama pengguna.
 */

import { getInitials, getAvatarColor } from "./utils";

const SIZE_MAP = {
  sm: 'text-[10px]',
  md: 'text-[16px]',
  lg: 'text-[20px]',
} as const;

interface InitialsAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function InitialsAvatar({ name, size = 'md' }: InitialsAvatarProps) {
  return (
    <div
      className={`w-full h-full rounded-full flex items-center justify-center font-black text-white ${SIZE_MAP[size]}`}
      style={{ backgroundColor: getAvatarColor(name) }}
    >
      {getInitials(name)}
    </div>
  );
}
