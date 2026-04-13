"use client";

/**
 * TopBarLogo.tsx
 * ──────────────
 * Komponen logo di pojok kiri atas halaman.
 * Menampilkan logo GameForSmart dengan efek hover opacity.
 * Posisi fixed agar tetap terlihat saat scroll.
 */

import Image from "next/image";

export default function TopBarLogo() {
  return (
    <div className="fixed top-0 left-0 z-[90] px-4 md:px-8 py-5 pointer-events-none flex items-start">
      <div className="pointer-events-auto">
        <Image
          src="/assets/logo/logo2.png"
          alt="GameForSmart"
          width={180}
          height={50}
          className="h-8 md:h-10 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-300"
          priority
        />
      </div>
    </div>
  );
}
