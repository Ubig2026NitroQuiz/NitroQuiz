/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KOMPONEN: QuizDetailDialog
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Dialog modal yang menampilkan detail lengkap quiz:
 * - Header dengan kategori dan judul
 * - Deskripsi yang bisa diperluas
 * - Grid data (jumlah pertanyaan, dimainkan, favorit, bahasa)
 * - Tombol aksi (batal & mulai)
 */

"use client";

import { HelpCircle, Heart, Play, Languages } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { getCategoryColor } from "../constants";

interface QuizDetailDialogProps {
    /** Data quiz yang sedang ditampilkan (null jika ditutup) */
    selectedQuizDetail: any;
    /** Sedang memuat detail quiz */
    isDetailLoading: boolean;
    /** Apakah deskripsi diperluas */
    isDescriptionExpanded: boolean;
    /** Toggle perluasan deskripsi */
    setIsDescriptionExpanded: (expanded: boolean) => void;
    /** Tutup dialog */
    onClose: () => void;
    /** Mulai game dengan quiz ini */
    onStartQuiz: (quizId: string) => void;
    /** Sedang dalam proses membuat sesi */
    creating: boolean;
    /** Fungsi untuk mendapatkan nama tampilan kategori */
    getCategoryDisplayName: (cat: string) => string;
    /** Fungsi terjemahan */
    t: (key: string) => string;
}

