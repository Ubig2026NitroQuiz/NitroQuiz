/**
 * ImageZoomModal.tsx — Modal zoom gambar kuis
 * ═══════════════════════════════════════════
 *
 * Modal fullscreen untuk memperbesar gambar soal/opsi.
 * - Klik area gelap atau tekan Escape untuk menutup
 * - Klik gambar tidak menutup modal (stopPropagation)
 */

'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ════════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════════

interface ImageZoomModalProps {
  /** URL gambar yang sedang di-zoom (null = modal tertutup) */
  imageUrl: string | null;
  /** Callback untuk menutup modal */
  onClose: () => void;
}

// ════════════════════════════════════════════════════════════════
// KOMPONEN
// ════════════════════════════════════════════════════════════════

export function ImageZoomModal({ imageUrl, onClose }: ImageZoomModalProps) {
  // ── Tutup modal dengan tombol Escape ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <AnimatePresence>
      {imageUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black z-[9999] flex items-center justify-center p-4 cursor-pointer"
          onClick={onClose}
        >
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            src={imageUrl}
            alt="Zoomed"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
