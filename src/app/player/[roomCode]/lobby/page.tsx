'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getUser } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { Loader2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

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

    const [status, setStatus] = useState<"loading" | "waiting" | "starting" | "error">("loading");
    const [errorMessage, setErrorMessage] = useState("");
    const [assignedCar, setAssignedCar] = useState<string>("/assets/car/car1_v2.webp");

    useEffect(() => {
        const user = getUser();
        if (!user) {
            router.push(`/player/${roomCode}/login`);
            return;
        }

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
                            user_id: user.id || null, // Real human player marks user_id if valid UUID
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

                // 4. Listen for game start
                // we can listen to Session status changing to "active"
                const channel = supabase.channel(`public:sessions:${sessionData.id}`)
                    .on(
                        'postgres_changes',
                        { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionData.id}` },
                        (payload) => {
                            if (payload.new.status === "active") {
                                setStatus("starting");
                                setTimeout(() => {
                                    router.push(`/player/${roomCode}/game`); // Not built yet, but placeholder
                                }, 2000);
                            }
                        }
                    ).subscribe();

                return () => {
                    supabase.removeChannel(channel);
                };

            } catch (err: any) {
                setStatus("error");
                setErrorMessage(err.message || "Unknown error occurred.");
            }
        };

        joinRoom();
    }, [roomCode, router]);

    return (
        <div className="bg-[#0b101a] text-white min-h-screen relative overflow-hidden font-body selection:bg-[#2d6af2] selection:text-white flex flex-col items-center justify-center p-4">
            <div className="fixed inset-0 z-0 city-silhouette pointer-events-none"></div>
            <div className="fixed inset-0 z-0 bg-gradient-to-t from-[#0b101a] via-transparent to-[#2d6af2]/10 pointer-events-none"></div>
            <div className="fixed bottom-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#2d6af2]/10 via-[#0a101f]/50 to-[#0a101f] pointer-events-none z-0"></div>
            <div className="fixed bottom-0 w-full h-1/2 bg-[linear-gradient(transparent_0%,rgba(45,106,242,0.1)_1px,transparent_1px),linear-gradient(90deg,transparent_0%,rgba(45,106,242,0.1)_1px,transparent_1px)] bg-[length:60px_60px] [transform:perspective(500px)_rotateX(60deg)] origin-bottom z-0 pointer-events-none opacity-20"></div>
            <div className="scanlines z-10 opacity-30 pointer-events-none"></div>

            <div className="relative z-20 w-full max-w-sm text-center">

                {status === "loading" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                        <Loader2 className="w-16 h-16 text-[#00ff9d] animate-spin mb-6" />
                        <h2 className="font-display text-2xl tracking-widest text-[#00ff9d] uppercase glow-text">CONNECTING...</h2>
                    </motion.div>
                )}

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

                {status === "waiting" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-black/40 border border-[#2d6af2]/30 p-8 rounded-3xl backdrop-blur-xl shadow-[0_0_50px_rgba(45,106,242,0.2)]"
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

                {status === "starting" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center"
                    >
                        <h1 className="font-display text-6xl md:text-8xl text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-500 uppercase tracking-tighter drop-shadow-[0_0_30px_rgba(250,204,21,0.6)] animate-pulse">
                            GO!
                        </h1>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
