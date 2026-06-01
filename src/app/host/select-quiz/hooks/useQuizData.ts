/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CUSTOM HOOK: useQuizData
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Hook ini mengelola seluruh state dan logika data untuk halaman pilih quiz:
 * - Pencarian & filter kategori
 * - Pagination
 * - Favorit (sinkronisasi ke profil & localStorage)
 * - Fetch data quiz via RPC Supabase
 * - Pembuatan sesi game baru
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { generateXID } from "@/lib/id-generator";
import { createGFSClient } from "@/lib/supabase/gfs-client";
import { supabaseGame } from "@/lib/supabase/game-client";
import type { QuizView, QuizTab } from "../types";

// ── Jumlah item per halaman ──
const ITEMS_PER_PAGE = 8;

/**
 * Parameter inisialisasi hook, berasal dari data server-side
 */
interface UseQuizDataParams {
    initialQuizzes: QuizView[];
    initialTotalCount: number;
    initialCategories: string[];
    serverProfileId: string | null;
}

/**
 * Hook utama untuk mengelola semua data dan aksi pada halaman pilih quiz.
 */
export function useQuizData({
    initialQuizzes,
    initialTotalCount,
    initialCategories,
    serverProfileId,
}: UseQuizDataParams) {
    const supabaseCentral = createGFSClient();
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const { profile, user } = useAuth();

    // ── Identitas pengguna ──
    // Prioritaskan profile client-side (real-time), fallback ke ID dari server
    const currentProfileId = profile?.id || serverProfileId || null;
    const currentUserId = user?.id || null;

    // ═══════════════════════════════════════════════════════════════════
    // STATE: Pencarian & Filter
    // ═══════════════════════════════════════════════════════════════════
    const [searchQuery, setSearchQuery] = useState("");         // Query yang aktif digunakan untuk fetch
    const [searchInput, setSearchInput] = useState("");         // Input yang diketik user (belum disubmit)
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [activeTab, setActiveTab] = useState<QuizTab>('all');

    // ═══════════════════════════════════════════════════════════════════
    // STATE: Pagination
    // ═══════════════════════════════════════════════════════════════════
    const [currentPage, setCurrentPage] = useState(1);

    // ═══════════════════════════════════════════════════════════════════
    // STATE: Data Quiz (diinisialisasi dari server agar tidak ada flash loading)
    // ═══════════════════════════════════════════════════════════════════
    const [quizzes, setQuizzes] = useState<QuizView[]>(initialQuizzes);
    const [totalCount, setTotalCount] = useState(initialTotalCount);
    const [categories, setCategories] = useState<string[]>(initialCategories);

    // ═══════════════════════════════════════════════════════════════════
    // STATE: Status UI
    // ═══════════════════════════════════════════════════════════════════
    const [creating, setCreating] = useState(false);                   // Sedang membuat sesi game
    const [creatingQuizId, setCreatingQuizId] = useState<string | null>(null);
    const [favorites, setFavorites] = useState<string[]>([]);          // Daftar ID quiz favorit
    const [isFetching, setIsFetching] = useState(false);               // Sedang mengambil data
    const [isReturning, setIsReturning] = useState(false);             // Animasi kembali

    // ═══════════════════════════════════════════════════════════════════
    // STATE: Detail Dialog
    // ═══════════════════════════════════════════════════════════════════
    const [selectedQuizDetail, setSelectedQuizDetail] = useState<any>(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    // ═══════════════════════════════════════════════════════════════════
    // STATE: Tooltip
    // ═══════════════════════════════════════════════════════════════════
    const [hoveredTooltipId, setHoveredTooltipId] = useState<string | null>(null);

    // ── Kalkulasi pagination ──
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;

    // ═══════════════════════════════════════════════════════════════════
    // EFFECT: Muat data favorit dari profil atau localStorage
    // ═══════════════════════════════════════════════════════════════════
    useEffect(() => {
        if (profile) {
            const profileFavorites = (profile as any)?.favorite_quiz?.favorites;
            if (profileFavorites && Array.isArray(profileFavorites)) {
                // Favorit ada di profil, gunakan dan simpan ke localStorage sebagai cache
                setFavorites(profileFavorites);
                localStorage.setItem('quiz_favorites', JSON.stringify(profileFavorites));
            } else {
                // Tidak ada di profil, coba ambil dari localStorage
                const savedFavorites = localStorage.getItem('quiz_favorites');
                if (savedFavorites) {
                    try { setFavorites(JSON.parse(savedFavorites)); } catch { }
                }
            }
        }
    }, [profile]);

    // ═══════════════════════════════════════════════════════════════════
    // EFFECT: Ambil ulang kategori saat profil berubah (personalisasi)
    // ═══════════════════════════════════════════════════════════════════
    useEffect(() => {
        if (!currentProfileId) return;

        const fetchCategories = async () => {
            const orQuery = `is_public.eq.true,creator_id.eq.${currentProfileId}`;
            const { data } = await supabaseCentral
                .from("quizzes").select("category")
                .eq("is_hidden", false).eq("status", "active")
                .is("deleted_at", null)
                .or(orQuery);

            if (data) {
                const uniqueCats = [
                    'All',
                    ...new Set(data.map((q: any) => q.category).filter(Boolean))
                ] as string[];
                setCategories(uniqueCats);
            }
        };

        fetchCategories();
    }, [currentProfileId]);

    // ═══════════════════════════════════════════════════════════════════
    // FUNGSI: Toggle favorit quiz
    // ═══════════════════════════════════════════════════════════════════
    const toggleFavorite = async (quizId: string, e: React.MouseEvent) => {
        e.stopPropagation();

        const isCurrentlyFav = favorites.includes(quizId);
        const newFavs = isCurrentlyFav
            ? favorites.filter(id => id !== quizId)
            : [...favorites, quizId];

        // Update state lokal & cache terlebih dahulu (optimistic update)
        setFavorites(newFavs);
        localStorage.setItem('quiz_favorites', JSON.stringify(newFavs));

        // Sinkronisasi ke database jika user sudah login
        if (currentProfileId) {
            try {
                // Update daftar favorit di profil pengguna
                await supabaseCentral
                    .from('profiles')
                    .update({ favorite_quiz: { favorites: newFavs } })
                    .eq('id', currentProfileId);

                // Update daftar pengguna yang memfavoritkan quiz ini
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
                console.error("Gagal menyinkronkan status favorit", err);
            }
        }
    };

    // ═══════════════════════════════════════════════════════════════════
    // FUNGSI: Ambil data quiz dari server (via RPC)
    // ═══════════════════════════════════════════════════════════════════
    const fetchQuizzes = useCallback(async (pageToFetch = currentPage, silent = false) => {
        if (!silent) setIsFetching(true);

        try {
            const offset = (pageToFetch - 1) * ITEMS_PER_PAGE;

            // Siapkan parameter filter
            const favIds = favorites.length > 0
                ? favorites
                : ['00000000-0000-0000-0000-000000000000'];
            const p_search_query = searchQuery || null;
            const p_category_filter = selectedCategory === 'All' ? null : selectedCategory;
            const p_favorites_filter = activeTab === 'favorites' ? favIds : null;
            const p_creator_filter = activeTab === 'myquiz'
                ? (currentProfileId || currentUserId)
                : null;

            // Panggil RPC Supabase
            const { data, error } = await supabaseCentral.rpc('get_quizzes_paginated', {
                p_user_id: currentProfileId || null,
                p_search_query,
                p_category_filter,
                p_favorites_filter,
                p_creator_filter,
                p_limit: ITEMS_PER_PAGE,
                p_offset: offset
            });

            if (error) {
                console.error("Error mengambil quiz terpaginasi:", error);
                return;
            }

            // Transform data mentah ke format QuizView
            if (data) {
                const fetchedQuizzes: QuizView[] = data.map((quiz: any) => ({
                    id: quiz.id,
                    title: quiz.title || "Untitled Quiz",
                    category: quiz.category || "umum",
                    questionCount: quiz.question_count || 0,
                    description: quiz.description || "No description provided.",
                    imageUrl: quiz.image_url || quiz.cover_image,
                    played: quiz.played || 0,
                    creatorId: quiz.creator_id,
                    isPublic: quiz.is_public !== false,
                }));
                setQuizzes(fetchedQuizzes);
                setTotalCount(data.length > 0 ? Number(data[0].total_count) : 0);
            }
        } catch (err) {
            console.error("Gagal mengambil quiz via RPC", err);
        } finally {
            setIsFetching(false);
        }
    }, [currentPage, searchQuery, selectedCategory, activeTab, currentProfileId, currentUserId, favorites]);

    // ═══════════════════════════════════════════════════════════════════
    // EFFECT: Fetch ulang saat filter/page berubah (skip render pertama)
    // ═══════════════════════════════════════════════════════════════════
    const [isFirstRender, setIsFirstRender] = useState(true);

    useEffect(() => {
        if (isFirstRender) {
            setIsFirstRender(false);
            return; // Lewati — data awal sudah ada dari server
        }
        fetchQuizzes(currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, searchQuery, selectedCategory, activeTab, currentProfileId, currentUserId]);

    // ── Refresh tab favorit secara silent saat daftar favorit berubah ──
    useEffect(() => {
        if (activeTab === 'favorites' && !isFirstRender) {
            fetchQuizzes(currentPage, true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [favorites]);

    // ── Reset pagination saat filter berubah ──
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedCategory, activeTab]);

    // ═══════════════════════════════════════════════════════════════════
    // FUNGSI: Tampilkan nama kategori yang sudah diterjemahkan
    // ═══════════════════════════════════════════════════════════════════
    const getCategoryDisplayName = (cat: string): string => {
        if (cat === 'All') return t('select_quiz.all_categories');

        const key = cat.toLowerCase().trim();
        if (i18n.exists(`categories.${key}`)) {
            return t(`categories.${key}`);
        }

        // Fallback: kapitalisasi huruf pertama setiap kata
        return cat.split(/[-_\s]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    // ═══════════════════════════════════════════════════════════════════
    // FUNGSI: Pilih quiz dan buat sesi game baru
    // ═══════════════════════════════════════════════════════════════════
    const handleSelectQuiz = async (quizId: string) => {
        if (creating) return;
        setCreating(true);
        setCreatingQuizId(quizId);

        // Generate PIN game 6 digit dan ID sesi unik
        const mockGamePin = Math.floor(100000 + Math.random() * 900000).toString();
        const hostId = currentProfileId || currentUserId || null;
        const sessId = generateXID();

        // Data sesi primer (digunakan di kedua database)
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

        // Data tambahan untuk database utama (GFS)
        const newMainSession = {
            ...primarySession,
            game_end_mode: 'manual',
            allow_join_after_start: false,
            participants: [],
            responses: [],
            application: 'NitroQuiz'
        };

        try {
            // Insert ke kedua database secara paralel
            const [mainResult, gameResult] = await Promise.allSettled([
                supabaseCentral.from('game_sessions').insert(newMainSession),
                supabaseGame.from('sessions').insert(primarySession)
            ]);

            const mainError = mainResult.status === 'rejected' ? mainResult.reason : mainResult.value.error;
            const gameError = gameResult.status === 'rejected' ? gameResult.reason : gameResult.value.error;

            // Rollback jika salah satu gagal
            if (mainError) {
                console.error('Error membuat sesi (utama):', mainError);
                if (!gameError) await supabaseGame.from('sessions').delete().eq('id', sessId);
                setCreating(false); setCreatingQuizId(null);
                return;
            }

            if (gameError) {
                console.error('Error membuat sesi (game):', gameError);
                await supabaseCentral.from('game_sessions').delete().eq('id', sessId);
                setCreating(false); setCreatingQuizId(null);
                return;
            }

            // Simpan data sesi ke storage lokal
            localStorage.setItem("currentQuizId", quizId);
            localStorage.setItem('hostGamePin', mockGamePin);
            sessionStorage.setItem('currentHostId', hostId || '');

            // Navigasi ke halaman pengaturan game
            router.push(`/host/${mockGamePin}/settings`);
        } catch (err) {
            console.error('Error tidak terduga:', err);
            setCreating(false);
            setCreatingQuizId(null);
        }
    };

    // ═══════════════════════════════════════════════════════════════════
    // FUNGSI: Buka dialog detail quiz
    // ═══════════════════════════════════════════════════════════════════
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
            console.error("Error mengambil detail quiz:", err);
        } finally {
            setIsDetailLoading(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════════
    // RETURN: Semua state dan fungsi yang dibutuhkan komponen
    // ═══════════════════════════════════════════════════════════════════
    return {
        // Identitas
        currentProfileId,

        // Pencarian & filter
        searchInput, setSearchInput,
        searchQuery, setSearchQuery,
        selectedCategory, setSelectedCategory,
        activeTab, setActiveTab,
        categories,

        // Data quiz
        quizzes, totalCount,
        favorites, toggleFavorite,
        fetchQuizzes,

        // Pagination
        currentPage, setCurrentPage,
        totalPages, itemsPerPage: ITEMS_PER_PAGE,

        // Status UI
        creating, isFetching, isReturning,

        // Detail dialog
        selectedQuizDetail, setSelectedQuizDetail,
        isDetailLoading,
        isDescriptionExpanded, setIsDescriptionExpanded,
        handleOpenQuizDetail,

        // Tooltip
        hoveredTooltipId, setHoveredTooltipId,

        // Aksi
        handleSelectQuiz,

        // Terjemahan & navigasi
        t, i18n, router,
        getCategoryDisplayName,
    };
}
