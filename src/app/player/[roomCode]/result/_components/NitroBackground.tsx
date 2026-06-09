/**
 * =====================================================
 * KOMPONEN LATAR BELAKANG - NitroBackground
 * =====================================================
 * Menampilkan elemen-elemen latar belakang visual:
 * - Racing stripe di bagian atas
 * - Gambar background dengan opacity rendah
 * - Gradient overlay untuk keterbacaan teks
 * - Pola grid halus
 * - Efek glow biru dan ungu
 *
 * Komponen ini murni dekoratif dan tidak memiliki logika.
 * =====================================================
 */

import React from 'react';

/**
 * Latar belakang visual bertema racing untuk halaman hasil.
 * Menggunakan multiple layer (stripe, gambar, gradient, grid, glow)
 * untuk menciptakan tampilan sinematik.
 */
export const NitroBackground = () => (
  <>
    {/* Racing stripe tipis di paling atas layar */}
    <div className="racing-stripe z-50 pointer-events-none absolute top-0 inset-x-0 h-1"></div>

    {/* Gambar latar belakang dengan opacity rendah */}
    <div
      className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-40"
      style={{
        backgroundImage: 'url("/assets/backgorund/homepage_bg.webp")',
        backgroundAttachment: 'fixed'
      }}
    ></div>

    {/* Gradient overlay untuk keterbacaan teks */}
    <div className="fixed inset-0 z-0 bg-gradient-to-t from-[#04060f] via-[#04060f]/80 to-[#7C3AED]/10 pointer-events-none"></div>

    {/* Pola grid halus */}
    <div className="fixed inset-0 z-0 bg-[linear-gradient(rgba(45,106,242,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(45,106,242,0.03)_1px,transparent_1px)] bg-[length:40px_40px] pointer-events-none" />

    {/* Efek glow biru (kiri atas) */}
    <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#2d6af2]/10 blur-[150px] rounded-full pointer-events-none" />

    {/* Efek glow ungu (kanan bawah) */}
    <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#7C3AED]/10 blur-[150px] rounded-full pointer-events-none" />
  </>
);
