"use client";

import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowLeft, HelpCircle, Heart, Play, FileText, RefreshCw } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase, supabaseCentral } from "@/lib/supabase";
import { Logo } from "@/components/ui/logo";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { generateXID } from "@/lib/id-generator";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Languages, Play as PlayIcon } from "lucide-react";
import { FloatingHostActions } from "@/components/FloatingHostActions";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface QuizView {
    id: string;
    title: string;
    category: string;
    questionCount: number;
    description: string;
    imageUrl?: string;
    played?: number;
    creatorId?: string;
    isPublic: boolean;
}

export interface SelectQuizClientProps {
    /** Data awal yang sudah di-fetch di server (halaman 1, tanpa filter) */
    initialQuizzes: QuizView[];
    initialTotalCount: number;
    initialCategories: string[];
    /** Profile ID dari server (untuk personalisasi tanpa menunggu client auth) */
    serverProfileId: string | null;
}

// ─── Category color map ───────────────────────────────────────────────────────

const categoryColorMap: Record<string, {
    bar: string;
    badge: string;
    badgeBorder: string;
    badgeText: string;
    hoverBorder: string;
}> = {
    general: { bar: '#1a5f5f', badge: 'rgba(26,95,95,0.22)', badgeBorder: 'rgba(38,166,154,0.4)', badgeText: '#4db6ac', hoverBorder: 'rgba(26,95,95,0.7)' },
    math: { bar: '#00c853', badge: 'rgba(0,200,83,0.15)', badgeBorder: 'rgba(0,230,118,0.35)', badgeText: '#00e676', hoverBorder: 'rgba(0,200,83,0.6)' },
    history: { bar: '#e91e8c', badge: 'rgba(233,30,140,0.15)', badgeBorder: 'rgba(240,98,146,0.35)', badgeText: '#f06292', hoverBorder: 'rgba(233,30,140,0.6)' },
    science: { bar: '#7c3aed', badge: 'rgba(124,58,237,0.18)', badgeBorder: 'rgba(167,139,250,0.35)', badgeText: '#a78bfa', hoverBorder: 'rgba(124,58,237,0.6)' },
    geography: { bar: '#1a9e6e', badge: 'rgba(26,158,110,0.18)', badgeBorder: 'rgba(52,211,153,0.35)', badgeText: '#34d399', hoverBorder: 'rgba(26,158,110,0.6)' },
    language: { bar: '#f59e0b', badge: 'rgba(245,158,11,0.15)', badgeBorder: 'rgba(251,191,36,0.35)', badgeText: '#fbbf24', hoverBorder: 'rgba(245,158,11,0.6)' },
    sport: { bar: '#ef4444', badge: 'rgba(239,68,68,0.15)', badgeBorder: 'rgba(252,165,165,0.35)', badgeText: '#fca5a5', hoverBorder: 'rgba(239,68,68,0.6)' },
    technology: { bar: '#2d6af2', badge: 'rgba(45,106,242,0.18)', badgeBorder: 'rgba(100,181,246,0.35)', badgeText: '#64b5f6', hoverBorder: 'rgba(45,106,242,0.6)' },
    art: { bar: '#d946ef', badge: 'rgba(217,70,239,0.15)', badgeBorder: 'rgba(240,171,252,0.35)', badgeText: '#f0abfc', hoverBorder: 'rgba(217,70,239,0.6)' },
    music: { bar: '#ec4899', badge: 'rgba(236,72,153,0.15)', badgeBorder: 'rgba(249,168,212,0.35)', badgeText: '#f9a8d4', hoverBorder: 'rgba(236,72,153,0.6)' },
    umum: { bar: '#1a5f5f', badge: 'rgba(26,95,95,0.22)', badgeBorder: 'rgba(38,166,154,0.4)', badgeText: '#4db6ac', hoverBorder: 'rgba(26,95,95,0.7)' },
    matematika: { bar: '#00c853', badge: 'rgba(0,200,83,0.15)', badgeBorder: 'rgba(0,230,118,0.35)', badgeText: '#00e676', hoverBorder: 'rgba(0,200,83,0.6)' },
    sejarah: { bar: '#e91e8c', badge: 'rgba(233,30,140,0.15)', badgeBorder: 'rgba(240,98,146,0.35)', badgeText: '#f06292', hoverBorder: 'rgba(233,30,140,0.6)' },
    ipa: { bar: '#7c3aed', badge: 'rgba(124,58,237,0.18)', badgeBorder: 'rgba(167,139,250,0.35)', badgeText: '#a78bfa', hoverBorder: 'rgba(124,58,237,0.6)' },
    ips: { bar: '#1a9e6e', badge: 'rgba(26,158,110,0.18)', badgeBorder: 'rgba(52,211,153,0.35)', badgeText: '#34d399', hoverBorder: 'rgba(26,158,110,0.6)' },
    bahasa: { bar: '#f59e0b', badge: 'rgba(245,158,11,0.15)', badgeBorder: 'rgba(251,191,36,0.35)', badgeText: '#fbbf24', hoverBorder: 'rgba(245,158,11,0.6)' },
    olahraga: { bar: '#ef4444', badge: 'rgba(239,68,68,0.15)', badgeBorder: 'rgba(252,165,165,0.35)', badgeText: '#fca5a5', hoverBorder: 'rgba(239,68,68,0.6)' },
    teknologi: { bar: '#2d6af2', badge: 'rgba(45,106,242,0.18)', badgeBorder: 'rgba(100,181,246,0.35)', badgeText: '#64b5f6', hoverBorder: 'rgba(45,106,242,0.6)' },
};

