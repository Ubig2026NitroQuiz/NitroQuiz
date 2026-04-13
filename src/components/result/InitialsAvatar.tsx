/**
 * InitialsAvatar.tsx — Avatar inisial pemain
 * ═══════════════════════════════════════════
 *
 * Komponen avatar bulat berisi inisial nama pemain.
 * Warna dihasilkan berdasarkan hash nama agar konsisten.
 * Digunakan saat pemain tidak memiliki avatar foto.
 */

'use client';

import { getInitials, getAvatarColor } from './types';

// ════════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════════

interface InitialsAvatarProps {
  /** Nama pemain untuk menghasilkan inisial dan warna */
  name: string;
  /** Ukuran teks: sm (leaderboard), md (podium), lg (profil) */
  size?: 'sm' | 'md' | 'lg';
}

// ════════════════════════════════════════════════════════════════
// KOMPONEN
// ════════════════════════════════════════════════════════════════

export function InitialsAvatar({ name, size = 'md' }: InitialsAvatarProps) {
  const fontSize = size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-xl' : 'text-xs';

  return (
    <div
      className={`w-full h-full rounded-full flex items-center justify-center ${fontSize} font-black text-white`}
      style={{ backgroundColor: getAvatarColor(name) }}
    >
      {getInitials(name)}
    </div>
  );
}
