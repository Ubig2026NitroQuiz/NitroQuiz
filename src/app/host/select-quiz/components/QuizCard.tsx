/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KOMPONEN: QuizCard
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Kartu individual untuk menampilkan informasi quiz dalam grid.
 * Menampilkan:
 * - Badge kategori dengan warna dinamis
 * - Judul quiz dengan tooltip (jika terpotong)
 * - Tombol favorit
 * - Jumlah pertanyaan
 * - Tombol mulai game
 */

"use client";

import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, Heart, Play } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import type { QuizView } from "../types";
import type { CategoryColorScheme } from "../constants";

interface QuizCardProps {
    quiz: QuizView;
    colors: CategoryColorScheme;
    isFavorited: boolean;
    creating: boolean;
    hoveredTooltipId: string | null;
    setHoveredTooltipId: (id: string | null) => void;
    onToggleFavorite: (quizId: string, e: React.MouseEvent) => void;
    onOpenDetail: (quizId: string) => void;
    onSelectQuiz: (quizId: string) => void;
    getCategoryDisplayName: (cat: string) => string;
    t: (key: string) => string;
}

export function QuizCard({
    quiz, colors, isFavorited, creating,
    hoveredTooltipId, setHoveredTooltipId,
    onToggleFavorite, onOpenDetail, onSelectQuiz,
    getCategoryDisplayName, t,
}: QuizCardProps) {
    return (
        <motion.div
            key={quiz.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="cursor-pointer relative group h-full flex flex-col"
            onClick={() => onOpenDetail(quiz.id)}
            style={{ willChange: "transform, opacity" }}
        >
            {/* Efek border gradient saat hover */}
            <div className="absolute -inset-[1px] bg-gradient-to-br from-white/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <Card className="h-full flex flex-col bg-[#161c33]/85 backdrop-blur-xl border-t border-t-white/20 border border-white/10 transition-all duration-300 relative overflow-hidden group rounded-xl pb-0 shadow-[0_10px_30px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_25px_rgba(124,58,237,0.3)] justify-between">

                {/* Pola titik-titik dekoratif */}
                <div
                    className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.06] pointer-events-none transition-opacity"
                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}
                />

                {/* Garis vertikal berwarna di sisi kiri */}
                <div
                    className="absolute left-0 top-0 bottom-0 w-[4px] opacity-80"
                    style={{ background: `linear-gradient(to bottom, ${colors.bar}, transparent)` }}
                />

                {/* Dekorasi pojok kanan atas */}
                <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden rounded-tr-xl">
                    <div className="absolute w-24 h-3 bg-white/[0.03] rotate-45 transform origin-bottom-left translate-x-8 translate-y-[-10px]" />
                    <div className="absolute w-24 h-1.5 bg-white/[0.05] rotate-45 transform origin-bottom-left translate-x-6 translate-y-[-16px]" />
                </div>

                {/* Gambar latar belakang quiz (jika ada) */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    {quiz.imageUrl && (
                        <div
                            className="absolute top-0 right-0 w-2/3 h-full opacity-[0.25] group-hover:opacity-[0.45] transition-all duration-700"
                            style={{ backgroundImage: `url(${quiz.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', maskImage: 'linear-gradient(to right, transparent, black)' }}
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#161c33] via-[#161c33]/90 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#161c33] via-transparent to-[#161c33]/50" />
                </div>

                {/* Tombol favorit */}
                <button
                    onClick={(e) => onToggleFavorite(quiz.id, e)}
                    className={`absolute top-2.5 right-2.5 z-30 p-1.5 rounded-full transition-all duration-200 backdrop-blur-sm ${isFavorited
                        ? 'bg-pink-500/20 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:bg-pink-500/40'
                        : 'bg-black/30 border border-white/5 text-gray-500 hover:text-pink-400 hover:border-pink-500/30 hover:bg-pink-500/10'
                        }`}
                >
                    <Heart size={12} className={isFavorited ? 'fill-pink-400' : ''} />
                </button>

                {/* Header: Badge kategori & judul quiz */}
                <CardHeader className="p-3 pb-1 relative z-20 flex flex-col">
                    {/* Badge kategori */}
                    <div className="flex items-start mb-1.5">
                        <div
                            className="px-2 py-[2px] rounded-sm text-[7px] font-display font-black uppercase tracking-[0.2em] transform -skew-x-[15deg] transition-all duration-300"
                            style={{
                                background: `linear-gradient(90deg, ${colors.badgeBorder}60, transparent)`,
                                borderLeft: `2.5px solid ${colors.bar}`,
                                boxShadow: `0 0 10px ${colors.badgeBorder}50, inset 2px 0 6px ${colors.badgeBorder}60`,
                                color: '#fff',
                                textShadow: `0 0 5px ${colors.bar}`
                            }}
                        >
                            <div className="transform skew-x-[15deg]">
                                {getCategoryDisplayName(quiz.category)}
                            </div>
                        </div>
                    </div>

                    {/* Judul quiz dengan tooltip */}
                    <Tooltip open={hoveredTooltipId === quiz.id}>
                        <TooltipTrigger asChild>
                            <CardTitle
                                className="text-[12px] text-white font-black italic uppercase tracking-wider leading-snug transition-all drop-shadow-md line-clamp-2 pr-6"
                                style={{ textShadow: `0 0 10px ${colors.badgeBorder}00` }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.textShadow = `0 0 15px ${colors.badgeBorder}80`;
                                    // Tampilkan tooltip hanya jika teks terpotong
                                    if (e.currentTarget.scrollHeight > e.currentTarget.clientHeight) {
                                        setHoveredTooltipId(quiz.id);
                                    }
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.textShadow = `0 0 10px ${colors.badgeBorder}00`;
                                    setHoveredTooltipId(null);
                                }}
                            >
                                {quiz.title}
                            </CardTitle>
                        </TooltipTrigger>
                        <TooltipContent
                            side="top" sideOffset={8}
                            className="bg-[#0c1020]/95 backdrop-blur-xl border border-[#7C3AED]/60 text-white font-display text-[10px] uppercase font-bold tracking-widest shadow-[0_0_25px_rgba(124,58,237,0.5)] z-[100] max-w-[280px]"
                        >
                            {quiz.title}
                        </TooltipContent>
                    </Tooltip>
                </CardHeader>

                {/* Footer: Jumlah pertanyaan & tombol mulai */}
                <CardFooter className="p-3 border-t border-white/10 flex justify-between items-end relative z-20 bg-gradient-to-t from-[#0c1020]/95 to-transparent mt-auto">
                    {/* Info jumlah pertanyaan */}
                    <div className="flex flex-col">
                        <span className="text-[8px] text-white/80 font-display uppercase tracking-[0.25em] mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-bold">QUESTIONS</span>
                        <div className="flex items-center gap-1.5 font-bold text-white text-xs font-display">
                            <HelpCircle size={12} style={{ color: colors.bar }} />
                            {quiz.questionCount}
                        </div>
                    </div>

                    {/* Tombol mulai game */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onSelectQuiz(quiz.id); }}
                        disabled={creating}
                        className="group/btn flex items-center h-10 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transform -skew-x-[12deg] transition-all duration-300 rounded-sm"
                        style={{ background: `linear-gradient(135deg, ${colors.bar}, ${colors.badgeBorder})` }}
                    >
                        <div className="absolute inset-0 border border-white/20 pointer-events-none" />
                        <div className="absolute top-0 right-0 bottom-0 w-1/2 bg-white/20 transform -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-out" />
                        <div className="relative z-10 flex items-center gap-2 px-5 transform skew-x-[12deg] transition-transform duration-300">
                            <span className="text-white font-black text-[10px] tracking-[0.2em] uppercase">{t('select_quiz.start_button')}</span>
                            <Play size={10} className="fill-white" />
                        </div>
                    </button>
                </CardFooter>
            </Card>
        </motion.div>
    );
}
