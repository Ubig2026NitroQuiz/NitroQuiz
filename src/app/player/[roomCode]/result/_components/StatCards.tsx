/**
 * =====================================================
 * KOMPONEN KARTU STATISTIK - StatCards
 * =====================================================
 * Berisi komponen kartu statistik untuk tampilan
 * mobile dan desktop:
 * - MobileStatCard: Kartu kecil dengan efek skew
 * - DesktopStatCard: Kartu dengan label dan cut corner
 *
 * Kedua komponen murni presentasional (tanpa logika).
 * =====================================================
 */

import React from 'react';

// ==========================================
// Kartu Statistik Mobile
// ==========================================

/** Properti untuk MobileStatCard */
interface MobileStatCardProps {
  children: React.ReactNode;
}

/**
 * Kartu statistik untuk tampilan mobile.
 * Menggunakan efek skew -8 derajat dengan cut corner di kanan bawah
 * untuk tampilan racing yang futuristik.
 */
export const MobileStatCard = ({ children }: MobileStatCardProps) => (
  <div
    className="flex flex-col items-center justify-center py-4 px-1 transform -skew-x-[8deg]"
    style={{
      background: "linear-gradient(155deg,#1a2540,#0d1526)",
      border: "1px solid rgba(45,106,242,0.4)",
      boxShadow: "0 0 16px rgba(45,106,242,0.1)",
      clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)',
    }}
  >
    {/* Konten di-skew balik agar teks tetap tegak */}
    <div className="transform skew-x-[8deg] flex flex-col items-center">{children}</div>
  </div>
);

// ==========================================
// Kartu Statistik Desktop
// ==========================================

/** Properti untuk DesktopStatCard */
interface DesktopStatCardProps {
  /** Label judul kartu (contoh: "RANK", "SCORE") */
  label: string;
  children: React.ReactNode;
}

/**
 * Kartu statistik untuk tampilan desktop.
 * Menggunakan background semi-transparan dengan border halus
 * dan cut corner di kanan bawah.
 */
export const DesktopStatCard = ({ label, children }: DesktopStatCardProps) => (
  <div
    className="overflow-hidden flex-1 flex flex-col justify-center items-center"
    style={{
      background: "rgba(200,215,240,0.08)",
      border: "1px solid rgba(180,200,240,0.25)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
      clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)',
    }}
  >
    {/* Label judul kartu */}
    <div className="text-center mb-1">
      <p
        className="font-display text-[12px] font-bold uppercase tracking-[0.28em]"
        style={{ color: "rgba(190,205,235,0.7)" }}
      >
        {label}
      </p>
    </div>
    {/* Konten nilai kartu */}
    <div className="text-center">{children}</div>
  </div>
);