export function QuizDetailDialog({
    selectedQuizDetail,
    isDetailLoading,
    isDescriptionExpanded,
    setIsDescriptionExpanded,
    onClose,
    onStartQuiz,
    creating,
    getCategoryDisplayName,
    t,
}: QuizDetailDialogProps) {
    // Hitung skema warna berdasarkan kategori quiz yang dipilih
    const colors = selectedQuizDetail ? getCategoryColor(selectedQuizDetail.category) : null;
    const dynamicBorderColor = colors ? colors.bar : '#2d6af2';
    const dynamicShadow = colors
        ? `0 0 60px rgba(0,0,0,0.8), 0 0 40px ${colors.badgeBorder}`
        : '0 0 60px rgba(0,0,0,0.8), 0 0 40px rgba(45,106,242,0.15)';

    return (
        <Dialog
            open={!!selectedQuizDetail || isDetailLoading}
            onOpenChange={(open) => { if (!open) onClose(); }}
        >
            <DialogContent
                className="bg-[#080d1a]/95 border border-white/[0.05] border-t-4 text-white backdrop-blur-3xl p-0 overflow-hidden max-w-lg rounded-sm transition-all duration-300"
                style={{ borderTopColor: dynamicBorderColor, boxShadow: dynamicShadow }}
            >
                {isDetailLoading ? (
                    /* Tampilan loading spinner — DialogTitle tersembunyi untuk aksesibilitas */
                    <div className="flex flex-col items-center justify-center p-12 space-y-4">
                        <DialogTitle className="sr-only">Loading Quiz Detail...</DialogTitle>
                        <div
                            className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
                            style={{ borderColor: `${dynamicBorderColor}50`, borderTopColor: '#00ff9d' }}
                        />
                        <p className="font-display text-[10px] uppercase tracking-widest text-gray-500">Loading...</p>
                    </div>
                ) : selectedQuizDetail && colors && (
                    <div className="flex flex-col">
                        {/* ── Header: Kategori & Judul ── */}
                        <DetailHeader
                            quiz={selectedQuizDetail}
                            colors={colors}
                            isDescriptionExpanded={isDescriptionExpanded}
                            setIsDescriptionExpanded={setIsDescriptionExpanded}
                            getCategoryDisplayName={getCategoryDisplayName}
                            t={t}
                        />

                        {/* ── Grid Data Statistik ── */}
                        <DetailDataGrid quiz={selectedQuizDetail} colors={colors} t={t} />

                        {/* ── Tombol Aksi ── */}
                        <DetailActions
                            quiz={selectedQuizDetail}
                            colors={colors}
                            creating={creating}
                            onClose={onClose}
                            onStartQuiz={onStartQuiz}
                            t={t}
                        />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: Header Detail (Kategori, Judul, Deskripsi)
// ═══════════════════════════════════════════════════════════════════════════

function DetailHeader({
    quiz, colors, isDescriptionExpanded, setIsDescriptionExpanded,
    getCategoryDisplayName, t,
}: {
    quiz: any;
    colors: ReturnType<typeof getCategoryColor>;
    isDescriptionExpanded: boolean;
    setIsDescriptionExpanded: (v: boolean) => void;
    getCategoryDisplayName: (cat: string) => string;
    t: (key: string) => string;
}) {
    return (
        <div className="p-6 pb-5 border-b border-white/5 bg-gradient-to-br from-[#0c1226] to-[#060914] relative overflow-hidden">
            {/* Efek blur dekoratif di pojok kanan */}
            <div
                className="absolute top-0 right-0 w-32 h-32 blur-[40px] rounded-full pointer-events-none transition-colors duration-500"
                style={{ backgroundColor: colors.badgeBorder, opacity: 0.15 }}
            />

            {/* Badge kategori */}
            <div className="flex items-start mb-3 relative z-10 w-fit">
                <div
                    className="px-3 py-1 text-[8px] font-display font-black uppercase tracking-[0.2em] transform -skew-x-[15deg] border border-l-2 shadow-[0_0_15px_rgba(0,0,0,0.2)]"
                    style={{
                        background: `linear-gradient(90deg, ${colors.badgeBorder}40, transparent)`,
                        borderColor: `${colors.badgeBorder}30`,
                        borderLeftColor: colors.bar,
                        color: colors.badgeText,
                        textShadow: `0 0 5px ${colors.bar}`
                    }}
                >
                    <div className="transform skew-x-[15deg]">
                        {getCategoryDisplayName(quiz.category)}
                    </div>
                </div>
            </div>

            {/* Judul quiz */}
            <DialogTitle className="text-[22px] font-display font-black italic uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 leading-tight drop-shadow-md relative z-10 pr-4">
                {quiz.title}
            </DialogTitle>

            {/* Deskripsi quiz */}
            <div className="mt-4 relative z-10">
                <p className={`text-gray-400 text-[11px] font-display tracking-widest uppercase leading-snug transition-all duration-300 ${isDescriptionExpanded ? '' : 'line-clamp-2'}`}>
                    {quiz.description || t('select_quiz.detail.no_description')}
                </p>
                {/* Tombol lihat lebih/kurang (hanya muncul jika deskripsi panjang) */}
                {(quiz.description && quiz.description.length > 80) && (
                    <button
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className="text-[9px] font-display font-bold uppercase tracking-[0.2em] mt-2 hover:text-white transition-colors focus:outline-none flex items-center gap-1"
                        style={{ color: colors.badgeText }}
                    >
                        {isDescriptionExpanded ? t('select_quiz.detail.show_less') : t('select_quiz.detail.show_more')}
                    </button>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: Grid Data Statistik
// ═══════════════════════════════════════════════════════════════════════════

function DetailDataGrid({
    quiz, colors, t,
}: {
    quiz: any;
    colors: ReturnType<typeof getCategoryColor>;
    t: (key: string) => string;
}) {
    /** Hitung jumlah pertanyaan dari data quiz */
    const getQuestionCount = (): number => {
        if (typeof quiz.questions === 'string') {
            return JSON.parse(quiz.questions).length;
        }
        return Array.isArray(quiz.questions) ? quiz.questions.length : 0;
    };

    /** Hitung jumlah pengguna yang memfavoritkan quiz ini */
    const getFavoriteCount = (): number => {
        try {
            const favs = typeof quiz.favorite === 'string'
                ? JSON.parse(quiz.favorite)
                : quiz.favorite;
            return Array.isArray(favs) ? favs.length : 0;
        } catch { return 0; }
    };

    return (
        <div className="px-6 py-5 grid grid-cols-2 gap-3 bg-[#060914]">
            {/* Jumlah pertanyaan */}
            <StatItem
                icon={<HelpCircle size={16} className="transition-transform group-hover:scale-110" style={{ color: colors.bar }} />}
                label={t('select_quiz.detail.questions')}
                value={getQuestionCount()}
                suffix={t('select_quiz.detail.qs_suffix')}
            />

            {/* Jumlah dimainkan */}
            <StatItem
                icon={<Play size={16} className="text-[#00ff9d] group-hover:scale-110 transition-transform" />}
                label={t('select_quiz.detail.played')}
                value={quiz.played || 0}
                suffix={t('select_quiz.detail.play_suffix')}
            />

            {/* Jumlah favorit */}
            <StatItem
                icon={<Heart size={16} className="text-pink-500 group-hover:scale-110 transition-transform" />}
                label={t('select_quiz.detail.favorites')}
                value={getFavoriteCount()}
                suffix={t('select_quiz.detail.fav_suffix')}
            />

            {/* Bahasa */}
            <div className="flex items-center gap-3 bg-[#0f142b] border border-white/5 p-3 px-4 rounded-sm shadow-inner transition-colors group">
                <Languages size={16} className="text-[#7c3aed] group-hover:scale-110 transition-transform" />
                <div className="flex flex-col">
                    <span className="text-[8px] text-white/40 uppercase tracking-widest font-display font-bold">{t('select_quiz.detail.language')}</span>
                    <span className="text-[14px] font-display font-black text-white uppercase tracking-widest">
                        {quiz.language || 'ID'}
                    </span>
                </div>
            </div>
        </div>
    );
}

/** Item statistik tunggal dalam grid data */
function StatItem({ icon, label, value, suffix }: {
    icon: React.ReactNode;
    label: string;
    value: number;
    suffix: string;
}) {
    return (
        <div className="flex items-center gap-3 bg-[#0f142b] border border-white/5 p-3 px-4 rounded-sm shadow-inner transition-colors group">
            {icon}
            <div className="flex flex-col">
                <span className="text-[8px] text-white/40 uppercase tracking-widest font-display font-bold">{label}</span>
                <span className="text-[14px] font-display font-black text-white tracking-widest">
                    {value} <span className="text-[9px] text-white/50">{suffix}</span>
                </span>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: Tombol Aksi (Batal & Mulai)
// ═══════════════════════════════════════════════════════════════════════════

function DetailActions({
    quiz, colors, creating, onClose, onStartQuiz, t,
}: {
    quiz: any;
    colors: ReturnType<typeof getCategoryColor>;
    creating: boolean;
    onClose: () => void;
    onStartQuiz: (quizId: string) => void;
    t: (key: string) => string;
}) {
    return (
        <div className="p-6 pt-0 pb-6 flex items-center justify-between gap-4 bg-[#060914]">
            {/* Tombol Batal */}
            <button
                onClick={onClose}
                className="px-6 h-10 font-display text-[10px] font-bold tracking-[0.2em] uppercase text-white/50 hover:text-white transition-all bg-white/5 border border-white/10 hover:border-white/30 transform -skew-x-[15deg] hover:bg-white/10"
            >
                <div className="transform skew-x-[15deg]">{t('select_quiz.detail.cancel')}</div>
            </button>

            {/* Tombol Mulai Game */}
            <button
                onClick={() => {
                    const qid = quiz.id;
                    onClose();
                    onStartQuiz(qid);
                }}
                disabled={creating}
                className="flex-1 max-w-[200px] h-11 group/btnstart overflow-hidden text-white font-display text-[12px] font-black tracking-[0.3em] uppercase transition-all duration-300 relative transform -skew-x-[15deg] disabled:opacity-50 border"
                style={{
                    background: `linear-gradient(135deg, ${colors.bar}, ${colors.badgeBorder})`,
                    borderColor: `${colors.badgeBorder}80`,
                    boxShadow: `0 0 25px ${colors.badgeBorder}60`
                }}
            >
                <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover/btnstart:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                <div className="absolute inset-0 border border-white/20" />
                <div className="transform skew-x-[15deg] absolute inset-0 flex items-center justify-center gap-2">
                    {t('select_quiz.detail.start')} <Play size={10} className="fill-white" />
                </div>
            </button>
        </div>
    );
}
