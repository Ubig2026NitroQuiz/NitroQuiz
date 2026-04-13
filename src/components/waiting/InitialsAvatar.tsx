"use client";

/**
 * InitialsAvatar.tsx
 * ──────────────────
 * Avatar inisial untuk waiting room.
 */

import { getInitials, getAvatarColor } from "./types";

const SIZE_MAP = { sm: 'text-[10px]', md: 'text-base', lg: 'text-xl' } as const;

export default function InitialsAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div
      className={`w-full h-full rounded-full flex items-center justify-center ${SIZE_MAP[size]} font-black text-white`}
      style={{ backgroundColor: getAvatarColor(name) }}
    >
      {getInitials(name)}
    </div>
  );
}
