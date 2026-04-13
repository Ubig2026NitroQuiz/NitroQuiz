"use client";

/**
 * BackgroundLayers.tsx
 * ────────────────────
 * Komponen untuk merender semua elemen latar belakang halaman utama.
 * Terdiri dari beberapa lapisan (layer):
 * 1. Racing stripe (garis dekoratif di bagian atas)
 * 2. Gambar background utama
 * 3. Overlay gradien untuk keterbacaan teks
 * 4. Animasi garis kecepatan (speed lines)
 * 5. Efek scanlines halus
 *
 * Semua lapisan bersifat non-interaktif (pointer-events-none)
 * sehingga tidak menghalangi klik pengguna.
 */

import { useMemo } from "react";

/** Tipe data untuk setiap garis kecepatan */
interface SpeedLine {
  id: number;
  top: string;
  width: string;
  delay: string;
  duration: string;
}

export default function BackgroundLayers() {
  /**
   * Menghasilkan data garis kecepatan secara acak.
   * useMemo digunakan agar nilai hanya dihitung sekali (tidak berubah setiap render).
   */
  const speedLines: SpeedLine[] = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      id: i,
      top: `${15 + Math.random() * 70}%`,
      width: `${100 + Math.random() * 200}px`,
      delay: `${i * 1.2}s`,
      duration: `${3 + Math.random() * 3}s`,
    }));
  }, []);

  return (
    <>
      {/* ── Lapisan 1: Racing Stripe (garis aksen di atas halaman) ── */}
      <div className="racing-stripe"></div>

      {/* ── Lapisan 2: Gambar background utama ── */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: 'url("/assets/backgorund/homepage_bg.webp")',
          backgroundAttachment: 'fixed'
        }}
      ></div>

      {/* ── Lapisan 3: Overlay gradien untuk meningkatkan keterbacaan teks ── */}
      <div className="fixed inset-0 z-0 bg-gradient-to-t from-[#04060f] via-[#04060f]/60 to-[#7C3AED]/10 pointer-events-none"></div>

      {/* ── Lapisan 4: Animasi garis kecepatan (speed lines) ── */}
      <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden">
        {speedLines.map((line) => (
          <div
            key={line.id}
            className="speed-line"
            style={{
              top: line.top,
              width: line.width,
              animationDelay: line.delay,
              animationDuration: line.duration,
            }}
          />
        ))}
      </div>

      {/* ── Lapisan 5: Efek scanlines halus ── */}
      <div className="scanlines"></div>
    </>
  );
}
