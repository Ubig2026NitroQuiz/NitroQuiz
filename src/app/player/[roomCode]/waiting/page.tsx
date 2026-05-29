'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { syncServerTime, getSyncedServerTime } from '@/lib/serverTime';
import { Loader2, Zap, Users, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from "react-i18next";
import { useAuth } from '@/contexts/AuthContext'; import { ASSET_LIST, TRACK_ASSETS } from '@/lib/gameAssets';
import { supabaseGame } from '@/lib/supabase/game-client';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

export const PLAYER_CHARACTERS = [
    {
        id: 'rico',
        name: 'RICO',
        imageSrc: '/assets/characters/rico/showroom/showroom1.png',
        gifSrc: '/assets/characters/rico/showroom/pose1.gif',
        stats: { speed: 80, accel: 60, handling: 70 }
    },
    {
        id: 'gecho',
        name: 'NINJA GECKO',
        imageSrc: '/assets/characters/gecho/showroom/showroom1.png',
        gifSrc: '/assets/characters/gecho/showroom/pose1.gif',
        stats: { speed: 70, accel: 90, handling: 80 }
    },
    {
        id: 'roadhog',
        name: 'ROADHOG',
        imageSrc: '/assets/characters/roadhog/showroom/showroom1.png',
        gifSrc: '/assets/characters/roadhog/showroom/pose1.gif',
        stats: { speed: 60, accel: 80, handling: 50 }
    }
];

// Helper: Generate initials from a name
const getInitials = (name: string): string => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
};

