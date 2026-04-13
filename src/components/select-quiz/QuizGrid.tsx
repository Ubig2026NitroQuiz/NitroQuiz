"use client";

/**
 * QuizGrid.tsx
 * ─────────────
 * Grid layout untuk menampilkan daftar kuis.
 * Menangani 3 kondisi tampilan:
 * 1. Loading/Skeleton — saat data sedang dimuat
 * 2. Grid kartu kuis — saat data tersedia
 * 3. Empty state — saat tidak ada kuis ditemukan
 *
 * Masing-masing tab (all, favorites, myquiz) memiliki
 * empty state dengan pesan dan aksi yang berbeda.
 *
 * Props:
 * - quizzes: daftar kuis yang akan ditampilkan
 * - isLoading: apakah sedang memuat data
 * - activeTab: tab aktif saat ini
 * - favorites: daftar ID kuis favorit
 * - isCreating: apakah sedang membuat session
 * - currentPage: halaman saat ini (untuk AnimatePresence key)
 * - onToggleFavorite: fungsi toggle favorit
 * - onOpenDetail: fungsi buka detail kuis
 * - onSelectQuiz: fungsi mulai kuis
 * - onTabChange: fungsi ganti tab
 * - onResetFilters: fungsi reset semua filter
 * - onRefresh: fungsi refresh data
 * - getCategoryDisplayName: fungsi nama tampilan kategori
 */

import { Search, Heart, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { QuizView, QuizTab } from "./types";
import QuizCard from "./QuizCard";

interface QuizGridProps {
  quizzes: QuizView[];
  isLoading: boolean;
  activeTab: QuizTab;
  favorites: string[];
  isCreating: boolean;
  currentPage: number;
  onToggleFavorite: (quizId: string, e: React.MouseEvent) => void;
  onOpenDetail: (quizId: string) => void;
  onSelectQuiz: (quizId: string) => void;
  onTabChange: (tab: QuizTab) => void;
  onResetFilters: () => void;
  onRefresh: () => void;
  getCategoryDisplayName: (cat: string) => string;
}

/** Komponen skeleton loading untuk satu kartu kuis */
function QuizCardSkeleton() {
  return (
    <div className="bg-[#080d1a]/80 border border-[#2d6af2]/15 rounded-xl overflow-hidden animate-pulse">
      <div className="h-1 w-full bg-[#2d6af2]/10" />
      <div className="w-full h-24 bg-gradient-to-br from-[#2d6af2]/10 to-[#04060f]" />
      <div className="p-2 space-y-1.5">
        <div className="h-3 bg-white/5 rounded w-3/4" />
        <div className="h-2 bg-white/5 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function QuizGrid({
  quizzes,
  isLoading,
  activeTab,
  favorites,
  isCreating,
  currentPage,
  onToggleFavorite,
  onOpenDetail,
  onSelectQuiz,
  onTabChange,
  onResetFilters,
  onRefresh,
  getCategoryDisplayName,
}: QuizGridProps) {
  const { t } = useTranslation();

  return (
    <AnimatePresence mode="wait">
      {/* ── Kondisi 1: Loading skeleton ── */}
      {isLoading ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <QuizCardSkeleton key={i} />
          ))}
        </motion.div>

      /* ── Kondisi 2: Grid kartu kuis ── */
      ) : quizzes.length > 0 ? (
        <motion.div
          key={`grid-${currentPage}-${activeTab}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
        >
          {quizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              isFavorited={favorites.includes(quiz.id)}
              isCreating={isCreating}
              onToggleFavorite={onToggleFavorite}
              onOpenDetail={onOpenDetail}
              onSelectQuiz={onSelectQuiz}
              getCategoryDisplayName={getCategoryDisplayName}
            />
          ))}
        </motion.div>

      /* ── Kondisi 3: Empty state ── */
      ) : (
        <motion.div
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="col-span-full py-20 text-center"
        >
          {/* Empty state untuk tab Favorit */}
          {activeTab === 'favorites' ? (
            <>
              <Heart className="h-16 w-16 mx-auto text-pink-500/20 mb-4" />
              <h3 className="text-xl text-white font-display uppercase tracking-widest mb-2">
                {t('select_quiz.empty_states.favorites_title')}
              </h3>
              <p className="text-pink-400/40 text-sm mb-6">
                {t('select_quiz.empty_states.favorites_desc')}
              </p>
              <Button
                variant="outline"
                onClick={() => onTabChange('all')}
                className="bg-pink-500/10 border border-pink-500/50 text-pink-400 hover:bg-pink-500 hover:text-white transition-all font-display text-xs uppercase tracking-wider"
              >
                {t('select_quiz.empty_states.browse_quizzes')}
              </Button>
            </>

          /* Empty state untuk tab Kuis Saya */
          ) : activeTab === 'myquiz' ? (
            <>
              <FileText className="h-16 w-16 mx-auto text-[#00ff9d]/20 mb-4" />
              <h3 className="text-xl text-white font-display uppercase tracking-widest mb-2">
                {t('select_quiz.empty_states.myquiz_title')}
              </h3>
              <p className="text-[#00ff9d]/40 text-sm mb-6">
                {t('select_quiz.empty_states.myquiz_desc')}
              </p>
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={onRefresh}
                  className="bg-white/[0.03] border border-[#00ff9d]/50 text-[#00ff9d] hover:bg-[#00ff9d]/20 transition-all font-display text-xs uppercase tracking-wider"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t('select_quiz.empty_states.refresh')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onTabChange('all')}
                  className="bg-[#00ff9d]/10 border border-[#00ff9d]/50 text-[#00ff9d] hover:bg-[#00ff9d] hover:text-[#04060f] transition-all font-display text-xs uppercase tracking-wider"
                >
                  {t('select_quiz.empty_states.browse_all')}
                </Button>
              </div>
            </>

          /* Empty state untuk tab Semua (pencarian kosong) */
          ) : (
            <>
              <Search className="h-16 w-16 mx-auto text-[#2d6af2]/20 mb-4" />
              <h3 className="text-xl text-white font-display uppercase tracking-widest mb-2">
                {t('select_quiz.empty_states.search_title')}
              </h3>
              <p className="text-[#2d6af2]/40 text-sm mb-6">
                {t('select_quiz.empty_states.search_desc')}
              </p>
              <Button
                variant="outline"
                onClick={onResetFilters}
                className="bg-[#2d6af2]/10 border border-[#2d6af2]/50 text-[#2d6af2] hover:bg-[#2d6af2] hover:text-white transition-all font-display text-xs uppercase tracking-wider"
              >
                {t('select_quiz.empty_states.reset_filters')}
              </Button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
