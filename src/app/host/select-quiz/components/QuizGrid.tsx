/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KOMPONEN: QuizGrid
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Grid utama yang menampilkan daftar quiz dalam 3 kondisi:
 * 1. Loading (skeleton cards)
 * 2. Ada data (grid kartu quiz)
 * 3. Kosong (pesan empty state sesuai tab aktif)
 */

"use client";

import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Heart, FileText, RefreshCw } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import type { QuizView, QuizTab } from "../types";
import { getCategoryColor } from "../constants";
import { QuizCard } from "./QuizCard";

interface QuizGridProps {
    // Data
    quizzes: QuizView[];
    favorites: string[];
    activeTab: QuizTab;
    currentPage: number;

    // Status loading
    isFetching: boolean;
    isReturning: boolean;
    creating: boolean;

    // Tooltip
    hoveredTooltipId: string | null;
    setHoveredTooltipId: (id: string | null) => void;

    // Aksi
    onToggleFavorite: (quizId: string, e: React.MouseEvent) => void;
    onOpenDetail: (quizId: string) => void;
    onSelectQuiz: (quizId: string) => void;
    onResetFilters: () => void;
    onBrowseAll: () => void;
    onRefresh: () => void;

    // Utilitas
    getCategoryDisplayName: (cat: string) => string;
    t: (key: string) => string;
}

