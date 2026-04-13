"use client";

/**
 * TopBar.tsx
 * ──────────
 * Bar atas halaman pengaturan dengan:
 * - Tombol kembali (memunculkan dialog konfirmasi pembatalan)
 * - Logo NitroQuiz
 * - Logo GameForSmart
 *
 * Props:
 * - onBack: fungsi yang dipanggil saat tombol kembali diklik
 */

import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Logo } from "@/components/ui/logo";
import Image from "next/image";

interface TopBarProps {
  onBack: () => void;
}

export default function TopBar({ onBack }: TopBarProps) {
  return (
    <div className="w-full px-4 md:px-6 pt-4 pb-2 flex items-center justify-between">
      {/* Sisi kiri: tombol kembali & logo NitroQuiz */}
      <div className="flex items-center gap-3">
        {/* Tombol kembali dengan animasi masuk */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          className="p-3 bg-[#080d1a]/60 border border-[#2d6af2]/50 hover:bg-[#2d6af2]/20 hover:border-[#00ff9d] text-[#2d6af2] rounded-xl transition-all shadow-[0_0_15px_rgba(45,106,242,0.3)] flex items-center justify-center group"
          aria-label="Back to Host"
          onClick={onBack}
        >
          <ArrowLeft size={20} className="group-hover:text-white transition-colors" />
        </motion.button>

        {/* Logo NitroQuiz */}
        <Logo width={140} height={40} withText={false} animated={false} />
      </div>

      {/* Sisi kanan: logo GameForSmart */}
      <Image
        src="/assets/logo/logo2.png"
        alt="GameForSmart.com"
        width={240}
        height={60}
        className="object-contain opacity-70 hover:opacity-100 transition-opacity duration-300 drop-shadow-[0_0_10px_rgba(169,141,197,0.4)]"
      />
    </div>
  );
}
