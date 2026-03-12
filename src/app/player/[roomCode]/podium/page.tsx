"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trophy, Crown, Medal, Users, Clock, Star, ChevronRight, House } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import confetti from "canvas-confetti";
import { getUser } from "@/lib/storage";

const carImageMap: Record<string, string> = {
    purple: "/assets/car/car1_v2.webp",
    white: "/assets/car/car2_v2.webp",
    black: "/assets/car/car3_v2.webp",
    aqua: "/assets/car/car4_v2.webp",
    blue: "/assets/car/car5_v2.webp",
};

interface Participant {
    id: string;
    nickname: string;
    car_character: string;
    score: number;
    current_question: number;
    finished_at: string | null;
    duration: number;
    eliminated: boolean;
}

export default function PlayerLeaderboardPage() {
    const params = useParams();
    const router = useRouter();
    const roomCode = params.roomCode as string;

    const [participants, setParticipants] = useState<Participant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showResults, setShowResults] = useState(false);

    const currentUser = getUser();

    const fetchResults = async () => {
        try {
            const { data: sessionData, error: sessionError } = await supabase
                .from("sessions")
                .select("id")
                .eq("game_pin", roomCode)
                .single();

            if (sessionError || !sessionData) {
                console.error("Session not found", sessionError);
                return;
            }

            const { data: pData, error: pError } = await supabase
                .from("participants")
                .select("*")
                .eq("session_id", sessionData.id);

            if (!pError && pData) {
                setParticipants(pData as Participant[]);
            }
        } catch (err) {
            console.error("Failed to load leaderboard data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchResults();

        const channel = supabase
            .channel(`leaderboard_updates_${roomCode}`)
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "participants" }, () => {
                fetchResults();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [roomCode]);

    const rankedPlayers = [...participants].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const dA = a.duration || Infinity;
        const dB = b.duration || Infinity;
        return dA - dB;
    });

    const currentPlayerRank = rankedPlayers.findIndex(p => p.nickname === currentUser?.username) + 1;

    const triggerConfetti = () => {
        const duration = 4000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 50 };
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
        const interval: any = setInterval(() => {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 40 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    useEffect(() => {
        if (!isLoading) {
            setTimeout(() => {
                setShowResults(true);
                if (rankedPlayers.length > 0) setTimeout(() => triggerConfetti(), 1000);
            }, 600);
        }
    }, [isLoading, rankedPlayers.length]);

    const podiumVariants: any = {
        hidden: { y: 150, opacity: 0 },
        visible: (custom: number) => ({
            y: 0, opacity: 1,
            transition: { type: "spring", stiffness: 70, damping: 12, delay: custom * 0.35 + 0.4 }
        })
    };

    const firstPlace = rankedPlayers[0];
    const secondPlace = rankedPlayers[1];
    const thirdPlace = rankedPlayers[2];

    const formatDuration = (seconds: number | undefined | null) => {
        if (!seconds || seconds === Infinity) return "--:--";
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f] font-display text-white">
                <div className="text-center z-10">
                    <div className="w-16 h-16 border-4 border-[#2d6af2]/30 border-t-[#2d6af2] rounded-full animate-spin mx-auto mb-6"></div>
                    <p className="mt-4 text-[#2d6af2] text-xl tracking-[0.2em] uppercase animate-pulse">Establishing Signal...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden font-body text-white flex flex-col items-center pb-12">
            {/* Background */}
            <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0a0a0f] to-[#050508] pointer-events-none" />
            <div className="fixed inset-0 z-0 bg-[linear-gradient(rgba(45,106,242,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(45,106,242,0.05)_1px,transparent_1px)] bg-[length:40px_40px] pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#2d6af2]/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

            {/* Top Bar: Logo1 left, Logo2 right */}
            <div className="w-full max-w-lg z-30 px-4 pt-4 flex items-center justify-between">
                <img src="/assets/logo/logo1.png" alt="Logo 1" className="h-7 sm:h-9 object-contain" />
                <img src="/assets/logo/logo2.png" alt="Logo 2" className="h-7 sm:h-9 object-contain" />
            </div>

            <div className="w-full max-w-lg z-20 px-4">

                {/* Your Rank Badge */}
                {currentPlayerRank > 0 && showResults && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, type: "spring" }}
                        className="text-center mt-4 mb-4"
                    >
                        <div className="inline-flex flex-col items-center bg-black/60 border border-[#00ff9d]/40 backdrop-blur-md px-6 py-3 rounded-2xl shadow-[0_0_30px_rgba(0,255,157,0.2)]">
                            <span className="text-gray-400 text-[10px] uppercase tracking-widest mb-0.5">Your Finish Position</span>
                            <span className="font-display text-4xl font-black text-[#00ff9d] drop-shadow-[0_0_20px_rgba(0,255,157,0.6)]">
                                #{currentPlayerRank}
                            </span>
                            <span className="text-gray-500 text-[10px] mt-0.5">
                                {currentPlayerRank === 1 ? '🏆 Champion!' : currentPlayerRank === 2 ? '🥈 Runner-up!' : currentPlayerRank === 3 ? '🥉 Great race!' : 'Good effort!'}
                            </span>
                        </div>
                    </motion.div>
                )}

                {/* Compact Podium */}
                {showResults && rankedPlayers.length > 0 && (
                    <div className="relative flex items-end justify-center w-full h-[240px] sm:h-[280px] mb-4 px-2">
                        <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-2/3 h-12 bg-[#2d6af2]/20 blur-[25px] rounded-full pointer-events-none" />

                        {/* 2nd */}
                        {secondPlace && (
                            <motion.div custom={2} variants={podiumVariants} initial="hidden" animate="visible" className="flex flex-col items-center relative z-10 mx-[-5px]">
                                <div className="mb-1.5 text-center">
                                    <div className="bg-black/60 border border-slate-300/40 backdrop-blur-md px-2.5 py-1 rounded-lg">
                                        <p className={`font-display text-[10px] tracking-wider truncate max-w-[80px] ${secondPlace.nickname === currentUser?.username ? 'text-[#00ff9d] font-bold' : 'text-slate-200'}`}>
                                            {secondPlace.nickname} {secondPlace.nickname === currentUser?.username && '(YOU)'}
                                        </p>
                                        <p className="font-mono text-slate-400 text-[9px]">{secondPlace.score.toLocaleString()} PTS</p>
                                    </div>
                                </div>
                                <p className="text-3xl mb-0.5">🥈</p>
                                <div className="w-[70px] h-[110px] bg-gradient-to-b from-[#1a2235] to-[#0a0f1a] border-t-3 border-l border-r border-[#64748b] rounded-t-xl flex items-end justify-center pb-3">
                                    <span className="font-display text-3xl text-slate-600/50 font-bold">2</span>
                                </div>
                            </motion.div>
                        )}

                        {/* 1st */}
                        {firstPlace && (
                            <motion.div custom={3} variants={podiumVariants} initial="hidden" animate="visible" className="flex flex-col items-center relative z-20 mx-0.5 -mb-1">
                                <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="mb-0.5">
                                    <Crown className="w-7 h-7 text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]" />
                                </motion.div>
                                <div className="mb-1.5 text-center">
                                    <div className="bg-[#1a1500]/80 border border-yellow-500/60 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                                        <p className={`font-display text-xs font-bold tracking-widest uppercase truncate max-w-[100px] ${firstPlace.nickname === currentUser?.username ? 'text-[#00ff9d]' : 'text-yellow-500'}`}>
                                            {firstPlace.nickname} {firstPlace.nickname === currentUser?.username && '(YOU)'}
                                        </p>
                                        <p className="font-mono text-white text-[10px] mt-0.5 font-bold">{firstPlace.score.toLocaleString()} PTS</p>
                                    </div>
                                </div>
                                <p className="text-4xl mb-0.5">🚀</p>
                                <div className="w-[85px] h-[160px] bg-gradient-to-b from-[#2a1f0a] to-[#0a0f1a] border-t-6 border-l-2 border-r-2 border-[#eab308] rounded-t-xl relative overflow-hidden flex items-end justify-center pb-5">
                                    <div className="absolute top-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#eab308] to-transparent" />
                                    <span className="font-display text-5xl text-yellow-600/40 font-bold">1</span>
                                </div>
                            </motion.div>
                        )}

                        {/* 3rd */}
                        {thirdPlace && (
                            <motion.div custom={1} variants={podiumVariants} initial="hidden" animate="visible" className="flex flex-col items-center relative z-10 mx-[-5px]">
                                <div className="mb-1.5 text-center">
                                    <div className="bg-black/60 border border-orange-700/40 backdrop-blur-md px-2.5 py-1 rounded-lg">
                                        <p className={`font-display text-[10px] tracking-wider truncate max-w-[80px] ${thirdPlace.nickname === currentUser?.username ? 'text-[#00ff9d] font-bold' : 'text-orange-200'}`}>
                                            {thirdPlace.nickname} {thirdPlace.nickname === currentUser?.username && '(YOU)'}
                                        </p>
                                        <p className="font-mono text-orange-400 text-[9px]">{thirdPlace.score.toLocaleString()} PTS</p>
                                    </div>
                                </div>
                                <p className="text-2xl mb-0.5">🥉</p>
                                <div className="w-[60px] h-[85px] bg-gradient-to-b from-[#25140b] to-[#0a0f1a] border-t-3 border-l border-r border-[#c2410c] rounded-t-xl flex items-end justify-center pb-2">
                                    <span className="font-display text-3xl text-orange-700/40 font-bold">3</span>
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}

                {/* Leaderboard Table */}
                {showResults && rankedPlayers.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2, type: "spring", stiffness: 100, damping: 14 }}
                        className="bg-black/40 backdrop-blur-xl border border-[#2d6af2]/30 rounded-2xl p-3 sm:p-4 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                    >
                        <div className="space-y-1.5">
                            <AnimatePresence>
                                {rankedPlayers.map((player, index) => {
                                    const isMe = player.nickname === currentUser?.username;
                                    const rankColors = [
                                        "border-yellow-500/50 bg-yellow-500/5",
                                        "border-slate-300/50 bg-slate-300/5",
                                        "border-orange-600/50 bg-orange-600/5"
                                    ];

                                    return (
                                        <motion.div
                                            key={player.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 2.3 + (index * 0.08) }}
                                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-colors ${isMe ? 'bg-[#2d6af2]/15 border-[#2d6af2]/50 shadow-[inset_0_0_10px_rgba(45,106,242,0.2)]' : index < 3 ? rankColors[index] : 'border-white/5 bg-white/[0.02]'}`}
                                        >
                                            {/* Rank */}
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-display text-[10px] font-bold flex-shrink-0
                                                ${index === 0 ? "bg-yellow-500/20 text-yellow-500" :
                                                    index === 1 ? "bg-slate-300/20 text-slate-300" :
                                                        index === 2 ? "bg-orange-600/20 text-orange-400" :
                                                            "bg-white/5 text-gray-500"}`}
                                            >
                                                {index + 1}
                                            </div>

                                            {/* Car */}
                                            <div className="w-7 h-7 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {player.eliminated ? "💀" : (() => {
                                                    const baseCar = (player.car_character || "purple").replace('-bot', '');
                                                    const carSrc = carImageMap[baseCar] || carImageMap["purple"];
                                                    return <img src={carSrc} alt="car" className="w-full h-full object-contain p-0.5" />;
                                                })()}
                                            </div>

                                            {/* Name */}
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-display text-[10px] tracking-wider uppercase truncate ${isMe ? 'text-[#00ff9d] font-bold' : index === 0 ? 'text-yellow-400' : 'text-gray-300'}`}>
                                                    {player.nickname} {isMe && "(YOU)"}
                                                </p>
                                            </div>

                                            {/* Score */}
                                            <span className={`font-mono font-bold text-xs flex-shrink-0 ${isMe ? "text-[#00ff9d]" : index === 0 ? "text-yellow-400" : "text-[#00ff9d]"}`}>
                                                {player.score.toLocaleString()}
                                            </span>

                                            {/* Time */}
                                            <span className="text-cyan-400/70 font-mono text-[10px] flex-shrink-0">
                                                {formatDuration(player.duration)}
                                            </span>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}

                {/* Back Button */}
                {showResults && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 3 }}
                        className="mt-6 text-center"
                    >
                        <Button
                            onClick={() => router.push('/')}
                            className="bg-[#2d6af2]/20 border border-[#2d6af2]/50 text-white font-display text-xs px-6 py-4 rounded-xl uppercase tracking-widest shadow-[0_0_20px_rgba(45,106,242,0.3)] hover:bg-[#2d6af2]/40 transition-all gap-2"
                        >
                            <House className="w-4 h-4" /> Back to Home
                        </Button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
