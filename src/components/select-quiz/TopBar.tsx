"use client";

/**
 * TopBar.tsx
 * ──────────
 * Bar atas halaman pemilihan kuis.
 * Menampilkan logo NitroQuiz (kiri) dan logo GameForSmart (kanan).
 */

import { Logo } from "@/components/ui/logo";
import Image from "next/image";

export default function TopBar() {
  return (
    <div className="w-full px-4 md:px-6 pt-2 pb-0 flex items-center justify-between flex-shrink-0">
      {/* Logo NitroQuiz di sebelah kiri */}
      <div className="flex items-center gap-2">
        <Logo width={100} height={30} withText={false} animated={false} />
      </div>

      {/* Logo GameForSmart di sebelah kanan */}
      <Image
        src="/assets/logo/logo2.png"
        alt="NitroQuiz"
        width={150}
        height={38}
        className="object-contain opacity-70 hover:opacity-100 transition-opacity duration-300 drop-shadow-[0_0_8px_rgba(169,141,197,0.4)]"
      />
    </div>
  );
}
