/**
 * =====================================================
 * KOMPONEN: QuizImageZoomModal - Modal Zoom Gambar
 * =====================================================
 * Modal fullscreen untuk memperbesar gambar soal/opsi.
 * Mendukung tutup via klik backdrop atau tombol Escape.
 * =====================================================
 */
'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuizImageZoomModalProps {
    /** URL gambar yang sedang di-zoom (null = modal tertutup) */
    zoomedImage: string | null;
    /** Handler untuk menutup modal */
    onClose: () => void;
}

/**
 * Modal overlay fullscreen untuk menampilkan gambar dalam ukuran besar.
 * Fitur:
 * - Animasi fade in/out
 * - Animasi scale pada gambar
 * - Tutup dengan klik di luar gambar
 * - Tutup dengan tombol Escape
 * - ClipPath styling konsisten dengan tema
 */
export function QuizImageZoomModal({ zoomedImage, onClose }: QuizImageZoomModalProps) {
    // Listener tombol Escape untuk menutup modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <AnimatePresence>
            {zoomedImage && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 cursor-pointer"
                    onClick={onClose}
                >
                    {/* Gambar yang di-zoom dengan animasi scale */}
                    <motion.img
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        src={zoomedImage}
                        alt="Zoomed"
                        className="max-w-full max-h-full object-contain border border-white/10"
                        style={{
                            clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
