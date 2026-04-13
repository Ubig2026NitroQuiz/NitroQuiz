"use client";

/**
 * CheckeredStrip.tsx
 * ──────────────────
 * Komponen pola kotak-kotak bendera balap (checkered flag).
 * Digunakan sebagai elemen dekoratif di sudut dan tepi layar login.
 *
 * Props:
 * - className: kelas CSS tambahan untuk posisi dan ukuran
 */

interface CheckeredStripProps {
  className?: string;
}

export default function CheckeredStrip({ className = "" }: CheckeredStripProps) {
  return (
    <div
      className={className}
      style={{
        backgroundImage: `
          linear-gradient(45deg, rgba(255,255,255,0.07) 25%, transparent 25%),
          linear-gradient(-45deg, rgba(255,255,255,0.07) 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.07) 75%),
          linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.07) 75%)
        `,
        backgroundSize: "10px 10px",
        backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0px",
      }}
    />
  );
}
