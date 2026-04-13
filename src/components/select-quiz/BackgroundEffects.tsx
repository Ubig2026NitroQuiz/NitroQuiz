"use client";

/**
 * BackgroundEffects.tsx
 * ─────────────────────
 * Efek visual latar belakang halaman pemilihan kuis.
 * Terdiri dari 5 lapisan dekoratif:
 * 1. Pola grid hijau halus
 * 2. Grid perspektif di bagian bawah
 * 3. Gradien radial biru difus
 * 4. Overlay gradien gelap ke biru
 * 5. Efek scanlines
 *
 * Semua lapisan bersifat non-interaktif (pointer-events-none).
 */

export default function BackgroundEffects() {
  return (
    <>
      {/* ── Lapisan 1: Pola grid hijau halus ── */}
      <div className="fixed inset-0 z-0 bg-[linear-gradient(rgba(0,255,157,0.022)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,157,0.022)_1px,transparent_1px)] bg-[length:80px_80px]" />

      {/* ── Lapisan 2: Grid perspektif di bawah ── */}
      <div className="fixed bottom-0 left-0 right-0 h-52 z-0 bg-[linear-gradient(transparent_0%,rgba(45,106,242,0.06)_1px,transparent_1px),linear-gradient(90deg,transparent_0%,rgba(45,106,242,0.06)_1px,transparent_1px)] bg-[length:80px_40px] [transform:perspective(400px)_rotateX(60deg)] origin-bottom pointer-events-none opacity-60" />

      {/* ── Lapisan 3: Gradien radial biru difus ── */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(45,106,242,0.07),transparent)] pointer-events-none" />

      {/* ── Lapisan 4: Overlay gradien gelap ke biru ── */}
      <div className="fixed inset-0 z-0 bg-gradient-to-t from-[#04060f] via-[#04060f]/50 to-[#2d6af2]/10 pointer-events-none" />

      {/* ── Lapisan 5: Efek scanlines ── */}
      <div className="scanlines" />
    </>
  );
}
