/**
 * ============================================================================
 *  HOOK: USE HOME PAGE
 * ============================================================================
 *
 *  Custom hook yang mengelola semua state dan logika bisnis
 *  untuk halaman beranda (Home). Memisahkan logika dari tampilan
 *  agar komponen UI tetap bersih dan mudah dibaca.
 *
 *  Menangani:
 *  - Deteksi redirect berdasarkan URL param (?room=XXX)
 *  - Pengelolaan state dropdown, modal, dan input
 *  - Logika join room (manual / QR scan)
 *  - Logika host game
 *  - Logika logout
 *  - Fullscreen toggle
 *  - PWA install banner
 * ============================================================================
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useBgm } from "@/contexts/BgmContext";
import { useTranslation } from "react-i18next";
import { getI18nInstance } from "@/lib/i18n";
import { createGFSClient } from "@/lib/supabase/gfs-client";
import { usePWAInstall } from "@/contexts/PWAContext";
import { extractRoomCodeFromScan } from "../helpers";

// ── Tipe data pengguna internal ─────────────────────────────────────────
export interface HomeUser {
    id: string;
    username: string;
    email: string;
    avatar: string;
}

export function useHomePage() {
    const supabase = createGFSClient();
    const router = useRouter();
    const { profile, loading: authLoading } = useAuth();
    const { isMuted, toggleMute } = useBgm();
    const { t } = useTranslation();
    const i18n = getI18nInstance();
    const { installPrompt, handleInstall: handlePWAInstall } = usePWAInstall();

    // ── STATE ────────────────────────────────────────────────────────────

    // Input kode room
    const [roomCode, setRoomCode] = useState("");

    // Status loading / redirect
    const [isHosting, setIsHosting] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    // Kontrol UI (modal & dropdown)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLanguageOpen, setIsLanguageOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showHowToPlay, setShowHowToPlay] = useState(false);
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
    const [isScanOpen, setIsScanOpen] = useState(false);

    // PWA banner
    const [isBannerVisible, setBannerVisible] = useState(false);

    // Ref untuk menutup dropdown saat klik di luar
    const dropdownRef = useRef<HTMLDivElement>(null);

    // ── DATA TURUNAN (DERIVED) ───────────────────────────────────────────

    // Objek user yang diformat dari profil autentikasi
    const user: HomeUser | null = profile
        ? {
            id: profile.auth_user_id,
            username: profile.nickname || profile.fullname || profile.username || "Racer",
            email: profile.email,
            avatar: profile.avatar_url || "",
        }
        : null;

    // Cek apakah aplikasi sudah di-install sebagai PWA
    const isInstalled =
        typeof window !== "undefined" &&
        (window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as any).standalone === true);

    // Data animasi speed lines (dibuat sekali, tidak berubah)
    const speedLines = useMemo(() => {
        return Array.from({ length: 5 }, (_, i) => ({
            id: i,
            top: `${15 + Math.random() * 70}%`,
            width: `${100 + Math.random() * 200}px`,
            delay: `${i * 1.2}s`,
            duration: `${3 + Math.random() * 3}s`,
        }));
    }, []);

    // ── EFEK SAMPING (SIDE EFFECTS) ──────────────────────────────────────

    // Deteksi perubahan status fullscreen
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    // Redirect otomatis jika URL memiliki parameter ?room=XXX
    useEffect(() => {
        async function init() {
            const params = new URLSearchParams(window.location.search);
            const roomParam = params.get("room");
            if (roomParam) {
                const code = roomParam.toUpperCase();
                setIsRedirecting(true);
                router.push(`/join/${code}`);
            }
        }
        init();
    }, [router]);

    // Redirect otomatis jika ada pending room code setelah login
    useEffect(() => {
        if (profile && !authLoading) {
            const pendingCode = localStorage.getItem("nitroquiz_pendingRoomCode");
            if (pendingCode) {
                localStorage.removeItem("nitroquiz_pendingRoomCode");
                router.replace(`/join/${pendingCode.toUpperCase()}`);
            }
        }
    }, [profile, authLoading, router]);

    // Menutup dropdown saat klik di luar area dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Tampilkan banner PWA jika belum di-dismiss dan belum di-install
    useEffect(() => {
        const dismissed = localStorage.getItem("pwaBannerDismissed") === "true";
        if (installPrompt && !dismissed && !isInstalled) {
            setBannerVisible(true);
        }
    }, [installPrompt, isInstalled]);

    // ── HANDLER / AKSI ───────────────────────────────────────────────────

    // Toggle mode fullscreen browser
    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
        setIsDropdownOpen(false);
    }, []);

    // Buka dialog konfirmasi logout
    const handleLogout = useCallback(() => {
        setIsLogoutDialogOpen(true);
        setIsDropdownOpen(false);
    }, []);

    // Eksekusi logout dan redirect ke halaman login
    const performLogout = useCallback(async () => {
        await supabase.auth.signOut();
        router.push("/login");
    }, [supabase.auth, router]);

    // Navigasi ke halaman pembuatan game (host)
    const handleHost = useCallback(() => {
        setIsHosting(true);
        setTimeout(() => {
            router.push("/host/select-quiz");
        }, 100);
    }, [router]);

    // Masuk ke room berdasarkan kode yang diisi
    const handleJoin = useCallback(() => {
        if (roomCode.trim()) {
            if (user) {
                router.push(`/join/${roomCode.trim()}`);
            } else {
                localStorage.setItem("nitroquiz_pendingRoomCode", roomCode.trim());
                router.push("/login");
            }
        }
    }, [roomCode, user, router]);

    // Dismiss banner PWA install
    const handleDismissBanner = useCallback(() => {
        localStorage.setItem("pwaBannerDismissed", "true");
        setBannerVisible(false);
    }, []);

    // Proses hasil scan QR dan navigasi ke room
    const handleQrScan = useCallback((result: any[]) => {
        if (result && result.length > 0) {
            const scannedText = result[0].rawValue;
            const finalCode = extractRoomCodeFromScan(scannedText);

            setRoomCode(finalCode);
            setIsScanOpen(false);

            if (finalCode) {
                if (user) {
                    router.push(`/join/${finalCode}`);
                } else {
                    localStorage.setItem("nitroquiz_pendingRoomCode", finalCode);
                    router.push("/login");
                }
            }
        }
    }, [user, router]);

    // Ganti bahasa aplikasi
    const changeLanguage = useCallback((langCode: string) => {
        i18n.changeLanguage(langCode);
        setIsLanguageOpen(false);
        setIsDropdownOpen(false);
    }, [i18n]);

    // ── RETURN ───────────────────────────────────────────────────────────
    return {
        // Terjemahan
        t,
        i18n,

        // Data pengguna
        user,
        authLoading,

        // Status loading
        isHosting,
        isRedirecting,

        // Input
        roomCode,
        setRoomCode,

        // UI state
        isDropdownOpen,
        setIsDropdownOpen,
        isLanguageOpen,
        setIsLanguageOpen,
        isFullscreen,
        showHowToPlay,
        setShowHowToPlay,
        isLogoutDialogOpen,
        setIsLogoutDialogOpen,
        isScanOpen,
        setIsScanOpen,
        isBannerVisible,
        setBannerVisible,
        dropdownRef,

        // PWA
        installPrompt,
        isInstalled,
        handlePWAInstall,

        // BGM
        isMuted,
        toggleMute,

        // Animasi
        speedLines,

        // Handler
        toggleFullscreen,
        handleLogout,
        performLogout,
        handleHost,
        handleJoin,
        handleDismissBanner,
        handleQrScan,
        changeLanguage,
    };
}
