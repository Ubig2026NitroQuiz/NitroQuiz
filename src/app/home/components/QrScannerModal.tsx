/**
 * ============================================================================
 *  KOMPONEN: QR SCANNER MODAL
 * ============================================================================
 *
 *  Modal pemindai QR Code untuk bergabung ke room secara cepat.
 *  Menggunakan kamera perangkat untuk memindai kode QR.
 *
 *  Fitur:
 *  - Animasi masuk/keluar dengan framer-motion
 *  - Scanner QR real-time menggunakan @yudiel/react-qr-scanner
 *  - Overlay target scanner di atas preview kamera
 *  - Mendukung URL join (/join/KODE) maupun teks biasa
 *  - Bisa ditutup dengan klik backdrop atau tombol X
 * ============================================================================
 */

import React from "react";
import { QrCode, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

// Lazy load scanner agar tidak mengganggu SSR
const Scanner = dynamic(
    () => import("@yudiel/react-qr-scanner").then((mod) => mod.Scanner),
    { ssr: false }
);

interface QrScannerModalProps {
    /** Apakah modal scanner sedang ditampilkan */
    isOpen: boolean;
    /** Handler untuk menutup modal */
    onClose: () => void;
    /** Handler saat QR berhasil dipindai */
    onScan: (result: any[]) => void;
    /** Fungsi terjemahan i18n */
    t: (...args: any[]) => string;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
    isOpen, onClose, onScan, t,
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
                        className="w-full max-w-sm bg-[#0c1020]/98 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Garis dekoratif atas */}
                        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#2d6af2] to-transparent"></div>

                        {/* Header Modal */}
                        <div className="p-4 flex items-center justify-between border-b border-white/[0.05]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-[#2d6af2]/10 border border-[#2d6af2]/20">
                                    <QrCode className="w-4 h-4 text-[#5a9cff]" />
                                </div>
                                <h2 className="text-lg font-bold uppercase tracking-wider text-white">
                                    Scan QR Code
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-white/[0.05] text-white/40 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Area Scanner */}
                        <div className="p-4 flex justify-center bg-black/50">
                            <div className="w-full aspect-square max-w-[300px] overflow-hidden rounded-xl border border-white/10 relative">
                                <Scanner
                                    onScan={onScan}
                                    onError={(error: any) => console.log(error)}
                                    components={{ audio: false, finder: false } as any}
                                />
                                {/* Overlay target scanner — bingkai sudut */}
                                <div className="absolute inset-0 pointer-events-none border-[3px] border-[#2d6af2]/50 m-8 rounded-lg z-10 flex items-center justify-center">
                                    <div className="w-full h-full relative">
                                        <div className="absolute top-0 left-0 w-4 h-4 border-t-[3px] border-l-[3px] border-[#5a9cff] -mt-[3px] -ml-[3px]" />
                                        <div className="absolute top-0 right-0 w-4 h-4 border-t-[3px] border-r-[3px] border-[#5a9cff] -mt-[3px] -mr-[3px]" />
                                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-[3px] border-l-[3px] border-[#5a9cff] -mb-[3px] -ml-[3px]" />
                                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-[3px] border-r-[3px] border-[#5a9cff] -mb-[3px] -mr-[3px]" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Petunjuk penggunaan */}
                        <div className="p-4 text-center text-white/50 text-xs font-medium tracking-widest uppercase border-t border-white/[0.05]">
                            {t('homepage.scan_qr_hint', 'Point camera at the QR Code')}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