export function QuizGrid({
    quizzes, favorites, activeTab, currentPage,
    isFetching, isReturning, creating,
    hoveredTooltipId, setHoveredTooltipId,
    onToggleFavorite, onOpenDetail, onSelectQuiz,
    onResetFilters, onBrowseAll, onRefresh,
    getCategoryDisplayName, t,
}: QuizGridProps) {
    const isLoading = isFetching || isReturning || creating;

    return (
        <TooltipProvider delayDuration={100}>
            <AnimatePresence mode="wait">
                {isLoading ? (
                    <SkeletonGrid />
                ) : quizzes.length > 0 ? (
                    <QuizCardGrid
                        quizzes={quizzes}
                        favorites={favorites}
                        currentPage={currentPage}
                        activeTab={activeTab}
                        creating={creating}
                        hoveredTooltipId={hoveredTooltipId}
                        setHoveredTooltipId={setHoveredTooltipId}
                        onToggleFavorite={onToggleFavorite}
                        onOpenDetail={onOpenDetail}
                        onSelectQuiz={onSelectQuiz}
                        getCategoryDisplayName={getCategoryDisplayName}
                        t={t}
                    />
                ) : (
                    <EmptyState
                        activeTab={activeTab}
                        onBrowseAll={onBrowseAll}
                        onResetFilters={onResetFilters}
                        onRefresh={onRefresh}
                        t={t}
                    />
                )}
            </AnimatePresence>
        </TooltipProvider>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: SkeletonGrid (Tampilan loading)
// ═══════════════════════════════════════════════════════════════════════════

function SkeletonGrid() {
    return (
        <motion.div
            key="skeleton"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
        >
            {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="h-full flex flex-col bg-[#161c33]/50 border-t border-t-white/10 border border-white/5 rounded-xl pb-0 shadow-lg animate-pulse overflow-hidden">
                    <CardHeader className="p-3 pb-1 flex flex-col">
                        <div className="w-24 h-[11px] bg-white/10 rounded-sm transform -skew-x-[15deg] mb-1.5"></div>
                        <div className="space-y-2 mt-1 mb-2">
                            <div className="w-[85%] h-3 bg-white/20 rounded-sm"></div>
                            <div className="w-[50%] h-3 bg-white/10 rounded-sm"></div>
                        </div>
                    </CardHeader>
                    <CardFooter className="p-3 border-t border-white/5 flex justify-between items-end mt-auto bg-gradient-to-t from-[#0c1020]/50 to-transparent">
                        <div className="flex flex-col gap-2">
                            <div className="w-14 h-2 bg-white/10 rounded-sm"></div>
                            <div className="w-8 h-3 bg-white/20 rounded-sm"></div>
                        </div>
                        <div className="w-16 h-8 bg-white/10 rounded-sm transform -skew-x-[15deg]"></div>
                    </CardFooter>
                </Card>
            ))}
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: QuizCardGrid (Grid kartu quiz yang sebenarnya)
// ═══════════════════════════════════════════════════════════════════════════

interface QuizCardGridProps {
    quizzes: QuizView[];
    favorites: string[];
    currentPage: number;
    activeTab: QuizTab;
    creating: boolean;
    hoveredTooltipId: string | null;
    setHoveredTooltipId: (id: string | null) => void;
    onToggleFavorite: (quizId: string, e: React.MouseEvent) => void;
    onOpenDetail: (quizId: string) => void;
    onSelectQuiz: (quizId: string) => void;
    getCategoryDisplayName: (cat: string) => string;
    t: (key: string) => string;
}

function QuizCardGrid({
    quizzes, favorites, currentPage, activeTab, creating,
    hoveredTooltipId, setHoveredTooltipId,
    onToggleFavorite, onOpenDetail, onSelectQuiz,
    getCategoryDisplayName, t,
}: QuizCardGridProps) {
    return (
        <motion.div
            key={`grid-${currentPage}-${activeTab}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
        >
            {quizzes.map((quiz) => (
                <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    colors={getCategoryColor(quiz.category)}
                    isFavorited={favorites.includes(quiz.id)}
                    creating={creating}
                    hoveredTooltipId={hoveredTooltipId}
                    setHoveredTooltipId={setHoveredTooltipId}
                    onToggleFavorite={onToggleFavorite}
                    onOpenDetail={onOpenDetail}
                    onSelectQuiz={onSelectQuiz}
                    getCategoryDisplayName={getCategoryDisplayName}
                    t={t}
                />
            ))}
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: EmptyState (Tampilan saat tidak ada quiz)
// ═══════════════════════════════════════════════════════════════════════════

interface EmptyStateProps {
    activeTab: QuizTab;
    onBrowseAll: () => void;
    onResetFilters: () => void;
    onRefresh: () => void;
    t: (key: string) => string;
}

function EmptyState({ activeTab, onBrowseAll, onResetFilters, onRefresh, t }: EmptyStateProps) {
    return (
        <motion.div
            key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="col-span-full py-20 text-center"
        >
            {activeTab === 'favorites' ? (
                /* Pesan kosong tab Favorit */
                <>
                    <Heart className="h-16 w-16 mx-auto text-pink-500/20 mb-4" />
                    <h3 className="text-xl text-white font-display uppercase tracking-widest mb-2">{t('select_quiz.empty_states.favorites_title')}</h3>
                    <p className="text-pink-400/40 text-sm mb-6">{t('select_quiz.empty_states.favorites_desc')}</p>
                    <Button variant="outline" onClick={onBrowseAll} className="bg-pink-500/10 border border-pink-500/50 text-pink-400 hover:bg-pink-500 hover:text-white transition-all font-display text-xs uppercase tracking-wider">{t('select_quiz.empty_states.browse_quizzes')}</Button>
                </>
            ) : activeTab === 'myquiz' ? (
                /* Pesan kosong tab Quiz Saya */
                <>
                    <FileText className="h-16 w-16 mx-auto text-[#00ff9d]/20 mb-4" />
                    <h3 className="text-xl text-white font-display uppercase tracking-widest mb-2">{t('select_quiz.empty_states.myquiz_title')}</h3>
                    <p className="text-[#00ff9d]/40 text-sm mb-6">{t('select_quiz.empty_states.myquiz_desc')}</p>
                    <div className="flex justify-center gap-4">
                        <Button variant="outline" onClick={onRefresh} className="bg-white/[0.03] border border-[#00ff9d]/50 text-[#00ff9d] hover:bg-[#00ff9d]/20 transition-all font-display text-xs uppercase tracking-wider"><RefreshCw className="w-4 h-4 mr-2" />{t('select_quiz.empty_states.refresh')}</Button>
                        <Button variant="outline" onClick={onBrowseAll} className="bg-[#00ff9d]/10 border border-[#00ff9d]/50 text-[#00ff9d] hover:bg-[#00ff9d] hover:text-[#04060f] transition-all font-display text-xs uppercase tracking-wider">{t('select_quiz.empty_states.browse_all')}</Button>
                    </div>
                </>
            ) : (
                /* Pesan kosong tab Semua (hasil pencarian kosong) */
                <>
                    <Search className="h-16 w-16 mx-auto text-[#2d6af2]/20 mb-4" />
                    <h3 className="text-xl text-white font-display uppercase tracking-widest mb-2">{t('select_quiz.empty_states.search_title')}</h3>
                    <p className="text-[#2d6af2]/40 text-sm mb-6">{t('select_quiz.empty_states.search_desc')}</p>
                    <Button variant="outline" onClick={onResetFilters} className="bg-[#2d6af2]/10 border border-[#2d6af2]/50 text-[#2d6af2] hover:bg-[#2d6af2] hover:text-white transition-all font-display text-xs uppercase tracking-wider">{t('select_quiz.empty_states.reset_filters')}</Button>
                </>
            )}
        </motion.div>
    );
}
