'use client';

import Image from "next/image";

/**
 * Menampilkan logo NitroQuiz (kiri) dan GameForSmart (kanan)
 * di bagian atas halaman. Posisi fixed agar tetap terlihat.
 */
export default function TopBarLogos() {
  return (
    <div className="fixed top-0 inset-x-0 z-[89] px-4 md:px-8 py-4 flex items-center justify-between pointer-events-none">
      <div className="pointer-events-auto">
        <Image
          src="/assets/logo/logo1.png"
          alt="NitroQuiz Logo"
          width={180}
          height={50}
          className="h-9 md:h-10 w-auto object-contain drop-shadow-[0_0_15px_rgba(124,58,237,0.5)]"
          priority
        />
      </div>
      <div className="pointer-events-auto">
        <Image
          src="/assets/logo/logo2.png"
          alt="GameForSmart"
          width={160}
          height={40}
          className="h-6 md:h-7 w-auto object-contain opacity-70 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
        />
      </div>
    </div>
  );
}