const fallbackColors = [
    { bar: '#1a5f5f', badge: 'rgba(26,95,95,0.22)', badgeBorder: 'rgba(38,166,154,0.4)', badgeText: '#4db6ac', hoverBorder: 'rgba(26,95,95,0.7)' },
    { bar: '#7c3aed', badge: 'rgba(124,58,237,0.18)', badgeBorder: 'rgba(167,139,250,0.35)', badgeText: '#a78bfa', hoverBorder: 'rgba(124,58,237,0.6)' },
    { bar: '#f59e0b', badge: 'rgba(245,158,11,0.15)', badgeBorder: 'rgba(251,191,36,0.35)', badgeText: '#fbbf24', hoverBorder: 'rgba(245,158,11,0.6)' },
    { bar: '#00c853', badge: 'rgba(0,200,83,0.15)', badgeBorder: 'rgba(0,230,118,0.35)', badgeText: '#00e676', hoverBorder: 'rgba(0,200,83,0.6)' },
    { bar: '#e91e8c', badge: 'rgba(233,30,140,0.15)', badgeBorder: 'rgba(240,98,146,0.35)', badgeText: '#f06292', hoverBorder: 'rgba(233,30,140,0.6)' },
    { bar: '#1a9e6e', badge: 'rgba(26,158,110,0.18)', badgeBorder: 'rgba(52,211,153,0.35)', badgeText: '#34d399', hoverBorder: 'rgba(26,158,110,0.6)' },
];

const getCategoryColor = (category: string) => {
    const key = category.toLowerCase().trim();
    if (categoryColorMap[key]) return categoryColorMap[key];
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) & 0xffff;
    return fallbackColors[hash % fallbackColors.length];
};

// ─── Main Client Component ────────────────────────────────────────────────────

