"use client";

/**
 * NightCircuit.tsx
 * ────────────────
 * Komponen latar belakang sirkuit malam hari.
 * Menampilkan suasana sirkuit balap yang tenang dan berkelas.
 *
 * Lapisan:
 * 1. Background gambar sirkuit
 * 2. Grid telemetri halus
 * 3. Cahaya sudut (atmospheric glow)
 * 4. Kilatan penonton (crowd flashes) — sangat halus
 * 5. Vignette overlay
 * 6. Garis perspektif di bawah
 */

import { motion } from "framer-motion";

export default function NightCircuit() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-[#02040a]">

      {/* ── 1. Gambar sirkuit utama ── */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: 'url("/assets/backgorund/homepage_bg.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.6) contrast(1.1)',
        }}
      />

      {/* ── 2. Grid telemetri halus (nuansa teknis) ── */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(124,58,237,0.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124,58,237,0.2) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── 3. Cahaya atmosferik sudut ── */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[#7C3AED]/10 rounded-full blur-[120px]" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-[#2d6af2]/10 rounded-full blur-[120px]" />

      {/* ── 4. Kilatan penonton (sangat halus) ── */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-[2px] h-[2px] bg-white rounded-full"
          style={{ top: `${20 + Math.random() * 40}%`, left: `${Math.random() * 100}%` }}
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 5 + Math.random() * 10, delay: i * 2 }}
        />
      ))}

      {/* ── 5. Vignette overlay ── */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#02040a]/40 to-[#02040a] opacity-90" />

      {/* ── 6. Garis perspektif di bawah ── */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  );
}
