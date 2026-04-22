"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/types";
import {
    Menu,
    Maximize,
    Minimize,
    PlayCircle,
    Download,
    Globe,
    LogOut,
    X,
    User as UserIcon,
    ChevronRight,
    Zap,
    Users,
    Trophy,
    Target,
    DownloadIcon,
    Flag,
    LogIn,
    Volume2,
    VolumeX,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useBgm } from "@/contexts/BgmContext";
import { useTranslation } from "react-i18next";
import { getI18nInstance } from "@/lib/i18n";
import { Logo } from "@/components/ui/logo";
import Image from "next/image";
import { createGFSClient } from "@/lib/supabase/gfs-client";

export default function HomeClient() {
    const supabase = createGFSClient();
    const router = useRouter();
    const { profile, loading: authLoading } = useAuth();
    const { isMuted, toggleMute } = useBgm();
    const { t } = useTranslation();
    const i18n = getI18nInstance();
    const [roomCode, setRoomCode] = useState("");
    const [isHosting, setIsHosting] = useState(false);
    const user = profile ? {
        id: profile.auth_user_id,
        username: profile.nickname || profile.fullname || profile.username || "Racer",
        email: profile.email,
        avatar: profile.avatar_url || "",
    } : null;
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLanguageOpen, setIsLanguageOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showHowToPlay, setShowHowToPlay] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const speedLines = useMemo(() => {
        return Array.from({ length: 5 }, (_, i) => ({
            id: i,
            top: `${15 + Math.random() * 70}%`,
            width: `${100 + Math.random() * 200}px`,
            delay: `${i * 1.2}s`,
            duration: `${3 + Math.random() * 3}s`,
        }));
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () =>
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
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
    };

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

    useEffect(() => {
        if (profile && !authLoading) {
            const pendingCode = localStorage.getItem("nitroquiz_pendingRoomCode");
            if (pendingCode) {
                localStorage.removeItem("nitroquiz_pendingRoomCode");
                router.replace(`/join/${pendingCode.toUpperCase()}`);
            }
        }
    }, [profile, authLoading, router]);

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

    const handleLogout = async () => {
        setIsLogoutDialogOpen(true);
        setIsDropdownOpen(false);
    };

    const performLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    const handleHost = () => {
        setIsHosting(true);
        setTimeout(() => {
            router.push("/host/select-quiz");
        }, 100);
    };

    const handleJoin = () => {
        if (roomCode.trim() && user) {
            router.push(`/join/${roomCode.trim()}`);
        }
    };

    if (authLoading || isHosting || isRedirecting) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#04060f] relative overflow-hidden font-body text-white">
                <div className="racing-stripe"></div>
                <div className="text-center z-10">
                    <div className="w-14 h-14 border-[3px] border-white/10 border-t-[#7C3AED] rounded-full animate-spin mx-auto mb-6"></div>
                    <p className="mt-4 text-white/60 text-sm tracking-[0.3em] uppercase font-body">
                        {t('homepage.loading')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#04060f] text-white min-h-screen relative overflow-hidden font-body selection:bg-[#7C3AED]/30 selection:text-white flex flex-col">
            {/* Racing Stripe at top */}
            <div className="racing-stripe"></div>

            {/* Original Background Image */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
                style={{
                    backgroundImage: 'url("/assets/backgorund/homepage_bg.webp")',
                    backgroundAttachment: 'fixed'
                }}
            ></div>

            {/* Overlays for readability */}
            <div className="fixed inset-0 z-0 bg-gradient-to-t from-[#04060f] via-[#04060f]/60 to-[#7C3AED]/10 pointer-events-none"></div>

            {/* Speed lines animation */}
            <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden">
                {speedLines.map((line) => (
                    <div
                        key={line.id}
                        className="speed-line"
                        style={{
                            top: line.top,
                            width: line.width,
                            animationDelay: line.delay,
                            animationDuration: line.duration,
                        }}
                    />
                ))}
            </div>

            {/* Very subtle scanlines */}
            <div className="scanlines"></div>

            {/* Top Bar: Corner Logo */}
            <div className="fixed top-0 left-0 z-[90] px-4 md:px-8 py-5 pointer-events-none flex items-start">
                <div className="pointer-events-auto">
                    <Image
                        src="/assets/logo/logo2.png"
                        alt="GameForSmart"
                        width={180}
                        height={50}
                        className="h-8 md:h-10 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-300"
                        priority
                    />
                </div>
            </div>

            {/* Top Right Dropdown Menu */}
            {user && (
                <div
                    className="fixed top-5 right-4 md:right-8 z-[100]"
                    ref={dropdownRef}
                >
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 border ${isDropdownOpen
                            ? "bg-[#7C3AED] border-[#7C3AED] text-white shadow-[0_0_20px_rgba(124,58,237,0.4)]"
                            : "bg-white/[0.04] backdrop-blur-md border-white/[0.08] text-white/50 hover:text-white hover:border-white/20 hover:bg-white/[0.08]"
                            }`}
                    >
                        {isDropdownOpen ? (
                            <X className="w-4 h-4" />
                        ) : (
                            <Menu className="w-4 h-4" />
                        )}
                    </button>

                    <AnimatePresence>
                        {isDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="absolute top-14 right-0 w-72 bg-[#0c1020]/97 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col font-body z-[101]"
                            >
                                {/* User Header */}
                                <div className="p-5 bg-gradient-to-br from-white/[0.03] to-transparent border-b border-white/[0.05]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
                                            {user.avatar ? (
                                                <Image
                                                    src={user.avatar}
                                                    alt={user.username}
                                                    width={40}
                                                    height={40}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div
                                                    className="w-full h-full flex items-center justify-center text-xs font-bold text-white select-none"
                                                    style={{
                                                        backgroundColor: (() => {
                                                            const colors = ['#7C3AED', '#2d6af2', '#f59e0b', '#8b5cf6', '#10b981', '#ec4899', '#06b6d4', '#f97316'];
                                                            let hash = 0;
                                                            for (let i = 0; i < user.username.length; i++) hash = user.username.charCodeAt(i) + ((hash << 5) - hash);
                                                            return colors[Math.abs(hash) % colors.length];
                                                        })()
                                                    }}
                                                >
                                                    {user.username.trim().split(/\s+/).length >= 2
                                                        ? (user.username.trim().split(/\s+/)[0][0] + user.username.trim().split(/\s+/)[1][0]).toUpperCase()
                                                        : user.username.slice(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-base font-bold truncate">
                                                {user.username}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions List */}
                                <div className="p-2 flex flex-col gap-0.5">
                                    <button
                                        onClick={toggleFullscreen}
                                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-white/[0.04] text-white/50 hover:text-white transition-all group"
                                    >
                                        <div className="p-1.5 rounded-lg bg-white/[0.04] group-hover:bg-white/[0.08] transition-colors">
                                            {isFullscreen ? (
                                                <Minimize className="w-3.5 h-3.5 text-white/70" />
                                            ) : (
                                                <Maximize className="w-3.5 h-3.5 text-white/70" />
                                            )}
                                        </div>
                                        <span className="text-sm font-medium">
                                            {isFullscreen ? t('homepage.menu.exit_fullscreen') : t('homepage.menu.fullscreen')}
                                        </span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setShowHowToPlay(true);
                                            setIsDropdownOpen(false);
                                        }}
                                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-white/[0.04] text-white/50 hover:text-white transition-all group"
                                    >
                                        <div className="p-1.5 rounded-lg bg-white/[0.04] group-hover:bg-white/[0.08] transition-colors">
                                            <PlayCircle className="w-3.5 h-3.5 text-white/70" />
                                        </div>
                                        <span className="text-sm font-medium">
                                            {t('homepage.menu.how_to_play')}
                                        </span>
                                    </button>

                                    <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-white/[0.04] text-white/50 hover:text-white transition-all group opacity-40 cursor-not-allowed">
                                        <div className="p-1.5 rounded-lg bg-white/[0.04] transition-colors">
                                            <DownloadIcon className="w-3.5 h-3.5 text-white/70" />
                                        </div>
                                        <span className="text-sm font-medium">
                                            {t('homepage.menu.install_app')}
                                        </span>
                                    </button>

                                    <button
                                        onClick={toggleMute}
                                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-white/[0.04] text-white/50 hover:text-white transition-all group"
                                    >
                                        <div className="p-1.5 rounded-lg bg-white/[0.04] group-hover:bg-white/[0.08] transition-colors">
                                            {isMuted ? (
                                                <VolumeX className="w-3.5 h-3.5 text-red-400" />
                                            ) : (
                                                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                                            )}
                                        </div>
                                        <span className="text-sm font-medium flex-1 text-left rtl:text-right">
                                            {t('room_settings.sound')}
                                        </span>
                                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded ${isMuted ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                            {isMuted ? 'OFF' : 'ON'}
                                        </div>
                                    </button>

                                    <div className="relative">
                                        <button
                                            onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                                            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-white/[0.04] text-white/50 hover:text-white transition-all group"
                                        >
                                            <div className="p-1.5 rounded-lg bg-white/[0.04] group-hover:bg-white/[0.08] transition-colors">
                                                <Globe className="w-3.5 h-3.5 text-white/70" />
                                            </div>
                                            <span className="text-sm font-medium flex-1 text-start">
                                                {t('homepage.menu.language')}
                                            </span>
                                            <ChevronRight className={`w-3.5 h-3.5 transition-transform rtl:scale-x-[-1] ${isLanguageOpen ? 'rotate-90' : ''}`} />
                                        </button>

                                        <AnimatePresence>
                                            {isLanguageOpen && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="px-2 pb-2 space-y-0.5 overflow-hidden"
                                                >
                                                    {[
                                                        { code: "en", label: "English", sub: "Global" },
                                                        { code: "id", label: "Indonesia", sub: "Bahasa" },
                                                        { code: "ar", label: "العربية", sub: "Arabic" },
                                                    ].map((lang) => (
                                                        <button
                                                            key={lang.code}
                                                            onClick={() => {
                                                                i18n.changeLanguage(lang.code);
                                                                setIsLanguageOpen(false);
                                                                setIsDropdownOpen(false);
                                                            }}
                                                            className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all ${i18n.language.startsWith(lang.code)
                                                                ? "bg-[#7C3AED]/10 text-[#a78bfa] border border-[#7C3AED]/20"
                                                                : "hover:bg-white/[0.03] text-white/40 hover:text-white/60"
                                                                }`}
                                                        >
                                                            <div className="flex flex-col items-start translate-x-1 rtl:-translate-x-1">
                                                                <span className="text-xs font-bold uppercase tracking-widest">{lang.label}</span>
                                                            </div>
                                                            {i18n.language.startsWith(lang.code) && (
                                                                <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                                                            )}
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Footer Action */}
                                <div className="p-2 pt-0 border-t border-white/[0.05]">
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 w-full mt-2 px-3 py-3 rounded-xl bg-red-500/[0.06] hover:bg-red-500/[0.15] text-red-400/80 hover:text-red-400 transition-all group"
                                    >
                                        <div className="p-1.5 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                                            <LogOut className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-sm font-semibold tracking-wide uppercase">
                                            {t('homepage.menu.logout')}
                                        </span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* How to Play Modal */}
            <AnimatePresence>
                {showHowToPlay && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowHowToPlay(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.3, type: "spring", stiffness: 150 }}
                            className="w-full max-w-lg bg-[#0c1020]/98 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="h-[2px] bg-gradient-to-r from-transparent via-[#7C3AED] to-transparent"></div>
                            <div className="p-6 pb-4 flex items-center justify-between border-b border-white/[0.05]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-[#7C3AED]/10 border border-[#7C3AED]/20">
                                        <Flag className="w-4 h-4 text-[#a78bfa]" />
                                    </div>
                                    <h2 className="text-lg font-bold uppercase tracking-wider text-white">
                                        {t('homepage.how_to_play.title')}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setShowHowToPlay(false)}
                                    className="p-2 rounded-lg hover:bg-white/[0.05] text-white/40 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                                {[
                                    { icon: <Zap className="w-4 h-4" />, title: t('homepage.how_to_play.step1.title'), desc: t('homepage.how_to_play.step1.desc'), color: "text-[#a78bfa]", bg: "bg-[#7C3AED]/[0.08] border-[#7C3AED]/[0.15]" },
                                    { icon: <Target className="w-4 h-4" />, title: t('homepage.how_to_play.step2.title'), desc: t('homepage.how_to_play.step2.desc'), color: "text-[#2d6af2]", bg: "bg-[#2d6af2]/[0.06] border-[#2d6af2]/[0.12]" },
                                    { icon: <Users className="w-4 h-4" />, title: t('homepage.how_to_play.step3.title'), desc: t('homepage.how_to_play.step3.desc'), color: "text-amber-400", bg: "bg-amber-400/[0.06] border-amber-400/[0.12]" },
                                    { icon: <Trophy className="w-4 h-4" />, title: t('homepage.how_to_play.step4.title'), desc: t('homepage.how_to_play.step4.desc'), color: "text-emerald-400", bg: "bg-emerald-400/[0.06] border-emerald-400/[0.12]" },
                                ].map((step, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: i18n.language === 'ar' ? 10 : -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.08 }}
                                        className={`flex items-start gap-3 p-3.5 rounded-xl border ${step.bg} transition-all`}
                                    >
                                        <div className={`flex-shrink-0 p-1.5 rounded-lg ${step.bg} ${step.color}`}>
                                            {step.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-[9px] font-bold tracking-[0.15em] text-white/30 uppercase">Step {i + 1}</span>
                                            </div>
                                            <h3 className={`font-bold text-sm uppercase tracking-wide mb-0.5 ${step.color}`}>{step.title}</h3>
                                            <p className="text-white/40 text-xs leading-relaxed">{step.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="p-6 pt-4 border-t border-white/[0.05]">
                                <button
                                    onClick={() => setShowHowToPlay(false)}
                                    className="w-full py-3 bg-gradient-to-r from-[#7C3AED] to-[#2d6af2] text-white font-bold text-xs tracking-[0.15em] uppercase rounded-xl hover:shadow-[0_0_30px_rgba(124,58,237,0.3)] transition-all active:scale-[0.98]"
                                >
                                    {t('homepage.how_to_play.button')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="relative z-20 flex flex-col items-center justify-center h-screen w-full max-w-5xl mx-auto p-4 md:p-6 overflow-hidden">
                {/* Logo & Tagline */}
                <header className="text-center mb-6 md:mb-10 relative z-30 w-full flex flex-col items-center">
                    <motion.div
                        initial={{ opacity: 0, y: -15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="relative"
                    >
                        <Image
                            src="/assets/logo/logo1.png"
                            alt="NitroQuiz Logo"
                            width={500}
                            height={150}
                            className="object-contain w-[200px] md:w-[320px] drop-shadow-[0_0_30px_rgba(124,58,237,0.4)] group-hover:drop-shadow-[0_0_40px_rgba(124,58,237,0.6)] transition-all duration-500 scale-95 group-hover:scale-100"
                            priority
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        className="mt-3 md:mt-4 flex items-center justify-center gap-3 md:gap-4"
                    >
                        {[
                            { word: "RACE", color: "#a78bfa" },
                            { word: "LEARN", color: "#00ff9d" },
                            { word: "DOMINATE", color: "#a78bfa" }
                        ].map((item, idx) => (
                            <div key={item.word} className="flex items-center gap-3 md:gap-4">
                                <span
                                    className="font-body text-[10px] sm:text-xs md:text-sm font-bold tracking-[0.25em] uppercase transition-all duration-300 cursor-default hover:tracking-[0.35em]"
                                    style={{ color: item.color }}
                                >
                                    {item.word}
                                </span>
                                {idx < 2 && (
                                    <div className="w-[3px] h-[3px] rounded-full bg-white/20" />
                                )}
                            </div>
                        ))}
                    </motion.div>
                </header>

                {/* Cards */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="flex flex-col md:flex-row gap-4 lg:gap-6 w-full justify-center items-stretch max-w-5xl px-4 md:px-0"
                >
                    {/* HOST CARD */}
                    <div className="host-card race-card flex-1 flex flex-col p-8 relative group">
                        <div className="motion-texture"></div>
                        <div className="laser-edge text-[#7C3AED]"></div>
                        <div className="checkered-tag"></div>

                        <div className="relative z-10 flex flex-col">
                            <div className="mb-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 flex items-center justify-center bg-[#7C3AED]/10 text-[#a78bfa] border border-[#7C3AED]/20">
                                        <Flag className="w-5 h-5" />
                                    </div>
                                    <div className="flex items-baseline gap-4">
                                        <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none">
                                            {t('homepage.host.title')}
                                        </h2>
                                        <p className="text-white/40 text-[10px] font-bold tracking-[0.1em] leading-none uppercase hidden sm:block">
                                            {t('homepage.host.subtitle')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 mt-1">
                                    <div className="h-0.5 w-12 bg-[#7C3AED] group-hover:w-20 transition-all duration-500"></div>
                                    <div className="flex gap-1">
                                        {[...Array(4)].map((_, i) => (
                                            <div key={i} className={`h-1 w-4 ${i < 3 ? 'bg-[#7C3AED]' : 'bg-white/10'}`}></div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <motion.button
                                    animate={{
                                        boxShadow: ["0 0 10px rgba(124,58,237,0.3)", "0 0 25px rgba(124,58,237,0.6)", "0 0 10px rgba(124,58,237,0.3)"],
                                    }}
                                    transition={{
                                        boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                                    }}
                                    onClick={handleHost}
                                    className="px-8 py-3.5 bg-gradient-to-r from-[#7C3AED] to-[#5b21b6] border border-white/20 rounded-sm transform -skew-x-[15deg] transition-all duration-300 relative group/btn overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-1000 ease-in-out"></div>
                                    <div className="relative z-10 flex items-center justify-center transform skew-x-[15deg] transition-transform duration-300">
                                        <span className="text-lg font-black text-white uppercase tracking-[0.15em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                                            {t('homepage.host.button')}
                                        </span>
                                    </div>
                                </motion.button>
                            </div>
                        </div>
                    </div>

                    {/* JOIN CARD */}
                    <div className="join-card race-card flex-1 flex flex-col p-8 relative group">
                        <div className="motion-texture"></div>
                        <div className="laser-edge text-[#2d6af2]"></div>
                        <div className="checkered-tag"></div>

                        <div className="relative z-10 flex flex-col">
                            <div className="mb-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 flex items-center justify-center bg-[#2d6af2]/10 text-[#5a9cff] border border-[#2d6af2]/20">
                                        <PlayCircle className="w-5 h-5" />
                                    </div>
                                    <div className="flex items-baseline gap-4">
                                        <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none">
                                            {t('homepage.join.title')}
                                        </h2>
                                        <p className="text-white/40 text-[10px] font-bold tracking-[0.1em] leading-none uppercase hidden sm:block">
                                            {t('homepage.join.subtitle')}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-1 h-0.5 w-12 bg-[#2d6af2] group-hover:w-20 transition-all duration-500"></div>
                            </div>

                            <div className="flex items-end gap-4">
                                <div className="flex-1 relative">
                                    <input
                                        className="w-full bg-white/[0.03] border-b border-white/10 text-white font-bold text-lg py-2 focus:outline-none focus:border-[#2d6af2] transition-colors placeholder:text-[10px] placeholder:font-bold uppercase tracking-[0.3em] placeholder:text-white/20 text-center"
                                        maxLength={6}
                                        placeholder={t('homepage.join.placeholder')}
                                        type="text"
                                        value={roomCode}
                                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                        onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                                    />
                                </div>

                                <motion.button
                                    animate={{
                                        boxShadow: ["0 0 10px rgba(45,106,242,0.3)", "0 0 25px rgba(45,106,242,0.6)", "0 0 10px rgba(45,106,242,0.3)"],
                                    }}
                                    transition={{
                                        boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                                    }}
                                    onClick={handleJoin}
                                    className="px-10 py-3 bg-gradient-to-r from-[#2d6af2] to-[#1e40af] border border-white/20 rounded-sm transform -skew-x-[15deg] transition-all duration-300 relative group/btn overflow-hidden whitespace-nowrap"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-1000 ease-in-out"></div>
                                    <div className="relative z-10 flex items-center justify-center transform skew-x-[15deg] transition-transform duration-300">
                                        <span className="text-base font-black text-white uppercase tracking-[0.15em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                                            {t('homepage.join.button')}
                                        </span>
                                    </div>
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </main>

            {/* Logout Confirmation Dialog */}
            <AnimatePresence>
                {isLogoutDialogOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 15 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            className="bg-[#0a0a0f] border-2 border-red-500/40 p-10 max-w-sm w-full shadow-[0_0_50px_rgba(239,68,68,0.2)] overflow-hidden relative transform -skew-x-[2deg] rounded-none"
                        >
                            <div className="transform skew-x-[2deg] flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-red-500/10 rounded-sm flex items-center justify-center mb-6 border border-red-500/20 transform -skew-x-[15deg]">
                                    <div className="transform skew-x-[15deg]">
                                        <LogOut className="w-7 h-7 text-red-500" />
                                    </div>
                                </div>

                                <h3 className="text-2xl font-display font-black text-white uppercase tracking-[0.1em] mb-3 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                                    {t("homepage.logout_confirm.title")}?
                                </h3>

                                <p className="text-white/40 text-xs font-display tracking-widest mb-10 uppercase leading-relaxed">
                                    {t("homepage.logout_confirm.description")}
                                </p>

                                <div className="flex gap-4 w-full">
                                    <button
                                        onClick={() => setIsLogoutDialogOpen(false)}
                                        className="group/btn flex-1 flex items-center justify-center border border-white/20 h-11 relative overflow-hidden transform -skew-x-[15deg] transition-all hover:bg-white/5"
                                    >
                                        <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                                        <span className="relative z-10 font-display font-black uppercase text-[10px] tracking-widest text-gray-400 group-hover/btn:text-white transform skew-x-[15deg]">
                                            {t("homepage.logout_confirm.cancel")}
                                        </span>
                                    </button>

                                    <button
                                        onClick={performLogout}
                                        className="group/btn flex-1 flex items-center justify-center bg-red-600 border border-red-400/50 h-11 relative overflow-hidden transform -skew-x-[15deg] transition-all hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                                    >
                                        <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                                        <span className="relative z-10 font-display font-black uppercase text-[10px] tracking-widest text-white transform skew-x-[15deg]">
                                            {t("homepage.logout_confirm.confirm")}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
