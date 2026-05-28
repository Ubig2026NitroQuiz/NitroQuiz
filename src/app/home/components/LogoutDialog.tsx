/**
 * ============================================================================
 *  KOMPONEN: LOGOUT DIALOG
 * ============================================================================
 *
 *  Dialog konfirmasi logout dengan desain racing theme.
 *  Ditampilkan saat pengguna menekan tombol "Logout" di dropdown menu.
 *
 *  Fitur:
 *  - Animasi masuk/keluar dengan framer-motion
 *  - Dua tombol aksi: Batal dan Konfirmasi Logout
 *  - Efek visual merah (warning) sesuai tema racing
 * ============================================================================
 */

import React from "react";
import { LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LogoutDialogProps {
    /** Apakah dialog sedang ditampilkan */
    isOpen: boolean;
    /** Handler untuk menutup dialog (batal) */
    onClose: () => void;
    /** Handler untuk mengeksekusi logout */
    onConfirm: () => void;
    /** Fungsi terjemahan i18n */
    t: (key: string) => string;
}

export const LogoutDialog: React.FC<LogoutDialogProps> = ({
    isOpen, onClose, onConfirm, t,
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 15 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        className="bg-[#0a0a0f] border-2 border-red-500/40 p-10 max-w-sm w-full shadow-[0_0_50px_rgba(239,68,68,0.2)] overflow-hidden relative transform -skew-x-[2deg] rounded-none"
                    >
                        <div className="transform skew-x-[2deg] flex flex-col items-center text-center">
                            {/* Ikon logout */}
                            <div className="w-16 h-16 bg-red-500/10 rounded-sm flex items-center justify-center mb-6 border border-red-500/20 transform -skew-x-[15deg]">
                                <div className="transform skew-x-[15deg]">
                                    <LogOut className="w-7 h-7 text-red-500" />
                                </div>
                            </div>

                            {/* Judul dialog */}
                            <h3 className="text-2xl font-display font-black text-white uppercase tracking-[0.1em] mb-3 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                                {t("homepage.logout_confirm.title")}?
                            </h3>

                            {/* Deskripsi */}
                            <p className="text-white/40 text-xs font-display tracking-widest mb-10 uppercase leading-relaxed">
                                {t("homepage.logout_confirm.description")}
                            </p>

                            {/* Tombol Aksi */}
                            <div className="flex gap-4 w-full">
                                {/* Tombol Batal */}
                                <button
                                    onClick={onClose}
                                    className="group/btn flex-1 flex items-center justify-center border border-white/20 h-11 relative overflow-hidden transform -skew-x-[15deg] transition-all hover:bg-white/5"
                                >
                                    <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                                    <span className="relative z-10 font-display font-black uppercase text-[10px] tracking-widest text-gray-400 group-hover/btn:text-white transform skew-x-[15deg]">
                                        {t("homepage.logout_confirm.cancel")}
                                    </span>
                                </button>

                                {/* Tombol Konfirmasi Logout */}
                                <button
                                    onClick={onConfirm}
                                    className="group/btn flex-1 flex items-center justify-center bg-red-600 border border-red-400/50 h-11 relative overflow-hidden transform -skew-x-[15deg] transition-all hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                                >
                                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                                    <span className="relative z-10 font-display font-black uppercase text-[10px] tracking-widest text-white transform skew-x-[15deg]">
                                        {t("homepage.logout_confirm.confirm")}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
