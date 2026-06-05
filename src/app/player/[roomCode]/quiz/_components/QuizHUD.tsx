/**
 * =====================================================
 * KOMPONEN: QuizHUD - Head-Up Display Quiz
 * =====================================================
 * Menampilkan informasi penting di bagian atas quiz:
 * - Progress bar (kemajuan soal)
 * - Nomor soal saat ini / total
 * - Timer countdown global
 * - Skor pemain
 *
 * Desain terinspirasi dari telemetri balap (racing HUD).
 * =====================================================
 */
'use client';

import { motion } from 'framer-motion';
import { List } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** Props untuk komponen QuizHUD */
interface QuizHUDProps {
    /** Indeks soal saat ini (0-based) */
    currentIndex: number;
    /** Total jumlah soal */
    totalQuestions: number;
    /** Sisa waktu global dalam detik (null jika belum tersedia) */
    globalTimeLeft: number | null;
    /** Skor pemain saat ini */
    score: number;
}

/**
 * Komponen HUD yang menampilkan progress, timer, dan skor.
 * Menggunakan desain skewed (miring) bertema racing.
 */
export function QuizHUD({ currentIndex, totalQuestions, globalTimeLeft, score }: QuizHUDProps) {
    const { t } = useTranslation();

    return (
        <>
            {/* ── Racing Progress Bar ── */}
            {/* Bar tipis yang menunjukkan kemajuan soal dengan gradient biru-hijau */}
            <div className="w-full h-[3px] bg-white/[0.04] relative">
                <motion.div
                    className="h-full relative"
                    style={{
                        background: 'linear-gradient(90deg, #2d6af2, #00ff9d)',
                        boxShadow: '0 0 15px rgba(0,255,157,0.5), 0 0 30px rgba(45,106,242,0.3)'
                    }}
                    initial={{ width: `${((currentIndex) / totalQuestions) * 100}%` }}
                    animate={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                />
            </div>

            {/* ── Telemetry Header ── */}
            {/* Grid 3 kolom: Nomor Soal | Timer | Skor */}
            <div
                className="grid grid-cols-3 items-center px-4 md:px-8 py-3 md:py-4"
                style={{ borderBottom: '1px solid rgba(45,106,242,0.12)' }}
            >
                {/* KIRI: Nomor Soal (Lap) */}
                <QuestionCounter currentIndex={currentIndex} totalQuestions={totalQuestions} />

                {/* TENGAH: Timer Global */}
                <TimerDisplay globalTimeLeft={globalTimeLeft} />

                {/* KANAN: Skor Pemain */}
                <ScoreDisplay score={score} />
            </div>
        </>
    );
}

// =====================================================
// SUB-KOMPONEN INTERNAL
// =====================================================

/** Props untuk QuestionCounter */
interface QuestionCounterProps {
    currentIndex: number;
    totalQuestions: number;
}

/**
 * Menampilkan nomor soal saat ini dengan format "01 / 09".
 * Menggunakan font Orbitron untuk estetika digital racing.
 */
function QuestionCounter({ currentIndex, totalQuestions }: QuestionCounterProps) {
    const { t } = useTranslation();

    return (
        <div className="flex items-center gap-3">
            {/* Ikon kotak miring (skewed) */}
            <div className="w-8 h-8 md:w-10 md:h-10 bg-[#2d6af2]/10 border border-[#2d6af2]/30 flex items-center justify-center transform -skew-x-[10deg]">
                <List className="w-4 h-4 md:w-5 md:h-5 text-[#5a9cff] transform skew-x-[10deg]" />
            </div>
            <div className="flex flex-col">
                {/* Label "SOAL" */}
                <span className="text-[7px] md:text-[9px] uppercase tracking-[0.25em] text-[#5a9cff]/70 font-bold leading-none">
                    {t("player_quiz.questions_label") || "LAP"}
                </span>
                {/* Angka soal saat ini / total */}
                <div className="flex items-baseline gap-1">
                    <span
                        className="text-lg md:text-2xl font-black text-white leading-none italic"
                        style={{ fontFamily: 'Orbitron, sans-serif' }}
                    >
                        {(currentIndex + 1).toString().padStart(2, '0')}
                    </span>
                    <span className="text-[9px] md:text-xs font-bold text-white/20">
                        / {totalQuestions.toString().padStart(2, '0')}
                    </span>
                </div>
            </div>
        </div>
    );
}

/** Props untuk TimerDisplay */
interface TimerDisplayProps {
    globalTimeLeft: number | null;
}

/**
 * Menampilkan countdown timer global dalam format MM:SS.
 * Berubah warna menjadi merah dan berkedip saat waktu tersisa ≤ 30 detik.
 */
function TimerDisplay({ globalTimeLeft }: TimerDisplayProps) {
    // Tidak ditampilkan jika timer belum tersedia
    if (globalTimeLeft === null) return <div className="flex justify-center" />;

    /** Flag: waktu kritis (≤ 30 detik) */
    const isCritical = globalTimeLeft <= 30;

    return (
        <div className="flex justify-center">
            <div className={`relative flex items-center px-5 md:px-8 py-1.5 md:py-2 transform -skew-x-[8deg] transition-all duration-300 ${
                isCritical
                    ? 'bg-red-500/10 border border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                    : 'bg-white/[0.03] border border-white/[0.08]'
            }`}>
                {/* Teks waktu MM:SS */}
                <span
                    className={`transform skew-x-[8deg] text-base md:text-2xl font-black leading-none ${
                        isCritical ? 'text-red-500' : 'text-white'
                    }`}
                    style={{
                        fontFamily: 'Orbitron, sans-serif',
                        letterSpacing: '0.15em',
                        fontVariantNumeric: 'tabular-nums'
                    }}
                >
                    {Math.floor(globalTimeLeft / 60).toString().padStart(2, '0')}
                    :
                    {(globalTimeLeft % 60).toString().padStart(2, '0')}
                </span>

                {/* Efek pulse saat waktu kritis */}
                {isCritical && (
                    <div className="absolute inset-0 border border-red-500/30 animate-pulse pointer-events-none" />
                )}
            </div>
        </div>
    );
}

/** Props untuk ScoreDisplay */
interface ScoreDisplayProps {
    score: number;
}

/**
 * Menampilkan skor pemain dengan indikator bar kecil berwarna amber.
 * Bar kecil memberikan efek visual "level meter" di samping angka skor.
 */
function ScoreDisplay({ score }: ScoreDisplayProps) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-end">
            {/* Label "PTS" (Points) */}
            <span className="text-[7px] md:text-[9px] uppercase tracking-[0.25em] text-[#f59e0b]/70 font-bold text-right leading-none">
                {t("player_quiz.score_label") || "PTS"}
            </span>
            {/* Angka skor + bar indikator */}
            <div className="flex items-baseline gap-1">
                <span
                    className="text-lg md:text-2xl font-black text-white leading-none italic"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                    {score}
                </span>
                {/* Bar indikator kecil (3 garis miring berwarna amber) */}
                <div className="flex gap-[2px] items-end ml-1">
                    <div className="w-[2px] h-[6px] bg-[#f59e0b]/40 transform -skew-x-[20deg]" />
                    <div className="w-[2px] h-[8px] bg-[#f59e0b]/60 transform -skew-x-[20deg]" />
                    <div className="w-[2px] h-[10px] bg-[#f59e0b] shadow-[0_0_4px_#f59e0b] transform -skew-x-[20deg]" />
                </div>
            </div>
        </div>
    );
}
