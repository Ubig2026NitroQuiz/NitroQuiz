"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { LogIn } from "lucide-react";

// Error messages mapping
const ERROR_MESSAGES = {
    duplicate: {
        title: "Duplicate Nickname",
        message: "This nickname is already taken in this room. Please change your profile nickname."
    },
    roomNotFound: {
        title: "Room Not Found",
        message: "The game code you entered does not exist. Please check the code."
    },
    sessionLocked: {
        title: "Session Locked",
        message: "This game session has already started or ended."
    },
    roomFull: {
        title: "Room Full",
        message: "This room has reached its maximum capacity."
    },
    general: {
        title: "Join Error",
        message: "Failed to join the game. Please try again later."
    }
};

export default function AutoJoinPage() {
    const router = useRouter();
    const params = useParams();
    const { t } = useTranslation();
    const roomCode = (params.roomCode as string)?.toUpperCase();
    const { user, profile, loading: authLoading } = useAuth();

    const [showAlert, setShowAlert] = useState(false);
    const [alertReason, setAlertReason] = useState<keyof typeof ERROR_MESSAGES | "">("");
    const [isLoading, setIsLoading] = useState(true);
    const hasAttempted = useRef(false);

    const closeAlert = () => {
        setShowAlert(false);
        setAlertReason("");
        setIsLoading(false);
        router.replace("/");
    };

    useEffect(() => {
        if (!roomCode || authLoading || hasAttempted.current) return;

        // If not logged in, redirect to login with pending code
        if (!user) {
            localStorage.setItem("nitroquiz_pendingRoomCode", roomCode);
            setIsLoading(false);
            router.replace("/login");
            return;
        }

        // Wait for profile to load
        if (!profile?.id) return;

        hasAttempted.current = true;

        const autoJoin = async () => {
            try {
                // Generate nickname: priority nickname > fullname > username > email
                const nickname =
                    profile.nickname?.trim() ||
                    profile.fullname?.trim() ||
                    profile.username?.trim() ||
                    user.email?.split("@")[0] ||
                    "Player";

                // Call join_game RPC for NitroQuiz
                const { data, error } = await supabase.rpc("join_game", {
                    p_room_code: roomCode,
                    p_user_id: profile.id,
                    p_nickname: nickname,
                });

                if (error) {
                    console.error("Join RPC error:", error);
                    setAlertReason("general");
                    setShowAlert(true);
                    setIsLoading(false);
                    return;
                }

                // Handle specific errors from RPC
                if (data.error) {
                    switch (data.error) {
                        case "duplicate_nickname":
                            setAlertReason("duplicate");
                            break;
                        case "room_not_found":
                        case "room_not_exist":
                            setAlertReason("roomNotFound");
                            break;
                        case "session_locked":
                            setAlertReason("sessionLocked");
                            break;
                        case "room_full":
                            setAlertReason("roomFull");
                            break;
                        default:
                            setAlertReason("general");
                    }
                    setShowAlert(true);
                    setIsLoading(false);
                    return;
                }

                // Success! Save avatar to participants table for host visibility
                if (profile?.avatar_url) {
                    await supabase.from("participants").update({ avatar_url: profile.avatar_url }).eq("id", data.participant_id);
                }

                // Success! Save data and redirect to lobby/waiting
                localStorage.setItem("nitroquiz_game_playerName", data.nickname);
                localStorage.setItem("nitroquiz_game_participantId", data.participant_id);
                localStorage.setItem("nitroquiz_game_roomCode", roomCode);
                localStorage.setItem('nitroquiz_game_sessionId', data.session_id);
                localStorage.setItem('nitroquiz_game_carCharacter', data.car_character || '');
                localStorage.removeItem("nitroquiz_pendingRoomCode");

                // Navigate to waiting room (lobby)
                router.replace(`/player/${roomCode}/waiting`);
            } catch (err) {
                console.error("Auto-join error:", err);
                setAlertReason("general");
                setShowAlert(true);
                setIsLoading(false);
            }
        };

        autoJoin();
    }, [roomCode, user, profile, authLoading, router]);

    const errorDetails = alertReason ? ERROR_MESSAGES[alertReason] : ERROR_MESSAGES.general;

    return (
        <div className="min-h-screen bg-[#04060f] text-white flex items-center justify-center p-4 relative overflow-hidden font-display">
            {/* ── Cinematic Background ── */}
            <div className="racing-stripe z-50 pointer-events-none absolute top-0 inset-x-0 h-1" />
            <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-30"
                style={{ backgroundImage: 'url("/assets/backgorund/homepage_bg.webp")', backgroundAttachment: 'fixed' }} />
            <div className="fixed inset-0 z-0 bg-gradient-to-t from-[#04060f] via-[#04060f]/85 to-[#2d6af2]/10 pointer-events-none" />
            <div className="fixed inset-0 z-0 bg-[linear-gradient(rgba(45,106,242,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(45,106,242,0.04)_1px,transparent_1px)] bg-[length:35px_35px] pointer-events-none" />
            {/* Ambient glow */}
            <div className="fixed top-0 left-1/3 w-[500px] h-[500px] bg-[#2d6af2]/8 blur-[140px] rounded-full pointer-events-none" />
            <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-[#7C3AED]/8 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 w-full max-w-md">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center gap-6">
                        {/* Logo */}
                        <img src="/assets/logo/logo1.png" alt="NitroQuiz" className="h-16 object-contain drop-shadow-[0_0_30px_rgba(45,106,242,0.6)] mb-2" />
                        {/* Spinner */}
                        <div className="relative">
                            <div className="w-14 h-14 border-[3px] border-[#2d6af2]/15 border-t-[#2d6af2] rounded-full animate-spin" />
                            <LogIn className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-[#2d6af2]/50" />
                        </div>
                        <h2 className="font-display text-sm font-bold tracking-[0.3em] text-[#5a9cff] uppercase animate-pulse">
                            {t("joining_room", "JOINING ROOM...")}
                        </h2>
                    </div>
                )}

                {/* Alert Modal — HUD Style */}
                {showAlert && (
                    <div className="bg-[#0a0e1a]/95 backdrop-blur-2xl border border-red-500/30 overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.15)]"
                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}>
                        {/* Red top laser */}
                        <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-red-500 to-transparent" />
                        <div className="p-8 text-center">
                            <h2 className="font-display text-xl font-black text-red-500 mb-2 uppercase tracking-[0.15em] drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                                {errorDetails.title}
                            </h2>
                            <p className="text-gray-400 font-semibold mb-8 text-base leading-relaxed">
                                {errorDetails.message}
                            </p>
                            <button
                                onClick={closeAlert}
                                className="group/btn relative h-12 px-8 font-display text-sm font-bold uppercase tracking-[0.2em] text-white active:scale-95 transition-all transform -skew-x-[12deg] overflow-hidden"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.08))',
                                    border: '1px solid rgba(239,68,68,0.4)',
                                }}
                            >
                                <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                                <span className="relative z-10 transform skew-x-[12deg]">Return to Home</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
