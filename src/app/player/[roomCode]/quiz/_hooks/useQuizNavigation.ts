/**
 * =====================================================
 * HOOK: useQuizNavigation - Navigasi Soal Quiz
 * =====================================================
 * Bertanggung jawab untuk:
 * - Menangani pemilihan jawaban (handleAnswer)
 * - Validasi jawaban ke backend API
 * - Navigasi antar soal (nextQuestion)
 * - Logika transisi ronde (quiz → game) dan selesai (quiz → result)
 * - Sinkronisasi skor dan progres ke database
 * =====================================================
 */
'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { supabaseGame } from '@/lib/supabase/game-client';
import { QUESTIONS_PER_ROUND } from '../_constants';
import type { QuizQuestion } from '../_types';

/**
 * Hook untuk mengelola navigasi soal dan jawaban quiz.
 * Termasuk validasi jawaban ke server, update skor, dan transisi halaman.
 *
 * @param questions - Daftar soal quiz
 * @param currentIndex - Indeks soal saat ini
 * @param setCurrentIndex - Setter indeks soal
 * @param score - Skor saat ini
 * @param setScore - Setter skor
 * @param sessionId - ID sesi aktif
 * @param roomCode - Kode room aktif
 * @returns Object berisi selectedOption, isAnswered, statusText, handleAnswer, dan isTransitioningRef
 */
export function useQuizNavigation(
    questions: QuizQuestion[],
    currentIndex: number,
    setCurrentIndex: (idx: number) => void,
    score: number,
    setScore: (s: number) => void,
    sessionId: string | null,
    roomCode: string | null
) {
    const router = useRouter();
    const { t } = useTranslation();

    // --- State Jawaban ---
    /** Indeks opsi yang sedang dipilih pemain */
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    /** Flag menandai soal sudah dijawab (mencegah klik ganda) */
    const [isAnswered, setIsAnswered] = useState(false);

    /** Teks status yang ditampilkan saat transisi */
    const [statusText, setStatusText] = useState(t("player_quiz.round_complete"));

    // --- Refs Internal ---
    /** Flag untuk mencegah redirect ganda saat sedang transisi halaman */
    const isTransitioningRef = useRef(false);

    /** Promise update terakhir ke backend (ditunggu sebelum navigasi) */
    const lastUpdateRef = useRef<Promise<void> | null>(null);

    /**
     * Navigasi ke soal berikutnya atau transisi halaman.
     * Terdapat 3 kemungkinan:
     * 1. Soal terakhir → selesai total → redirect ke result
     * 2. Akhir ronde → kembali ke game (balapan)
     * 3. Soal biasa → lanjut ke soal berikutnya
     */
    const nextQuestion = useCallback(async () => {
        const nextIdx = currentIndex + 1;

        const isEndOfQuiz = nextIdx >= questions.length;
        const isRoundEnd = !isEndOfQuiz && (nextIdx % QUESTIONS_PER_ROUND === 0);

        if (isEndOfQuiz) {
            // === KASUS 1: Quiz selesai total → redirect ke halaman result ===

            // Tunggu update background terakhir selesai sebelum navigasi
            if (lastUpdateRef.current) await lastUpdateRef.current;

            isTransitioningRef.current = true;
            const participantId = localStorage.getItem('nitroquiz_game_participantId');

            if (participantId) {
                try {
                    await supabaseGame.from('participants')
                        .update({
                            minigame: false,
                            finished_at: new Date().toISOString(),
                            current_question: nextIdx
                        })
                        .eq('id', participantId);
                } catch (e) {
                    console.error("Error menyelesaikan quiz:", e);
                }
            }

            setStatusText(t("player_quiz.quiz_finished"));
            router.push(`/player/${roomCode}/result`);
            return;
        }

        if (isRoundEnd) {
            // === KASUS 2: Selesai 1 ronde → kembali ke game (balapan) ===

            // Tunggu update background terakhir selesai sebelum navigasi
            if (lastUpdateRef.current) await lastUpdateRef.current;

            isTransitioningRef.current = true;
            const participantId = localStorage.getItem('nitroquiz_game_participantId');

            if (participantId) {
                try {
                    await supabaseGame.from('participants')
                        .update({
                            minigame: true,
                            current_question: nextIdx
                        })
                        .eq('id', participantId);
                } catch (e) {
                    console.error("Error kritis saat transisi quiz:", e);
                }
            }

            setStatusText(t("player_quiz.round_complete"));
            router.push(`/player/${roomCode}/game`);
            return;
        }

        // === KASUS 3: Soal biasa → lanjut ke soal berikutnya ===
        setCurrentIndex(nextIdx);
        setIsAnswered(false);
        setSelectedOption(null);
        localStorage.setItem('nitroquiz_game_questionIndex', nextIdx.toString());
    }, [currentIndex, questions.length, roomCode, sessionId, router, t, setCurrentIndex]);

    /**
     * Handler saat pemain memilih jawaban.
     * Melakukan transisi optimistik (langsung pindah soal)
     * sambil memvalidasi jawaban ke backend secara asinkron.
     *
     * @param optionIndex - Indeks opsi yang dipilih (0-3)
     */
    const handleAnswer = useCallback(async (optionIndex: number) => {
        // Guard: Cegah klik ganda
        if (isAnswered) return;

        const currentQ = questions[currentIndex];
        const participantId = localStorage.getItem('nitroquiz_game_participantId');

        // Update UI segera (optimistic)
        setSelectedOption(optionIndex);
        setIsAnswered(true);

        // Transisi optimistik: langsung pindah soal setelah delay singkat
        setTimeout(() => {
            nextQuestion();
        }, 300);

        // Validasi jawaban dan update skor di backend (background)
        lastUpdateRef.current = (async () => {
            if (participantId && sessionId) {
                try {
                    const res = await fetch('/api/quiz/validate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            sessionId,
                            participantId,
                            questionId: currentQ.id,
                            optionIndex
                        })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        setScore(data.newScore);
                        localStorage.setItem('nitroquiz_game_score', data.newScore.toString());
                    }
                } catch (e) {
                    console.error("Gagal update skor/lap di background", e);
                }
            }
        })();
    }, [isAnswered, questions, currentIndex, sessionId, nextQuestion, setScore]);

    return {
        selectedOption,
        isAnswered,
        statusText,
        handleAnswer,
        isTransitioningRef,
    };
}
