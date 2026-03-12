'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getUser } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { Loader2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const carGifs = [
    "/assets/car/car1_v2.webp",
    "/assets/car/car2_v2.webp",
    "/assets/car/car3_v2.webp",
    "/assets/car/car4_v2.webp",
    "/assets/car/car5_v2.webp",
];
const carMap = ["purple", "white", "black", "aqua", "blue"];

export default function PlayerLobbyPage() {
    const router = useRouter();
    const params = useParams();
    const roomCode = params.roomCode as string;

    const [status, setStatus] = useState<"loading" | "waiting" | "countdown" | "go" | "error">("loading");
    const [errorMessage, setErrorMessage] = useState("");
    const [assignedCar, setAssignedCar] = useState<string>("/assets/car/car1_v2.webp");
    const [countdownValue, setCountdownValue] = useState(10);
    const [sessionId, setSessionId] = useState<string | null>(null);

    useEffect(() => {
        const user = getUser();
        if (!user) {
            router.push(`/player/${roomCode}/login`);
            return;
        }

        let cleanup: (() => void) | undefined;

        const joinRoom = async () => {
            try {
                // 1. Get Session ID
                const { data: sessionData, error: sessionError } = await supabase
                    .from("sessions")
                    .select("id, status")
                    .eq("game_pin", roomCode)
                    .single();

                if (sessionError || !sessionData) {
                    setStatus("error");
                    setErrorMessage("Room not found or invalid.");
                    return;
                }

                // If the game is already active, go straight to countdown
                if (sessionData.status === "active") {
                    setStatus("countdown");
                    return;
                }

                // Temporary logic: random car
                const randIndex = Math.floor(Math.random() * carMap.length);
                const carChoice = carMap[randIndex];
                setAssignedCar(carGifs[randIndex]);

                // 2. Check if already joined
                const { data: existingP } = await supabase
                    .from("participants")
                    .select("id")
                    .eq("session_id", sessionData.id)
                    .eq("nickname", user.username)
                    .maybeSingle();

                if (!existingP) {
                    // 3. Insert Participant
                    const { error: insertError } = await supabase
                        .from("participants")
                        .insert({
                            session_id: sessionData.id,
                            user_id: user.id || null,
                            nickname: user.username,
                            car_character: carChoice,
                            score: 0,
                            minigame: false
                        });

                    if (insertError) {
                        setStatus("error");
                        setErrorMessage("Failed to enter room. " + insertError.message);
                        return;
                    }
                }

                setStatus("waiting");

                // 4. Listen for game start (session status -> "active")
                const channel = supabase.channel(`public:sessions:${sessionData.id}`)
                    .on(
                        'postgres_changes',
                        { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionData.id}` },
                        (payload) => {
                            if (payload.new.status === "active") {
                                setStatus("countdown");
                                // Preload quiz questions from session
                                preloadQuizData(sessionData.id);
                            }
                        }
                    ).subscribe();

                cleanup = () => {
                    supabase.removeChannel(channel);
                };

            } catch (err: any) {
                setStatus("error");
                setErrorMessage(err.message || "Unknown error occurred.");
            }
        };

        joinRoom();

        return () => {
            if (cleanup) cleanup();
        };
    }, [roomCode, router]);

    // Preload quiz data from session's current_questions
    const preloadQuizData = async (sessId: string) => {
        try {
            const { data } = await supabase
                .from("sessions")
                .select("current_questions, question_limit, quiz_id")
                .eq("id", sessId)
                .single();

            if (data?.current_questions) {
                let questions = data.current_questions;
                if (typeof questions === 'string') {
                    try { questions = JSON.parse(questions); } catch (e) { }
                }
                // Store for gamespeed to pick up
                localStorage.setItem('nitroquiz_game_questions', JSON.stringify(questions));
                localStorage.setItem('nitroquiz_game_roomCode', roomCode);
                localStorage.setItem('nitroquiz_game_sessionId', sessId);
                if (data.quiz_id) {
                    localStorage.setItem('nitroquiz_game_quizId', data.quiz_id);
                }
            }

            // Prefetch gamespeed page for faster load
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = '/gamespeed';
            document.head.appendChild(link);
        } catch (err) {
            console.error('Failed to preload quiz:', err);
        }
    };

    // Countdown timer: 10 -> 0, then redirect to gamespeed
    useEffect(() => {
        if (status !== "countdown") return;

        if (countdownValue <= 0) {
            setStatus("go");
            // Brief "GO!" display then redirect
            setTimeout(() => {
                router.push('/gamespeed');
            }, 1500);
            return;
        }

        const timer = setTimeout(() => {
            setCountdownValue(prev => prev - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [status, countdownValue, router]);

    // Racing-themed countdown labels
    const getCountdownLabel = (val: number) => {
        if (val > 7) return "ENGINES ON";
        if (val > 4) return "REV IT UP";
        if (val > 2) return "GET SET";
        if (val > 0) return "READY";
        return "GO!";
    };

    const getCountdownColor = (val: number) => {
        if (val > 6) return "text-[#2d6af2]";
        if (val > 3) return "text-yellow-400";
        return "text-[#00ff9d]";
    };

    return (
        <div className="bg-[#0b101a] text-white min-h-screen relative overflow-hidden font-body flex flex-col items-center justify-center p-4">
            {/* Simplified BG - no heavy external images */}
            <div className="fixed inset-0 z-0 bg-gradient-to-t from-[#0b101a] via-transparent to-[#2d6af2]/10 pointer-events-none"></div>
            <div className="fixed bottom-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#2d6af2]/10 via-[#0a101f]/50 to-[#0a101f] pointer-events-none z-0"></div>
            <div className="fixed bottom-0 w-full h-1/2 bg-[linear-gradient(transparent_0%,rgba(45,106,242,0.1)_1px,transparent_1px),linear-gradient(90deg,transparent_0%,rgba(45,106,242,0.1)_1px,transparent_1px)] bg-[length:60px_60px] [transform:perspective(500px)_rotateX(60deg)] origin-bottom z-0 pointer-events-none opacity-20"></div>

            <div className="relative z-20 w-full max-w-sm text-center">

                {/* LOADING */}
                {status === "loading" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                        <Loader2 className="w-16 h-16 text-[#00ff9d] animate-spin mb-6" />
                        <h2 className="font-display text-2xl tracking-widest text-[#00ff9d] uppercase glow-text">CONNECTING...</h2>
                    </motion.div>
                )}

                {/* ERROR */}
                {status === "error" && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-500/10 border border-red-500/50 p-6 rounded-2xl backdrop-blur-md">
                        <Zap className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="font-display text-xl text-red-400 mb-2 uppercase tracking-widest">CONNECTION LOST</h2>
                        <p className="text-gray-400 text-sm font-mono">{errorMessage}</p>
                        <button
                            onClick={() => router.push('/')}
                            className="mt-6 px-6 py-2 bg-red-500/20 hover:bg-red-500 text-white rounded-xl transition-colors font-display text-xs uppercase tracking-wider"
                        >
                            Back to Home
                        </button>
                    </motion.div>
                )}

                {/* WAITING FOR HOST */}
                {status === "waiting" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-black/40 border border-[#2d6af2]/30 p-8 rounded-3xl shadow-[0_0_50px_rgba(45,106,242,0.2)]"
                    >
                        <div className="mb-8">
                            <h2 className="font-display text-3xl text-white uppercase tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] mb-2">YOU'RE IN</h2>
                            <p className="text-gray-400 font-mono text-sm tracking-wider">ROOM: <span className="text-[#00ff9d] font-bold">{roomCode}</span></p>
                        </div>

                        <div className="relative w-48 h-32 mx-auto mb-8 flex items-center justify-center bg-gradient-to-b from-white/5 to-transparent rounded-2xl border border-white/5">
                            <div className="absolute inset-0 bg-[#00ff9d]/5 blur-xl rounded-full"></div>
                            <img src={assignedCar} alt="Your Car" className="w-[120px] object-contain relative z-10 drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] transform hover:scale-110 transition-transform cursor-pointer" />
                        </div>

                        <div className="w-full h-1 bg-[#2d6af2]/20 rounded-full overflow-hidden mb-6">
                            <motion.div
                                className="h-full bg-gradient-to-r from-[#2d6af2] to-[#00ff9d]"
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                            />
                        </div>

                        <p className="font-display text-[#00ff9d] text-sm uppercase tracking-widest animate-pulse">Waiting for host to start...</p>
                    </motion.div>
                )}

                {/* COUNTDOWN */}
                <AnimatePresence mode="wait">
                    {status === "countdown" && (
                        <motion.div
                            key="countdown"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
                        >
                            {/* Racing lights indicator */}
                            <div className="flex gap-4 mb-10">
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <motion.div
                                        key={i}
                                        className={`w-8 h-8 rounded-full border-2 transition-all duration-300 ${countdownValue <= (10 - i * 2)
                                                ? 'bg-red-500 border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.8)]'
                                                : 'bg-gray-800 border-gray-600'
                                            } ${countdownValue <= 0 ? 'bg-[#00ff9d] border-[#00ff9d] shadow-[0_0_25px_rgba(0,255,157,0.8)]' : ''}`}
                                        animate={countdownValue <= (10 - i * 2) ? { scale: [1, 1.2, 1] } : {}}
                                        transition={{ duration: 0.3 }}
                                    />
                                ))}
                            </div>

                            {/* Big countdown number */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={countdownValue}
                                    initial={{ opacity: 0, scale: 2, y: -30 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.5, y: 30 }}
                                    transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 15 }}
                                    className="relative"
                                >
                                    <span className={`font-display text-[120px] md:text-[160px] font-black leading-none tracking-tighter ${getCountdownColor(countdownValue)} drop-shadow-[0_0_40px_currentColor]`}>
                                        {countdownValue > 0 ? countdownValue : "GO!"}
                                    </span>
                                </motion.div>
                            </AnimatePresence>

                            {/* Status label */}
                            <motion.p
                                key={`label-${getCountdownLabel(countdownValue)}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="font-display text-lg tracking-[0.3em] uppercase text-gray-400 mt-6"
                            >
                                {getCountdownLabel(countdownValue)}
                            </motion.p>

                            {/* Pulsing ring effect */}
                            <motion.div
                                className="absolute w-64 h-64 rounded-full border border-[#2d6af2]/20"
                                animate={{
                                    scale: [1, 1.5, 1],
                                    opacity: [0.3, 0, 0.3],
                                }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 2,
                                    ease: "easeInOut",
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* GO! */}
                {status === "go" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center"
                    >
                        <motion.h1
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 0.5 }}
                            className="font-display text-[100px] md:text-[140px] text-transparent bg-clip-text bg-gradient-to-b from-[#00ff9d] to-[#2d6af2] uppercase tracking-tighter leading-none font-black drop-shadow-[0_0_50px_rgba(0,255,157,0.6)]"
                        >
                            GO!
                        </motion.h1>
                        <p className="font-display text-[#00ff9d] text-sm uppercase tracking-[0.3em] mt-4 animate-pulse">
                            LAUNCHING RACE...
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
