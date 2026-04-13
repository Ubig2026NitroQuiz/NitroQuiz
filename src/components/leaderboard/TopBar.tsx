"use client";

/**
 * TopBar.tsx
 * ──────────
 * Bar atas halaman leaderboard yang menampilkan dua logo:
 * - Kiri: Logo NitroQuiz (logo1)
 * - Kanan: Logo GameForSmart (logo2) dengan efek hover
 */

export default function TopBar() {
  return (
    <div className="w-full z-30 px-4 md:px-6 pt-2 flex items-center justify-between">
      {/* Logo NitroQuiz di sebelah kiri */}
      <div className="flex items-center justify-center">
        <img
          src="/assets/logo/logo1.png"
          alt="NitroQuiz Logo"
          width={120}
          height={36}
          className="object-contain"
        />
      </div>

      {/* Logo GameForSmart di sebelah kanan */}
      <img
        src="/assets/logo/logo2.png"
        alt="GameForSmart.com"
        width={200}
        height={50}
        className="object-contain opacity-70 hover:opacity-100 transition-opacity duration-300 drop-shadow-[0_0_10px_rgba(45,106,242,0.3)]"
      />
    </div>
  );
}
