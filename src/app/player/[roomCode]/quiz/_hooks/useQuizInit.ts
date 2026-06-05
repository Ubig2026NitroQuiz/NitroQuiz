/**
 * =====================================================
 * HOOK: useQuizInit - Inisialisasi Halaman Quiz
 * =====================================================
 * Bertanggung jawab untuk:
 * - Sinkronisasi waktu server
 * - Validasi sesi dan peserta dari Supabase
 * - Guard navigasi (redirect jika status tidak sesuai)
 * - Fetch soal dari API backend
 * - Menyiapkan state awal quiz
 * =====================================================
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { syncServerTime } from '@/lib/serverTime';
import { supabaseGame } from '@/lib/supabase/game-client';
import type { QuizQuestion } from '../_types';

/**
 * Hook untuk menginisialisasi halaman quiz.
 * Melakukan fetch data sesi, peserta, dan soal dari backend.
 *
 * @param roomCodeFromParams - Kode room dari URL parameter
 * @returns State inisialisasi quiz (mounted, questions, currentIndex, score, sessionId, roomCode, setter)
 */
export function useQuizInit(roomCodeFromParams: string) {
    const router = useRouter();

    // --- State Dasar ---
    const [mounted, setMounted] = useState(false);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [roomCode, setRoomCode] = useState<string | null>(roomCodeFromParams || null);
    const [sessionId, setSessionId] = useState<string | null>(null);

    useEffect(() => {
        // Tandai komponen sudah di-mount (untuk menghindari hydration mismatch)
        setMounted(true);

        // Sinkronisasi waktu lokal dengan server (untuk timer global)
        syncServerTime();

        /**
         * Fungsi utama: Fetch data terbaru dari Supabase dan API.
         * Melakukan validasi sesi, peserta, dan mengambil soal kuis.
         */
        const fetchLatestData = async () => {
            const participantId = localStorage.getItem('nitroquiz_game_participantId');
            const storedRoom = localStorage.getItem('nitroquiz_game_roomCode');
            const roomToUse = roomCodeFromParams || storedRoom;

            // Guard: Tidak ada data peserta/room → redirect ke home
            if (!participantId || !roomToUse) {
                console.warn("Quiz: Tidak ada participantId atau roomCode, redirect ke home.");
                router.push('/');
                return;
            }

            try {
                // 1. Ambil info sesi (status dan difficulty)
                const { data: sessionData, error: sessError } = await supabaseGame
                    .from('sessions')
                    .select('id, status, difficulty')
                    .eq('game_pin', roomToUse)
                    .single();

                if (sessError || !sessionData) {
                    router.push('/');
                    return;
                }

                // 2. Ambil info peserta (progres dan guard)
                const { data: pData, error: pError } = await supabaseGame
                    .from('participants')
                    .select('score, current_question, minigame, finished_at')
                    .eq('id', participantId)
                    .single();

                if (pError || !pData) {
                    router.push('/');
                    return;
                }

                // Guard: Jika DB menandai minigame = true, pemain harusnya di halaman balapan
                if (pData.minigame === true && !pData.finished_at) {
                    router.replace(`/player/${roomToUse}/game`);
                    return;
                }

                // Guard: Sesi sudah selesai → redirect ke result
                if (sessionData.status === 'finished' || sessionData.status === 'completed') {
                    router.replace(`/player/${roomToUse}/result`);
                    return;
                }

                // Guard: Sesi masih menunggu → redirect ke waiting
                if (sessionData.status === 'waiting' || sessionData.status === 'lobby') {
                    router.replace(`/player/${roomToUse}/waiting`);
                    return;
                }

                // Update state lokal dari data database
                setSessionId(sessionData.id);
                setRoomCode(roomToUse);
                setScore(pData.score || 0);
                setCurrentIndex(pData.current_question || 0);

                // 3. Fetch soal kuis dari API backend (validasi jawaban di server)
                const qRes = await fetch(`/api/quiz/questions?sessionId=${sessionData.id}`);
                if (qRes.ok) {
                    const apiData = await qRes.json();
                    if (apiData.questions && Array.isArray(apiData.questions)) {
                        setQuestions(apiData.questions);
                        // Simpan ke localStorage sebagai cache
                        localStorage.setItem('nitroquiz_game_questions', JSON.stringify(apiData.questions));
                        localStorage.setItem('nitroquiz_game_sessionId', sessionData.id);
                        localStorage.setItem('nitroquiz_game_roomCode', roomToUse);
                        localStorage.setItem('nitroquiz_game_difficulty', apiData.difficulty || sessionData.difficulty || 'easy');
                    }
                }

            } catch (err) {
                console.error("Quiz Initialization Error:", err);
                router.push('/');
            }
        };

        fetchLatestData();

        // Prefetch halaman game untuk transisi yang lebih cepat
        const gameRoute = `/player/${roomCodeFromParams}/game`;
        router.prefetch(gameRoute);

    }, [router, roomCodeFromParams]);

    return {
        mounted,
        questions,
        currentIndex,
        score,
        sessionId,
        roomCode,
        setCurrentIndex,
        setScore,
    };
}
