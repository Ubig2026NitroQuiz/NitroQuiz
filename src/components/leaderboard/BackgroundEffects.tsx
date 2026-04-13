"use client";

/**
 * BackgroundEffects.tsx
 * ─────────────────────
 * Efek visual latar belakang halaman leaderboard.
 * Terdiri dari 3 lapisan:
 * 1. Gradien radial gelap dengan sentuhan biru
 * 2. Pola grid garis halus
 * 3. Cahaya glow biru difus di bagian atas
 *
 * Semua lapisan bersifat non-interaktif (pointer-events-none).
 */

export default function BackgroundEffects() {
  return (
    <>
      {/* ── Lapisan 1: Gradien radial gelap ── */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0a0a0f] to-[#050508] pointer-events-none" />

      {/* ── Lapisan 2: Pola grid garis halus ── */}
      <div className="fixed inset-0 z-0 bg-[linear-gradient(rgba(45,106,242,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(45,106,242,0.05)_1px,transparent_1px)] bg-[length:40px_40px] pointer-events-none" />

      {/* ── Lapisan 3: Cahaya glow biru difus ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#2d6af2]/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
    </>
  );
}
