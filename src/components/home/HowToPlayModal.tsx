"use client";

/**
 * HowToPlayModal.tsx
 * ──────────────────
 * Modal popup yang menampilkan panduan cara bermain NitroQuiz.
 * Terdiri dari 4 langkah yang ditampilkan dalam daftar animasi:
 * 1. Masuk ke permainan
 * 2. Jawab pertanyaan
 * 3. Bermain bersama teman
 * 4. Menangkan balapan
 *
 * Props:
 * - isOpen: mengontrol visibilitas modal
 * - onClose: fungsi untuk menutup modal
 */

import { Zap, Users, Trophy, Target, Flag, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { getI18nInstance } from "@/lib/i18n";
import { ReactNode } from "react";

/** Tipe data untuk setiap langkah panduan */
interface HowToPlayStep {
  icon: ReactNode;
  title: string;
  desc: string;
  color: string;
  bg: string;
}

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  const { t } = useTranslation();
  const i18n = getI18nInstance();

  /** Data langkah-langkah cara bermain dengan ikon, warna, dan terjemahan */
  const steps: HowToPlayStep[] = [
    {
      icon: <Zap className="w-4 h-4" />,
      title: t('homepage.how_to_play.step1.title'),
      desc: t('homepage.how_to_play.step1.desc'),
      color: "text-[#a78bfa]",
      bg: "bg-[#7C3AED]/[0.08] border-[#7C3AED]/[0.15]",
    },
    {
      icon: <Target className="w-4 h-4" />,
      title: t('homepage.how_to_play.step2.title'),
      desc: t('homepage.how_to_play.step2.desc'),
      color: "text-[#2d6af2]",
      bg: "bg-[#2d6af2]/[0.06] border-[#2d6af2]/[0.12]",
    },
    {
      icon: <Users className="w-4 h-4" />,
      title: t('homepage.how_to_play.step3.title'),
      desc: t('homepage.how_to_play.step3.desc'),
      color: "text-amber-400",
      bg: "bg-amber-400/[0.06] border-amber-400/[0.12]",
    },
    {
      icon: <Trophy className="w-4 h-4" />,
      title: t('homepage.how_to_play.step4.title'),
      desc: t('homepage.how_to_play.step4.desc'),
      color: "text-emerald-400",
      bg: "bg-emerald-400/[0.06] border-emerald-400/[0.12]",
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* ── Konten modal utama ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 150 }}
            className="w-full max-w-lg bg-[#0c1020]/98 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Garis aksen gradien di atas modal */}
            <div className="h-[2px] bg-gradient-to-r from-transparent via-[#7C3AED] to-transparent"></div>

            {/* ── Header modal ── */}
            <div className="p-6 pb-4 flex items-center justify-between border-b border-white/[0.05]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#7C3AED]/10 border border-[#7C3AED]/20">
                  <Flag className="w-4 h-4 text-[#a78bfa]" />
                </div>
                <h2 className="text-lg font-bold uppercase tracking-wider text-white">
                  {t('homepage.how_to_play.title')}
                </h2>
              </div>
              {/* Tombol tutup modal */}
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/[0.05] text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Daftar langkah-langkah cara bermain ── */}
            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i18n.language === 'ar' ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border ${step.bg} transition-all`}
                >
                  {/* Ikon langkah */}
                  <div
                    className={`flex-shrink-0 p-1.5 rounded-lg ${step.bg} ${step.color}`}
                  >
                    {step.icon}
                  </div>

                  {/* Konten langkah */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-bold tracking-[0.15em] text-white/30 uppercase">
                        Step {i + 1}
                      </span>
                    </div>
                    <h3
                      className={`font-bold text-sm uppercase tracking-wide mb-0.5 ${step.color}`}
                    >
                      {step.title}
                    </h3>
                    <p className="text-white/40 text-xs leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ── Footer dengan tombol aksi ── */}
            <div className="p-6 pt-4 border-t border-white/[0.05]">
              <button
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-[#7C3AED] to-[#2d6af2] text-white font-bold text-xs tracking-[0.15em] uppercase rounded-xl hover:shadow-[0_0_30px_rgba(124,58,237,0.3)] transition-all active:scale-[0.98]"
              >
                {t('homepage.how_to_play.button')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
