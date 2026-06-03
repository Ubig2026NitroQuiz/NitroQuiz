import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { syncServerTime, getSyncedServerTime } from '@/lib/serverTime';
import { supabaseGame } from '@/lib/supabase/game-client';
import { useAuth } from '@/contexts/AuthContext';
import { ASSET_LIST, TRACK_ASSETS } from '@/lib/gameAssets';

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

export function useWaitingData(roomCode: string) {
    const router = useRouter();
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
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
    const statusRef = useRef(status);

    useEffect(() => { statusRef.current = status; }, [status]);

    const channelRef = useRef<any>(null);

    // Sync server time on mount
    useEffect(() => {
        const initSync = async () => {
            await syncServerTime();
        };
        initSync();
    }, []);

    const preloadQuizData = async (sessId: string) => {
        try {
            const { data } = await supabaseGame.from("sessions")
                .select("question_limit, quiz_id, difficulty").eq("id", sessId).single();
            
            const response = await fetch(`/api/quiz/questions?sessionId=${sessId}`);
            if (response.ok) {
                const apiData = await response.json();
                if (apiData.questions) {
                    localStorage.setItem('nitroquiz_game_questions', JSON.stringify(apiData.questions));
                    localStorage.setItem('nitroquiz_game_roomCode', roomCode);
                    localStorage.setItem('nitroquiz_game_sessionId', sessId);
                    localStorage.setItem('nitroquiz_game_difficulty', apiData.difficulty || data?.difficulty || 'easy');
                    if (data?.quiz_id) localStorage.setItem('nitroquiz_game_quizId', data.quiz_id);
                    localStorage.removeItem('nitroquiz_game_score');
                    localStorage.removeItem('nitroquiz_game_questionIndex');
                }
            }

            const route = `/player/${roomCode}/game`;
            const link = document.createElement('link'); link.rel = 'prefetch'; link.href = route; document.head.appendChild(link);
        } catch (err) { console.error('Failed to preload quiz:', err); }
    };

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

                if (sessionData.countdown_started_at && !sessionData.started_at) {
                    const startTime = new Date(sessionData.countdown_started_at).getTime();
                    const nowOnServer = getSyncedServerTime();
                    const elapsed = nowOnServer - startTime;
                    const remaining = Math.max(0, 3000 - elapsed);

                    if (remaining > 0) {
                        startCountdown(startTime, sessionData.id);
                    } else {
                        setStatus("go");
                        router.push(`/player/${roomCode}/game`);
                        return;
                    }
                }

                if (!sessionData.countdown_started_at) {
                    setStatus("waiting");
                }
                setSessionId(sessionData.id);

                if (!channelRef.current) {
                    const channel = supabaseGame.channel(`player-session-${sessionData.id}`)
                        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionData.id}` },
                            () => {
                                fetchSessionState();
                            })
                        .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `session_id=eq.${sessionData.id}` },
                            async () => {
                                const { data: pList, count } = await supabaseGame
                                    .from("participants")
                                    .select("id, nickname, car_character, avatar_url, user_id", { count: "exact" })
                                    .eq("session_id", sessionData.id);

                                if (isMounted) {
                                    if (count !== null) setParticipantCount(count);
                                    if (pList) {
                                        setAllParticipants(pList);
                                        const storedId = localStorage.getItem('nitroquiz_game_participantId');
                                        const stillExists = pList.some(p => p.id === storedId);
                                        if (!stillExists && storedId) {
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
                                localStorage.removeItem('nitroquiz_game_participantId');
                                localStorage.removeItem('nitroquiz_game_nickname');
                                localStorage.removeItem('nitroquiz_game_roomCode');
                                localStorage.removeItem('nitroquiz_game_carCharacter');
                                router.replace('/?kicked=true');
                            }
                        })
                        .subscribe();

                    channelRef.current = channel;
                }

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
                        const me = pList.find(p => p.id === storedParticipantId || (profile?.id && p.user_id === profile.id));
                        if (me) {
                            setUsername(me.nickname);
                            setUserAvatar(profile?.avatar_url || me.avatar_url || null);
                            if (me.car_character) {
                                setAssignedCarId(me.car_character);
                                setPendingCharacterId(me.car_character);
                            }
                        } else {
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

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
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

    useEffect(() => {
        const preloadAssets = () => {
            if (typeof window === 'undefined') return;
            if (!(window as any).__nitroquiz_asset_store) {
                (window as any).__nitroquiz_asset_store = {};
            }
            const store = (window as any).__nitroquiz_asset_store;
            let charId = 'rico'; 
            let loaded = 0;
            let total = 0;

            const onDone = () => {
                loaded++;
                if (loaded === total) {
                    console.log(`[NitroQuiz] Preload complete: ${loaded}/${total} assets cached.`);
                }
            };

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
                img.onerror = () => onDone();
                img.src = src;
            });

            const uniqueTrackSources = Array.from(new Set(TRACK_ASSETS.map(item => item.src))).filter(Boolean);
            uniqueTrackSources.forEach(src => {
                if (store[src]) return; 
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
        };

        const timeout = setTimeout(preloadAssets, 2000);
        return () => clearTimeout(timeout);
    }, [assignedCarId]);

    const handleConfirmExit = async () => {
        if (participantId) {
            try {
                if (channelRef.current) {
                    channelRef.current.send({
                        type: "broadcast",
                        event: "player_left",
                        payload: { id: participantId }
                    });
                }
                
                await supabaseGame.from("participants").delete().eq("id", participantId);
                
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

    const handleSelectCharacter = async () => {
        if (participantId && sessionId && pendingCharacterId !== assignedCarId) {
            await supabaseGame.from("participants")
                .update({ car_character: pendingCharacterId })
                .eq("id", participantId);
        }
        setAssignedCarId(pendingCharacterId);
        setIsSelectingCharacter(false);
    };

    return {
        status,
        errorMessage,
        assignedCarId,
        isSelectingCharacter,
        pendingCharacterId,
        countdownValue,
        participantCount,
        username,
        userAvatar,
        allParticipants,
        isExiting,
        activeTooltip,
        setPendingCharacterId,
        setIsSelectingCharacter,
        setIsExiting,
        setActiveTooltip,
        handleConfirmExit,
        handleSelectCharacter,
    };
}
