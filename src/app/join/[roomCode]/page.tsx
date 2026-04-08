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
        <div className="min-h-screen bg-[#07091a] text-white flex items-center justify-center p-4 relative overflow-hidden font-rajdhani">
            <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-[#07091a] to-[#050508] pointer-events-none" />

            <div className="relative z-10 w-full max-w-md">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 border-4 border-[#2d6af2] border-t-transparent rounded-full animate-spin"></div>
                        <h2 className="text-xl font-bold tracking-widest text-[#2d6af2] animate-pulse">
                            {t("joining_room", "JOINING ROOM...")}
                        </h2>
                    </div>
                )}

                {/* Alert Modal */}
                {showAlert && (
                    <div className="bg-[#0c1225]/80 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 text-center shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                        <h2 className="text-2xl font-black text-red-500 mb-2 uppercase tracking-wide">
                            {errorDetails.title}
                        </h2>
                        <p className="text-gray-300 font-semibold mb-8 text-lg leading-snug">
                            {errorDetails.message}
                        </p>
                        <button
                            onClick={closeAlert}
                            className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 border border-white/20 active:scale-95"
                        >
                            Return to Home
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
