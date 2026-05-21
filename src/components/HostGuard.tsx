"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseGame } from "@/lib/supabase/game-client";
import { Logo } from "@/components/ui/logo";
import { useTranslation } from "react-i18next";

interface HostGuardProps {
    children: React.ReactNode;
}

export function HostGuard({ children }: HostGuardProps) {
    const router = useRouter();
    const params = useParams();
    const roomCode = (params.roomCode as string)?.toUpperCase();
    const { profile, loading: authLoading } = useAuth();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const authorizedAsHost = useRef(false);
    const { t } = useTranslation()

    useEffect(() => {
        // Once confirmed as host, never re-run checks (prevents AuthContext refresh race)
        if (authorizedAsHost.current) return;

        if (authLoading || !roomCode) return;

        const checkAuthorization = async () => {
            try {
                // 1. Fetch the session to find the host
                const { data: session, error: sessionError } = await supabaseGame
                    .from("sessions")
                    .select("id, host_id")
                    .eq("game_pin", roomCode)
                    .single();

                if (sessionError || !session) {
                    console.error("Session not found or error:", sessionError);
                    router.replace("/");
                    return;
                }

                // 2. PRIORITY: Check if the current user is the host
                // If they are the host, they SHOULD stay here, even if they are also a participant
                if (profile && profile.id === session.host_id) {
                    authorizedAsHost.current = true;
                    setIsAuthorized(true);
                    return;
                }

                // 3. Check for participant status (Redirect to player waiting)
                // 3a. Check localStorage (Fast check for current session)
                const localRoomCode = localStorage.getItem("nitroquiz_game_roomCode");
                const localParticipantId = localStorage.getItem("nitroquiz_game_participantId");
                if (localRoomCode === roomCode && localParticipantId) {
                    router.replace(`/player/${roomCode}/waiting`);
                    setIsAuthorized(false);
                    return;
                }

                // 3b. Check Database (Logged-in user check)
                if (profile) {
                    const { data: participant } = await supabaseGame
                        .from("participants")
                        .select("id")
                        .eq("session_id", session.id)
                        .eq("user_id", profile.id)
                        .maybeSingle();

                    if (participant) {
                        router.replace(`/player/${roomCode}/waiting`);
                        setIsAuthorized(false);
                        return;
                    }
                }

                // 4. If neither host nor recognized participant, kick to home
                router.replace("/");
                setIsAuthorized(false);
            } catch (err) {
                console.error("Authorization check failed:", err);
                router.replace("/");
            }
        };

        checkAuthorization();
    }, [roomCode, profile, authLoading, router]);

    // Show loading screen while checking
    if (authLoading || isAuthorized === null) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#04060f] relative overflow-hidden font-display text-white">
                <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-20"
                    style={{ backgroundImage: 'url("/assets/backgorund/homepage_bg.webp")', backgroundAttachment: 'fixed' }} />
                <div className="fixed inset-0 z-0 bg-gradient-to-t from-[#04060f] via-[#04060f]/85 to-[#2d6af2]/10 pointer-events-none" />
                <div className="text-center z-10">
                    <div className="w-16 h-16 border-4 border-[#2d6af2]/30 border-t-[#2d6af2] rounded-full animate-spin mx-auto mb-6"></div>
                    <p className="mt-4 text-[#5a9cff] text-xl tracking-[0.2em] uppercase animate-pulse">{t('host.verify')}</p>
                </div>
            </div>
        );
    }

    // If authorized, render children
    return isAuthorized ? <>{children}</> : null;
}
