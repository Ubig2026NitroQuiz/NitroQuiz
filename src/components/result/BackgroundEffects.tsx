/**
 * BackgroundEffects.tsx — Efek background halaman Result
 * ══════════════════════════════════════════════════════
 *
 * Komponen dekoratif:
 * - MobileBG: Gradien radial + grid + partikel bintang
 * - DesktopBG: Showroom style dengan garis cahaya
 */

'use client';

// ════════════════════════════════════════════════════════════════
// PARTIKEL BINTANG (posisi tetap)
// ════════════════════════════════════════════════════════════════

/** Koordinat partikel dekoratif untuk background mobile */
const STAR_POSITIONS = [
  [12, 8], [88, 15], [25, 35], [70, 22], [45, 60],
  [92, 45], [8, 72], [60, 80], [35, 90], [78, 68],
  [18, 55], [55, 12], [82, 35], [40, 48], [65, 92],
  [30, 75], [50, 28], [10, 42], [95, 70], [72, 50],
];

// ════════════════════════════════════════════════════════════════
// MOBILE BACKGROUND
// ════════════════════════════════════════════════════════════════

/** Background halaman result versi mobile (gradien + grid + bintang) */
export function MobileBG() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      {/* Gradien radial biru */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_15%,rgba(45,106,242,0.2),transparent_65%)]" />
      {/* Grid tipis */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(45,106,242,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(45,106,242,0.03)_1px,transparent_1px)] bg-[length:40px_40px]" />
      {/* Partikel bintang dekoratif */}
      {STAR_POSITIONS.map(([x, y], i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: i % 3 === 0 ? 2 : 1,
            height: i % 3 === 0 ? 2 : 1,
            opacity: 0.15 + (i % 5) * 0.08,
          }}
        />
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// DESKTOP BACKGROUND
// ════════════════════════════════════════════════════════════════

/** Background halaman result versi desktop (showroom style) */
export function DesktopBG() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      {/* Gradien lantai showroom */}
      <div
        className="absolute bottom-0 inset-x-0 h-[42%]"
        style={{ background: "linear-gradient(to top, #282e3e 0%, transparent 100%)" }}
      />
      {/* Garis cahaya vertikal */}
      <div className="absolute top-0 left-[28%] w-[2px] h-[48%] bg-gradient-to-b from-white/25 to-transparent" style={{ filter: "blur(1px)" }} />
      <div className="absolute top-0 left-[42%] w-[1px] h-[55%] bg-gradient-to-b from-white/15 to-transparent" />
      <div className="absolute top-0 left-[56%] w-[2px] h-[50%] bg-gradient-to-b from-white/20 to-transparent" style={{ filter: "blur(1px)" }} />
      <div className="absolute top-0 left-[72%] w-[1px] h-[40%] bg-gradient-to-b from-white/12 to-transparent" />
      <div className="absolute top-0 right-[12%] w-[1px] h-[35%] bg-gradient-to-b from-white/10 to-transparent" />
      {/* Vignette kanan */}
      <div className="absolute top-0 right-0 w-[20%] h-full" style={{ background: "linear-gradient(to left, rgba(30,50,80,0.35), transparent)" }} />
      {/* Refleksi lantai */}
      <div
        className="absolute bottom-[18%] left-[38%] w-[320px] h-[40px] -translate-x-1/4"
        style={{ background: "rgba(180,190,220,0.06)", filter: "blur(20px)", borderRadius: "50%" }}
      />
    </div>
  );
}
