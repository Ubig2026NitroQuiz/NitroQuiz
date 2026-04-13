/**
 * QuizOptionCard.tsx — Kartu opsi jawaban kuis
 * ══════════════════════════════════════════════
 *
 * Satu kartu pilihan jawaban dengan:
 * - Label huruf berwarna (A, B, C, D)
 * - Gambar opsional (klik untuk zoom)
 * - Animasi hover & tap (framer-motion)
 */

'use client';

import { motion } from 'framer-motion';
import { OPTION_COLORS } from './types';

// ════════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════════

interface QuizOptionCardProps {
  /** Indeks opsi dalam array (0-based) */
  index: number;
  /** Teks jawaban */
  text: string;
  /** URL gambar opsional */
  image?: string;
  /** Apakah opsi ini yang dipilih pemain */
  isSelected: boolean;
  /** Apakah soal sudah dijawab (disable klik) */
  isAnswered: boolean;
  /** Key unik untuk animasi (kombinasi soal + opsi) */
  animationKey: string;
  /** Callback saat opsi diklik */
  onSelect: () => void;
  /** Callback saat gambar diklik untuk zoom */
  onImageZoom: (imageUrl: string) => void;
}

// ════════════════════════════════════════════════════════════════
// KOMPONEN
// ════════════════════════════════════════════════════════════════

export function QuizOptionCard({
  index, text, image, isSelected, isAnswered, animationKey, onSelect, onImageZoom,
}: QuizOptionCardProps) {
  /** Warna badge berdasarkan urutan (A=biru, B=amber, C=merah, D=ungu) */
  const optionColor = OPTION_COLORS[index] || OPTION_COLORS[0];
  /** Huruf label (A, B, C, D, ...) */
  const letter = String.fromCharCode(65 + index);
  const hasImage = !!image;

  return (
    <motion.button
      key={animationKey}
      whileHover={!isAnswered ? { scale: 1.01, backgroundColor: 'rgba(255,255,255,0.02)' } : {}}
      whileTap={!isAnswered ? { scale: 0.98 } : {}}
      onClick={onSelect}
      disabled={isAnswered}
      className={`w-full group relative rounded-2xl border text-left flex flex-col overflow-hidden transition-all duration-300 ${
        isSelected
          ? 'bg-white/5 border-white/20 shadow-lg'
          : 'bg-white/[0.01] border-white/[0.03] hover:border-white/10'
      }`}
    >
      {/* ── Gambar opsi (jika ada) ── */}
      {hasImage && (
        <div
          className="w-full h-24 sm:h-32 md:h-40 overflow-hidden bg-black/20 border-b border-white/5 cursor-zoom-in"
          onClick={(e) => { e.stopPropagation(); onImageZoom(image!); }}
        >
          <img
            src={image}
            alt={`Option ${letter}`}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      )}

      {/* ── Label huruf + teks jawaban ── */}
      <div className="flex items-center gap-3 md:gap-4 p-3 md:p-5 flex-1 w-full">
        <div
          className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center font-black text-sm md:text-lg flex-shrink-0 text-white shadow-lg relative z-10"
          style={{ backgroundColor: optionColor }}
        >
          {letter}
        </div>
        <span className={`text-xs md:text-lg font-bold flex-1 tracking-tight leading-snug ${
          isSelected ? 'text-white' : 'text-gray-200'
        }`}>
          {text}
        </span>
      </div>
    </motion.button>
  );
}
