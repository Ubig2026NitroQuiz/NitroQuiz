/**
 * ============================================================================
 *  KOMPONEN CHECKERED STRIP (Pola Bendera Kotak-Kotak)
 * ============================================================================
 *
 *  Menampilkan pola kotak-kotak (checkered flag) menggunakan CSS
 *  linear-gradient. Digunakan sebagai aksen dekoratif bertema balap
 *  di sudut-sudut dan tepi halaman login.
 * ============================================================================
 */

'use client';

interface CheckeredStripProps {
  /** Kelas CSS tambahan untuk mengatur posisi dan ukuran */
  className?: string;
}

export default function CheckeredStrip({ className = "" }: CheckeredStripProps) {
  return (
    <div
      className={`${className}`}
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
