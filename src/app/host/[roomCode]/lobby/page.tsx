"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    Copy,
    Users,
    Play,
    ArrowLeft,
    VolumeX,
    Volume2,
    Maximize2,
    Check,
    X,
    Plus
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";
import { Dialog, DialogContent, DialogOverlay, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Mock Translation (same as before)
const t = (key: string, params?: any) => {
    const translations: Record<string, string> = {
        "hostroom.title": "LOBBY",
        "hostroom.start": "START",
        "hostroom.playerCount": `PLAYERS: ${params?.count || 0}`,
        "hostroom.waiting": "WAITING FOR PLAYERS...",
        "hostroom.kickconfirmation": `KICK ${params?.name}?`,
        "hostroom.cancel": "CANCEL",
        "hostroom.kick": "KICK",
        "hostroom.loadingMore": "LOADING DATA..."
    };
    return translations[key] || key;
};

// Utils inline
const breakOnCaps = (str: string) => str;
const formatUrlBreakable = (url: string) => url.replace(/https?:\/\//, "");

// Car mappings (Keep for now, maybe replace with avatars later if requested, but for now just style the container)
const carGifMap: Record<string, string> = {
    purple: "/assets/car/car1_v2.webp",
    white: "/assets/car/car2_v2.webp",
    black: "/assets/car/car3_v2.webp",
    aqua: "/assets/car/car4_v2.webp",
    blue: "/assets/car/car5_v2.webp",
};

interface Participant {
    id: string;
    nickname: string;
    car: string;
    joined_at: string;
}

export default function HostRoomPage() {
    const params = useParams();
    const router = useRouter();
    const roomCode = params.roomCode as string;

    const [participants, setParticipants] = useState<Participant[]>([]);
    const [countdown, setCountdown] = useState(0);

    const audioRef = useRef<HTMLAudioElement>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [hasInteracted, setHasInteracted] = useState(false);

    const [open, setOpen] = useState(false);
    const [joinLink, setJoinLink] = useState("");
    const [copiedRoom, setCopiedRoom] = useState(false);
    const [copiedJoin, setCopiedJoin] = useState(false);

    const [kickDialogOpen, setKickDialogOpen] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState<Participant | null>(null);

    useEffect(() => {
        const savedMuted = localStorage.getItem("settings_muted");
        if (savedMuted !== null) {
            setIsMuted(savedMuted === "true");
        }

        if (typeof window !== "undefined") {
            setJoinLink(`${window.location.origin}/join/${roomCode}`);
        }
    }, [roomCode]);

    // Audio control
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.volume = 0.5;

        const playAudio = async () => {
            try {
                await audio.play();
                setHasInteracted(true);
            } catch (err) {
                console.warn("Audio play blocked:", err);
            }
        };

        if (isMuted) {
            audio.pause();
        } else {
            playAudio();
        }
    }, [isMuted]);

    const copyToClipboard = async (
        text: string,
        setFeedback: (val: boolean) => void
    ) => {
        try {
            await navigator.clipboard.writeText(text);
            setFeedback(true);
            setTimeout(() => setFeedback(false), 2000);
        } catch (err) {
            console.error("Copy failed:", err);
        }
    };

    const startGame = () => {
        setCountdown(5);
        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    router.push(`/host/${roomCode}/game`);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const confirmKick = () => {
        if (!selectedPlayer) return;
        setParticipants(prev => prev.filter(p => p.id !== selectedPlayer.id));
        setKickDialogOpen(false);
        setSelectedPlayer(null);
    };

    const simulateJoin = () => {
        const cars = Object.keys(carGifMap);
        const randomCar = cars[Math.floor(Math.random() * cars.length)];
        const newPlayer: Participant = {
            id: Math.random().toString(36).substr(2, 9),
            nickname: `Agent-${Math.floor(Math.random() * 999)}`,
            car: randomCar,
            joined_at: new Date().toISOString()
        };
        setParticipants(prev => [...prev, newPlayer]);
    };

    if (countdown > 0) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f] relative overflow-hidden font-display text-white">
                <div className="fixed inset-0 z-0 city-silhouette pointer-events-none opacity-50"></div>
                <div className="fixed inset-0 z-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-blue-900/20 pointer-events-none"></div>
                <div className="scanlines"></div>
                <div className="text-center z-10">
                    <motion.div
                        className="text-9xl font-bold text-white drop-shadow-[0_0_30px_rgba(45,106,242,0.8)]"
                        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                    >
                        {countdown}
                    </motion.div>
                    <p className="mt-4 text-[#2d6af2] text-xl tracking-[0.5em] uppercase animate-pulse">Initializing Race...</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen bg-[#0a0a0f] relative overflow-hidden font-body text-white flex flex-col"
            onClick={() => setHasInteracted(true)}
        >
            {/* Background Layers */}
            <div className="fixed inset-0 z-0 city-silhouette pointer-events-none"></div>
            <div className="fixed inset-0 z-0 bg-gradient-to-t from-background-dark via-transparent to-blue-900/10 pointer-events-none"></div>
            <div className="fixed bottom-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-background-dark/50 to-background-dark pointer-events-none z-0"></div>
            <div className="fixed bottom-0 w-full h-1/2 bg-[linear-gradient(transparent_0%,rgba(45,106,242,0.1)_1px,transparent_1px),linear-gradient(90deg,transparent_0%,rgba(45,106,242,0.1)_1px,transparent_1px)] bg-[length:60px_60px] [transform:perspective(500px)_rotateX(60deg)] origin-bottom z-0 pointer-events-none opacity-20"></div>
            <div className="scanlines"></div>

            {/* Main Content */}
            <div className="relative z-20 flex flex-col h-full w-full mx-auto p-4 md:p-8">

                {/* Header */}
                <div className="w-full flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <h1 className="font-display !text-4xl text-white mb-2 uppercase tracking-tight transform -skew-x-6 drop-shadow-[0_0_10px_rgba(45,106,242,0.8)]">
                            <span className="text-white">NITRO</span>
                            <span className="text-neon-blue text-blue-600">QUIZ</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            onClick={simulateJoin}
                            variant="outline"
                            className="bg-[#00ff9d]/5 border-[#00ff9d]/30 text-[#00ff9d] hover:bg-[#00ff9d]/10 hover:text-[#00ff9d] font-display text-xs uppercase tracking-wider rounded-xl h-12"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Add Bot
                        </Button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsMuted((p) => !p)}
                            className={`p-3 border rounded-xl shadow-lg transition-all ${isMuted
                                ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                                : "bg-[#2d6af2]/10 border-[#2d6af2]/30 text-[#2d6af2] hover:bg-[#2d6af2]/20 shadow-[0_0_10px_rgba(45,106,242,0.3)]"
                                }`}
                        >
                            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                        </motion.button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start relative">

                    {/* Left Column: Room Details (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col gap-4 bg-black/60 backdrop-blur-md rounded-[2rem] p-8 shadow-[0_0_30px_rgba(45,106,242,0.15)] border border-[#2d6af2]/50 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#2d6af2]/20 to-transparent rounded-bl-full pointer-events-none"></div>

                            <div className="text-center relative z-10">
                                <div
                                    className="relative group/code cursor-pointer bg-white/5 rounded-2xl p-4 border border-white/10 hover:border-[#2d6af2]/50 transition-all"
                                    onClick={() => copyToClipboard(roomCode, setCopiedRoom)}
                                >
                                    <h1 className="font-display text-5xl sm:text-6xl text-white tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                                        {roomCode}
                                    </h1>
                                    <div className="absolute top-2 right-2">
                                        {copiedRoom ? <Check size={14} className="text-[#00ff9d]" /> : <Copy size={14} className="text-gray-500 group-hover/code:text-[#2d6af2]" />}
                                    </div>
                                </div>
                            </div>

                            <div
                                className="flex justify-center bg-white p-4 rounded-2xl w-[220px] sm:w-[260px] md:w-[300px] lg:w-[20vw] xl:w-[22vw] mx-auto shadow-[0_0_20px_rgba(45,106,242,0.3)] relative group/qr cursor-pointer"
                                onClick={() => setOpen(true)}
                            >
                                <QRCode
                                    value={joinLink}
                                    style={{ width: "100%", height: "auto" }}
                                />
                            </div>


                            <div
                                className="relative group/link cursor-pointer bg-[#0a101f] p-4 rounded-xl border border-[#2d6af2]/20 hover:border-[#2d6af2] transition-all"
                                onClick={() => copyToClipboard(joinLink, setCopiedJoin)}
                            >
                                <p className="text-center text-[#2d6af2] text-xs font-display tracking-wider truncate px-6">
                                    {formatUrlBreakable(joinLink)}
                                </p>
                                <div className="absolute top-1/2 -translate-y-1/2 right-3">
                                    {copiedJoin ? <Check size={14} className="text-[#00ff9d]" /> : <Copy size={14} className="text-gray-500 group-hover/link:text-[#2d6af2]" />}
                                </div>
                            </div>

                            <Button
                                onClick={startGame}
                                disabled={participants.length === 0}
                                className="w-full bg-gradient-to-r from-[#2d6af2] to-[#00ff9d] hover:from-[#3b7bf5] hover:to-[#33ffb0] text-black font-display text-lg py-6 rounded-xl shadow-[0_0_20px_rgba(45,106,242,0.4)] hover:shadow-[0_0_30px_rgba(45,106,242,0.6)] transition-all uppercase tracking-widest transform active:scale-[0.98] disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 disabled:shadow-none border-none"
                            >
                                <Play className="mr-2 h-5 w-5 fill-current" />
                                {t("hostroom.start")}
                            </Button>
                        </motion.div>
                    </div>

                    {/* Right Column: Players (8 cols) */}
                    <div className="lg:col-span-8 h-full min-h-[500px]">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-black/60 backdrop-blur-md rounded-[2rem] p-4 h-full shadow-[0_0_30px_rgba(0,255,157,0.1)] border border-[#00ff9d]/30 relative overflow-hidden flex flex-col"
                        >
                            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-[#00ff9d]/10 to-transparent rounded-br-full pointer-events-none"></div>

                            <div className="flex items-center justify-start gap-1 relative z-10 border-b border-[#00ff9d]/10 pb-4">
                                <div className="p-3">
                                    <Users size={24} />
                                </div>
                                <h2 className="font-display text-2xl text-white tracking-wide">
                                    Players: {participants.length}
                                </h2>

                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
                                {participants.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-6 opacity-60">
                                        <div className="w-24 h-24 rounded-full bg-[#00ff9d]/5 border border-[#00ff9d]/20 flex items-center justify-center animate-pulse">
                                            <Users size={40} className="text-[#00ff9d]/50" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-display tracking-[0.2em] text-sm uppercase text-[#00ff9d]">{t("hostroom.waiting")}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4 pt-5">
                                        <AnimatePresence >
                                            {participants.map((player) => (
                                                <motion.div
                                                    key={player.id}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    className="group relative bg-[#0a101f] border border-[#2d6af2]/20 hover:border-[#2d6af2] rounded-xl p-4 flex flex-col items-center transition-all hover:shadow-[0_0_20px_rgba(45,106,242,0.3)] hover:-translate-y-1 cursor-pointer overflow-hidden"
                                                    onClick={() => {
                                                        setSelectedPlayer(player);
                                                        setKickDialogOpen(true);
                                                    }}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-t from-[#2d6af2]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                                    <div className="relative mb-3 w-full flex justify-center">
                                                        <div className="absolute inset-0 bg-[#2d6af2]/20 blur-xl rounded-full scale-50 group-hover:scale-100 transition-transform duration-500"></div>
                                                        {/* <img
                                                            src={carGifMap[player.car] || "/assets/car/car5_v2.webp"}
                                                            alt={player.nickname}
                                                            className="w-24 h-16 object-contain relative z-10 drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]"
                                                        /> */}
                                                        <p className="text-6xl">🏎️</p>
                                                    </div>

                                                    <div className="w-full text-center relative z-10">
                                                        <div className="bg-[#2d6af2]/10 border border-[#2d6af2]/20 rounded px-2 py-1 mb-1">
                                                            <p className="font-display text-white text-xs tracking-wide truncate">
                                                                {player.nickname}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="absolute top-2 right-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-20">
                                                        <div className="bg-red-500/10 border border-red-500/30 p-1.5 rounded-lg hover:bg-red-500/80 hover:text-white text-red-500 transition-colors">
                                                            <X size={14} />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Kick Dialog */}
            <Dialog open={kickDialogOpen} onOpenChange={setKickDialogOpen}>
                <DialogOverlay className="bg-black/80 backdrop-blur-sm" />
                <DialogContent className="bg-[#0a101f] border border-[#2d6af2]/50 text-white p-0 gap-0 overflow-hidden rounded-2xl max-w-sm shadow-[0_0_30px_rgba(45,106,242,0.15)]">
                    <div className="h-1.5 bg-gradient-to-r from-[#2d6af2] to-[#00ff9d] w-full"></div>
                    <DialogHeader className="flex p-6 justify-center text-center">
                        <p className="text-6xl text-center pb-5">🏎️</p>
                        <DialogTitle className="font-display text-xl uppercase tracking-widest text-white text-center drop-shadow-[0_0_10px_rgba(45,106,242,0.5)]">
                            Kick{" "}
                            <span className="text-[#00ff9d] font-bold text-xl font-display tracking-wider drop-shadow-[0_0_8px_rgba(0,255,157,0.5)]">
                                {selectedPlayer?.nickname}
                            </span>
                            ?
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-6 pt-2 text-center">
                        <div className="flex gap-3">
                            <Button
                                onClick={() => setKickDialogOpen(false)}
                                variant="ghost"
                                className="flex-1 bg-transparent border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white font-display text-xs uppercase tracking-wider h-12 rounded-xl transition-all"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={confirmKick}
                                className="flex-1 bg-gradient-to-r from-[#2d6af2] to-[#00ff9d] hover:from-[#3b7bf5] hover:to-[#33ffb0] text-black border-none font-display text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(45,106,242,0.4)] h-12 rounded-xl transition-all"
                            >
                                Kick
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* QR Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogOverlay className="bg-black/90 backdrop-blur-md" />
                <DialogContent className="bg-transparent border-none p-0 flex flex-col items-center justify-center shadow-none max-w-none w-auto [&>button]:top-4 [&>button]:right-4 [&>button]:bg-white/10 [&>button]:hover:bg-white/20 [&>button]:text-white [&>button]:rounded-full [&>button]:w-10 [&>button]:h-10">
                    <div className="bg-white p-6 rounded-3xl shadow-[0_0_50px_rgba(45,106,242,0.5)] transform transition-transform duration-300">
                        <QRCode value={joinLink} size={550} />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
