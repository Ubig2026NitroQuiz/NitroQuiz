"use client";

/**
 * BackgroundEffects.tsx
 * ─────────────────────
 * Efek visual latar belakang halaman login.
 * Berisi semua lapisan dekoratif yang ditumpuk di belakang kartu login.
 *
 * Lapisan (dari bawah ke atas):
 * A. Background image full-screen
 * B. Dark overlay
 * C. Diagonal color split (merah/ungu kiri, biru kanan)
 * D. Atmospheric glows (4 sudut + center bloom)
 * E. Asphalt diagonal texture
 * F. NightCircuit (sirkuit malam)
 * G. Noise overlay (premium detail)
 * M. Checkered flag accents
 * N. Racing stripe (F1 tri-color)
 *
 * Props:
 * - isLoggingIn: untuk center bloom animation
 */

import { motion } from "framer-motion";
import CheckeredStrip from "./CheckeredStrip";
import NightCircuit from "./NightCircuit";

interface BackgroundEffectsProps {
  isLoggingIn: boolean;
}

export default function BackgroundEffects({ isLoggingIn }: BackgroundEffectsProps) {
  return (
    <>
      {/* ── A. GAMBAR BACKGROUND FULL-SCREEN ── */}
      <div
        className="absolute inset-0 z-0 pointer-events-none bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("/assets/backgorund/homepage_bg.png")' }}
      />

      {/* ── B. OVERLAY GELAP (efek malam) ── */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[#04060f]/85" />
      <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-b from-[#04060f] via-[#04060f]/60 to-[#04060f]/90" />

      {/* ── C. PEMISAH WARNA DIAGONAL (kiri=merah/ungu, kanan=biru) ── */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(
              115deg,
              rgba(225,6,0,0.12)   0%,
              rgba(124,58,237,0.18) 35%,
              transparent          50%,
              rgba(45,106,242,0.14) 65%,
              rgba(0,255,157,0.06)  100%
            )
          `,
        }}
      />

      {/* ── D. CAHAYA ATMOSFERIK BESAR ── */}
      {/* Kiri atas: suar merah F1 */}
      <div
        className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full z-0 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(225,6,0,0.18) 0%, transparent 65%)", filter: "blur(60px)" }}
      />
      {/* Kanan atas: bloom nitro ungu */}
      <div
        className="absolute -top-32 -right-32 w-[650px] h-[650px] rounded-full z-0 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 65%)", filter: "blur(70px)" }}
      />
      {/* Kiri bawah: biru kecepatan */}
      <div
        className="absolute -bottom-32 -left-32 w-[550px] h-[550px] rounded-full z-0 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(45,106,242,0.20) 0%, transparent 65%)", filter: "blur(80px)" }}
      />
      {/* Kanan bawah: hint hijau nitro */}
      <div
        className="absolute -bottom-20 -right-20 w-[500px] h-[500px] rounded-full z-0 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,255,157,0.10) 0%, transparent 65%)", filter: "blur(80px)" }}
      />
      {/* Bloom tengah (di belakang kartu) */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div
          className="w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.25) 0%, rgba(45,106,242,0.10) 40%, transparent 70%)", filter: "blur(40px)" }}
        />
      </motion.div>

      {/* ── E. TEKSTUR ASPAL DIAGONAL ── */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(-45deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 16px)`,
        }}
      />

      {/* ── F. SIRKUIT MALAM ── */}
      <NightCircuit />

      {/* ── G. NOISE OVERLAY (detail premium) ── */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none opacity-[0.035]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

      {/* ── M. AKSEN BENDERA KOTAK-KOTAK ── */}
      {/* Garis atas */}
      <div className="absolute top-[3px] inset-x-0 h-[4px] z-[98] pointer-events-none overflow-hidden">
        <CheckeredStrip className="w-full h-full opacity-50" />
      </div>
      {/* Kotak sudut */}
      <CheckeredStrip className="absolute top-[7px] left-0 w-20 h-16 z-[97] opacity-60" />
      <CheckeredStrip className="absolute top-[7px] right-0 w-20 h-16 z-[97] opacity-60" />
      <CheckeredStrip className="absolute bottom-0 left-0 w-20 h-8 z-[2] opacity-30" />
      <CheckeredStrip className="absolute bottom-0 right-0 w-20 h-8 z-[2] opacity-30" />

      {/* ── N. RACING STRIPE (tri-color F1) ── */}
      <div className="fixed top-0 inset-x-0 z-[100] h-[3px] overflow-hidden">
        <div className="h-full w-full bg-gradient-to-r from-[#E10600] via-[#7C3AED] to-[#2d6af2]" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }}
        />
      </div>
    </>
  );
}
