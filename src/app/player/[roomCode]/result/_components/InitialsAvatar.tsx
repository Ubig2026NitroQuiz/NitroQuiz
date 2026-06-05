/**
 * =====================================================
 * KOMPONEN AVATAR INISIAL - InitialsAvatar
 * =====================================================
 * Menampilkan lingkaran berwarna dengan inisial nama
 * sebagai pengganti foto profil (saat avatar_url kosong).
 *
 * Mendukung 3 ukuran: 'sm' (kecil), 'md' (sedang), 'lg' (besar)
 * =====================================================
 */

import React from 'react';
import { getInitials, getAvatarColor } from '../_utils';

/** Properti komponen InitialsAvatar */
interface InitialsAvatarProps {
  /** Nama pemain untuk menghasilkan inisial dan warna */
  name: string;
  /** Ukuran avatar: 'sm' | 'md' | 'lg' */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Komponen avatar yang menampilkan inisial nama dalam lingkaran berwarna.
 * Warna dipilih secara konsisten berdasarkan hash dari nama.
 */
export const InitialsAvatar = ({ name, size = 'md' }: InitialsAvatarProps) => {
  // Tentukan ukuran font berdasarkan ukuran avatar
  const fontSize = size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-xl' : 'text-xs';

  return (
    <div
      className={`w-full h-full rounded-full flex items-center justify-center ${fontSize} font-black text-white`}
      style={{ backgroundColor: getAvatarColor(name) }}
    >
      {getInitials(name)}
    </div>
  );
};
