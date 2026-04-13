"use client";

/**
 * BackgroundEffects.tsx
 * ─────────────────────
 * Efek visual latar belakang halaman monitor.
 * Terdiri dari: grid biru, radial glow, dan aksen ungu di sudut.
 */

export default function BackgroundEffects() {
  return (
    <>
      {/* ── Lapisan 1: Grid biru ── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          opacity: 0.25,
          backgroundImage: `
            linear-gradient(rgba(45,106,242,0.18) 1px, transparent 1px),
            linear-gradient(90deg, rgba(45,106,242,0.18) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* ── Lapisan 2: Cahaya radial pusat ── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background: "radial-gradient(ellipse 80% 55% at 50% 50%, rgba(45,106,242,0.07) 0%, transparent 70%)",
        }}
      />

      {/* ── Lapisan 3: Aksen ungu pojok kiri bawah ── */}
      <div style={{ position: "fixed", bottom: 0, left: 0, zIndex: 0, pointerEvents: "none", width: "320px", height: "320px", background: "radial-gradient(circle at bottom left, rgba(139,92,246,0.35) 0%, transparent 70%)", opacity: 0.2 }} />

      {/* ── Lapisan 4: Aksen ungu pojok kanan atas ── */}
      <div style={{ position: "fixed", top: 0, right: 0, zIndex: 0, pointerEvents: "none", width: "320px", height: "320px", background: "radial-gradient(circle at top right, rgba(139,92,246,0.3) 0%, transparent 70%)", opacity: 0.15 }} />
    </>
  );
}
