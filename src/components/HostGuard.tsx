"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseGame } from "@/lib/supabase/game-client";
import { useTranslation } from "react-i18next";

interface HostGuardProps {
    children: React.ReactNode;
}

export function HostGuard({ children }: HostGuardProps) {
    const router = useRouter();
    const params = useParams();
    const roomCode = (params.roomCode as string)?.toUpperCase();
    const { user, profile, loading: authLoading } = useAuth();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const authorizedAsHost = useRef(false);
    const { t } = useTranslation()

    useEffect(() => {
        // ── Jika sudah dikonfirmasi sebagai host, jangan cek ulang ──
        // (mencegah race condition saat AuthContext re-render)
        if (authorizedAsHost.current) return;

        // ── Tunggu sampai auth sepenuhnya selesai loading ──
        if (authLoading || !roomCode) return;

        // ── Jika ada user yang login tapi profile belum siap, tunggu ──
        // Ini mencegah race condition di mana auth sudah selesai loading
        // tapi profile belum ter-fetch dari database
        if (user && !profile) return;

        const checkAuthorization = async () => {
            try {
                // 1. Ambil data sesi untuk mengetahui siapa host-nya
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

                // 2. PRIORITAS UTAMA: Cek apakah user adalah HOST
                // Host HARUS tetap di halaman host, meskipun juga terdaftar sebagai participant
                if (profile && profile.id === session.host_id) {
                    authorizedAsHost.current = true;
                    setIsAuthorized(true);
                    return;
                }

                // 2b. Fallback: Jika profile.id tidak cocok, cek langsung via database
                // menggunakan auth_user_id → profile.id mapping
                // Ini menangani kasus di mana host_id di sessions merujuk ke profile.id
                // tapi bisa saja ada ketidakcocokan format
                if (user && !profile) {
                    // Sudah ditangani di atas (return early), tapi guard tambahan
                    return;
                }

                // 3. Cek status participant (Redirect ke player waiting)
                // PENTING: Cek ini hanya berjalan jika user BUKAN host

                // 3a. Cek localStorage (cek cepat untuk sesi saat ini)
                const localRoomCode = localStorage.getItem("nitroquiz_game_roomCode");
                const localParticipantId = localStorage.getItem("nitroquiz_game_participantId");
                if (localRoomCode === roomCode && localParticipantId) {
                    router.replace(`/player/${roomCode}/waiting`);
                    setIsAuthorized(false);
                    return;
                }

                // 3b. Cek Database (untuk user yang login)
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

                // 4. Jika bukan host dan bukan participant, redirect ke home
                router.replace("/");
                setIsAuthorized(false);
            } catch (err) {
                console.error("Authorization check failed:", err);
                router.replace("/");
            }
        };

        checkAuthorization();
    }, [roomCode, user, profile, authLoading, router]);

    // Tampilkan loading screen selama pengecekan
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

    // Jika terotorisasi, tampilkan children
    return isAuthorized ? <>{children}</> : null;
}
