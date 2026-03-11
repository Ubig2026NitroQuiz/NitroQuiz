"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trophy, Crown, Medal, User, Users, Clock, Star, ChevronRight, Home, RotateCcw, BarChart2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import confetti from "canvas-confetti";

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
    duration: number; // Duration taken to finish all correctly
    eliminated: boolean;
}

export default function PodiumPage() {
    const params = useParams();
    const router = useRouter();
    const roomCode = params.roomCode as string;

    const [participants, setParticipants] = useState<Participant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showResults, setShowResults] = useState(false);
    const [isReturning, setIsReturning] = useState(false);

    // Fetch final results
    useEffect(() => {
        const fetchResults = async () => {
            try {
                // Get Session ID from roomCode
                const { data: sessionData, error: sessionError } = await supabase
                    .from("sessions")
                    .select("id")
                    .eq("game_pin", roomCode)
                    .single();

                if (sessionError || !sessionData) {
                    console.error("Session not found", sessionError);
                    return;
                }

                // Fetch final Participants list
                const { data: pData, error: pError } = await supabase
                    .from("participants")
                    .select("*")
                    .eq("session_id", sessionData.id);

                if (!pError && pData) {
                    setParticipants(pData as Participant[]);
                }
            } catch (err) {
                console.error("Failed to load podium data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [roomCode]);

    // Rank players: Primary by Score (desc), Secondary by Duration (asc, faster is better)
    const rankedPlayers = [...participants].sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }

        // If scores are tied, the one who finished faster (smaller duration) wins.
        // Assuming undefined/null duration means they didn't finish properly.
        const durationA = a.duration || Infinity;
        const durationB = b.duration || Infinity;

        return durationA - durationB;
    });

    const triggerConfetti = () => {
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 50 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            // since particles fall down, start a bit higher than random
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    // Stagger reveal animations
    useEffect(() => {
        if (!isLoading) {
            setTimeout(() => {
                setShowResults(true);
                // Trigger fireworks effect just for winners
                if (rankedPlayers.length > 0) {
                    setTimeout(() => triggerConfetti(), 1500);
                }
            }, 800);
        }
    }, [isLoading, rankedPlayers.length]);


    // Animation Variants for Podium Steps
    const podiumVariants: any = {
        hidden: { y: 200, opacity: 0 },
        visible: (custom: number) => ({
            y: 0,
            opacity: 1,
            transition: {
                type: "spring" as const,
                stiffness: 70,
                damping: 12,
                delay: custom * 0.4 + 0.5 // staggered based on rank logic
            }
        })
    };

    // Top 3 Players
    const firstPlace = rankedPlayers[0];
    const secondPlace = rankedPlayers[1];
    const thirdPlace = rankedPlayers[2];

    // Rest of players
    const runnerUps = rankedPlayers.slice(3);

    const formatDuration = (seconds: number | undefined | null) => {
        if (!seconds || seconds === Infinity) return "--:--";
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f] relative overflow-hidden font-display text-white">
                <div className="text-center z-10">
                    <div className="w-16 h-16 border-4 border-[#2d6af2]/30 border-t-[#2d6af2] rounded-full animate-spin mx-auto mb-6"></div>
                    <p className="mt-4 text-[#2d6af2] text-xl tracking-[0.2em] uppercase animate-pulse">Establishing Signal...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden font-body text-white flex flex-col items-center pt-8 pb-12">

            {/* Dark Space & Grids Background */}
            <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0a0a0f] to-[#050508] pointer-events-none"></div>
            <div className="fixed inset-0 z-0 bg-[linear-gradient(rgba(45,106,242,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(45,106,242,0.05)_1px,transparent_1px)] bg-[length:40px_40px] pointer-events-none"></div>

            {/* Light Beams */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#2d6af2]/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
            <div className="scanlines z-10 opacity-30 pointer-events-none"></div>

            <div className="w-full max-w-5xl z-20 px-6">

                {/* Add Floating Actions */}
                <div className="fixed left-4 md:left-8 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-50">
                    <Button
                        onClick={() => router.push('/')}
                        className="w-14 h-14 rounded-full p-0 bg-black/60 backdrop-blur-md border border-[#2d6af2]/50 hover:bg-[#2d6af2]/20 hover:scale-110 flex items-center justify-center text-[#2d6af2] shadow-[0_0_15px_rgba(45,106,242,0.4)] transition-all"
                        title="Home"
                    >
                        <Home size={24} />
                    </Button>
                    <Button
                        onClick={() => router.push(`/host/${roomCode}/lobby`)}
                        className="w-14 h-14 rounded-full p-0 bg-black/60 backdrop-blur-md border border-[#00ff9d]/50 hover:bg-[#00ff9d]/20 hover:scale-110 flex items-center justify-center text-[#00ff9d] shadow-[0_0_15px_rgba(0,255,157,0.4)] transition-all"
                        title="Restart Room"
                    >
                        <RotateCcw size={24} />
                    </Button>
                </div>

                <div className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-50">
                    <Button
                        onClick={() => window.open('https://ubig.co.id', '_blank')}
                        className="w-14 h-14 rounded-full p-0 bg-black/60 backdrop-blur-md border border-yellow-500/50 hover:bg-yellow-500/20 hover:scale-110 flex items-center justify-center text-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.4)] transition-all"
                        title="Statistics"
                    >
                        <BarChart2 size={24} />
                    </Button>
                </div>

                {/* 3D Podium Container */}
                {showResults && rankedPlayers.length > 0 && (
                    <div className="relative flex items-end justify-center w-full h-[400px] sm:h-[450px] mb-20 px-4">

                        {/* Podium Stand Glow */}
                        <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-3/4 h-24 bg-[#2d6af2]/20 blur-[40px] rounded-full pointer-events-none"></div>

                        {/* 2nd Place */}
                        {secondPlace && (
                            <motion.div
                                custom={2} // delay multiplier
                                variants={podiumVariants}
                                initial="hidden"
                                animate="visible"
                                className="flex flex-col items-center relative z-10 mx-[-10px] sm:mx-2"
                            >
                                {/* Name Tag */}
                                <div className="mb-4 text-center">
                                    <div className="bg-black/60 border border-slate-300/40 backdrop-blur-md px-4 py-2 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
                                        <p className="font-display text-slate-200 text-sm sm:text-base tracking-wider truncate max-w-[120px]">{secondPlace.nickname}</p>
                                        <p className="font-mono text-slate-400 text-xs mt-1">{secondPlace.score.toLocaleString()} PTS</p>
                                    </div>
                                    <div className="w-0.5 h-6 bg-slate-400/30 mx-auto mt-2"></div>
                                </div>

                                {/* Avatar/Car Representation */}
                                <div className="absolute top-[80px] z-20 transform -translate-y-1/2 drop-shadow-[0_0_15px_rgba(200,200,200,0.4)]">
                                    <p className="text-5xl sm:text-6xl">🥈</p>
                                    <Medal className="w-8 h-8 text-slate-300 absolute -right-4 -bottom-2 bg-black/50 rounded-full" />
                                </div>

                                {/* The Block */}
                                <div className="w-[100px] sm:w-[130px] h-[180px] sm:h-[220px] bg-gradient-to-b from-[#1a2235] to-[#0a0f1a] border-t-4 border-l border-r border-[#64748b] rounded-t-xl relative overflow-hidden shadow-2xl flex items-end justify-center pb-6">
                                    <div className="absolute top-0 w-full h-full opacity-30 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:10px_10px]"></div>
                                    <span className="font-display text-5xl sm:text-7xl text-slate-600/50 font-bold">2</span>
                                </div>
                            </motion.div>
                        )}

                        {/* 1st Place (Center, Tallest) */}
                        {firstPlace && (
                            <motion.div
                                custom={3}
                                variants={podiumVariants}
                                initial="hidden"
                                animate="visible"
                                className="flex flex-col items-center relative z-20 mx-0 sm:mx-4 -mb-4"
                            >
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                    className="absolute -top-[140px]"
                                >
                                    <Crown className="w-12 h-12 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
                                </motion.div>

                                {/* Name Tag */}
                                <div className="mb-4 text-center mt-[-80px]">
                                    <div className="bg-[#1a1500]/80 border border-yellow-500/60 backdrop-blur-md px-6 py-3 rounded-2xl shadow-[0_0_30px_rgba(250,204,21,0.3)]">
                                        <p className="font-display text-yellow-500 text-lg sm:text-xl font-bold tracking-widest uppercase shadow-black drop-shadow-md truncate max-w-[150px]">{firstPlace.nickname}</p>
                                        <p className="font-mono text-white text-md mt-1 font-bold">{firstPlace.score.toLocaleString()} PTS</p>
                                    </div>
                                    <div className="w-0.5 h-8 bg-yellow-500/50 mx-auto mt-2"></div>
                                </div>

                                {/* Avatar/Car Representation */}
                                <div className="absolute top-[80px] sm:top-[90px] z-20 transform -translate-y-1/2 drop-shadow-[0_0_25px_rgba(250,204,21,0.6)]">
                                    <p className="text-7xl sm:text-8xl relative z-10">🚀</p>
                                    <Trophy className="w-12 h-12 text-yellow-400 absolute -right-6 -bottom-2 bg-black/60 p-2 rounded-full border border-yellow-500/50" />
                                </div>

                                {/* The Block */}
                                <div className="w-[120px] sm:w-[150px] h-[250px] sm:h-[300px] bg-gradient-to-b from-[#2a1f0a] to-[#0a0f1a] border-t-8 border-l-2 border-r-2 border-[#eab308] rounded-t-xl relative overflow-hidden shadow-[0_-10px_40px_rgba(250,204,21,0.15)] flex items-end justify-center pb-8">
                                    <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-[#eab308] to-transparent"></div>
                                    <div className="absolute inset-0 bg-yellow-500/5 opacity-50 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-yellow-500/40 to-transparent"></div>
                                    <span className="font-display text-7xl sm:text-9xl text-yellow-600/40 font-bold">1</span>
                                </div>
                            </motion.div>
                        )}

                        {/* 3rd Place */}
                        {thirdPlace && (
                            <motion.div
                                custom={1}
                                variants={podiumVariants}
                                initial="hidden"
                                animate="visible"
                                className="flex flex-col items-center relative z-10 mx-[-10px] sm:mx-2"
                            >
                                {/* Name Tag */}
                                <div className="mb-4 text-center">
                                    <div className="bg-black/60 border border-orange-700/40 backdrop-blur-md px-4 py-2 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
                                        <p className="font-display text-orange-200 text-sm sm:text-base tracking-wider truncate max-w-[120px]">{thirdPlace.nickname}</p>
                                        <p className="font-mono text-orange-400 text-xs mt-1">{thirdPlace.score.toLocaleString()} PTS</p>
                                    </div>
                                    <div className="w-0.5 h-6 bg-orange-700/30 mx-auto mt-2"></div>
                                </div>

                                {/* Avatar/Car Representation */}
                                <div className="absolute top-[80px] z-20 transform -translate-y-1/2 drop-shadow-[0_0_15px_rgba(194,65,12,0.4)]">
                                    <p className="text-4xl sm:text-5xl">🥉</p>
                                    <Medal className="w-8 h-8 text-orange-600 absolute -right-3 -bottom-2 bg-black/50 rounded-full" />
                                </div>

                                {/* The Block */}
                                <div className="w-[90px] sm:w-[120px] h-[140px] sm:h-[180px] bg-gradient-to-b from-[#25140b] to-[#0a0f1a] border-t-4 border-l border-r border-[#c2410c] rounded-t-xl relative overflow-hidden shadow-2xl flex items-end justify-center pb-4">
                                    <span className="font-display text-5xl sm:text-7xl text-orange-700/40 font-bold">3</span>
                                </div>
                            </motion.div>
                        )}

                    </div>
                )}

                {/* Leaderboard Table (Rows 4+) */}
                {showResults && rankedPlayers.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 2.5, type: "spring", stiffness: 100, damping: 14 }}
                        className="bg-black/40 backdrop-blur-xl border border-[#2d6af2]/30 rounded-[2rem] p-6 sm:p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
                    >
                        <h3 className="font-display text-xl text-[#00ff9d] uppercase tracking-widest mb-6 flex items-center gap-3">
                            <Users className="w-5 h-5" />
                            Complete Standings
                        </h3>

                        <div className="overflow-x-auto w-full custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[#2d6af2]/20 text-gray-400 font-display text-xs tracking-wider">
                                        <th className="px-4 py-4 w-16 text-center">RANK</th>
                                        <th className="px-4 py-4">RACER INFO</th>
                                        <th className="px-4 py-4 text-center">TIME TAKEN</th>
                                        <th className="px-4 py-4 text-right">SCORE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {rankedPlayers.map((player, index) => {
                                            const isTop3 = index < 3;

                                            return (
                                                <motion.tr
                                                    key={player.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 2.8 + (index * 0.1) }}
                                                    className={`border-b border-[#2d6af2]/10 transition-colors ${isTop3
                                                        ? (index === 0 ? "bg-yellow-500/5" : index === 1 ? "bg-slate-300/5" : "bg-orange-600/5")
                                                        : "hover:bg-[#2d6af2]/5"
                                                        }`}
                                                >
                                                    <td className="px-4 py-4 text-center">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto font-display text-sm
                                                            ${index === 0 ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/50" :
                                                                index === 1 ? "bg-slate-300/20 text-slate-300 border border-slate-300/50" :
                                                                    index === 2 ? "bg-orange-600/20 text-orange-400 border border-orange-600/50" :
                                                                        "bg-white/5 text-gray-500"
                                                            }`}
                                                        >
                                                            {index + 1}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center text-lg shadow-inner overflow-hidden">
                                                                {player.eliminated ? (
                                                                    "💀"
                                                                ) : (() => {
                                                                    const baseCar = (player.car_character || "purple").replace('-bot', '');
                                                                    const carSrc = carImageMap[baseCar] || carImageMap["purple"];
                                                                    return <img src={carSrc} alt="car" className="w-full h-full object-contain p-1" />;
                                                                })()}
                                                            </div>
                                                            <div>
                                                                <p className={`font-display tracking-wider uppercase ${isTop3 ? "text-white" : "text-gray-300"} ${index === 0 && 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]'}`}>
                                                                    {player.nickname}
                                                                </p>
                                                                <p className="text-[10px] text-gray-500 font-mono mt-0.5">ID: {player.id.substring(0, 8)}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-black/40 border border-[#2d6af2]/20 text-cyan-400 font-mono text-sm">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {formatDuration(player.duration)}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <span className={`font-mono font-bold text-lg ${index === 0 ? "text-yellow-400" : "text-[#00ff9d]"}`}>
                                                            {player.score.toLocaleString()}
                                                        </span>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </AnimatePresence>
                                </tbody>
                            </table>

                            {rankedPlayers.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    <Star className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p className="font-display tracking-widest text-sm uppercase">No participants found</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {showResults && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 4 }}
                        className="mt-12 text-center pb-24"
                    >
                        <Button
                            onClick={() => {
                                setIsReturning(true);
                                router.push('/host/select-quiz');
                            }}
                            disabled={isReturning}
                            className={`bg-transparent border border-[#2d6af2]/50 text-[#2d6af2] font-display text-sm px-8 py-6 rounded-xl uppercase tracking-widest transition-all gap-2 group ${isReturning ? "opacity-50 cursor-not-allowed" : "hover:bg-[#2d6af2]/10"}`}
                        >
                            {isReturning ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-[#2d6af2]/30 border-t-[#2d6af2] rounded-full animate-spin"></div>
                                    RETURNING...
                                </span>
                            ) : (
                                <>
                                    Return to Selection <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </motion.div>
                )}

            </div>

        </div>
    );
}