// Initials avatar colors based on nickname hash
const AVATAR_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#10b981', '#ec4899', '#06b6d4', '#f97316'];
const getAvatarColor = (name: string): string => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// Reusable InitialsAvatar component
const InitialsAvatar = ({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) => {
    const fontSize = size === 'lg' ? 'text-xl' : size === 'md' ? 'text-base' : 'text-[10px]';
    return (
        <div
            className={`w-full h-full rounded-full flex items-center justify-center ${fontSize} font-black text-white`}
            style={{ backgroundColor: getAvatarColor(name) }}
        >
            {getInitials(name)}
        </div>
    );
};


// Reusable Confirmation Dialog for logout/exit
const LogoutConfirmDialog = ({ onConfirm, onCancel, t }: { onConfirm: () => void, onCancel: () => void, t: any }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
        <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-[#0b0811]/95 border border-red-500/20 border-t-4 border-t-red-600 p-0 overflow-hidden rounded-sm max-w-sm w-full shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_40px_rgba(220,38,38,0.2)] backdrop-blur-2xl"
        >
            <div className="p-8">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 flex items-center justify-center rounded-sm transform -skew-x-[10deg] shadow-[inset_0_0_15px_rgba(220,38,38,0.2)] mb-4">
                        <LogOut className="w-6 h-6 text-red-500 scale-x-[-1] transform skew-x-[10deg]" />
                    </div>
                    <h3 className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-white to-red-200 font-display font-black italic uppercase tracking-wider text-center drop-shadow-[0_0_10px_rgba(220,38,38,0.6)]">
                        {t("player_waiting.exit_title")}
                    </h3>
                </div>
                
                <p className="text-center text-red-500/70 font-display font-bold text-[10px] tracking-[0.2em] mb-8 uppercase border border-red-500/20 bg-[#1a0a10] p-4 rounded-sm shadow-inner">
                    {t("player_waiting.exit_description")}
                </p>
                
                <div className="flex gap-4 w-full">
                    <button
                        onClick={onCancel}
                        className="group/btn relative flex-1 flex items-center justify-center bg-[#0f142b] border border-white/5 text-white/40 hover:bg-white/10 hover:border-white/20 hover:text-white font-display font-black text-[11px] uppercase tracking-widest h-12 transform -skew-x-[15deg] transition-all overflow-hidden outline-none"
                    >
                        <div className="absolute inset-0 bg-white/5 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                        <div className="transform skew-x-[15deg] relative z-10">{t("player_waiting.exit_cancel")}</div>
                    </button>
                    <button
                        onClick={onConfirm}
                        className="group/btn relative flex-1 flex items-center justify-center bg-red-600/20 border border-red-500 text-red-500 hover:bg-red-600 hover:text-white font-display font-black text-[11px] uppercase tracking-widest h-12 transform -skew-x-[15deg] transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] outline-none overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                        <div className="transform skew-x-[15deg] relative z-10">{t("player_waiting.exit_confirm")}</div>
                    </button>
                </div>
            </div>
        </motion.div>
    </motion.div>
);


export default function PlayerWaitingPage() {
    const router = useRouter();
    const params = useParams();
    const { t } = useTranslation();
    const roomCode = (params.roomCode as string)?.toUpperCase();
    const { profile, loading: authLoading } = useAuth();

    const [status, setStatus] = useState<"loading" | "waiting" | "countdown" | "go" | "error">("loading");
    const [errorMessage, setErrorMessage] = useState("");
    const [assignedCarId, setAssignedCarId] = useState<string>("rico");
    const [isSelectingCharacter, setIsSelectingCharacter] = useState(false);
    const [pendingCharacterId, setPendingCharacterId] = useState<string>("rico");
    const [countdownValue, setCountdownValue] = useState(3);
    const [participantId, setParticipantId] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [participantCount, setParticipantCount] = useState(1);
    const [username, setUsername] = useState("");
    const [userAvatar, setUserAvatar] = useState<string | null>(null);
    const [allParticipants, setAllParticipants] = useState<{ id?: string; nickname: string; car_character: string; avatar_url?: string | null }[]>([]);
    const [isExiting, setIsExiting] = useState(false);
    const statusRef = useRef(status);
    useEffect(() => { statusRef.current = status; }, [status]);

    const handleConfirmExit = async () => {
        if (participantId) {
            try {
                // 1. Broadcast exit before deletion for instant host update
                if (channelRef.current) {
                    channelRef.current.send({
                        type: "broadcast",
                        event: "player_left",
                        payload: { id: participantId }
                    });
                }
                
                await supabaseGame.from("participants").delete().eq("id", participantId);
                
                // Clean up local storage
                localStorage.removeItem('nitroquiz_game_participantId');
                localStorage.removeItem('nitroquiz_game_nickname');
                localStorage.removeItem('nitroquiz_game_roomCode');
                localStorage.removeItem('nitroquiz_game_carCharacter');
            } catch (err) {
                console.error("Error during exit cleanup:", err);
            }
        }
        router.push('/');
    };

    // Sync server time on mount
    useEffect(() => {
        const initSync = async () => {
            await syncServerTime();
        };
        initSync();
    }, []);

    // Countdown logic deduplicated
    const startCountdown = useCallback((startTime: number, sessId: string) => {
        if (statusRef.current === "countdown" || statusRef.current === "go") return;

        setStatus("countdown");
        statusRef.current = "countdown";
        preloadQuizData(sessId);

        const syncLoop = () => {
            const nowOnServer = getSyncedServerTime();
            const elapsed = nowOnServer - startTime;
            const remaining = Math.max(0, 3000 - elapsed);
            const displayVal = Math.min(3, Math.ceil(remaining / 1000));

            setCountdownValue(displayVal);

            if (remaining > 0 && statusRef.current === "countdown") {
                requestAnimationFrame(syncLoop);
            } else if (remaining <= 0 && statusRef.current === "countdown") {
                setStatus("go");
                setTimeout(() => {
                    router.push(`/player/${roomCode}/game`);
                }, 800);
            }
        };
        requestAnimationFrame(syncLoop);
    }, [roomCode, router]);

    const channelRef = useRef<any>(null);

    useEffect(() => {
        if (authLoading) return;
        let isMounted = true;

        const fetchSessionState = async () => {
            try {
                const { data: sessionData, error: sessionError } = await supabaseGame
                    .from("sessions").select("id, status, countdown_started_at, started_at, created_at").eq("game_pin", roomCode).single();

                if (sessionError || !sessionData || !isMounted) {
                    if (sessionError) {
                        setStatus("error");
                        setErrorMessage("Room not found or invalid.");
                    }
                    return;
                }

                if (sessionData.status === "active") {
                    router.push(`/player/${roomCode}/game`);
                    return;
                }

                if (sessionData.status === "finished" || sessionData.status === "completed") {
                    router.push(`/player/${roomCode}/result`);
                    return;
                }

                // If countdown has already started but session not yet active
                if (sessionData.countdown_started_at && !sessionData.started_at) {
                    const startTime = new Date(sessionData.countdown_started_at).getTime();
                    const nowOnServer = getSyncedServerTime();
                    const elapsed = nowOnServer - startTime;
                    const remaining = Math.max(0, 3000 - elapsed);

                    if (remaining > 0) {
                        startCountdown(startTime, sessionData.id);
                    } else {
                        // Countdown already finished but status not yet 'active' in DB cache
                        setStatus("go");
                        router.push(`/player/${roomCode}/game`);
                        return;
                    }
                }

                // If we are here, we are in waiting state or countdown has started
                if (!sessionData.countdown_started_at) {
                    setStatus("waiting");
                }
                setSessionId(sessionData.id);

                // Setup Subscriptions only once
                if (!channelRef.current) {
                    const channel = supabaseGame.channel(`player-session-${sessionData.id}`)
                        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionData.id}` },
                            (payload) => {
                                // Re-verify via fetchSessionState to be safe and consistent
                                fetchSessionState();
                            })
                        .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `session_id=eq.${sessionData.id}` },
                            async (payload) => {
                                const { data: pList, count } = await supabaseGame
                                    .from("participants")
                                    .select("id, nickname, car_character, avatar_url, user_id", { count: "exact" })
                                    .eq("session_id", sessionData.id);

                                if (isMounted) {
                                    if (count !== null) setParticipantCount(count);
                                    if (pList) {
                                        setAllParticipants(pList);

                                        // ✅ CEK: apakah player ini masih ada di list?
                                        const storedId = localStorage.getItem('nitroquiz_game_participantId');
                                        const stillExists = pList.some(p => p.id === storedId);
                                        if (!stillExists && storedId) {
                                            // Di-kick! Cleanup dan redirect ke home
                                            localStorage.removeItem('nitroquiz_game_participantId');
                                            localStorage.removeItem('nitroquiz_game_nickname');
                                            localStorage.removeItem('nitroquiz_game_roomCode');
                                            localStorage.removeItem('nitroquiz_game_carCharacter');
                                            router.replace('/');
                                            return;
                                        }
                                    }
                                }
                            })
                        .on('broadcast', { event: 'kick_player' }, (payload) => {
                            const myId = localStorage.getItem('nitroquiz_game_participantId');
                            if (payload.payload?.id === myId) {
                                console.log("[NitroQuiz] You have been kicked by the host.");
                                localStorage.removeItem('nitroquiz_game_participantId');
                                localStorage.removeItem('nitroquiz_game_nickname');
                                localStorage.removeItem('nitroquiz_game_roomCode');
                                localStorage.removeItem('nitroquiz_game_carCharacter');
                                router.replace('/?kicked=true');
                            }
                        })
                        .subscribe((status) => {
                            if (status === 'SUBSCRIBED') {
                                console.log("[NitroQuiz] Player Subscribed to realtime");
                            }
                        });

                    channelRef.current = channel;
                }

                // Initial fetch for additional info (participants)
                const storedParticipantId = typeof window !== 'undefined' ? localStorage.getItem('nitroquiz_game_participantId') : null;
                const storedRoomCode = typeof window !== 'undefined' ? localStorage.getItem('nitroquiz_game_roomCode') : null;

                if (!storedParticipantId || storedRoomCode !== roomCode) {
                    router.replace(`/join/${roomCode}`);
                    return;
                }

                const storedCarCharacter = typeof window !== 'undefined' ? localStorage.getItem('nitroquiz_game_carCharacter') : null;
                const assignedCar = storedCarCharacter || "rico";

                setParticipantId(storedParticipantId);
                setAssignedCarId(assignedCar);
                setPendingCharacterId(assignedCar);

                const { data: pList, count } = await supabaseGame.from("participants")
                    .select("id, nickname, car_character, avatar_url, user_id", { count: "exact" }).eq("session_id", sessionData.id);

                if (isMounted) {
                    if (count !== null) setParticipantCount(count);
                    if (pList) {
                        setAllParticipants(pList);
                        // Find myself by participantId (localStorage) OR user_id (Supabase Auth)
                        const me = pList.find(p => p.id === storedParticipantId || (profile?.id && p.user_id === profile.id));
                        if (me) {
                            setUsername(me.nickname);
                            setUserAvatar(profile?.avatar_url || me.avatar_url || null);
                            if (me.car_character) {
                                setAssignedCarId(me.car_character);
                                setPendingCharacterId(me.car_character);
                            }
                        } else {
                            // ⛔ KICKED: Not in the participant list anymore
                            console.log("[NitroQuiz] Participant record not found. Redirecting...");
                            localStorage.removeItem('nitroquiz_game_participantId');
                            localStorage.removeItem('nitroquiz_game_nickname');
                            localStorage.removeItem('nitroquiz_game_roomCode');
                            localStorage.removeItem('nitroquiz_game_carCharacter');
                            router.replace('/?kicked=true');
                            return;
                        }
                    }
                }
            } catch (err: any) {
                if (isMounted) {
                    setStatus("error");
                    setErrorMessage(err.message || "Unknown error occurred.");
                }
            }
        };

        fetchSessionState();

        // Handle visibility change to catch missed events when tab is inactive
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log("[NitroQuiz] Tab focused, re-verifying session state...");
                fetchSessionState();
            }
        };
        window.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            isMounted = false;
            if (channelRef.current) {
                supabaseGame.removeChannel(channelRef.current);
                channelRef.current = null;
            }
            window.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [roomCode, router, startCountdown, authLoading, profile]);

    const preloadQuizData = async (sessId: string) => {
        try {
            const { data } = await supabaseGame.from("sessions")
                .select("current_questions, question_limit, quiz_id, difficulty").eq("id", sessId).single();
            if (data?.current_questions) {
                let questions = data.current_questions;
                if (typeof questions === 'string') { try { questions = JSON.parse(questions); } catch (e) { } }
                localStorage.setItem('nitroquiz_game_questions', JSON.stringify(questions));
                localStorage.setItem('nitroquiz_game_roomCode', roomCode);
                localStorage.setItem('nitroquiz_game_sessionId', sessId);
                localStorage.setItem('nitroquiz_game_difficulty', data.difficulty || 'easy');
                if (data.quiz_id) localStorage.setItem('nitroquiz_game_quizId', data.quiz_id);
                localStorage.removeItem('nitroquiz_game_score');
                localStorage.removeItem('nitroquiz_game_questionIndex');
            }

            const difficulty = data?.difficulty || 'easy';
            const route = `/player/${roomCode}/game`;

            const link = document.createElement('link'); link.rel = 'prefetch'; link.href = route; document.head.appendChild(link);
        } catch (err) { console.error('Failed to preload quiz:', err); }
    };

    // --- Asset Background Preloader ---
    // Runs during idle in waiting room (2s after mount).
    // Non-blocking: each Image loads asynchronously via browser.
    // Only stores to global store AFTER onload (ensures valid width/height).
    useEffect(() => {
        const preloadAssets = () => {
            console.log("[NitroQuiz] Starting background asset preload...");

            if (typeof window === 'undefined') return;
            if (!(window as any).__nitroquiz_asset_store) {
                (window as any).__nitroquiz_asset_store = {};
            }
            const store = (window as any).__nitroquiz_asset_store;
            // let charId = assignedCarId || 'rico';
            let charId = 'rico'; // Forced to 'rico'
            let loaded = 0;
            let total = 0;

            const onDone = () => {
                loaded++;
                if (loaded === total) {
                    console.log(`[NitroQuiz] Preload complete: ${loaded}/${total} assets cached.`);
                }
            };

            // 1. ASSET_LIST (Characters, UI, effects)
            ASSET_LIST.forEach(asset => {
                if (!asset.src) return;
                total++;
                let src = asset.src;
                if (src.includes('/characters/rico/')) {
                    src = src.replace('/characters/rico/', `/characters/${charId}/`);
                }
                const img = new Image();
                img.onload = () => {
                    (img as any).assetName = asset.name;
                    store[asset.name] = img;
                    onDone();
                };
                img.onerror = () => onDone(); // Skip failures silently
                img.src = src;
            });

            // 2. TRACK_ASSETS (Road, landmarks, obstacles)
            const uniqueTrackSources = Array.from(new Set(TRACK_ASSETS.map(item => item.src))).filter(Boolean);
            uniqueTrackSources.forEach(src => {
                if (store[src]) return; // Already loaded
                total++;
                const img = new Image();
                img.onload = () => {
                    (img as any).assetName = src;
                    store[src] = img;
                    onDone();
                };
                img.onerror = () => onDone();
                img.src = src;
            });

            // 3. Showroom visuals (Characters)
            PLAYER_CHARACTERS.forEach(char => {
                [char.imageSrc, char.gifSrc].filter(Boolean).forEach(src => {
                    if (!src || store[src]) return;
                    total++;
                    const img = new Image();
                    img.onload = () => { store[src] = img; onDone(); };
                    img.onerror = () => onDone();
                    img.src = src;
                });
            });

            if (total === 0) console.log("[NitroQuiz] No assets to preload.");
        };

        // Delay 2s to let waiting room UI mount first
        const timeout = setTimeout(preloadAssets, 2000);
        return () => clearTimeout(timeout);
    }, [assignedCarId]);

    const getCountdownLabel = (val: number) => {
        if (val === 3) return t("player_waiting.ready");
        if (val === 2) return t("player_waiting.steady");
        if (val === 1) return t("player_waiting.go_race");
        return t("player_waiting.go");
    };
    const getCountdownColor = (val: number) => {
        if (val === 3) return "text-red-500";
        if (val === 2) return "text-yellow-400";
        return "text-[#00ff9d]";
    };

    const handleSelectCharacter = async () => {
        if (participantId && sessionId && pendingCharacterId !== assignedCarId) {
            await supabaseGame.from("participants")
                .update({ car_character: pendingCharacterId })
                .eq("id", participantId);
        }
        setAssignedCarId(pendingCharacterId);
        setIsSelectingCharacter(false);
    };

    const assignedChar = PLAYER_CHARACTERS.find(c => c.id === assignedCarId) || PLAYER_CHARACTERS[0];
    const displayVisual = assignedChar.gifSrc || assignedChar.imageSrc;

    return (
        <TooltipProvider delayDuration={100}>
        <div className="bg-[#04060f] text-white min-h-screen relative overflow-hidden font-body flex flex-col items-center justify-center p-4">
            {/* Homepage Background Image */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
                style={{
                    backgroundImage: 'url("/assets/backgorund/homepage_bg.webp")',
                    backgroundAttachment: 'fixed'
                }}
            />
            {/* Overlays for readability */}
            <div className="fixed inset-0 z-0 bg-gradient-to-t from-[#04060f] via-[#04060f]/60 to-[#7C3AED]/10 pointer-events-none" />

            <div className="relative z-20 w-full max-w-sm text-center">

                {/* LOADING */}
                {status === "loading" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                        <Loader2 className="w-16 h-16 text-[#00ff9d] animate-spin mb-6" />
                        <h2 className="font-display text-2xl tracking-widest text-[#00ff9d] uppercase glow-text">{t("player_waiting.connecting")}</h2>
                    </motion.div>
                )}

                {/* ERROR */}
                {status === "error" && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-500/10 border border-red-500/50 p-6 rounded-2xl backdrop-blur-md">
                        <Zap className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="font-display text-xl text-red-400 mb-2 uppercase tracking-widest">{t("player_waiting.connection_lost")}</h2>
                        <p className="text-gray-400 text-sm font-mono">{errorMessage}</p>
                        <button onClick={() => router.push('/')} className="mt-6 px-6 py-2 bg-red-500/20 hover:bg-red-500 text-white rounded-xl transition-colors font-display text-xs uppercase tracking-wider">
                            {t("player_waiting.back_home")}
                        </button>
                    </motion.div>
                )}

                {/* ── WAITING ── */}
                {status === "waiting" && (
                    <>
                        {/* ===== MOBILE ===== */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="md:hidden fixed inset-0 z-30 bg-[#04060f]/85 backdrop-blur-sm flex flex-col">
                            {/* Top bar */}
                            <div className="flex items-center justify-between px-4 pt-6 pb-3 flex-shrink-0">
                                <img src="/assets/logo/logo1.png" alt="Logo" className="h-9 object-contain" />
                            </div>

                            {/* Players header */}
                            <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(80,110,180,0.15)' }}>
                                <div className="grid grid-cols-3 gap-0.5 flex-shrink-0">
                                    {Array.from({ length: 9 }).map((_, i) => (
                                        <div key={i} className="w-1 h-1 rounded-full bg-[#4a7cdc]" />
                                    ))}
                                </div>
                                <span className="font-display text-white text-xs font-bold tracking-widest">
                                    {t("player_waiting.player", { count: participantCount })}
                                </span>
                            </div>

                            {/* Scrollable player cards grid */}
                            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-3 auto-rows-max"
                                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(45,106,242,0.25) transparent' }}>

                                {/* YOU card */}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="group relative w-full bg-[#0a0e1a] border-t border-r border-[#7C3AED]/40 shadow-[inset_0_0_30px_rgba(124,58,237,0.05)]"
                                            style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)', aspectRatio: '1/1.15' }}>
                                            
                                            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#b89aff] via-[#7C3AED] to-[#3a1a7a] z-10 shadow-[0_0_8px_#7C3AED]" />
                                    <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(124,58,237,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.3) 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
                                    
                                    <div className="absolute top-2 left-3 z-20 w-6 h-6 rounded-full overflow-hidden border border-[#7C3AED]/60 shadow-[0_0_8px_rgba(124,58,237,0.4)] backdrop-blur-md bg-black/50">
                                        {userAvatar ? (
                                            <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <InitialsAvatar name={username} size="sm" />
                                        )}
                                    </div>

                                    <div className="absolute top-2 right-2 z-20">
                                        <div className="font-display font-black text-[8px] tracking-[0.15em] px-2 py-0.5 transform -skew-x-[12deg] shadow-[0_0_10px_rgba(124,58,237,0.5)] border border-[#a78bfa]/50"
                                            style={{ background: 'linear-gradient(90deg, #7C3AED, #5b21b6)', color: '#fff' }}>
                                            <span className="block transform skew-x-[12deg]">{t("player_waiting.you")}</span>
                                        </div>
                                    </div>

                                    <div className="absolute inset-x-0 top-6 bottom-10 flex items-center justify-center p-2 z-10 w-full h-auto">
                                        <img src={assignedChar.imageSrc} alt="car"
                                            className="w-full h-full object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)] filter contrast-[1.1] brightness-[1.05]" />
                                    </div>

                                    <div className="absolute bottom-0 inset-x-0 z-20 h-[40px] bg-gradient-to-t from-[#04060f] to-transparent flex flex-col justify-end px-2 pb-1.5 pt-4">
                                        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#7C3AED]/0 via-[#7C3AED] to-[#7C3AED]/0" />
                                        <p className="font-display text-white text-[10px] font-black tracking-[0.15em] truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-none mb-0.5">
                                            {username}
                                        </p>
                                        <div className="flex justify-between items-center">
                                            <p className="font-display text-[#a78bfa] text-[7px] tracking-[0.2em] uppercase opacity-90 leading-none truncate pr-1">
                                                {assignedChar.name}
                                            </p>
                                            <div className="flex gap-[2px]">
                                                <div className="w-[2px] h-[5px] bg-[#7C3AED]/60 transform -skew-x-[20deg]" />
                                                <div className="w-[2px] h-[5px] bg-[#7C3AED]/80 transform -skew-x-[20deg]" />
                                                <div className="w-[2px] h-[5px] bg-white shadow-[0_0_5px_#fff] transform -skew-x-[20deg]" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                </TooltipTrigger>
                                    <TooltipContent className="bg-[#111729] text-white border-[#7C3AED]/50 font-display text-xs px-3 py-1.5 shadow-[0_0_15px_rgba(124,58,237,0.4)]">
                                        {username}
                                    </TooltipContent>
                                </Tooltip>

                                {/* Other players */}
                                {allParticipants.filter(p => p.nickname !== username).map((p, i) => {
                                    const charObj = PLAYER_CHARACTERS.find(c => c.id === p.car_character) || PLAYER_CHARACTERS[0];
                                    return (
                                        <Tooltip key={i}>
                                            <TooltipTrigger asChild>
                                                <div className="group relative w-full bg-[#0a0e1a]/80 border-t border-r border-[#2d6af2]/30 shadow-[inset_0_0_30px_rgba(45,106,242,0.05)]"
                                                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)', aspectRatio: '1/1.15' }}>
                                                    
                                                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#5a9cff] via-[#2d6af2] to-[#123075] z-10 shadow-[0_0_8px_#2d6af2] opacity-80" />
                                            <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(45,106,242,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(45,106,242,0.3) 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
                                            
                                            <div className="absolute top-2 left-3 z-20 w-6 h-6 rounded-full overflow-hidden border border-[#2d6af2]/50 shadow-[0_0_6px_rgba(45,106,242,0.3)] backdrop-blur-md bg-black/50">
                                                {p.avatar_url ? (
                                                    <img src={p.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <InitialsAvatar name={p.nickname} size="sm" />
                                                )}
                                            </div>

                                            <div className="absolute inset-x-0 top-6 bottom-10 flex items-center justify-center p-2 z-10 w-full h-auto">
                                                <img src={charObj.imageSrc} alt="car" className="w-full h-full object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)] filter brightness-[0.95]" />
                                            </div>

                                            <div className="absolute bottom-0 inset-x-0 z-20 h-[40px] bg-gradient-to-t from-[#04060f] to-transparent flex flex-col justify-end px-2 pb-1.5 pt-4">
                                                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#2d6af2]/0 via-[#2d6af2] to-[#2d6af2]/0 opacity-50" />
                                                <p className="font-display text-white/90 text-[10px] font-black tracking-[0.15em] truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-none mb-0.5">
                                                    {p.nickname}
                                                </p>
                                                <div className="flex justify-between items-center">
                                                    <p className="font-display text-[#5a9cff]/80 text-[7px] tracking-[0.2em] uppercase leading-none truncate pr-1">
                                                        {charObj.name}
                                                    </p>
                                                    <div className="flex gap-[2px] opacity-60">
                                                        <div className="w-[2px] h-[5px] bg-[#2d6af2]/60 transform -skew-x-[20deg]" />
                                                        <div className="w-[2px] h-[5px] bg-[#2d6af2]/80 transform -skew-x-[20deg]" />
                                                        <div className="w-[2px] h-[5px] bg-[#5a9cff] shadow-[0_0_5px_#5a9cff] transform -skew-x-[20deg]" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-[#111729] text-white border-[#2d6af2]/50 font-display text-xs px-3 py-1.5 shadow-[0_0_15px_rgba(45,106,242,0.4)]">
                                            {p.nickname}
                                        </TooltipContent>
                                        </Tooltip>
                                    );
                                })}

                                {/* Empty slot */}
                                <div className="group relative w-full bg-[#0a0e1a]/40 border-t border-r border-[#7090cc]/20 border-dashed"
                                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)', aspectRatio: '1/1.15' }}>
                                    <div className="absolute inset-0 flex items-center justify-center p-3">
                                        <svg viewBox="0 0 180 80" className="w-[100px] h-[45px] opacity-[0.2] transition-opacity" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect x="8" y="28" width="164" height="34" rx="4" stroke="#7090cc" strokeWidth="2" />
                                            <rect x="42" y="12" width="96" height="28" rx="4" stroke="#7090cc" strokeWidth="2" />
                                            <circle cx="42" cy="66" r="10" stroke="#7090cc" strokeWidth="2" />
                                            <circle cx="138" cy="66" r="10" stroke="#7090cc" strokeWidth="2" />
                                            <line x1="8" y1="42" x2="172" y2="42" stroke="#7090cc" strokeWidth="1" strokeDasharray="6 4" />
                                        </svg>
                                    </div>
                                    <div className="absolute bottom-2.5 inset-x-0 text-center">
                                        <p className="text-[7.5px] uppercase tracking-[0.2em] font-display text-white/30 bg-black/40 inline-block px-2 py-1 rounded-sm border border-white/5">
                                            {t("player_waiting.waiting_player")}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom action bar */}
                            <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(14,18,30,0.8)' }}>
                                <button onClick={() => setIsExiting(true)} className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#1a0a12] border border-red-500/50 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all flex-shrink-0">
                                    <LogOut className="w-4 h-4 scale-x-[-1]" />
                                </button>
                                <button onClick={() => setIsSelectingCharacter(true)} className="flex-1 h-11 flex items-center justify-center rounded-xl border border-[#00ff9d]/60 text-[#00ff9d] font-display text-xs uppercase tracking-widest hover:bg-[#00ff9d]/10 active:scale-95 transition-all">
                                    {t("player_waiting.choose_character")}
                                </button>
                            </div>
                        </motion.div>

                        {/* ===== DESKTOP — Racing Lobby ===== */}
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="hidden md:block fixed inset-0 z-30"
                            style={{
                                background: 'rgba(4,6,15,0.55)',
                                backdropFilter: 'blur(2px)',
                            }}>

                            {/* Ambient light effects */}
                            <div className="absolute inset-0 pointer-events-none">
                                {/* Subtle purple ambient glow top-right */}
                                <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-gradient-to-bl from-[#7C3AED]/8 to-transparent rounded-bl-full" />
                                {/* Floor fade */}
                                <div className="absolute bottom-0 inset-x-0 h-[40%] bg-gradient-to-t from-[#04060f]/80 to-transparent" />
                                {/* Car glow on floor */}
                                <div className="absolute bottom-[18%] left-[62%] w-[400px] h-[60px] -translate-x-1/2 bg-[#7C3AED]/8 blur-3xl rounded-full" />
                            </div>

                            {/* ── Top bar ── */}
                            <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-6 py-3">
                                <div className="flex flex-col leading-none">
                                    <img src="/assets/logo/logo1.png" alt="Logo" className="h-10 object-contain opacity-80 hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="flex flex-col leading-none">
                                    <img src="/assets/logo/logo2.png" alt="NitroQuiz" className="h-10 object-contain opacity-70 hover:opacity-100 transition-opacity" />
                                </div>
                            </div>

                            {/* ── Left panel — floats over the showroom ── */}
                            <div className="absolute top-[85px] left-6 bottom-6 z-10 flex flex-col min-h-0 w-[320px] lg:w-[480px] xl:w-[680px]">
                                {/* Outer panel */}
                                <div className="flex-1 flex flex-col min-h-0 rounded-xl overflow-hidden shadow-2xl"
                                    style={{
                                        background: 'rgba(17,23,41,0.92)',
                                        border: '1px solid rgba(124,58,237,0.15)',
                                        backdropFilter: 'blur(20px)',
                                        boxShadow: '0 15px 40px rgba(0,0,0,0.6)',
                                    }}>
                                    {/* Subtle dot texture */}
                                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                                        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                                    {/* Corner accent glow */}
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#7C3AED]/8 to-transparent rounded-bl-full pointer-events-none z-0" />

                                    {/* Header row */}
                                    <div className="flex items-center justify-between px-5 py-3.5 flex-shrink-0 relative z-10"
                                        style={{ borderBottom: '1px solid rgba(124,58,237,0.12)' }}>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-[#7C3AED]/10 rounded-lg">
                                                <Users className="w-4 h-4 text-[#a78bfa]" />
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="font-display text-xl font-black text-white leading-none">
                                                    {participantCount}
                                                </span>
                                                <span className="font-display text-[#a78bfa] text-[10px] font-bold tracking-[0.2em] uppercase">
                                                    {t("player_waiting.player", { count: participantCount }).replace(/[\d()]+/g, '').trim()}
                                                </span>
                                            </div>
                                        </div>
                                        <button onClick={() => setIsExiting(true)}
                                            className="group/btn h-9 px-4 flex items-center justify-center rounded-sm active:scale-95 transition-all flex-shrink-0 transform -skew-x-[15deg] overflow-hidden relative hover:bg-red-500/25 hover:border-red-500/60 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                                            style={{
                                                background: 'rgba(239,68,68,0.12)',
                                                border: '1px solid rgba(239,68,68,0.35)',
                                                color: '#f87171',
                                            }}>
                                            <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                                            <div className="relative z-10 transform skew-x-[15deg]">
                                                <LogOut className="w-4 h-4 scale-x-[-1]" />
                                            </div>
                                        </button>
                                    </div>

                                    {/* Scrollable cards */}
                                    <div className="flex-1 overflow-y-auto p-4 md:p-5 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-max relative z-10"
                                        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(124,58,237,0.25) transparent' }}>

                                        {/* YOU card */}
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="group relative h-[190px] w-full bg-[#0a0e1a] border-t border-r border-[#7C3AED]/40 hover:border-[#a78bfa] transition-all hover:shadow-[0_0_30px_rgba(124,58,237,0.3)] shadow-[inset_0_0_40px_rgba(124,58,237,0.05)]"
                                                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}>
                                                    
                                                    {/* Tech styling bases */}
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#b89aff] via-[#7C3AED] to-[#3a1a7a] z-10 shadow-[0_0_10px_#7C3AED]" />
                                            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(124,58,237,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.2) 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
                                            
                                            {/* Profile avatar */}
                                            <div className="absolute top-3 left-4 z-20 w-8 h-8 rounded-full overflow-hidden border border-[#7C3AED]/60 shadow-[0_0_10px_rgba(124,58,237,0.4)] backdrop-blur-md bg-black/50">
                                                {userAvatar ? (
                                                    <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <InitialsAvatar name={username} size="sm" />
                                                )}
                                            </div>

                                            {/* YOU badge */}
                                            <div className="absolute top-3 right-3 z-20">
                                                <div className="font-display font-black text-[9px] tracking-[0.2em] px-3 py-1 transform -skew-x-[15deg] shadow-[0_0_15px_rgba(124,58,237,0.5)] border border-[#a78bfa]/50"
                                                    style={{ background: 'linear-gradient(90deg, #7C3AED, #5b21b6)', color: '#fff' }}>
                                                    <span className="block transform skew-x-[15deg]">{t("player_waiting.you")}</span>
                                                </div>
                                            </div>

                                            {/* Car image */}
                                            <div className="absolute inset-x-0 top-6 bottom-12 flex items-center justify-center p-2 z-10 w-full h-auto">
                                                <img src={assignedChar.imageSrc} alt="car"
                                                    className="w-full h-full object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)] filter contrast-[1.1] brightness-[1.05] group-hover:scale-105 transition-transform duration-500 will-change-transform" />
                                            </div>

                                            {/* Name plate */}
                                            <div className="absolute bottom-0 inset-x-0 z-20 h-[48px] bg-gradient-to-t from-[#04060f] to-transparent flex flex-col justify-end px-3 pb-2 pt-4">
                                                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#7C3AED]/0 via-[#7C3AED] to-[#7C3AED]/0" />
                                                <p className="font-display text-white text-[12px] font-black tracking-[0.15em] truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-none mb-1">
                                                    {username}
                                                </p>
                                                <div className="flex justify-between items-center">
                                                    <p className="font-display text-[#a78bfa] text-[8px] tracking-[0.3em] uppercase opacity-90 leading-none truncate pr-2">
                                                        {assignedChar.name}
                                                    </p>
                                                    <div className="flex gap-[2px]">
                                                        <div className="w-[3px] h-[6px] bg-[#7C3AED]/60 transform -skew-x-[20deg]" />
                                                        <div className="w-[3px] h-[6px] bg-[#7C3AED]/80 transform -skew-x-[20deg]" />
                                                        <div className="w-[3px] h-[6px] bg-white shadow-[0_0_5px_#fff] transform -skew-x-[20deg]" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-[#111729] text-white border-[#7C3AED]/50 font-display text-xs px-3 py-1.5 shadow-[0_0_15px_rgba(124,58,237,0.4)]">
                                            {username}
                                        </TooltipContent>
                                        </Tooltip>

                                        {/* Other players */}
                                        {allParticipants.filter(p => p.nickname !== username).map((p, i) => {
                                            const charObj = PLAYER_CHARACTERS.find(c => c.id === p.car_character) || PLAYER_CHARACTERS[0];
                                            const pCarName = charObj.name;
                                            const carSrc = charObj.imageSrc;
                                            return (
                                                <Tooltip key={i}>
                                                    <TooltipTrigger asChild>
                                                        <div className="group relative h-[190px] w-full bg-[#0a0e1a]/80 border-t border-r border-[#2d6af2]/30 hover:border-[#5a9cff] transition-all hover:shadow-[0_0_30px_rgba(45,106,242,0.2)] shadow-[inset_0_0_40px_rgba(45,106,242,0.05)]"
                                                            style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}>
                                                            
                                                            {/* Tech styling bases */}
                                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#5a9cff] via-[#2d6af2] to-[#123075] z-10 shadow-[0_0_10px_#2d6af2] opacity-80 group-hover:opacity-100" />
                                                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(45,106,242,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(45,106,242,0.2) 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
                                                    
                                                    {/* Profile avatar */}
                                                    <div className="absolute top-3 left-4 z-20 w-8 h-8 rounded-full overflow-hidden border border-[#2d6af2]/50 shadow-[0_0_8px_rgba(45,106,242,0.3)] backdrop-blur-md bg-black/50 group-hover:border-[#5a9cff] transition-colors">
                                                        {p.avatar_url ? (
                                                            <img src={p.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <InitialsAvatar name={p.nickname} size="sm" />
                                                        )}
                                                    </div>

                                                    {/* Car image */}
                                                    <div className="absolute inset-x-0 top-6 bottom-12 flex items-center justify-center p-2 z-10 w-full h-auto">
                                                        <img src={carSrc} alt="car"
                                                            className="w-full h-full object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)] filter brightness-[0.95] group-hover:brightness-[1.1] group-hover:scale-105 transition-transform duration-500 will-change-transform" />
                                                    </div>

                                                    {/* Name plate */}
                                                    <div className="absolute bottom-0 inset-x-0 z-20 h-[48px] bg-gradient-to-t from-[#04060f] to-transparent flex flex-col justify-end px-3 pb-2 pt-4">
                                                        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#2d6af2]/0 via-[#2d6af2] to-[#2d6af2]/0 opacity-50 group-hover:opacity-100 transition-opacity" />
                                                        <p className="font-display text-white/90 group-hover:text-white text-[12px] font-black tracking-[0.15em] truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-none mb-1 transition-colors">
                                                            {p.nickname}
                                                        </p>
                                                        <div className="flex justify-between items-center">
                                                            <p className="font-display text-[#5a9cff]/80 group-hover:text-[#5a9cff] text-[8px] tracking-[0.3em] uppercase leading-none truncate pr-2 transition-colors">
                                                                {pCarName}
                                                            </p>
                                                            <div className="flex gap-[2px] opacity-60 group-hover:opacity-100 transition-opacity">
                                                                <div className="w-[3px] h-[6px] bg-[#2d6af2]/60 transform -skew-x-[20deg]" />
                                                                <div className="w-[3px] h-[6px] bg-[#2d6af2]/80 transform -skew-x-[20deg]" />
                                                                <div className="w-[3px] h-[6px] bg-[#5a9cff] shadow-[0_0_5px_#5a9cff] transform -skew-x-[20deg]" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-[#111729] text-white border-[#2d6af2]/50 font-display text-xs px-3 py-1.5 shadow-[0_0_15px_rgba(45,106,242,0.4)]">
                                                    {p.nickname}
                                                </TooltipContent>
                                                </Tooltip>
                                            );
                                        })}

                                        {/* Empty slot */}
                                        <div className="group relative h-[190px] w-full bg-[#0a0e1a]/40 border-t border-r border-[#7090cc]/20 border-dashed"
                                            style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}>
                                            <div className="absolute inset-0 flex items-center justify-center p-4">
                                                <svg viewBox="0 0 180 80" className="w-[140px] h-[60px] opacity-[0.15] group-hover:opacity-30 transition-opacity" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <rect x="8" y="28" width="164" height="34" rx="4" stroke="#7090cc" strokeWidth="2" />
                                                    <rect x="42" y="12" width="96" height="28" rx="4" stroke="#7090cc" strokeWidth="2" />
                                                    <circle cx="42" cy="66" r="10" stroke="#7090cc" strokeWidth="2" />
                                                    <circle cx="138" cy="66" r="10" stroke="#7090cc" strokeWidth="2" />
                                                    <line x1="8" y1="42" x2="172" y2="42" stroke="#7090cc" strokeWidth="1" strokeDasharray="6 4" />
                                                </svg>
                                            </div>
                                            <div className="absolute bottom-3 inset-x-0 text-center">
                                                <p className="text-[9px] uppercase tracking-[0.25em] font-display text-white/30 group-hover:text-white/50 transition-colors bg-black/40 inline-block px-3 py-1.5 rounded-sm border border-white/5">
                                                    {t("player_waiting.waiting_player")}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── Right Panel Area ── */}
                            {isSelectingCharacter ? (
                                <div className="absolute z-10 flex flex-col items-center justify-center right-0 md:left-[340px] lg:left-[500px] xl:left-[700px]" style={{ top: '60px', bottom: '64px', right: '20px' }}>
                                    <h2 className="font-display text-2xl font-black text-white uppercase tracking-[0.15em] mb-8 drop-shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                                        {t("player_waiting.choose_racer")}
                                    </h2>
                                    <div className="flex items-center gap-6 w-full justify-center px-4 overflow-hidden relative">
                                        {/* Left Arrow */}
                                        <button className="z-20 w-10 h-10 flex items-center justify-center bg-white/[0.04] backdrop-blur-md border border-white/[0.08] rounded-xl hover:bg-white/[0.08] hover:border-[#7C3AED]/30 transition-all shadow-lg flex-shrink-0">
                                            <ChevronLeft className="w-5 h-5 text-white/60" />
                                        </button>

                                        {/* Cards Container */}
                                        <div className="flex justify-center gap-5 items-center overflow-x-auto no-scrollbar py-6 px-4">
                                            {PLAYER_CHARACTERS.map((c) => {
                                                const isSel = pendingCharacterId === c.id;
                                                return (
                                                    <div key={c.id} onClick={() => setPendingCharacterId(c.id)}
                                                        className={`relative flex flex-col items-center justify-center p-4 rounded-xl transition-all cursor-pointer ${isSel ? 'bg-[#111729]/95 border-2 border-[#7C3AED]' : 'bg-[#111729]/70 border border-white/[0.08]'}`}
                                                        style={{
                                                            width: '240px',
                                                            height: '240px',
                                                            boxShadow: isSel ? '0 0 30px rgba(124,58,237,0.4), inset 0 0 20px rgba(124,58,237,0.1)' : '0 4px 20px rgba(0,0,0,0.3)',
                                                            backdropFilter: 'blur(12px)',
                                                        }}>
                                                        {isSel && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#7C3AED] via-[#a78bfa] to-transparent" />}

                                                        {/* Car Image */}
                                                        <div className="w-full mb-3 relative flex items-center justify-center" style={{ height: '120px' }}>
                                                            <img src={c.imageSrc} alt={c.name}
                                                                className="w-full h-full object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.8)]" />
                                                        </div>

                                                        {/* Name */}
                                                        <h3 className={`font-display text-[14px] font-bold uppercase tracking-[0.15em] text-center mt-auto mb-2 ${isSel ? 'text-[#a78bfa]' : 'text-white/70'}`}>
                                                            {c.name}
                                                        </h3>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Right Arrow */}
                                        <button className="z-20 w-10 h-10 flex items-center justify-center bg-white/[0.04] backdrop-blur-md border border-white/[0.08] rounded-xl hover:bg-white/[0.08] hover:border-[#7C3AED]/30 transition-all shadow-lg flex-shrink-0">
                                            <ChevronRight className="w-5 h-5 text-white/60" />
                                        </button>
                                    </div>

                                    {/* Action Buttons — motorsport skewed */}
                                    <div className="flex gap-4 mt-8">
                                        <button onClick={() => { setIsSelectingCharacter(false); setPendingCharacterId(assignedCarId); }}
                                            className="group/btn px-8 py-3 bg-white/[0.04] border border-white/[0.15] rounded-sm transform -skew-x-[15deg] transition-all hover:bg-white/[0.08] hover:border-white/[0.25] overflow-hidden relative">
                                            <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                                            <span className="relative z-10 font-display text-[12px] font-bold uppercase tracking-[0.15em] text-white/60 group-hover/btn:text-white transform skew-x-[15deg]">
                                                {t("player_waiting.back")}
                                            </span>
                                        </button>
                                        <button onClick={handleSelectCharacter}
                                            className="group/btn px-8 py-3 bg-gradient-to-r from-[#7C3AED] to-[#5b21b6] border border-white/20 rounded-sm transform -skew-x-[15deg] transition-all hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] overflow-hidden relative">
                                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                                            <span className="relative z-10 font-display text-[12px] font-bold uppercase tracking-[0.15em] text-white transform skew-x-[15deg] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                                                {t("player_waiting.select")}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Character name label */}
                                    <div className="absolute z-10 text-left md:left-[360px] lg:left-[520px] xl:left-[720px]"
                                        style={{ top: '85px' }}>
                                        <h2 className="font-display text-3xl font-black text-white uppercase tracking-[0.1em] leading-none drop-shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                                            {assignedChar.name}
                                        </h2>
                                        <div className="h-[2px] w-16 mt-2 bg-gradient-to-r from-[#7C3AED] to-transparent" />
                                    </div>

                                    <div className="absolute z-10 flex flex-col gap-6 items-center justify-center right-0 md:left-[340px] lg:left-[500px] xl:left-[700px]"
                                        style={{ top: '60px', bottom: '64px' }}>
                                        <motion.div className="relative flex items-center justify-center"
                                            style={{ width: 'clamp(300px, 45vw, 560px)', height: '52vh' }}
                                            animate={{ y: [0, -14, 0] }}
                                            transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}>
                                            <img src={displayVisual} alt="Your Car"
                                                className="object-contain drop-shadow-[0_28px_60px_rgba(124,58,237,0.15)] relative z-10"
                                                style={{ width: '100%', maxHeight: '100%' }}
                                            />
                                            {/* Ground glow */}
                                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-[#7C3AED]/15 blur-2xl rounded-full" />
                                        </motion.div>

                                        {/* Choose Character — motorsport skewed button */}
                                        <motion.button
                                            onClick={() => { setPendingCharacterId(assignedCarId); setIsSelectingCharacter(true); }}
                                            animate={{
                                                boxShadow: ['0 0 10px rgba(124,58,237,0.3)', '0 0 25px rgba(124,58,237,0.6)', '0 0 10px rgba(124,58,237,0.3)'],
                                            }}
                                            transition={{
                                                boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                                            }}
                                            className="group/btn px-10 py-3.5 bg-gradient-to-r from-[#7C3AED] to-[#5b21b6] border border-white/20 rounded-sm transform -skew-x-[15deg] transition-all active:scale-[0.98] overflow-hidden relative"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
                                            <span className="relative z-10 font-display text-[13px] font-black uppercase tracking-[0.2em] text-white transform skew-x-[15deg] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                                                {t("player_waiting.choose_character")}
                                            </span>
                                        </motion.button>
                                    </div>
                                </>
                            )}

                        </motion.div>
                    </>
                )}

                {/* ── MOBILE CHARACTER SELECTOR OVERLAY ── */}
                {isSelectingCharacter && status === "waiting" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="md:hidden fixed inset-0 z-[100] bg-[#070d1c]/98 backdrop-blur-md flex flex-col items-center justify-center p-4"
                    >
                        <h2 className="font-display text-lg font-black text-white uppercase tracking-wider mb-6 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                            {t("player_waiting.choose_racer")}
                        </h2>
                        <div className="flex gap-3 w-full max-w-[380px] justify-center">
                            {PLAYER_CHARACTERS.map((c) => {
                                const isSel = pendingCharacterId === c.id;
                                return (
                                    <div key={c.id} onClick={() => setPendingCharacterId(c.id)}
                                        className={`relative flex flex-col items-center justify-center p-3 rounded-xl transition-all cursor-pointer flex-1 ${isSel ? 'bg-[#182136] border-2 border-[#e6fdff]' : 'bg-[#111726] border border-[#2d4060]'}`}
                                        style={{
                                            boxShadow: isSel ? '0 0 20px rgba(120,240,255,0.3), inset 0 0 15px rgba(120,240,255,0.1)' : 'none'
                                        }}>
                                        <div className="w-full mb-2 relative flex items-center justify-center" style={{ height: '80px' }}>
                                            <img src={c.imageSrc} alt={c.name}
                                                className="w-full h-full object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]" />
                                        </div>
                                        <h3 className="font-display text-[10px] font-bold text-white uppercase tracking-[0.1em] text-center">
                                            {c.name}
                                        </h3>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex gap-4 mt-6 w-full max-w-[320px]">
                            <button onClick={() => { setIsSelectingCharacter(false); setPendingCharacterId(assignedCarId); }}
                                className="flex-1 py-3 rounded-xl font-display text-xs font-bold uppercase tracking-widest text-white bg-white/10 border border-white/20 hover:bg-white/20 transition-colors">
                                {t("player_waiting.back")}
                            </button>
                            <button onClick={handleSelectCharacter}
                                className="flex-1 py-3 rounded-xl font-display text-xs font-bold uppercase tracking-widest text-white bg-[#0fa8c4] hover:bg-[#0880b8] transition-colors shadow-[0_0_15px_rgba(15,168,196,0.4)]">
                                {t("player_waiting.select")}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* COUNTDOWN */}
                {status === "countdown" && (
                    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
                        style={{ animation: 'fadeIn 0.3s ease-out' }}>
                        {/* 3 traffic light dots */}
                        <div className="flex gap-4 mb-8">
                            {[
                                { color: "#ef4444", activeAt: 3 },
                                { color: "#facc15", activeAt: 2 },
                                { color: "#00ff9d", activeAt: 1 },
                            ].map((light, i) => {
                                const isGo = countdownValue <= 0;
                                const isLit = isGo || countdownValue <= light.activeAt;
                                const displayColor = isGo ? "#00ff9d" : light.color;
                                return (
                                    <div key={i} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2" style={{
                                        borderColor: isLit ? displayColor : '#374151',
                                        backgroundColor: isLit ? displayColor : 'rgba(55,65,81,0.3)',
                                        boxShadow: isLit ? `0 0 25px ${displayColor}` : 'none',
                                        transform: isLit ? 'scale(1.15)' : 'scale(1)',
                                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    }} />
                                );
                            })}
                        </div>
                        <span key={countdownValue}
                            className={`font-display font-black py-4 ${getCountdownColor(countdownValue)} drop-shadow-[0_0_40px_currentColor]`}
                            style={{ animation: 'countdown-pop 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)', willChange: 'transform, opacity', display: 'block', fontSize: 'clamp(80px, 16vw, 150px)', lineHeight: '1.2' }}>
                            {countdownValue > 0 ? countdownValue : t("player_waiting.go")}
                        </span>
                        <p className="font-display text-lg text-gray-400 mt-6" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
                            {getCountdownLabel(countdownValue)}
                        </p>

                        {/* Mobile Orientation Picker during countdown */}
                        <div className="md:hidden mt-6 flex gap-3 w-full max-w-[320px] px-4">
                            <button
                                onClick={() => localStorage.setItem('nitroquiz_orientation', 'portrait')}
                                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${(typeof window !== 'undefined' && localStorage.getItem('nitroquiz_orientation') === 'portrait')
                                    ? 'border-[#2d6af2] bg-[#2d6af2]/15'
                                    : 'border-white/10 bg-white/5'
                                    }`}
                            >
                                <span style={{ fontSize: '1.5rem' }}>📱</span>
                                <span className="font-display text-[9px] text-white font-bold uppercase tracking-widest">{t('player_game.portrait')}</span>
                            </button>
                            <button
                                onClick={() => localStorage.setItem('nitroquiz_orientation', 'landscape')}
                                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${(typeof window !== 'undefined' && localStorage.getItem('nitroquiz_orientation') === 'landscape')
                                    ? 'border-[#00ff9d] bg-[#00ff9d]/10'
                                    : 'border-white/10 bg-white/5'
                                    }`}
                            >
                                <span style={{ fontSize: '1.5rem', transform: 'rotate(90deg)', display: 'inline-block' }}>📱</span>
                                <span className="font-display text-[9px] text-white font-bold uppercase tracking-widest">{t('player_game.landscape')}</span>
                            </button>
                        </div>

                        <div className="absolute w-64 h-64 rounded-full border border-[#2d6af2]/20" style={{ animation: 'pulseRing 2s ease-in-out infinite' }} />
                        <style>{`
                            @keyframes fadeIn{from{opacity:0}to{opacity:1}}
                            @keyframes fadeInUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
                            @keyframes countdown-pop{0%{transform:scale(1.5) translateY(-30px);opacity:0}60%{transform:scale(0.95) translateY(5px);opacity:1}100%{transform:scale(1) translateY(0);opacity:1}}
                            @keyframes pulseRing{0%{transform:scale(1);opacity:0.3}50%{transform:scale(1.5);opacity:0}100%{transform:scale(1);opacity:0.3}}
                        `}</style>
                    </div>
                )}

                {/* GO! */}
                {status === "go" && (
                    <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
                        <motion.h1 animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 0.5 }}
                            className="font-display text-transparent bg-clip-text bg-gradient-to-b from-[#00ff9d] to-[#2d6af2] font-black drop-shadow-[0_0_50px_rgba(0,255,157,0.6)] py-4 px-2"
                            style={{ fontSize: 'clamp(60px, 14vw, 120px)' }}>
                            {t("player_waiting.go")}
                        </motion.h1>
                        <p className="font-display text-[#00ff9d] text-sm mt-4 animate-pulse">{t("player_waiting.launching")}</p>
                    </motion.div>
                )}
            </div>

            <AnimatePresence>
                {isExiting && (
                    <LogoutConfirmDialog
                        onConfirm={handleConfirmExit}
                        onCancel={() => setIsExiting(false)}
                        t={t}
                    />
                )}
            </AnimatePresence>
        </div>
        </TooltipProvider>
    );
}