'use client';
/**
 * =====================================================
 * HALAMAN UTAMA QUIZ - NitroQuiz Quiz Page
 * =====================================================
 * File ini adalah entry point (orchestrator) yang
 * menggabungkan semua modul: hooks dan komponen UI.
 * Logika berat sudah dipindahkan ke modul terpisah:
 *
 * - _types/         → Interface dan tipe data
 * - _constants/     → Konstanta (warna opsi, jumlah soal per ronde)
 * - _hooks/         → Custom hooks (init, timer, guards, navigasi)
 * - _components/    → Komponen UI (HUD, kartu soal, background, dll.)
 *
 * CATATAN: Tidak ada perubahan fungsi, logika, atau tampilan
 * dari versi sebelumnya. Hanya restrukturisasi kode.
 * =====================================================
 */

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';

// --- Tipe Data ---
import type { QuizQuestion } from './_types';

// --- Konstanta ---
import { QUESTIONS_PER_ROUND } from './_constants';

// --- Custom Hooks ---
import { useQuizInit } from './_hooks/useQuizInit';
import { useQuizTimer } from './_hooks/useQuizTimer';
import { useQuizGuards } from './_hooks/useQuizGuards';
import { useQuizNavigation } from './_hooks/useQuizNavigation';

// --- Komponen UI ---
import { QuizLoadingScreen, QuizEmptyScreen } from './_components/QuizLoadingScreen';
import { QuizBackground } from './_components/QuizBackground';
import { QuizHUD } from './_components/QuizHUD';
import { QuizQuestionCard } from './_components/QuizQuestionCard';
import { QuizImageZoomModal } from './_components/QuizImageZoomModal';

// Re-export tipe QuizQuestion agar tetap bisa diakses dari luar
export type { QuizQuestion };

// ==========================================
// Komponen Utama
// ==========================================
export default function QuizPage() {
    const params = useParams();
    const roomCodeFromParams = (params?.roomCode as string)?.toUpperCase();

    // --- State zoom gambar ---
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    // --- Hook Inisialisasi: fetch sesi, peserta, soal, dan guard awal ---
    const {
        mounted,
        questions,
        currentIndex,
        score,
        sessionId,
        roomCode,
        setCurrentIndex,
        setScore,
    } = useQuizInit(roomCodeFromParams);

    // --- Hook Timer Global: countdown tersinkronisasi dengan server ---
    const { globalTimeLeft, isTimerReady } = useQuizTimer(
        sessionId,
        roomCode,
        roomCodeFromParams
    );

    // --- Hook Navigasi Soal: handle jawaban, transisi ronde, dan selesai ---
    const {
        selectedOption,
        isAnswered,
        statusText,
        handleAnswer,
        isTransitioningRef,
    } = useQuizNavigation(
        questions,
        currentIndex,
        setCurrentIndex,
        score,
        setScore,
        sessionId,
        roomCode
    );

    // --- Hook Guard Real-time: pantau perubahan status sesi/peserta via Supabase ---
    useQuizGuards(roomCode, roomCodeFromParams, isTransitioningRef);

    // --- Handler zoom gambar ---
    const handleImageZoom = useCallback((imageUrl: string | null) => {
        setZoomedImage(imageUrl);
    }, []);

    const handleCloseZoom = useCallback(() => {
        setZoomedImage(null);
    }, []);

    // ==========================================
    // RENDER: Kondisi Loading / Empty
    // ==========================================

    // Kondisi awal: data belum siap → tampilkan layar kosong
    if (!mounted || questions.length === 0 || (currentIndex >= questions.length && (currentIndex % QUESTIONS_PER_ROUND !== 0))) {
        return <QuizEmptyScreen />;
    }

    // Kondisi loading: data belum lengkap atau timer belum siap → tampilkan loading
    if (!mounted || questions.length === 0 || !isTimerReady) {
        return <QuizLoadingScreen />;
    }

    // Data soal saat ini
    const currentQ = questions[currentIndex];

    // ==========================================
    // RENDER: Halaman Quiz Utama
    // ==========================================
    return (
        <div className="min-h-[100dvh] w-full bg-[#04060f] text-white font-display overflow-hidden relative flex flex-col">
            {/* Latar belakang sinematik bertema racing */}
            <QuizBackground />

            {/* Konten Utama */}
            <div className="flex-1 flex flex-col items-center justify-center p-3 md:p-6 relative z-10">
                <div className="w-full max-w-4xl mx-auto flex flex-col items-center">

                    {/* Panel HUD Utama */}
                    <div
                        className="w-full bg-[#0a0e1a]/90 backdrop-blur-2xl border border-white/[0.06] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)' }}
                    >
                        {/* Header HUD: Progress Bar, Timer, Skor */}
                        <QuizHUD
                            currentIndex={currentIndex}
                            totalQuestions={questions.length}
                            globalTimeLeft={globalTimeLeft}
                            score={score}
                        />

                        {/* Kartu Soal dan Opsi Jawaban */}
                        <QuizQuestionCard
                            currentQuestion={currentQ}
                            currentIndex={currentIndex}
                            selectedOption={selectedOption}
                            isAnswered={isAnswered}
                            onAnswer={handleAnswer}
                            onImageZoom={handleImageZoom}
                        />
                    </div>
                </div>
            </div>

            {/* Modal Zoom Gambar (fullscreen) */}
            <QuizImageZoomModal
                zoomedImage={zoomedImage}
                onClose={handleCloseZoom}
            />
        </div>
    );
}
