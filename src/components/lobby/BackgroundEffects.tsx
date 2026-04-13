"use client";

/**
 * BackgroundEffects.tsx
 * ─────────────────────
 * Efek visual latar belakang halaman lobby.
 * 3 lapisan: siluet kota, gradien gelap, dan grid perspektif.
 */

export default function BackgroundEffects() {
  return (
    <>
      {/* ── Lapisan 1: Siluet kota ── */}
      <div className="fixed inset-0 z-0 city-silhouette pointer-events-none opacity-40"></div>

      {/* ── Lapisan 2: Gradien gelap dari biru ke hitam ── */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-blue-900/10 via-transparent to-black pointer-events-none"></div>

      {/* ── Lapisan 3: Grid perspektif di bawah ── */}
      <div className="fixed bottom-0 w-full h-[60%] bg-[linear-gradient(transparent_0%,rgba(45,106,242,0.1)_1px,transparent_1px),linear-gradient(90deg,transparent_0%,rgba(45,106,242,0.1)_1px,transparent_1px)] bg-[length:60px_60px] [transform:perspective(500px)_rotateX(60deg)] origin-bottom z-0 pointer-events-none opacity-20"></div>
    </>
  );
}
