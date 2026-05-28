/**
 * ============================================================================
 *  KOMPONEN: HOW TO PLAY MODAL
 * ============================================================================
 *
 *  Modal yang menampilkan panduan langkah-langkah cara bermain NitroQuiz.
 *  Ditampilkan saat pengguna menekan tombol "How to Play" di dropdown menu.
 *
 *  Fitur:
 *  - Animasi masuk/keluar dengan framer-motion
 *  - 4 langkah bermain dengan ikon, warna, dan deskripsi
 *  - Scrollable jika konten melebihi 60% tinggi layar
 *  - Bisa ditutup dengan klik backdrop atau tombol X
 * ============================================================================
 */

import React from "react";
import { Flag, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { HOW_TO_PLAY_STEPS } from "../constants";

interface HowToPlayModalProps {
    /** Apakah modal sedang ditampilkan */
    isOpen: boolean;
    /** Handler untuk menutup modal */
    onClose: () => void;
    /** Fungsi terjemahan i18n */
    t: (key: string) => string;
    /** Instance i18n untuk cek arah bahasa (RTL) */
    i18n: any;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
    isOpen, onClose, t, i18n,
}) => {
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
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.3, type: "spring", stiffness: 150 }}
                        className="w-full max-w-lg bg-[#0c1020]/98 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Garis dekoratif atas */}
                        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#7C3AED] to-transparent"></div>

                        {/* Header Modal */}
                        <div className="p-6 pb-4 flex items-center justify-between border-b border-white/[0.05]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-[#7C3AED]/10 border border-[#7C3AED]/20">
                                    <Flag className="w-4 h-4 text-[#a78bfa]" />
                                </div>
                                <h2 className="text-lg font-bold uppercase tracking-wider text-white">
                                    {t('homepage.how_to_play.title')}
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-white/[0.05] text-white/40 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Konten Langkah-langkah */}
                        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                            {HOW_TO_PLAY_STEPS.map((step, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: i18n.language === 'ar' ? 10 : -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                    className={`flex items-start gap-3 p-3.5 rounded-xl border ${step.bg} transition-all`}
                                >
                                    <div className={`flex-shrink-0 p-1.5 rounded-lg ${step.bg} ${step.color}`}>
                                        {step.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-[9px] font-bold tracking-[0.15em] text-white/30 uppercase">Step {i + 1}</span>
                                        </div>
                                        <h3 className={`font-bold text-sm uppercase tracking-wide mb-0.5 ${step.color}`}>{t(step.titleKey)}</h3>
                                        <p className="text-white/40 text-xs leading-relaxed">{t(step.descKey)}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Footer dengan tombol tutup */}
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
};
