"use client";

/**
 * QuizCard.tsx
 * ────────────
 * Kartu individual untuk menampilkan satu kuis dalam grid.
 *
 * Fitur:
 * - Gambar latar belakang kuis (jika ada)
 * - Badge kategori dengan warna sesuai kategori
 * - Tombol favorit dengan animasi
 * - Tombol mulai permainan
 * - Efek hover: garis glow, overlay gradien, perubahan warna border
 *
 * Props:
 * - quiz: data kuis yang ditampilkan
 * - isFavorited: apakah kuis ini di-favorit-kan oleh pengguna
 * - isCreating: apakah sedang proses membuat session
 * - onToggleFavorite: fungsi toggle favorit
 * - onOpenDetail: fungsi untuk membuka dialog detail
 * - onSelectQuiz: fungsi untuk langsung memilih dan mulai kuis
 * - getCategoryDisplayName: fungsi untuk nama tampilan kategori
 */

import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, HelpCircle, Play } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { QuizView } from "./types";
import { getCategoryColor } from "./constants";

interface QuizCardProps {
  quiz: QuizView;
  isFavorited: boolean;
  isCreating: boolean;
  onToggleFavorite: (quizId: string, e: React.MouseEvent) => void;
  onOpenDetail: (quizId: string) => void;
  onSelectQuiz: (quizId: string) => void;
  getCategoryDisplayName: (cat: string) => string;
}

export default function QuizCard({
  quiz,
  isFavorited,
  isCreating,
  onToggleFavorite,
  onOpenDetail,
  onSelectQuiz,
  getCategoryDisplayName,
}: QuizCardProps) {
  const { t } = useTranslation();
  const colors = getCategoryColor(quiz.category);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.01 }}
      className="cursor-pointer"
      onClick={() => onOpenDetail(quiz.id)}
      style={{ willChange: "transform, opacity" }}
    >
      <Card
        className="h-full flex flex-col bg-black/40 border transition-all duration-200 relative overflow-hidden group rounded-xl pb-0"
        style={{ borderColor: 'rgba(74,61,143,0.3)' }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = colors.hoverBorder)}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(74,61,143,0.3)')}
      >
        {/* ── Garis aksen berwarna di atas kartu ── */}
        <div
          className="absolute top-0 inset-x-0 h-[4px] z-20 pointer-events-none"
          style={{ background: colors.bar }}
        />

        {/* ── Garis glow di bawah saat hover ── */}
        <div
          className="absolute inset-x-0 bottom-0 h-px pointer-events-none z-10 transition-opacity opacity-0 group-hover:opacity-100"
          style={{ background: `linear-gradient(to right, transparent, ${colors.bar}, transparent)` }}
        />

        {/* ── Overlay gradien saat hover ── */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
          style={{ background: `linear-gradient(135deg, ${colors.badge} 0%, transparent 60%)` }}
        />

        {/* ── Gambar latar belakang kuis ── */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {quiz.imageUrl && (
            <div
              className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity"
              style={{ backgroundImage: `url(${quiz.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-black/80" />
        </div>

        {/* ── Tombol favorit ── */}
        <button
          onClick={(e) => onToggleFavorite(quiz.id, e)}
          className={`absolute top-4 right-3 z-30 p-2 rounded-full transition-all duration-200 backdrop-blur-sm ${
            isFavorited
              ? 'bg-pink-500/30 border border-pink-500/50 text-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.4)] hover:bg-pink-500/50'
              : 'bg-black/50 border border-white/10 text-gray-500 hover:text-pink-400 hover:border-pink-500/30 hover:bg-pink-500/10'
          }`}
        >
          <Heart size={14} className={isFavorited ? 'fill-pink-400' : ''} />
        </button>

        {/* ── Konten kartu: badge kategori & judul ── */}
        <CardHeader className="pb-1.5 relative z-20 flex-1 flex flex-col pt-2">
          {/* Badge kategori */}
          <div className="flex items-start mb-1 pr-10">
            <div
              className="px-1.5 py-[1px] rounded text-[7px] font-display font-bold uppercase tracking-wider backdrop-blur-sm shadow-sm"
              style={{
                background: colors.badge,
                border: `1px solid ${colors.badgeBorder}`,
                color: colors.badgeText,
              }}
            >
              {getCategoryDisplayName(quiz.category)}
            </div>
          </div>

          {/* Judul kuis */}
          <CardTitle
            className="text-xs text-white font-display uppercase tracking-wide leading-tight transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] line-clamp-1"
            style={{ color: '#fff' }}
            onMouseEnter={e => (e.currentTarget.style.color = colors.badgeText)}
            onMouseLeave={e => (e.currentTarget.style.color = '#fff')}
            title={quiz.title}
          >
            {quiz.title}
          </CardTitle>
        </CardHeader>

        {/* ── Footer: jumlah soal & tombol mulai ── */}
        <CardFooter className="mt-auto !pt-2 !pb-2 px-3 border-t border-white/5 flex justify-between items-center text-[8px] text-gray-400 font-display tracking-wider relative z-20 bg-black/40 backdrop-blur-sm">
          {/* Jumlah pertanyaan */}
          <div className="flex items-center gap-4 drop-shadow-md">
            <div className="flex items-center gap-1.5">
              <HelpCircle size={14} style={{ color: colors.bar }} />
              {quiz.questionCount} Qs
            </div>
          </div>

          {/* Tombol mulai */}
          <button
            onClick={(e) => { e.stopPropagation(); onSelectQuiz(quiz.id); }}
            disabled={isCreating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-white font-display text-[9px] tracking-widest uppercase rounded-lg transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(135deg, ${colors.bar}, ${colors.badgeText})`,
              boxShadow: `0 0 12px ${colors.badge}`,
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 0 22px ${colors.badgeBorder}`)}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 0 12px ${colors.badge}`)}
          >
            <Play size={12} className="fill-white" />
            {t('select_quiz.start_button')}
          </button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
