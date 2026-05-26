/**
 * ============================================================================
 *  KOMPONEN RACING BACKGROUND
 * ============================================================================
 *
 *  Menggabungkan semua elemen latar belakang bertema balap menjadi satu
 *  komponen yang rapi. Komponen ini menumpuk beberapa lapisan dekoratif:
 *
 *  [A] Gambar latar layar penuh
 *  [B] Overlay gelap (efek balapan malam)
 *  [C] Pemisahan warna diagonal (kiri=merah/ungu, kanan=biru)
 *  [D] Cahaya atmosferik besar (glow)
 *  [E] Tekstur aspal diagonal
 *  [F] Komponen NightCircuit
 *  [G] Overlay noise (detail premium)
 *  [H] Aksen bendera kotak-kotak (checkered)
 *  [I] Strip balap atas (tri-warna F1)
 *
 *  Komponen ini murni dekoratif, tidak menerima props dan tidak
 *  berinteraksi dengan logika aplikasi.
 * ============================================================================
 */

'use client';

import { motion } from "framer-motion";
import NightCircuit from "./NightCircuit";
import CheckeredStrip from "./CheckeredStrip";

export default function RacingBackground() {
  return (
    <>
      {/* ── A. GAMBAR LATAR LAYAR PENUH ── */}
      <div
        className="absolute inset-0 z-0 pointer-events-none bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("/assets/backgorund/homepage_bg.png")' }}
      />

      {/* ── B. OVERLAY GELAP (Nuansa balapan malam) ── */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[#04060f]/85" />
      {/* Gradien: gelap atas, sedikit terang di tengah */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-b from-[#04060f] via-[#04060f]/60 to-[#04060f]/90" />

      {/* ── C. PEMISAHAN WARNA DIAGONAL ── */}
      {/* Menciptakan nuansa "dua sisi lintasan" */}
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
      {/* Kanan atas: cahaya ungu nitro */}
      <div
        className="absolute -top-32 -right-32 w-[650px] h-[650px] rounded-full z-0 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 65%)", filter: "blur(70px)" }}
      />
      {/* Kiri bawah: biru kecepatan */}
      <div
        className="absolute -bottom-32 -left-32 w-[550px] h-[550px] rounded-full z-0 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(45,106,242,0.20) 0%, transparent 65%)", filter: "blur(80px)" }}
      />
      {/* Kanan bawah: sentuhan hijau nitro */}
      <div
        className="absolute -bottom-20 -right-20 w-[500px] h-[500px] rounded-full z-0 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,255,157,0.10) 0%, transparent 65%)", filter: "blur(80px)" }}
      />
      {/* Cahaya tengah (di belakang kartu login) — berkedip halus */}
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

      {/* ── F. SIRKUIT MALAM (Pengalaman Balap) ── */}
      <NightCircuit />

      {/* ── G. OVERLAY NOISE (Detail Premium) ── */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none opacity-[0.035]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

      {/* ── H. AKSEN BENDERA KOTAK-KOTAK ── */}
      {/* Strip atas */}
      <div className="absolute top-[3px] inset-x-0 h-[4px] z-[98] pointer-events-none overflow-hidden">
        <CheckeredStrip className="w-full h-full opacity-50" />
      </div>
      {/* Kotak di sudut-sudut */}
      <CheckeredStrip className="absolute top-[7px] left-0 w-20 h-16 z-[97] opacity-60" />
      <CheckeredStrip className="absolute top-[7px] right-0 w-20 h-16 z-[97] opacity-60" />
      <CheckeredStrip className="absolute bottom-0 left-0 w-20 h-8 z-[2] opacity-30" />
      <CheckeredStrip className="absolute bottom-0 right-0 w-20 h-8 z-[2] opacity-30" />

      {/* ── I. STRIP BALAP ATAS (Tri-warna F1) ── */}
      <div className="fixed top-0 inset-x-0 z-[100] h-[3px] overflow-hidden">
        <div className="h-full w-full bg-gradient-to-r from-[#E10600] via-[#7C3AED] to-[#2d6af2]" />
        {/* Efek kilau yang bergerak horizontal */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }}
        />
      </div>
    </>
  );
}