export default function SelectQuizClient({
    initialQuizzes,
    initialTotalCount,
    initialCategories,
    serverProfileId,
}: SelectQuizClientProps) {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const { profile, user } = useAuth();

    // Auth: prefer client-side profile (real-time), fallback to server-passed ID
    const currentProfileId = profile?.id || serverProfileId || null;
    const currentUserId = user?.id || null;

    // ── State ──
    const [searchQuery, setSearchQuery] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [currentPage, setCurrentPage] = useState(1);

    // Initialize with server-provided data — NO loading flash on first render!
    const [quizzes, setQuizzes] = useState<QuizView[]>(initialQuizzes);
    const [totalCount, setTotalCount] = useState(initialTotalCount);
    const [categories, setCategories] = useState<string[]>(initialCategories);

    const [creating, setCreating] = useState(false);
    const [creatingQuizId, setCreatingQuizId] = useState<string | null>(null);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'myquiz'>('all');

    // isFetching starts as false — initial data already loaded from server
    const [isFetching, setIsFetching] = useState(false);
    const [isReturning, setIsReturning] = useState(false);
    const [hoveredTooltipId, setHoveredTooltipId] = useState<string | null>(null);

    // Detail Dialog State
    const [selectedQuizDetail, setSelectedQuizDetail] = useState<any>(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    const itemsPerPage = 8;
    const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

    // ── Load favorites from profile/localStorage ──
    useEffect(() => {
        if (profile) {
            const profileFavorites = (profile as any)?.favorite_quiz?.favorites;
            if (profileFavorites && Array.isArray(profileFavorites)) {
                setFavorites(profileFavorites);
                localStorage.setItem('quiz_favorites', JSON.stringify(profileFavorites));
            } else {
                const savedFavorites = localStorage.getItem('quiz_favorites');
                if (savedFavorites) {
                    try { setFavorites(JSON.parse(savedFavorites)); } catch { }
                }
            }
        }
    }, [profile]);

    // ── Fetch categories when profile changes (for user-specific cats) ──
    useEffect(() => {
        // Only re-fetch categories if we have a profile (personalized view)
        // On initial load, server already provided categories
        if (!currentProfileId) return;
        const fetchCategories = async () => {
            const orQuery = `is_public.eq.true,creator_id.eq.${currentProfileId}`;
            const { data } = await supabaseCentral
                .from("quizzes").select("category")
                .eq("is_hidden", false).eq("status", "active")
                .is("deleted_at", null)
                .or(orQuery);
            if (data) {
                const uniqueCats = ['All', ...new Set(data.map((q: any) => q.category).filter(Boolean))];
                setCategories(uniqueCats);
            }
        };
        fetchCategories();
    }, [currentProfileId]);

    const toggleFavorite = async (quizId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const isCurrentlyFav = favorites.includes(quizId);
        const newFavs = isCurrentlyFav ? favorites.filter(id => id !== quizId) : [...favorites, quizId];
        setFavorites(newFavs);
        localStorage.setItem('quiz_favorites', JSON.stringify(newFavs));

        if (currentProfileId) {
            try {
                await supabaseCentral
                    .from('profiles')
                    .update({ favorite_quiz: { favorites: newFavs } })
                    .eq('id', currentProfileId);

                const { data: quizData } = await supabaseCentral
                    .from('quizzes')
                    .select('favorite')
                    .eq('id', quizId)
                    .single();

                if (quizData) {
                    let quizFavs: string[] = [];
                    try {
                        const parsed = typeof quizData.favorite === 'string'
                            ? JSON.parse(quizData.favorite)
                            : quizData.favorite;
                        quizFavs = Array.isArray(parsed) ? parsed : [];
                    } catch { quizFavs = []; }

                    const updatedQuizFavs = isCurrentlyFav
                        ? quizFavs.filter(uid => uid !== currentProfileId)
                        : Array.from(new Set([...quizFavs, currentProfileId]));

                    await supabaseCentral
                        .from('quizzes')
                        .update({ favorite: JSON.stringify(updatedQuizFavs) })
                        .eq('id', quizId);
                }
            } catch (err) {
                console.error("Failed to sync favorite status", err);
            }
        }
    };

    const fetchQuizzes = useCallback(async (pageToFetch = currentPage, silent = false) => {
        if (!silent) setIsFetching(true);
        try {
            const offset = (pageToFetch - 1) * itemsPerPage;
            const favIds = favorites.length > 0 ? favorites : ['00000000-0000-0000-0000-000000000000'];
            const p_search_query = searchQuery || null;
            const p_category_filter = selectedCategory === 'All' ? null : selectedCategory;
            const p_favorites_filter = activeTab === 'favorites' ? favIds : null;
            const p_creator_filter = activeTab === 'myquiz' ? (currentProfileId || currentUserId) : null;

            const { data, error } = await supabaseCentral.rpc('get_quizzes_paginated', {
                p_user_id: currentProfileId || null,
                p_search_query,
                p_category_filter,
                p_favorites_filter,
                p_creator_filter,
                p_limit: itemsPerPage,
                p_offset: offset
            });

            if (error) { console.error("Error fetching paginated quizzes:", error); return; }

            if (data) {
                const fetchedQuizzes: QuizView[] = data.map((quiz: any) => ({
                    id: quiz.id, title: quiz.title || "Untitled Quiz",
                    category: quiz.category || "umum", questionCount: quiz.question_count || 0,
                    description: quiz.description || "No description provided.",
                    imageUrl: quiz.image_url || quiz.cover_image, played: quiz.played || 0,
                    creatorId: quiz.creator_id, isPublic: quiz.is_public !== false,
                }));
                setQuizzes(fetchedQuizzes);
                setTotalCount(data.length > 0 ? Number(data[0].total_count) : 0);
            }
        } catch (err) { console.error("Failed to fetch quizzes via RPC", err); }
        finally { setIsFetching(false); }
    }, [currentPage, searchQuery, selectedCategory, activeTab, currentProfileId, currentUserId, favorites]);

    // Refetch hanya jika ada perubahan filter/page (bukan saat pertama render)
    const [isFirstRender, setIsFirstRender] = useState(true);
    useEffect(() => {
        if (isFirstRender) {
            setIsFirstRender(false);
            return; // Skip — data awal sudah ada dari server
        }
        fetchQuizzes(currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, searchQuery, selectedCategory, activeTab, currentProfileId, currentUserId]);

    // Silent refresh favorites tab
    useEffect(() => {
        if (activeTab === 'favorites' && !isFirstRender) {
            fetchQuizzes(currentPage, true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [favorites]);

    // Reset pagination
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedCategory, activeTab]);

    const getCategoryDisplayName = (cat: string): string => {
        if (cat === 'All') return t('select_quiz.all_categories');
        const key = cat.toLowerCase().trim();
        if (i18n.exists(`categories.${key}`)) {
            return t(`categories.${key}`);
        }
        return cat.split(/[-_\s]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    const handleSelectQuiz = async (quizId: string) => {
        if (creating) return;
        setCreating(true);
        setCreatingQuizId(quizId);
        const mockGamePin = Math.floor(100000 + Math.random() * 900000).toString();
        const hostId = currentProfileId || currentUserId || null;
        const sessId = generateXID();

        const primarySession = {
            id: sessId,
            quiz_id: quizId,
            host_id: hostId,
            game_pin: mockGamePin,
            total_time_minutes: 5,
            question_limit: 5,
            difficulty: 'easy',
            current_questions: [],
            status: 'waiting',
        };

        const newMainSession = {
            ...primarySession,
            game_end_mode: 'manual',
            allow_join_after_start: false,
            participants: [],
            responses: [],
            application: 'nitroquiz'
        };

        try {
            const [mainResult, gameResult] = await Promise.allSettled([
                supabaseCentral.from('game_sessions').insert(newMainSession),
                supabase.from('sessions').insert(primarySession)
            ]);

            const mainError = mainResult.status === 'rejected' ? mainResult.reason : mainResult.value.error;
            const gameError = gameResult.status === 'rejected' ? gameResult.reason : gameResult.value.error;

            if (mainError) {
                console.error('Error creating session (main):', mainError);
                if (!gameError) await supabase.from('sessions').delete().eq('id', sessId);
                setCreating(false); setCreatingQuizId(null);
                return;
            }

            if (gameError) {
                console.error('Error creating session (game):', gameError);
                await supabaseCentral.from('game_sessions').delete().eq('id', sessId);
                setCreating(false); setCreatingQuizId(null);
                return;
            }

            localStorage.setItem("currentQuizId", quizId);
            localStorage.setItem('hostGamePin', mockGamePin);
            sessionStorage.setItem('currentHostId', hostId || '');

            router.push(`/host/${mockGamePin}/settings`);
        } catch (err) {
            console.error('Unexpected error:', err);
            setCreating(false);
            setCreatingQuizId(null);
        }
    };

    const handleOpenQuizDetail = async (quizId: string) => {
        setIsDetailLoading(true);
        setSelectedQuizDetail(null);
        setIsDescriptionExpanded(false);
        try {
            const { data, error } = await supabaseCentral
                .from("quizzes")
                .select("*")
                .eq("id", quizId)
                .single();

            if (error) throw error;
            setSelectedQuizDetail(data);
        } catch (err) {
            console.error("Error fetching quiz detail:", err);
        } finally {
            setIsDetailLoading(false);
        }
    };

    return (
        <div className="h-screen bg-[#04060f] relative overflow-hidden font-body text-white selection:bg-[#7C3AED]/30 selection:text-white flex flex-col">
            {/* Racing Stripe at top */}
            <div className="racing-stripe z-0 pointer-events-none"></div>

            {/* Background Image matching HomePage */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
                style={{
                    backgroundImage: 'url("/assets/backgorund/homepage_bg.png")',
                    backgroundAttachment: 'fixed'
                }}
            ></div>

            {/* Overlays for readability */}
            <div className="fixed inset-0 z-0 bg-gradient-to-t from-[#04060f] via-[#04060f]/80 to-[#7C3AED]/20 pointer-events-none"></div>

            {/* Very subtle scanlines */}
            <div className="scanlines"></div>

            <div className="relative z-10 flex-1 flex flex-col h-full overflow-hidden">
                {/* Top Bar */}
                <div className="w-full px-4 md:px-6 pt-2 pb-0 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <Logo width={100} height={30} withText={false} animated={false} />
                    </div>
                    <Image src="/assets/logo/logo2.png" alt="NitroQuiz" width={150} height={38}
                        className="object-contain opacity-70 hover:opacity-100 transition-opacity duration-300 drop-shadow-[0_0_8px_rgba(169,141,197,0.4)]" />
                </div>

                <div className="flex-1 overflow-y-auto relative w-full pt-0.5">
                    <div className="container mx-auto px-6 pb-8 max-w-6xl">

                        {/* Search & Filter Bar */}
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                            className="w-full bg-[#0c1020]/80 border border-white/[0.08] rounded-xl overflow-hidden mb-6 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex-shrink-0">
                            <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg,transparent,#7C3AED,transparent)' }} />

                            <div className="p-3 sm:p-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 w-full">
                                {/* Search */}
                                <div className="flex-1 w-full md:w-auto relative group/search min-w-[200px] transform -skew-x-[8deg]">
                                    <Input type="text" placeholder={t('select_quiz.search_placeholder')} value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                setSearchQuery(searchInput);
                                                setCurrentPage(1);
                                            }
                                        }}
                                        className="w-full bg-white/[0.03] border border-white/10 pl-6 pr-14 h-10 text-white font-display text-[10px] uppercase tracking-widest placeholder:text-white/30 rounded-none focus-visible:ring-1 focus-visible:ring-[#7C3AED]/50 focus-visible:border-[#7C3AED] transition-all hover:bg-white/[0.06] transform skew-x-[8deg] !rounded-sm" />
                                    <button
                                        onClick={() => { setSearchQuery(searchInput); setCurrentPage(1); }}
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 bg-[#7C3AED]/30 text-[#a78bfa] hover:bg-[#7C3AED] hover:text-white border border-[#7C3AED]/50 transition-all z-10 flex items-center justify-center group/btn overflow-hidden transform skew-x-[8deg] -translate-x-1 rounded-sm"
                                        title="Search"
                                    >
                                        <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                                        <Search className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Navigation Tabs */}
                                <div className="flex items-center justify-center sm:justify-start flex-wrap gap-2 flex-shrink-0 w-full md:w-auto">
                                    <button onClick={() => setActiveTab('all')}
                                        className={`group/tb flex items-center justify-center h-9 px-4 relative overflow-hidden transform -skew-x-[12deg] transition-all duration-300 rounded-sm hover:shadow-[0_0_15px_rgba(45,106,242,0.3)] ${activeTab === 'all' ? 'bg-[#2d6af2] text-white border border-white/20' : 'bg-white/[0.03] border border-white/5 text-gray-400 hover:text-white hover:bg-white/[0.08]'}`}>
                                        <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/tb:translate-x-[200%] transition-transform duration-700" />
                                        <div className="relative z-10 flex items-center gap-2 transform skew-x-[12deg]">
                                            <Search size={12} className="w-3.5 h-3.5" />
                                            <span className="font-display text-[10px] tracking-widest uppercase font-black">{t('select_quiz.tabs.quizzes')}</span>
                                        </div>
                                    </button>

                                    <button onClick={() => setActiveTab('favorites')}
                                        className={`group/tb flex items-center justify-center h-9 px-4 relative overflow-hidden transform -skew-x-[12deg] transition-all duration-300 rounded-sm hover:shadow-[0_0_15px_rgba(236,72,153,0.3)] ${activeTab === 'favorites' ? 'bg-gradient-to-r from-[#ec4899] to-[#ef4444] text-white border border-white/20' : 'bg-white/[0.03] border border-white/5 text-gray-400 hover:text-pink-400 hover:bg-pink-500/10'}`}>
                                        <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/tb:translate-x-[200%] transition-transform duration-700" />
                                        <div className="relative z-10 flex items-center gap-2 transform skew-x-[12deg]">
                                            <Heart size={12} className={`w-3.5 h-3.5 ${activeTab === 'favorites' ? 'fill-white' : ''}`} />
                                            <span className="font-display text-[10px] tracking-widest uppercase font-black">{t('select_quiz.tabs.favorites')}</span>
                                        </div>
                                    </button>

                                    <button onClick={() => setActiveTab('myquiz')}
                                        className={`group/tb flex items-center justify-center h-9 px-4 relative overflow-hidden transform -skew-x-[12deg] transition-all duration-300 rounded-sm hover:shadow-[0_0_15px_rgba(124,58,237,0.3)] ${activeTab === 'myquiz' ? 'bg-[#7c3aed] text-white border border-white/20' : 'bg-white/[0.03] border border-white/5 text-gray-400 hover:text-[#a78bfa] hover:bg-[#7c3aed]/10'}`}>
                                        <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/tb:translate-x-[200%] transition-transform duration-700" />
                                        <div className="relative z-10 flex items-center gap-2 transform skew-x-[12deg]">
                                            <FileText size={12} className="w-3.5 h-3.5" />
                                            <span className="font-display text-[10px] tracking-widest uppercase font-black">{t('select_quiz.tabs.my_quiz')}</span>
                                        </div>
                                    </button>
                                </div>

                                {/* Category Dropdown */}
                                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                    <SelectTrigger className="w-full md:w-56 h-10 bg-white/[0.03] border border-white/10 text-white hover:bg-white/[0.06] focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/50 rounded-sm font-display text-[10px] tracking-widest uppercase transition-all flex-shrink-0 transform -skew-x-[8deg]">
                                        <SelectValue placeholder={t('select_quiz.category_placeholder')} className="transform skew-x-[8deg]" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0c1020]/95 border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.5)] text-white font-display text-[10px] uppercase tracking-wide backdrop-blur-2xl">
                                        {categories.map((cat) => (
                                            <SelectItem key={cat} value={cat} className="focus:bg-[#2d6af2]/30 focus:text-white cursor-pointer py-2">
                                                {getCategoryDisplayName(cat)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </motion.div>

                        {/* Quiz Grid */}
                        <TooltipProvider delayDuration={100}>
                            <AnimatePresence mode="wait">
                                {(isFetching || isReturning || creating) ? (
                                    <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                        {Array.from({ length: 8 }).map((_, i) => (
                                            <Card key={i} className="h-full flex flex-col bg-[#161c33]/50 border-t border-t-white/10 border border-white/5 rounded-xl pb-0 shadow-lg animate-pulse overflow-hidden">
                                                <CardHeader className="p-3 pb-1 flex flex-col">
                                                    <div className="w-24 h-[11px] bg-white/10 rounded-sm transform -skew-x-[15deg] mb-1.5"></div>
                                                    <div className="space-y-2 mt-1 mb-2">
                                                        <div className="w-[85%] h-3 bg-white/20 rounded-sm"></div>
                                                        <div className="w-[50%] h-3 bg-white/10 rounded-sm"></div>
                                                    </div>
                                                </CardHeader>
                                                <CardFooter className="p-3 border-t border-white/5 flex justify-between items-end mt-auto bg-gradient-to-t from-[#0c1020]/50 to-transparent">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="w-14 h-2 bg-white/10 rounded-sm"></div>
                                                        <div className="w-8 h-3 bg-white/20 rounded-sm"></div>
                                                    </div>
                                                    <div className="w-16 h-8 bg-white/10 rounded-sm transform -skew-x-[15deg]"></div>
                                                </CardFooter>
                                            </Card>
                                        ))}
                                    </motion.div>
                                ) : quizzes.length > 0 ? (
                                    <motion.div key={`grid-${currentPage}-${activeTab}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                        {quizzes.map((quiz) => {
                                            const isFavorited = favorites.includes(quiz.id);
                                            const colors = getCategoryColor(quiz.category);

                                            return (
                                                <motion.div key={quiz.id}
                                                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="cursor-pointer relative group h-full flex flex-col"
                                                    onClick={() => handleOpenQuizDetail(quiz.id)}
                                                    style={{ willChange: "transform, opacity" }}>

                                                    <div className="absolute -inset-[1px] bg-gradient-to-br from-white/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />

                                                    <Card className="h-full flex flex-col bg-[#161c33]/85 backdrop-blur-xl border-t border-t-white/20 border border-white/10 transition-all duration-300 relative overflow-hidden group rounded-xl pb-0 shadow-[0_10px_30px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_25px_rgba(124,58,237,0.3)] justify-between">

                                                        <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.06] pointer-events-none transition-opacity"
                                                            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />

                                                        <div className="absolute left-0 top-0 bottom-0 w-[4px] opacity-80"
                                                            style={{ background: `linear-gradient(to bottom, ${colors.bar}, transparent)` }} />

                                                        <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden rounded-tr-xl">
                                                            <div className="absolute w-24 h-3 bg-white/[0.03] rotate-45 transform origin-bottom-left translate-x-8 translate-y-[-10px]" />
                                                            <div className="absolute w-24 h-1.5 bg-white/[0.05] rotate-45 transform origin-bottom-left translate-x-6 translate-y-[-16px]" />
                                                        </div>

                                                        <div className="absolute inset-0 z-0 pointer-events-none">
                                                            {quiz.imageUrl && (
                                                                <div className="absolute top-0 right-0 w-2/3 h-full opacity-[0.25] group-hover:opacity-[0.45] transition-all duration-700"
                                                                    style={{ backgroundImage: `url(${quiz.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', maskImage: 'linear-gradient(to right, transparent, black)' }} />
                                                            )}
                                                            <div className="absolute inset-0 bg-gradient-to-r from-[#161c33] via-[#161c33]/90 to-transparent" />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-[#161c33] via-transparent to-[#161c33]/50" />
                                                        </div>

                                                        <button onClick={(e) => toggleFavorite(quiz.id, e)}
                                                            className={`absolute top-2.5 right-2.5 z-30 p-1.5 rounded-full transition-all duration-200 backdrop-blur-sm ${isFavorited ? 'bg-pink-500/20 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:bg-pink-500/40' : 'bg-black/30 border border-white/5 text-gray-500 hover:text-pink-400 hover:border-pink-500/30 hover:bg-pink-500/10'}`}>
                                                            <Heart size={12} className={isFavorited ? 'fill-pink-400' : ''} />
                                                        </button>

                                                        <CardHeader className="p-3 pb-1 relative z-20 flex flex-col">
                                                            <div className="flex items-start mb-1.5">
                                                                <div className="px-2 py-[2px] rounded-sm text-[7px] font-display font-black uppercase tracking-[0.2em] transform -skew-x-[15deg] transition-all duration-300"
                                                                    style={{
                                                                        background: `linear-gradient(90deg, ${colors.badgeBorder}60, transparent)`,
                                                                        borderLeft: `2.5px solid ${colors.bar}`,
                                                                        boxShadow: `0 0 10px ${colors.badgeBorder}50, inset 2px 0 6px ${colors.badgeBorder}60`,
                                                                        color: '#fff',
                                                                        textShadow: `0 0 5px ${colors.bar}`
                                                                    }}>
                                                                    <div className="transform skew-x-[15deg]">
                                                                        {getCategoryDisplayName(quiz.category)}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <Tooltip open={hoveredTooltipId === quiz.id}>
                                                                <TooltipTrigger asChild>
                                                                    <CardTitle className="text-[12px] text-white font-black italic uppercase tracking-wider leading-snug transition-all drop-shadow-md line-clamp-2 pr-6"
                                                                        style={{ textShadow: `0 0 10px ${colors.badgeBorder}00` }}
                                                                        onMouseEnter={e => {
                                                                            e.currentTarget.style.textShadow = `0 0 15px ${colors.badgeBorder}80`;
                                                                            if (e.currentTarget.scrollHeight > e.currentTarget.clientHeight) {
                                                                                setHoveredTooltipId(quiz.id);
                                                                            }
                                                                        }}
                                                                        onMouseLeave={e => {
                                                                            e.currentTarget.style.textShadow = `0 0 10px ${colors.badgeBorder}00`;
                                                                            setHoveredTooltipId(null);
                                                                        }}>
                                                                        {quiz.title}
                                                                    </CardTitle>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" sideOffset={8} className="bg-[#0c1020]/95 backdrop-blur-xl border border-[#7C3AED]/60 text-white font-display text-[10px] uppercase font-bold tracking-widest shadow-[0_0_25px_rgba(124,58,237,0.5)] z-[100] max-w-[280px]">
                                                                    {quiz.title}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </CardHeader>

                                                        <CardFooter className="p-3 border-t border-white/10 flex justify-between items-end relative z-20 bg-gradient-to-t from-[#0c1020]/95 to-transparent mt-auto">
                                                            <div className="flex flex-col">
                                                                <span className="text-[8px] text-white/80 font-display uppercase tracking-[0.25em] mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-bold">QUESTIONS</span>
                                                                <div className="flex items-center gap-1.5 font-bold text-white text-xs font-display">
                                                                    <HelpCircle size={12} style={{ color: colors.bar }} />
                                                                    {quiz.questionCount}
                                                                </div>
                                                            </div>

                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleSelectQuiz(quiz.id); }}
                                                                disabled={creating}
                                                                className="group/btn flex items-center h-10 relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transform -skew-x-[12deg] transition-all duration-300 rounded-sm"
                                                                style={{ background: `linear-gradient(135deg, ${colors.bar}, ${colors.badgeBorder})` }}
                                                            >
                                                                <div className="absolute inset-0 border border-white/20 pointer-events-none" />
                                                                <div className="absolute top-0 right-0 bottom-0 w-1/2 bg-white/20 transform -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-out" />
                                                                <div className="relative z-10 flex items-center gap-2 px-5 transform skew-x-[12deg] transition-transform duration-300">
                                                                    <span className="text-white font-black text-[10px] tracking-[0.2em] uppercase">{t('select_quiz.start_button')}</span>
                                                                    <Play size={10} className="fill-white" />
                                                                </div>
                                                            </button>
                                                        </CardFooter>
                                                    </Card>
                                                </motion.div>
                                            );
                                        })}
                                    </motion.div>
                                ) : (
                                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="col-span-full py-20 text-center">
                                        {activeTab === 'favorites' ? (
                                            <>
                                                <Heart className="h-16 w-16 mx-auto text-pink-500/20 mb-4" />
                                                <h3 className="text-xl text-white font-display uppercase tracking-widest mb-2">{t('select_quiz.empty_states.favorites_title')}</h3>
                                                <p className="text-pink-400/40 text-sm mb-6">{t('select_quiz.empty_states.favorites_desc')}</p>
                                                <Button variant="outline" onClick={() => setActiveTab('all')} className="bg-pink-500/10 border border-pink-500/50 text-pink-400 hover:bg-pink-500 hover:text-white transition-all font-display text-xs uppercase tracking-wider">{t('select_quiz.empty_states.browse_quizzes')}</Button>
                                            </>
                                        ) : activeTab === 'myquiz' ? (
                                            <>
                                                <FileText className="h-16 w-16 mx-auto text-[#00ff9d]/20 mb-4" />
                                                <h3 className="text-xl text-white font-display uppercase tracking-widest mb-2">{t('select_quiz.empty_states.myquiz_title')}</h3>
                                                <p className="text-[#00ff9d]/40 text-sm mb-6">{t('select_quiz.empty_states.myquiz_desc')}</p>
                                                <div className="flex justify-center gap-4">
                                                    <Button variant="outline" onClick={() => fetchQuizzes(1)} className="bg-white/[0.03] border border-[#00ff9d]/50 text-[#00ff9d] hover:bg-[#00ff9d]/20 transition-all font-display text-xs uppercase tracking-wider"><RefreshCw className="w-4 h-4 mr-2" />{t('select_quiz.empty_states.refresh')}</Button>
                                                    <Button variant="outline" onClick={() => setActiveTab('all')} className="bg-[#00ff9d]/10 border border-[#00ff9d]/50 text-[#00ff9d] hover:bg-[#00ff9d] hover:text-[#04060f] transition-all font-display text-xs uppercase tracking-wider">{t('select_quiz.empty_states.browse_all')}</Button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <Search className="h-16 w-16 mx-auto text-[#2d6af2]/20 mb-4" />
                                                <h3 className="text-xl text-white font-display uppercase tracking-widest mb-2">{t('select_quiz.empty_states.search_title')}</h3>
                                                <p className="text-[#2d6af2]/40 text-sm mb-6">{t('select_quiz.empty_states.search_desc')}</p>
                                                <Button variant="outline" onClick={() => { setSearchQuery(""); setSearchInput(""); setSelectedCategory("All"); }} className="bg-[#2d6af2]/10 border border-[#2d6af2]/50 text-[#2d6af2] hover:bg-[#2d6af2] hover:text-white transition-all font-display text-xs uppercase tracking-wider">{t('select_quiz.empty_states.reset_filters')}</Button>
                                            </>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </TooltipProvider>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center mt-6 mb-2 gap-3 flex-shrink-0">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1 || isFetching || creating || isReturning}
                                    className="group/prev flex items-center h-10 px-6 relative overflow-hidden disabled:opacity-30 disabled:cursor-not-allowed transform -skew-x-[15deg] transition-all duration-300 rounded-sm bg-white/[0.03] border border-white/10 hover:border-[#2d6af2]/50 hover:bg-[#2d6af2]/10"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#2d6af2]/10 to-transparent -translate-x-full group-hover/prev:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                                    <div className="relative z-10 flex items-center gap-2 transform skew-x-[15deg] transition-transform duration-300">
                                        <ArrowLeft size={12} className="text-[#2d6af2]" />
                                        <span className="text-white font-black text-[10px] tracking-[0.2em] uppercase">{t('select_quiz.pagination.prev')}</span>
                                    </div>
                                </button>

                                <div className="flex items-center px-6 bg-[#0c1020]/80 border border-white/10 rounded-sm text-white font-display font-black text-[11px] tracking-[0.2em] shadow-[0_0_15px_rgba(0,0,0,0.3)] transform -skew-x-[15deg]">
                                    <div className="transform skew-x-[15deg]">
                                        {t('select_quiz.pagination.page')} {currentPage} / {totalPages}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || isFetching || creating || isReturning}
                                    className="group/next flex items-center h-10 px-6 relative overflow-hidden disabled:opacity-30 disabled:cursor-not-allowed transform -skew-x-[15deg] transition-all duration-300 rounded-sm bg-gradient-to-r from-[#2d6af2] to-[#1e40af] border border-white/20 hover:shadow-[0_0_20px_rgba(45,106,242,0.4)]"
                                >
                                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/next:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                                    <div className="relative z-10 flex items-center gap-2 transform skew-x-[15deg] transition-transform duration-300">
                                        <span className="text-white font-black text-[10px] tracking-[0.2em] uppercase">{t('select_quiz.pagination.next')}</span>
                                        <Play size={10} className="fill-white" />
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <FloatingHostActions />

            {/* Quiz Detail Dialog */}
            {(() => {
                const colors = selectedQuizDetail ? getCategoryColor(selectedQuizDetail.category) : null;
                const dynamicBorderColor = colors ? colors.bar : '#2d6af2';
                const dynamicShadow = colors ? `0 0 60px rgba(0,0,0,0.8), 0 0 40px ${colors.badgeBorder}` : '0 0 60px rgba(0,0,0,0.8), 0 0 40px rgba(45,106,242,0.15)';

                return (
                    <Dialog open={!!selectedQuizDetail || isDetailLoading} onOpenChange={(open) => { if (!open) setSelectedQuizDetail(null); }}>
                        <DialogContent
                            className="bg-[#080d1a]/95 border border-white/[0.05] border-t-4 text-white backdrop-blur-3xl p-0 overflow-hidden max-w-lg rounded-sm transition-all duration-300"
                            style={{ borderTopColor: dynamicBorderColor, boxShadow: dynamicShadow }}>
                            {isDetailLoading ? (
                                <div className="flex flex-col items-center justify-center p-12 space-y-4">
                                    <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
                                        style={{ borderColor: `${dynamicBorderColor}50`, borderTopColor: '#00ff9d' }} />
                                    <p className="font-display text-[10px] uppercase tracking-widest text-gray-500">Loading...</p>
                                </div>
                            ) : selectedQuizDetail && colors && (
                                <div className="flex flex-col">
                                    {/* Telemetry Header */}
                                    <div className="p-6 pb-5 border-b border-white/5 bg-gradient-to-br from-[#0c1226] to-[#060914] relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 blur-[40px] rounded-full pointer-events-none transition-colors duration-500"
                                            style={{ backgroundColor: colors.badgeBorder, opacity: 0.15 }} />

                                        <div className="flex items-start mb-3 relative z-10 w-fit">
                                            <div className="px-3 py-1 text-[8px] font-display font-black uppercase tracking-[0.2em] transform -skew-x-[15deg] border border-l-2 shadow-[0_0_15px_rgba(0,0,0,0.2)]"
                                                style={{
                                                    background: `linear-gradient(90deg, ${colors.badgeBorder}40, transparent)`,
                                                    borderColor: `${colors.badgeBorder}30`,
                                                    borderLeftColor: colors.bar,
                                                    color: colors.badgeText,
                                                    textShadow: `0 0 5px ${colors.bar}`
                                                }}>
                                                <div className="transform skew-x-[15deg]">
                                                    {getCategoryDisplayName(selectedQuizDetail.category)}
                                                </div>
                                            </div>
                                        </div>

                                        <DialogTitle className="text-[22px] font-display font-black italic uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 leading-tight drop-shadow-md relative z-10 pr-4">
                                            {selectedQuizDetail.title}
                                        </DialogTitle>

                                        <div className="mt-4 relative z-10">
                                            <p className={`text-gray-400 text-[11px] font-display tracking-widest uppercase leading-snug transition-all duration-300 ${isDescriptionExpanded ? '' : 'line-clamp-2'}`}>
                                                {selectedQuizDetail.description || t('select_quiz.detail.no_description')}
                                            </p>
                                            {(selectedQuizDetail.description && selectedQuizDetail.description.length > 80) && (
                                                <button
                                                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                                    className="text-[9px] font-display font-bold uppercase tracking-[0.2em] mt-2 hover:text-white transition-colors focus:outline-none flex items-center gap-1"
                                                    style={{ color: colors.badgeText }}>
                                                    {isDescriptionExpanded ? t('select_quiz.detail.show_less') : t('select_quiz.detail.show_more')}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Data Grid */}
                                    <div className="px-6 py-5 grid grid-cols-2 gap-3 bg-[#060914]">
                                        <div className="flex items-center gap-3 bg-[#0f142b] border border-white/5 p-3 px-4 rounded-sm shadow-inner transition-colors group">
                                            <HelpCircle size={16} className="transition-transform group-hover:scale-110" style={{ color: colors.bar }} />
                                            <div className="flex flex-col">
                                                <span className="text-[8px] text-white/40 uppercase tracking-widest font-display font-bold">{t('select_quiz.detail.questions')}</span>
                                                <span className="text-[14px] font-display font-black text-white tracking-widest">
                                                    {typeof selectedQuizDetail.questions === 'string'
                                                        ? JSON.parse(selectedQuizDetail.questions).length
                                                        : (Array.isArray(selectedQuizDetail.questions) ? selectedQuizDetail.questions.length : 0)} <span className="text-[9px] text-white/50">{t('select_quiz.detail.qs_suffix')}</span>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 bg-[#0f142b] border border-white/5 p-3 px-4 rounded-sm shadow-inner transition-colors group">
                                            <Play size={16} className="text-[#00ff9d] group-hover:scale-110 transition-transform" />
                                            <div className="flex flex-col">
                                                <span className="text-[8px] text-white/40 uppercase tracking-widest font-display font-bold">{t('select_quiz.detail.played')}</span>
                                                <span className="text-[14px] font-display font-black text-white tracking-widest">
                                                    {selectedQuizDetail.played || 0} <span className="text-[9px] text-white/50">{t('select_quiz.detail.play_suffix')}</span>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 bg-[#0f142b] border border-white/5 p-3 px-4 rounded-sm shadow-inner transition-colors group">
                                            <Heart size={16} className="text-pink-500 group-hover:scale-110 transition-transform" />
                                            <div className="flex flex-col">
                                                <span className="text-[8px] text-white/40 uppercase tracking-widest font-display font-bold">{t('select_quiz.detail.favorites')}</span>
                                                <span className="text-[14px] font-display font-black text-white tracking-widest">
                                                    {(() => {
                                                        try {
                                                            const favs = typeof selectedQuizDetail.favorite === 'string'
                                                                ? JSON.parse(selectedQuizDetail.favorite)
                                                                : selectedQuizDetail.favorite;
                                                            return Array.isArray(favs) ? favs.length : 0;
                                                        } catch { return 0; }
                                                    })()} <span className="text-[9px] text-white/50">{t('select_quiz.detail.fav_suffix')}</span>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 bg-[#0f142b] border border-white/5 p-3 px-4 rounded-sm shadow-inner transition-colors group">
                                            <Languages size={16} className="text-[#7c3aed] group-hover:scale-110 transition-transform" />
                                            <div className="flex flex-col">
                                                <span className="text-[8px] text-white/40 uppercase tracking-widest font-display font-bold">{t('select_quiz.detail.language')}</span>
                                                <span className="text-[14px] font-display font-black text-white uppercase tracking-widest">
                                                    {selectedQuizDetail.language || 'ID'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Bay */}
                                    <div className="p-6 pt-0 pb-6 flex items-center justify-between gap-4 bg-[#060914]">
                                        <button
                                            onClick={() => setSelectedQuizDetail(null)}
                                            className="px-6 h-10 font-display text-[10px] font-bold tracking-[0.2em] uppercase text-white/50 hover:text-white transition-all bg-white/5 border border-white/10 hover:border-white/30 transform -skew-x-[15deg] hover:bg-white/10">
                                            <div className="transform skew-x-[15deg]">{t('select_quiz.detail.cancel')}</div>
                                        </button>
                                        <button
                                            onClick={() => {
                                                const qid = selectedQuizDetail.id;
                                                setSelectedQuizDetail(null);
                                                handleSelectQuiz(qid);
                                            }}
                                            disabled={creating}
                                            className="flex-1 max-w-[200px] h-11 group/btnstart overflow-hidden text-white font-display text-[12px] font-black tracking-[0.3em] uppercase transition-all duration-300 relative transform -skew-x-[15deg] disabled:opacity-50 border"
                                            style={{
                                                background: `linear-gradient(135deg, ${colors.bar}, ${colors.badgeBorder})`,
                                                borderColor: `${colors.badgeBorder}80`,
                                                boxShadow: `0 0 25px ${colors.badgeBorder}60`
                                            }}>
                                            <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover/btnstart:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                                            <div className="absolute inset-0 border border-white/20" />
                                            <div className="transform skew-x-[15deg] absolute inset-0 flex items-center justify-center gap-2">
                                                {t('select_quiz.detail.start')} <Play size={10} className="fill-white" />
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                );
            })()}
        </div>
    );
}
