/**
 * StatCards.tsx — Kartu statistik (Mobile & Desktop)
 * ══════════════════════════════════════════════════
 *
 * Dua variasi kartu statistik:
 * - MobileStatCard: Kartu ringkas untuk grid 4 kolom
 * - DesktopStatCard: Kartu vertikal dengan label atas
 */

'use client';

import React from 'react';

// ════════════════════════════════════════════════════════════════
// MOBILE STAT CARD
// ════════════════════════════════════════════════════════════════

/**
 * Kartu statistik mobile (rank, score, correct, time).
 * Digunakan dalam grid 4 kolom pada tampilan mobile.
 */
export function MobileStatCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl py-4 px-1"
      style={{
        background: "linear-gradient(155deg,#1a2540,#0d1526)",
        border: "1px solid rgba(45,106,242,0.4)",
        boxShadow: "0 0 16px rgba(45,106,242,0.1)",
      }}
    >
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// DESKTOP STAT CARD
// ════════════════════════════════════════════════════════════════

interface DesktopStatCardProps {
  /** Label di atas angka (contoh: "RANK", "SCORE") */
  label: string;
  children: React.ReactNode;
}

/**
 * Kartu statistik desktop dengan label dan nilai besar.
 * Ditampilkan di panel kanan halaman desktop.
 */
export function DesktopStatCard({ label, children }: DesktopStatCardProps) {
  return (
    <div
      className="rounded-2xl overflow-hidden flex-1 flex flex-col justify-center items-center"
      style={{
        background: "rgba(200,215,240,0.08)",
        border: "1px solid rgba(180,200,240,0.25)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
      }}
    >
      <div className="text-center mb-1">
        <p
          className="font-display text-[12px] font-bold uppercase tracking-[0.28em]"
          style={{ color: "rgba(190,205,235,0.7)" }}
        >
          {label}
        </p>
      </div>
      <div className="text-center">{children}</div>
    </div>
  );
}
