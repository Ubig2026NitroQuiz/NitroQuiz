'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Timer, Trophy, ArrowRight, Loader2, Sparkles, Clock, List, Star } from 'lucide-react';
import { useTranslation } from "react-i18next";
import { getSyncedServerTime, syncServerTime } from '@/lib/serverTime';
import { generateXID } from '@/lib/id-generator';
import { supabaseGame } from '@/lib/supabase/game-client';

// Reuse QuizQuestion type
export interface QuizQuestion {
    id: string;
    question: string;
    options: { text: string; image?: string }[];
    correctAnswer?: number;
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
                const { data: sessionData, error: sessError } = await supabaseGame
                    .from('sessions')
                    .select('id, status, difficulty')
                    .eq('game_pin', roomToUse)
                    .single();

                if (sessError || !sessionData) {
                    router.push('/');
                    return;
                }

                // 2. Fetch Participant Info (Progress & Guard)
                const { data: pData, error: pError } = await supabaseGame
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
                    router.replace(`/player/${roomToUse}/game`);
                    return;
                }

                // Session Status Guard
                if (sessionData.status === 'finished' || sessionData.status === 'completed') {
                    router.replace(`/player/${roomToUse}/result`);
                    return;
                }
                if (sessionData.status === 'waiting' || sessionData.status === 'lobby') {
                    router.replace(`/player/${roomToUse}/waiting`);
                    return;
                }

                // Update Local State from DB
                setSessionId(sessionData.id);
                setRoomCode(roomToUse);
                setScore(pData.score || 0);
                setCurrentIndex(pData.current_question || 0);

                // Initialize Questions securely from API
                const qRes = await fetch(`/api/quiz/questions?sessionId=${sessionData.id}`);
                if (qRes.ok) {
                    const apiData = await qRes.json();
                    if (apiData.questions && Array.isArray(apiData.questions)) {
                        setQuestions(apiData.questions);
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
        const participantId = localStorage.getItem('nitroquiz_game_participantId');
        
        setSelectedOption(optionIndex);
        setIsAnswered(true);

        // Optimistic transition
        setTimeout(() => {
            nextQuestion();
        }, 300);

        // Update database and validate securely on backend
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
                    await supabaseGame.from('participants')
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
                    await supabaseGame.from('participants')
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

        const channel = supabaseGame
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
            supabaseGame.removeChannel(channel);
        };
    }, [router, roomCode, roomCodeFromParams]);

    // Global Timer Realtime Synchronization
    useEffect(() => {
        if (!sessionId) return;

        const fetchAndStartTimer = async () => {
            const { data } = await supabaseGame.from('sessions').select('started_at, total_time_minutes').eq('id', sessionId).single();
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

    const OPTION_COLORS = ['#2d6af2', '#f59e0b', '#ef4444', '#7C3AED']; // A=blue, B=amber, C=red, D=purple

    return (
        <div className="min-h-[100dvh] w-full bg-[#04060f] text-white font-display overflow-hidden relative flex flex-col">
            {/* ── Cinematic Background ── */}
            <div className="racing-stripe z-50 pointer-events-none absolute top-0 inset-x-0 h-1" />
            <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-30"
                style={{ backgroundImage: 'url("/assets/backgorund/homepage_bg.webp")', backgroundAttachment: 'fixed' }} />
            <div className="fixed inset-0 z-0 bg-gradient-to-t from-[#04060f] via-[#04060f]/85 to-[#2d6af2]/10 pointer-events-none" />
            <div className="fixed inset-0 z-0 bg-[linear-gradient(rgba(45,106,242,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(45,106,242,0.04)_1px,transparent_1px)] bg-[length:35px_35px] pointer-events-none" />
            {/* Ambient glow */}
            <div className="fixed top-0 left-1/3 w-[500px] h-[500px] bg-[#2d6af2]/8 blur-[140px] rounded-full pointer-events-none" />
            <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-[#7C3AED]/8 blur-[120px] rounded-full pointer-events-none" />

            {/* ── Main Content ── */}
            <div className="flex-1 flex flex-col items-center justify-center p-3 md:p-6 relative z-10">
                <div className="w-full max-w-4xl mx-auto flex flex-col items-center">

                    {/* ── HUD Panel ── */}
                    <div className="w-full bg-[#0a0e1a]/90 backdrop-blur-2xl border border-white/[0.06] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)' }}>

                        {/* ── Racing Progress Bar ── */}
                        <div className="w-full h-[3px] bg-white/[0.04] relative">
                            <motion.div
                                className="h-full relative"
                                style={{ background: 'linear-gradient(90deg, #2d6af2, #00ff9d)', boxShadow: '0 0 15px rgba(0,255,157,0.5), 0 0 30px rgba(45,106,242,0.3)' }}
                                initial={{ width: `${((currentIndex) / questions.length) * 100}%` }}
                                animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                            />
                        </div>

                        {/* ── Telemetry Header ── */}
                        <div className="grid grid-cols-3 items-center px-4 md:px-8 py-3 md:py-4" style={{ borderBottom: '1px solid rgba(45,106,242,0.12)' }}>
                            {/* LEFT: Lap/Question */}
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-[#2d6af2]/10 border border-[#2d6af2]/30 flex items-center justify-center transform -skew-x-[10deg]">
                                    <List className="w-4 h-4 md:w-5 md:h-5 text-[#5a9cff] transform skew-x-[10deg]" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[7px] md:text-[9px] uppercase tracking-[0.25em] text-[#5a9cff]/70 font-bold leading-none">
                                        {t("player_quiz.questions_label") || "LAP"}
                                    </span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-lg md:text-2xl font-black text-white leading-none italic" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                                            {(currentIndex + 1).toString().padStart(2, '0')}
                                        </span>
                                        <span className="text-[9px] md:text-xs font-bold text-white/20">/ {questions.length.toString().padStart(2, '0')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* CENTER: Timer HUD */}
                            <div className="flex justify-center">
                                {globalTimeLeft !== null && (
                                    <div className={`relative flex items-center px-5 md:px-8 py-1.5 md:py-2 transform -skew-x-[8deg] transition-all duration-300 ${globalTimeLeft <= 30
                                        ? 'bg-red-500/10 border border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                                        : 'bg-white/[0.03] border border-white/[0.08]'
                                        }`}>
                                        <span
                                            className={`transform skew-x-[8deg] text-base md:text-2xl font-black leading-none ${globalTimeLeft <= 30 ? 'text-red-500' : 'text-white'}`}
                                            style={{ fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.15em', fontVariantNumeric: 'tabular-nums' }}
                                        >
                                            {Math.floor(globalTimeLeft / 60).toString().padStart(2, '0')}:{(globalTimeLeft % 60).toString().padStart(2, '0')}
                                        </span>
                                        {globalTimeLeft <= 30 && (
                                            <div className="absolute inset-0 border border-red-500/30 animate-pulse pointer-events-none" />
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* RIGHT: Score Telemetry */}
                            <div className="flex flex-col items-end">
                                <span className="text-[7px] md:text-[9px] uppercase tracking-[0.25em] text-[#f59e0b]/70 font-bold text-right leading-none">
                                    {t("player_quiz.score_label") || "PTS"}
                                </span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-lg md:text-2xl font-black text-white leading-none italic" style={{ fontFamily: 'Orbitron, sans-serif' }}>{score}</span>
                                    <div className="flex gap-[2px] items-end ml-1">
                                        <div className="w-[2px] h-[6px] bg-[#f59e0b]/40 transform -skew-x-[20deg]" />
                                        <div className="w-[2px] h-[8px] bg-[#f59e0b]/60 transform -skew-x-[20deg]" />
                                        <div className="w-[2px] h-[10px] bg-[#f59e0b] shadow-[0_0_4px_#f59e0b] transform -skew-x-[20deg]" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Question Content ── */}
                        <div className="px-5 md:px-10 py-6 md:py-10">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentIndex}
                                    initial={{ y: 15, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -15, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="mb-6 md:mb-10 flex flex-col items-center"
                                >
                                    {currentQ.imageUrl && (
                                        <div className="mb-6 flex justify-center">
                                            <div className="bg-white/95 p-2 rounded-md shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:scale-105 transition-transform duration-300 cursor-zoom-in"
                                                 onClick={() => setZoomedImage(currentQ.imageUrl || null)}>
                                                <img
                                                    src={currentQ.imageUrl}
                                                    alt="Quiz visual"
                                                    className="max-h-[120px] md:max-h-[180px] object-contain"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <h3 className="text-base md:text-2xl font-black leading-tight text-white text-center text-balance max-w-3xl tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                                        {currentQ.question}
                                    </h3>
                                </motion.div>
                            </AnimatePresence>

                            {/* ── Answer Options — Skewed HUD Buttons ── */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                {currentQ.options.map((option, idx) => {
                                    const isSelected = selectedOption === idx;
                                    const optionColor = OPTION_COLORS[idx] || OPTION_COLORS[0];
                                    const letter = String.fromCharCode(65 + idx);
                                    const hasImage = !!option.image;

                                    return (
                                        <motion.button
                                            key={`${currentIndex}-${idx}`}
                                            whileTap={!isAnswered ? { scale: 0.97 } : {}}
                                            onClick={() => handleAnswer(idx)}
                                            disabled={isAnswered}
                                            className={`group/opt w-full relative text-left overflow-hidden transition-all duration-300 transform -skew-x-[6deg] outline-none ${isSelected
                                                ? 'shadow-[0_0_25px_rgba(255,255,255,0.1)]'
                                                : 'hover:shadow-[0_0_20px_rgba(45,106,242,0.15)]'
                                                }`}
                                            style={{
                                                background: isSelected
                                                    ? `linear-gradient(135deg, ${optionColor}30, ${optionColor}10)`
                                                    : 'rgba(10,14,26,0.8)',
                                                border: isSelected
                                                    ? `1.5px solid ${optionColor}`
                                                    : '1px solid rgba(255,255,255,0.06)',
                                                boxShadow: isSelected ? `0 0 20px ${optionColor}30, inset 0 0 30px ${optionColor}08` : undefined,
                                            }}
                                        >
                                            {/* Left color accent laser */}
                                            <div className="absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-300"
                                                style={{
                                                    background: isSelected
                                                        ? `linear-gradient(to bottom, ${optionColor}, ${optionColor}80)`
                                                        : `linear-gradient(to bottom, ${optionColor}60, transparent)`,
                                                    boxShadow: isSelected ? `0 0 8px ${optionColor}` : 'none',
                                                    opacity: isSelected ? 1 : 0.5,
                                                }} />

                                            {/* Hover shine effect */}
                                            <div className="absolute inset-0 bg-white/5 -translate-x-full group-hover/opt:translate-x-[200%] transition-transform duration-700 ease-in-out pointer-events-none" />

                                            {/* Option Image */}
                                            {hasImage && (
                                                <div
                                                    className="w-full h-28 sm:h-36 md:h-40 flex items-center justify-center overflow-hidden bg-black/20 border-b border-white/5 cursor-zoom-in transform skew-x-[6deg] p-3"
                                                    onClick={(e) => { e.stopPropagation(); setZoomedImage(option.image || null); }}
                                                >
                                                    <div className="w-20 h-20 sm:w-28 sm:h-28 bg-white/95 rounded-md p-2 shadow-[0_4px_12px_rgba(0,0,0,0.5)] flex items-center justify-center transition-transform group-hover/opt:scale-105">
                                                        <img src={option.image} alt={`Option ${letter}`} className="w-full h-full object-contain" />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 flex-1 w-full transform skew-x-[6deg]">
                                                {/* Letter badge */}
                                                <div
                                                    className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center font-black text-sm md:text-base flex-shrink-0 text-white transform -skew-x-[8deg] transition-all duration-300"
                                                    style={{
                                                        backgroundColor: isSelected ? optionColor : `${optionColor}25`,
                                                        border: `1px solid ${optionColor}${isSelected ? '' : '50'}`,
                                                        boxShadow: isSelected ? `0 0 12px ${optionColor}60` : 'none',
                                                    }}
                                                >
                                                    <span className="transform skew-x-[8deg]">{letter}</span>
                                                </div>

                                                {/* Option text */}
                                                <span className={`text-xs md:text-base font-bold flex-1 tracking-tight leading-snug transition-colors duration-300 ${isSelected ? 'text-white' : 'text-gray-300 group-hover/opt:text-white'}`}>
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
            </div>

            {/* Zoom Modal */}
            <AnimatePresence>
                {zoomedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 cursor-pointer"
                        onClick={() => setZoomedImage(null)}
                    >
                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            src={zoomedImage}
                            alt="Zoomed"
                            className="max-w-full max-h-full object-contain border border-white/10"
                            style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

