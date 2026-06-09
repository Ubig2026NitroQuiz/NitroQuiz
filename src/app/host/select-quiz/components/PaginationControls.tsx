/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KOMPONEN: PaginationControls
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Kontrol navigasi halaman (sebelumnya/selanjutnya) dengan gaya cyberpunk.
 * Hanya ditampilkan jika total halaman lebih dari 1.
 */

"use client";

import { ArrowLeft, Play } from "lucide-react";

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    isFetching: boolean;
    creating: boolean;
    isReturning: boolean;
    setCurrentPage: (updater: (prev: number) => number) => void;
    t: (key: string) => string;
}

export function PaginationControls({
    currentPage, totalPages,
    isFetching, creating, isReturning,
    setCurrentPage, t,
}: PaginationControlsProps) {
    // Sembunyikan jika hanya 1 halaman
    if (totalPages <= 1) return null;

    const isDisabled = isFetching || creating || isReturning;

    return (
        <div className="flex justify-center mt-6 mb-2 gap-3 flex-shrink-0">
            {/* Tombol Sebelumnya */}
            <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isDisabled}
                className="group/prev flex items-center h-10 px-6 relative overflow-hidden disabled:opacity-30 disabled:cursor-not-allowed transform -skew-x-[15deg] transition-all duration-300 rounded-sm bg-white/[0.03] border border-white/10 hover:border-[#2d6af2]/50 hover:bg-[#2d6af2]/10"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#2d6af2]/10 to-transparent -translate-x-full group-hover/prev:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                <div className="relative z-10 flex items-center gap-2 transform skew-x-[15deg] transition-transform duration-300">
                    <ArrowLeft size={12} className="text-[#2d6af2]" />
                    <span className="text-white font-black text-[10px] tracking-[0.2em] uppercase">{t('select_quiz.pagination.prev')}</span>
                </div>
            </button>

            {/* Indikator Halaman */}
            <div className="flex items-center px-6 bg-[#0c1020]/80 border border-white/10 rounded-sm text-white font-display font-black text-[11px] tracking-[0.2em] shadow-[0_0_15px_rgba(0,0,0,0.3)] transform -skew-x-[15deg]">
                <div className="transform skew-x-[15deg]">
                    {t('select_quiz.pagination.page')} {currentPage} / {totalPages}
                </div>
            </div>

            {/* Tombol Selanjutnya */}
            <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || isDisabled}
                className="group/next flex items-center h-10 px-6 relative overflow-hidden disabled:opacity-30 disabled:cursor-not-allowed transform -skew-x-[15deg] transition-all duration-300 rounded-sm bg-gradient-to-r from-[#2d6af2] to-[#1e40af] border border-white/20 hover:shadow-[0_0_20px_rgba(45,106,242,0.4)]"
            >
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/next:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                <div className="relative z-10 flex items-center gap-2 transform skew-x-[15deg] transition-transform duration-300">
                    <span className="text-white font-black text-[10px] tracking-[0.2em] uppercase">{t('select_quiz.pagination.next')}</span>
                    <Play size={10} className="fill-white" />
                </div>
            </button>
        </div>
    );
}
