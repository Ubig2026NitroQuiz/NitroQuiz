"use client";

/**
 * QuizDetailDialog.tsx
 * ────────────────────
 * Dialog popup untuk menampilkan detail lengkap suatu kuis.
 *
 * Informasi yang ditampilkan:
 * - Kategori, judul, dan deskripsi kuis
 * - Jumlah pertanyaan
 * - Jumlah kali dimainkan
 * - Jumlah favorit
 * - Bahasa kuis
 * - Tombol Batal dan Mulai
 *
 * Props:
 * - quizDetail: data detail kuis (null jika dialog tertutup)
 * - isLoading: apakah sedang memuat data detail
 * - isCreating: apakah sedang membuat session
 * - isDescriptionExpanded: apakah deskripsi diperluas
 * - onToggleDescription: fungsi toggle deskripsi
 * - onClose: fungsi untuk menutup dialog
 * - onStart: fungsi untuk memulai kuis
 * - getCategoryDisplayName: fungsi nama tampilan kategori
 */

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { HelpCircle, Play, Heart, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

interface QuizDetailDialogProps {
  quizDetail: any | null;
  isLoading: boolean;
  isCreating: boolean;
  isDescriptionExpanded: boolean;
  onToggleDescription: () => void;
  onClose: () => void;
  onStart: (quizId: string) => void;
  getCategoryDisplayName: (cat: string) => string;
}

/**
 * Menghitung jumlah favorit dari data kuis.
 * Data favorit bisa berupa string JSON atau array.
 */
function getFavoriteCount(favorite: any): number {
  try {
    const favs = typeof favorite === 'string'
      ? JSON.parse(favorite)
      : favorite;
    return Array.isArray(favs) ? favs.length : 0;
  } catch {
    return 0;
  }
}

/**
 * Menghitung jumlah pertanyaan dari data kuis.
 * Data pertanyaan bisa berupa string JSON atau array.
 */
function getQuestionCount(questions: any): number {
  if (typeof questions === 'string') {
    try { return JSON.parse(questions).length; } catch { return 0; }
  }
  return Array.isArray(questions) ? questions.length : 0;
}

export default function QuizDetailDialog({
  quizDetail,
  isLoading,
  isCreating,
  isDescriptionExpanded,
  onToggleDescription,
  onClose,
  onStart,
  getCategoryDisplayName,
}: QuizDetailDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={!!quizDetail || isLoading}
      onOpenChange={(open) => { if (!open) onClose(); }}
    >
      <DialogContent className="bg-[#080d1a] border border-[#2d6af2]/30 text-white backdrop-blur-xl p-0 overflow-hidden max-w-lg shadow-2xl rounded-xl">
        {/* ── Kondisi loading: spinner ── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <div className="w-10 h-10 border-2 border-[#2d6af2]/30 border-t-[#00ff9d] rounded-full animate-spin" />
            <p className="font-display text-[10px] uppercase tracking-widest text-gray-500">Loading...</p>
          </div>

        /* ── Konten detail kuis ── */
        ) : quizDetail && (
          <div className="flex flex-col">
            {/* ── Header: kategori, judul, deskripsi ── */}
            <div className="p-6 pb-4 border-b border-white/5">
              {/* Badge kategori */}
              <span className="text-[9px] font-display font-bold uppercase tracking-[0.2em] text-[#00ff9d] mb-2 block">
                {getCategoryDisplayName(quizDetail.category)}
              </span>

              {/* Judul kuis */}
              <DialogTitle className="text-xl font-display font-bold uppercase tracking-wide text-white leading-tight">
                {quizDetail.title}
              </DialogTitle>

              {/* Deskripsi dengan toggle expand/collapse */}
              <div className="mt-3">
                <p className={`text-gray-400 text-xs font-body leading-relaxed transition-all duration-300 ${isDescriptionExpanded ? '' : 'line-clamp-1'}`}>
                  {quizDetail.description || t('select_quiz.detail.no_description')}
                </p>
                {(quizDetail.description && quizDetail.description.length > 80) && (
                  <button
                    onClick={onToggleDescription}
                    className="text-[#00ff9d] text-[10px] font-display uppercase tracking-widest mt-2 hover:underline focus:outline-none"
                  >
                    {isDescriptionExpanded ? t('select_quiz.detail.show_less') : t('select_quiz.detail.show_more')}
                  </button>
                )}
              </div>
            </div>

            {/* ── Grid statistik: 4 kotak info ── */}
            <div className="px-6 py-4 grid grid-cols-2 gap-4">
              {/* Jumlah pertanyaan */}
              <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 p-3 rounded-xl hover:bg-white/[0.05] transition-all">
                <HelpCircle size={14} className="text-[#2d6af2]" />
                <div className="flex flex-col">
                  <span className="text-[8px] text-gray-500 uppercase tracking-widest font-display">
                    {t('select_quiz.detail.questions')}
                  </span>
                  <span className="text-[12px] font-display font-bold text-white">
                    {getQuestionCount(quizDetail.questions)} {t('select_quiz.detail.qs_suffix')}
                  </span>
                </div>
              </div>

              {/* Jumlah kali dimainkan */}
              <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 p-3 rounded-xl hover:bg-white/[0.05] transition-all">
                <Play size={14} className="text-[#00ff9d]" />
                <div className="flex flex-col">
                  <span className="text-[8px] text-gray-500 uppercase tracking-widest font-display">
                    {t('select_quiz.detail.played')}
                  </span>
                  <span className="text-[12px] font-display font-bold text-white">
                    {quizDetail.played || 0} {t('select_quiz.detail.play_suffix')}
                  </span>
                </div>
              </div>

              {/* Jumlah favorit */}
              <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 p-3 rounded-xl hover:bg-white/[0.05] transition-all">
                <Heart size={14} className="text-pink-500" />
                <div className="flex flex-col">
                  <span className="text-[8px] text-gray-500 uppercase tracking-widest font-display">
                    {t('select_quiz.detail.favorites')}
                  </span>
                  <span className="text-[12px] font-display font-bold text-white">
                    {getFavoriteCount(quizDetail.favorite)} {t('select_quiz.detail.fav_suffix')}
                  </span>
                </div>
              </div>

              {/* Bahasa kuis */}
              <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 p-3 rounded-xl hover:bg-white/[0.05] transition-all">
                <Languages size={14} className="text-purple-500" />
                <div className="flex flex-col">
                  <span className="text-[8px] text-gray-500 uppercase tracking-widest font-display">
                    {t('select_quiz.detail.language')}
                  </span>
                  <span className="text-[12px] font-display font-bold text-white uppercase">
                    {quizDetail.language || 'ID'}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Footer: tombol Batal & Mulai ── */}
            <div className="p-6 pt-2 flex items-center justify-between gap-4">
              <button
                onClick={onClose}
                className="px-6 py-3 font-display text-[10px] tracking-widest uppercase text-gray-500 hover:text-white transition-all bg-white/5 rounded-xl border border-white/10"
              >
                {t('select_quiz.detail.cancel')}
              </button>
              <button
                onClick={() => {
                  const qid = quizDetail.id;
                  onClose();
                  onStart(qid);
                }}
                disabled={isCreating}
                className="px-12 py-3 text-[#04060f] font-display text-[11px] font-bold tracking-widest uppercase rounded-xl transition-all duration-300 bg-[#00ff9d] hover:shadow-[0_0_20px_rgba(0,255,157,0.4)] disabled:opacity-50"
              >
                {t('select_quiz.detail.start')}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
