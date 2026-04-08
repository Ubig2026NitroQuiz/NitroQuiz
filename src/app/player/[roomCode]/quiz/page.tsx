'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Timer, Trophy, ArrowRight, Loader2, Sparkles, Clock, List, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useTranslation } from "react-i18next";
import { getSyncedServerTime, syncServerTime } from '@/lib/serverTime';
import { generateXID } from '@/lib/id-generator';

// Reuse QuizQuestion type
export interface QuizQuestion {
    id: string;
    question: string;
    options: { text: string; image?: string }[];
    correctAnswer: number;
    imageUrl?: string;
    originalDoc?: any;
}

export default function QuizPage() {
    const router = useRouter();
    const params = useParams();
    const { t } = useTranslation();
    const roomCodeFromParams = (params?.roomCode as string)?.toUpperCase();
    const [mounted, setMounted] = useState(false);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [roomCode, setRoomCode] = useState<string | null>(roomCodeFromParams || null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [statusText, setStatusText] = useState(t("player_quiz.round_complete"));
    const [globalTimeLeft, setGlobalTimeLeft] = useState<number | null>(null);
    const [isTimerReady, setIsTimerReady] = useState(false);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const isTransitioningRef = useRef(false);
    const lastUpdateRef = useRef<Promise<void> | null>(null);

    // Handle Escape Key to close Zoom Modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setZoomedImage(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);


    const QUESTIONS_PER_ROUND = 3;

    useEffect(() => {
        setMounted(true);
        syncServerTime();

        const fetchLatestData = async () => {
            const participantId = localStorage.getItem('nitroquiz_game_participantId');
            const storedRoom = localStorage.getItem('nitroquiz_game_roomCode');
            const roomToUse = roomCodeFromParams || storedRoom;

            if (!participantId || !roomToUse) {
                console.warn("Quiz: No participantId or roomCode found, redirecting home.");
                router.push('/');
                return;
            }

            try {
                // 1. Fetch Session Info (Questions & Status)
                const { data: sessionData, error: sessError } = await supabase
                    .from('sessions')
                    .select('id, status, current_questions, difficulty')
                    .eq('game_pin', roomToUse)
                    .single();

                if (sessError || !sessionData) {
                    router.push('/');
                    return;
                }

                // 2. Fetch Participant Info (Progress & Guard)
                const { data: pData, error: pError } = await supabase
                    .from('participants')
                    .select('score, current_question, minigame, finished_at')
                    .eq('id', participantId)
                    .single();

                if (pError || !pData) {
                    router.push('/');
                    return;
                }

                // Guard: If DB says minigame is TRUE, you should be in the RACE
                if (pData.minigame === true && !pData.finished_at) {
                    router.push(`/player/${roomToUse}/game`);
                    return;
                }

                // Session Status Guard
                if (sessionData.status === 'finished' || sessionData.status === 'completed') {
                    router.push(`/player/${roomToUse}/result`);
                    return;
                }

                // Update Local State from DB
                setSessionId(sessionData.id);
                setRoomCode(roomToUse);
                setScore(pData.score || 0);
                setCurrentIndex(pData.current_question || 0);

                // Initialize Questions
                let rawQuestions = sessionData.current_questions;
                if (typeof rawQuestions === 'string') {
                    try { rawQuestions = JSON.parse(rawQuestions); } catch (e) { }
                }

                if (Array.isArray(rawQuestions)) {
                    const normalized: QuizQuestion[] = rawQuestions.map((q: any, idx: number) => {
                        let options: { text: string; image?: string }[] = [];
                        let correctAnswer = 0;

                        if (Array.isArray(q.answers)) {
                            options = q.answers.map((a: any) => ({
                                text: a.answer || a.text || '',
                                image: a.image || a.image_url || a.imageUrl || undefined
                            }));
                            const correctId = String(q.correct);
                            const correctIdx = q.answers.findIndex((a: any) => String(a.id) === correctId);
                            correctAnswer = correctIdx >= 0 ? correctIdx : 0;
                        } else if (Array.isArray(q.options)) {
                            options = q.options.map((opt: any) => {
                                if (typeof opt === 'string') return { text: opt };
                                return {
                                    text: opt.text || opt.answer || '',
                                    image: opt.image || opt.image_url || opt.imageUrl || undefined
                                };
                            });
                            correctAnswer = q.correctAnswer ?? 0;
                        }

                        return {
                            id: q.id || `q-${idx}`,
                            question: q.question || q.text || '',
                            options,
                            correctAnswer,
                            imageUrl: q.image || q.image_url || q.imageUrl || undefined,
                            originalDoc: q
                        };
                    });
                    setQuestions(normalized);

                    // Keep cache updated
                    localStorage.setItem('nitroquiz_game_questions', JSON.stringify(rawQuestions));
                    localStorage.setItem('nitroquiz_game_sessionId', sessionData.id);
                    localStorage.setItem('nitroquiz_game_roomCode', roomToUse);
                    localStorage.setItem('nitroquiz_game_difficulty', sessionData.difficulty || 'easy');
                }

            } catch (err) {
                console.error("Quiz Initialization Error:", err);
                router.push('/');
            }
        };

        fetchLatestData();

        // Prefetch game assets
        const gameRoute = `/player/${roomCodeFromParams}/game`;
        router.prefetch(gameRoute);

    }, [router, roomCodeFromParams]);

    useEffect(() => {
        // No auto timer needed anymore, progress is completely player-driven
    }, [questions.length, currentIndex, isAnswered]);

    const handleAnswer = async (optionIndex: number) => {
        if (isAnswered) return;

        const currentQ = questions[currentIndex];
        const correct = optionIndex === currentQ.correctAnswer;

        setSelectedOption(optionIndex);
        setIsAnswered(true);

        const earnedPoints = correct ? Math.ceil(100 / questions.length) : 0;
        const newScore = Math.min(100, score + earnedPoints);
        setScore(newScore);

        localStorage.setItem('nitroquiz_game_score', newScore.toString());

        const participantId = localStorage.getItem('nitroquiz_game_participantId');
        // Start transition timer immediately for snappier feel
        setTimeout(() => {
            nextQuestion();
        }, 300);

        // Update database in background but keep track of it
        lastUpdateRef.current = (async () => {
            if (participantId) {
                try {
                    // Fetch the current state from Supabase to prevent overwriting
                    const { data: currentData } = await supabase
                        .from('participants')
                        .select('answers, correct, score, current_question')
                        .eq('id', participantId)
                        .single();

                    if (currentData) {
                        let currentAnswers: any[] = [];
                        if (currentData.answers) {
                            try {
                                currentAnswers = typeof currentData.answers === 'string'
                                    ? JSON.parse(currentData.answers)
                                    : currentData.answers;
                            } catch (e) { }
                        }

                        // Extract strict raw IDs from original dictionary
                        let answer_id = "";
                        if (currentQ.originalDoc?.answers?.[optionIndex]?.id) {
                            answer_id = currentQ.originalDoc.answers[optionIndex].id;
                        }

                        const newEntry = {
                            id: generateXID(),
                            correct: correct,
                            answer_id: answer_id,
                            question_id: currentQ.id
                        };

                        const updatedAnswers = [...currentAnswers, newEntry];
                        const updatedCorrect = (currentData.correct || 0) + (correct ? 1 : 0);

                        await supabase
                            .from('participants')
                            .update({
                                answers: updatedAnswers,
                                correct: updatedCorrect,
                                score: newScore,
                                current_question: currentIndex + 1
                            })
                            .eq('id', participantId);
                    }
                } catch (e) {
                    console.error("Failed to update score/lap in background", e);
                }
            }
        })();
    };

    const nextQuestion = async () => {
        const nextIdx = currentIndex + 1;

        const isEndOfQuiz = nextIdx >= questions.length;
        const isRoundEnd = !isEndOfQuiz && (nextIdx % QUESTIONS_PER_ROUND === 0);

        if (isEndOfQuiz) {
            // Quiz selesai total → ke result
            // WAIT for the last background update to finish before navigating to ensure data is saved
            if (lastUpdateRef.current) await lastUpdateRef.current;

            isTransitioningRef.current = true;
            const participantId = localStorage.getItem('nitroquiz_game_participantId');
            if (participantId) {
                try {
                    await supabase.from('participants')
                        .update({
                            minigame: false,
                            finished_at: new Date().toISOString(),
                            current_question: nextIdx
                        })
                        .eq('id', participantId);
                } catch (e) {
                    console.error("Error finishing quiz:", e);
                }
            }
            setStatusText(t("player_quiz.quiz_finished"));
            router.push(`/player/${roomCode}/result`);
            return;
        }

        if (isRoundEnd) {
            // Selesai 1 round → balik ke game
            // WAIT for the last background update to finish before navigating
            if (lastUpdateRef.current) await lastUpdateRef.current;

            isTransitioningRef.current = true;
            const participantId = localStorage.getItem('nitroquiz_game_participantId');
            if (participantId) {
                try {
                    await supabase.from('participants')
                        .update({
                            minigame: true,
                            current_question: nextIdx
                        })
                        .eq('id', participantId);
                } catch (e) {
                    console.error("Critical error during quiz transition:", e);
                }
            }
            setStatusText(t("player_quiz.round_complete"));
            router.push(`/player/${roomCode}/game`);
            return;
        }

        // Soal biasa, lanjut
        setCurrentIndex(nextIdx);
        setIsAnswered(false);
        setSelectedOption(null);
        localStorage.setItem('nitroquiz_game_questionIndex', nextIdx.toString());
    };

    // Real-time Guards: Session status and Minigame status
    useEffect(() => {
        const sessId = typeof window !== 'undefined' ? localStorage.getItem('nitroquiz_game_sessionId') : null;
        const participantId = typeof window !== 'undefined' ? localStorage.getItem('nitroquiz_game_participantId') : null;
        if (!sessId || !participantId) return;

        const channel = supabase
            .channel(`player_quiz_guards_${participantId}`)
            // Listen for Session changes
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessId}` },
                (payload) => {
                    const status = payload.new.status;
                    if (status === 'finished' || status === 'completed') {
                        router.push(`/player/${roomCode || roomCodeFromParams}/result`);
                    } else if (status === 'waiting' || status === 'lobby') {
                        router.push(`/player/${roomCode || roomCodeFromParams}/waiting`);
                    }
                }
            )
            // Listen for Participant changes (Minigame Guard)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'participants', filter: `id=eq.${participantId}` },
                (payload) => {
                    // If minigame is true, player should be on the race track
                    if (isTransitioningRef.current) return;
                    if (payload.new.minigame === true && !payload.new.finished_at) {
                        router.push(`/player/${roomCode || roomCodeFromParams}/game`);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [router, roomCode, roomCodeFromParams]);

    // Global Timer Realtime Synchronization
    useEffect(() => {
        if (!sessionId) return;

        const fetchAndStartTimer = async () => {
            const { data } = await supabase.from('sessions').select('started_at, total_time_minutes').eq('id', sessionId).single();
            if (!data?.started_at) {
                setIsTimerReady(true);
                return;
            }

            // Hitung sekali dulu SEBELUM interval — ini yang hilangkan flicker
            const start = new Date(data.started_at).getTime();
            const now = getSyncedServerTime();
            const elapsedSeconds = Math.floor((now - start) / 1000);
            const initialRemaining = Math.max(0, (data.total_time_minutes || 5) * 60 - elapsedSeconds);
            setGlobalTimeLeft(initialRemaining);
            setIsTimerReady(true);

            const interval = setInterval(() => {
                const start = new Date(data.started_at).getTime();
                const now = getSyncedServerTime();
                const elapsedSeconds = Math.floor((now - start) / 1000);
                const remaining = Math.max(0, (data.total_time_minutes || 5) * 60 - elapsedSeconds);

                setGlobalTimeLeft(remaining);

                if (remaining <= 0) {
                    clearInterval(interval);
                    // Automatically redirect to game (which will then redirect to result handling) or result
                    router.push(`/player/${roomCode || roomCodeFromParams}/result`);
                }
            }, 1000);

            return interval;
        };

        let intervalId: NodeJS.Timeout | undefined;
        fetchAndStartTimer().then(id => { intervalId = id; });

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [sessionId, router, roomCode, roomCodeFromParams]);

    if (!mounted || questions.length === 0 || (currentIndex >= questions.length && (currentIndex % QUESTIONS_PER_ROUND !== 0))) {
        return <div className="min-h-screen bg-[#04060f]" />;
    }

    if (!mounted || questions.length === 0 || !isTimerReady) {
        return (
            <div className="min-h-screen bg-[#04060f] flex items-center justify-center text-white font-rajdhani">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-[#2d6af2]/10 border-t-[#2d6af2] rounded-full animate-spin" />
                        <Trophy className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-[#2d6af2]/40" />
                    </div>
                    <p className="text-[#2d6af2] text-base font-bold uppercase tracking-[0.4em] animate-pulse">
                        {t("player_quiz.establishing_signal")}
                    </p>
                </div>
            </div>
        );
    }

    const currentQ = questions[currentIndex];
    const progressPercent = ((currentIndex) / questions.length) * 100;

    const OPTION_COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']; // A=blue, B=amber, C=red, D=purple

    return (
        <div className="min-h-[100dvh] w-full bg-[#07091a] text-white font-rajdhani overflow-hidden relative flex flex-col items-center justify-center p-3 md:p-6">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-[#07091a] to-[#050508] pointer-events-none" />
            <div className="fixed inset-0 z-0 bg-[linear-gradient(rgba(45,106,242,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(45,106,242,0.03)_1px,transparent_1px)] bg-[length:35px_35px] pointer-events-none" />

            <div className="w-full max-w-4xl mx-auto relative z-10 flex flex-col items-center">
                {/* Main Glass Panel */}
                <div className="w-full bg-[#0c1225]/40 backdrop-blur-xl border border-white/5 rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-2xl">

                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-white/5">
                        <motion.div
                            className="h-full bg-gradient-to-r from-[#2d6af2] to-[#00ff9d]"
                            style={{ boxShadow: '0 0 10px rgba(45,106,242,0.4)' }}
                            initial={{ width: `${((currentIndex) / questions.length) * 100}%` }}
                            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                        />
                    </div>

                    {/* Clean Header Grid - Scaled Down */}
                    <div className="grid grid-cols-3 items-center px-4 md:px-10 py-3 md:py-5 border-b border-white/5">
                        {/* LEFT: Questions Count */}
                        <div className="flex flex-col">
                            <span className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-[#2d6af2] font-black">
                                {t("player_quiz.questions_label") || "Questions"}
                            </span>
                            <div className="flex items-baseline gap-1 md:gap-1.5">
                                <span className="text-lg md:text-2xl font-black text-white leading-none">{(currentIndex + 1).toString().padStart(2, '0')}</span>
                                <span className="text-[10px] md:text-base font-bold text-white/20">/ {questions.length.toString().padStart(2, '0')}</span>
                            </div>
                        </div>

                        {/* CENTER: Timer Pill - Scaled Down */}
                        <div className="flex justify-center">
                            {globalTimeLeft !== null && (
                                <div className={`flex items-center px-4 md:px-8 py-1.5 md:py-2.5 rounded-lg md:rounded-full bg-white/[0.03] border transition-all duration-300 ${globalTimeLeft <= 30
                                    ? 'border-red-500/40 bg-red-500/5 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                                    : 'border-white/10 text-white'
                                    }`}>
                                    <span
                                        className="text-base md:text-2xl font-black leading-none"
                                        style={{
                                            fontFamily: 'Orbitron, sans-serif',
                                            letterSpacing: '0.15em',
                                            fontVariantNumeric: 'tabular-nums'
                                        }}
                                    >
                                        {Math.floor(globalTimeLeft / 60).toString().padStart(2, '0')}:{(globalTimeLeft % 60).toString().padStart(2, '0')}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Score Status - Scaled Down */}
                        <div className="flex flex-col items-end">
                            <span className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-[#f59e0b] font-black text-right">
                                {t("player_quiz.score_label") || "Score"}
                            </span>
                            <div className="flex items-center h-auto">
                                <span className="text-lg md:text-2xl font-black text-white leading-none tracking-tight">{score}</span>
                            </div>
                        </div>
                    </div>

                    <div className="px-5 md:px-12 py-5 md:py-10">
                        {/* Question Content */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentIndex}
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -10, opacity: 0 }}
                                className="mb-6 md:mb-10 flex flex-col items-center"
                            >
                                {currentQ.imageUrl && (
                                    <div className="!mb-6 flex justify-center">
                                        <img
                                            src={currentQ.imageUrl}
                                            alt="Quiz visual"
                                            className="rounded-lg max-h-[120px] md:max-h-[180px] object-contain cursor-pointer shadow-lg hover:scale-105 transition-transform duration-300"
                                            onClick={() => setZoomedImage(currentQ.imageUrl || null)}
                                        />
                                    </div>
                                )}
                                <h3 className="text-base md:text-2xl font-black leading-tight text-white text-center text-balance max-w-3xl tracking-tight">
                                    {currentQ.question}
                                </h3>
                            </motion.div>
                        </AnimatePresence>

                        {/* Options Grid - Scaled Down */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6">
                            {currentQ.options.map((option, idx) => {
                                const isSelected = selectedOption === idx;
                                const optionColor = OPTION_COLORS[idx] || OPTION_COLORS[0];
                                const letter = String.fromCharCode(65 + idx);
                                const hasImage = !!option.image;

                                return (
                                    <motion.button
                                        key={`${currentIndex}-${idx}`}
                                        whileHover={!isAnswered ? { scale: 1.01, backgroundColor: 'rgba(255,255,255,0.02)' } : {}}
                                        whileTap={!isAnswered ? { scale: 0.98 } : {}}
                                        onClick={() => handleAnswer(idx)}
                                        disabled={isAnswered}
                                        className={`w-full group relative rounded-2xl border text-left flex flex-col overflow-hidden transition-all duration-300 ${isSelected
                                            ? 'bg-white/5 border-white/20 shadow-lg'
                                            : 'bg-white/[0.01] border-white/[0.03] hover:border-white/10'
                                            }`}
                                    >
                                        {/* Option Image Overlay/Section if exists */}
                                        {hasImage && (
                                            <div
                                                className="w-full h-24 sm:h-32 md:h-40 overflow-hidden bg-black/20 border-b border-white/5 cursor-zoom-in"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setZoomedImage(option.image || null);
                                                }}
                                            >
                                                <img src={option.image} alt={`Option ${letter}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3 md:gap-4 p-3 md:p-5 flex-1 w-full">
                                            <div
                                                className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center font-black text-sm md:text-lg flex-shrink-0 text-white shadow-lg relative z-10"
                                                style={{ backgroundColor: optionColor }}
                                            >
                                                {letter}
                                            </div>

                                            <span className={`text-xs md:text-lg font-bold flex-1 tracking-tight leading-snug ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                                                {option.text}
                                            </span>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
            {/* Zoom Modal - Matches ContohAxiomQuiz */}
            <AnimatePresence>
                {zoomedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black z-[9999] flex items-center justify-center p-4 cursor-pointer"
                        onClick={() => setZoomedImage(null)}
                    >
                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            src={zoomedImage}
                            alt="Zoomed"
                            className="max-w-full max-h-full object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

