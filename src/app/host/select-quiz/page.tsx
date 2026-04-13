"use client";

/**
 * page.tsx — Halaman Pemilihan Kuis (Select Quiz)
 * ════════════════════════════════════════════════
 *
 * Halaman ini memungkinkan host memilih kuis yang akan dimainkan.
 * Setelah memilih kuis, sistem akan membuat session baru dan
 * mengarahkan host ke halaman pengaturan.
 *
 * Fitur utama:
 * 1. Pencarian kuis berdasarkan judul
 * 2. Filter berdasarkan kategori
 * 3. Tab navigasi: Semua Kuis, Favorit, Kuis Saya
 * 4. Paginasi
 * 5. Dialog detail kuis
 * 6. Toggle favorit (disinkronkan ke server)
 * 7. Pembuatan session kuis baru
 *
 * Struktur komponen:
 * ├── BackgroundEffects   → Efek visual latar belakang
 * ├── TopBar              → Logo kiri & kanan
 * ├── SearchFilterBar     → Input pencarian, dropdown kategori, tab navigasi
 * ├── QuizGrid            → Grid kartu kuis / skeleton / empty state
 * ├── Pagination          → Navigasi halaman
 * └── QuizDetailDialog    → Dialog detail kuis
 *
 * Alur utama:
 * 1. Host mencari/memfilter kuis
 * 2. Host klik kartu untuk melihat detail, atau langsung klik "Start"
 * 3. Session baru dibuat di 2 database (central & game) secara paralel
 * 4. Host diarahkan ke halaman pengaturan (/host/{gamePin}/settings)
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, supabaseCentral } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { generateXID } from "@/lib/id-generator";

// ── Komponen halaman pemilihan kuis ──
import {
  BackgroundEffects,
  TopBar,
  SearchFilterBar,
  QuizGrid,
  Pagination,
  QuizDetailDialog,
  ITEMS_PER_PAGE,
} from "@/components/select-quiz";
import type { QuizView, QuizTab } from "@/components/select-quiz";

// ════════════════════════════════════════════════════════════════
// Komponen Utama: SelectQuizPage
// ════════════════════════════════════════════════════════════════
export default function SelectQuizPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { profile, user } = useAuth();

  // ── Derivasi data autentikasi ──
  const currentProfileId = profile?.id || null;
  const currentUserId = user?.id || null;

  // ════════════════════════════════════════════════════════════════
  // STATE
  // ════════════════════════════════════════════════════════════════

  // ── State pencarian & filter ──
  const [searchQuery, setSearchQuery] = useState("");         // Query pencarian aktif (debounced)
  const [searchInput, setSearchInput] = useState("");         // Nilai input pencarian (real-time)
  const [selectedCategory, setSelectedCategory] = useState<string>("All"); // Kategori terpilih
  const [activeTab, setActiveTab] = useState<QuizTab>('all'); // Tab aktif

  // ── State data ──
  const [quizzes, setQuizzes] = useState<QuizView[]>([]);     // Daftar kuis yang ditampilkan
  const [totalCount, setTotalCount] = useState(0);            // Total kuis (untuk paginasi)
  const [categories, setCategories] = useState<string[]>(['All']); // Daftar kategori tersedia
  const [favorites, setFavorites] = useState<string[]>([]);   // ID kuis yang di-favoritkan

  // ── State paginasi ──
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;

  // ── State loading & proses ──
  const [isFetching, setIsFetching] = useState(true);         // Sedang memuat daftar kuis
  const [creating, setCreating] = useState(false);             // Sedang membuat session baru
  const [creatingQuizId, setCreatingQuizId] = useState<string | null>(null); // ID kuis yang sedang dibuat
  const [isReturning, setIsReturning] = useState(false);       // Sedang kembali (navigasi)

  // ── State dialog detail kuis ──
  const [selectedQuizDetail, setSelectedQuizDetail] = useState<any>(null); // Data detail kuis
  const [isDetailLoading, setIsDetailLoading] = useState(false); // Sedang memuat detail
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false); // Deskripsi diperluas

  // ════════════════════════════════════════════════════════════════
  // HOOKS & SIDE EFFECTS
  // ════════════════════════════════════════════════════════════════

  /**
   * Hook: Memuat data favorit dari profil pengguna atau localStorage.
   * Prioritas: profil server → localStorage (fallback).
   */
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

  /**
   * Hook: Memuat daftar kategori unik dari database.
   * Filter berdasarkan kuis publik dan kuis milik pengguna.
   */
  useEffect(() => {
    const fetchCategories = async () => {
      const orQuery = currentProfileId
        ? `is_public.eq.true,creator_id.eq.${currentProfileId}`
        : `is_public.eq.true`;
      const { data } = await supabaseCentral
        .from("quizzes").select("category")
        .eq("is_hidden", false).eq("status", "active")
        .is("deleted_at", null)
        .or(orQuery);
      if (data) {
        const uniqueCats = ['All', ...new Set(data.map(q => q.category).filter(Boolean))];
        setCategories(uniqueCats);
      }
    };
    fetchCategories();
  }, [currentProfileId]);

  /**
   * Hook: Mengambil data kuis saat filter, halaman, atau tab berubah.
   */
  useEffect(() => {
    fetchQuizzes(currentPage);
  }, [currentPage, searchQuery, selectedCategory, activeTab, currentProfileId, currentUserId]);

  /**
   * Hook: Refresh silent saat toggle favorit di tab favorit.
   * Menggunakan mode silent agar tidak menampilkan loading skeleton.
   */
  useEffect(() => {
    if (activeTab === 'favorites') {
      fetchQuizzes(currentPage, true);
    }
  }, [favorites]);

  /**
   * Hook: Reset halaman ke 1 saat filter berubah.
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, activeTab]);

  // ════════════════════════════════════════════════════════════════
  // FUNGSI DATA FETCHING
  // ════════════════════════════════════════════════════════════════

  /**
   * Mengambil daftar kuis dari database menggunakan RPC (stored procedure).
   * Mendukung pencarian, filter kategori, filter favorit, dan filter kuis sendiri.
   *
   * @param pageToFetch - Nomor halaman yang akan diambil
   * @param silent - Jika true, tidak menampilkan loading skeleton
   */
  const fetchQuizzes = async (pageToFetch = currentPage, silent = false) => {
    if (!silent) setIsFetching(true);
    try {
      const offset = (pageToFetch - 1) * ITEMS_PER_PAGE;
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
        p_limit: ITEMS_PER_PAGE,
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
  };

  // ════════════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ════════════════════════════════════════════════════════════════

  /**
   * Toggle status favorit suatu kuis.
   * Menyinkronkan ke dua tempat:
   * 1. Profil pengguna (daftar kuis favorit)
   * 2. Record kuis (daftar pengguna yang mem-favoritkan)
   */
  const toggleFavorite = async (quizId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCurrentlyFav = favorites.includes(quizId);
    const newFavs = isCurrentlyFav ? favorites.filter(id => id !== quizId) : [...favorites, quizId];
    setFavorites(newFavs);
    localStorage.setItem('quiz_favorites', JSON.stringify(newFavs));

    if (currentProfileId) {
      try {
        // 1. Simpan ke profil pengguna (daftar kuis yang di-favoritkan user ini)
        await supabaseCentral
          .from('profiles')
          .update({ favorite_quiz: { favorites: newFavs } })
          .eq('id', currentProfileId);

        // 2. Simpan ke record kuis (daftar user yang mem-favoritkan kuis ini)
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

  /**
   * Memilih kuis dan membuat session baru.
   * Insert ke 2 database secara paralel, lalu redirect ke halaman pengaturan.
   */
  const handleSelectQuiz = async (quizId: string) => {
    if (creating) return;
    setCreating(true);
    setCreatingQuizId(quizId);
    const mockGamePin = Math.floor(100000 + Math.random() * 900000).toString();
    const hostId = currentProfileId || currentUserId || null;
    const sessId = generateXID();

    // Data session untuk database game (NitroQuiz)
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

    // Data session untuk database central (platform utama)
    const newMainSession = {
      ...primarySession,
      game_end_mode: 'manual',
      allow_join_after_start: false,
      participants: [],
      responses: [],
      application: 'nitroquiz'
    };

    try {
      // Insert ke kedua database secara paralel
      const [mainResult, gameResult] = await Promise.allSettled([
        supabaseCentral.from('game_sessions').insert(newMainSession),
        supabase.from('sessions').insert(primarySession)
      ]);

      const mainError = mainResult.status === 'rejected' ? mainResult.reason : mainResult.value.error;
      const gameError = gameResult.status === 'rejected' ? gameResult.reason : gameResult.value.error;

      // Rollback jika salah satu gagal
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

      // Simpan referensi ke storage dan redirect
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

  /**
   * Membuka dialog detail kuis dengan mengambil data lengkap dari server.
   */
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

  /**
   * Mendapatkan nama tampilan kategori dengan lokalisasi.
   * Prioritas: terjemahan i18n → auto-format dari string mentah.
   */
  const getCategoryDisplayName = (cat: string): string => {
    if (cat === 'All') return t('select_quiz.all_categories');

    const key = cat.toLowerCase().trim();
    if (i18n.exists(`categories.${key}`)) {
      return t(`categories.${key}`);
    }

    // Auto-format: "bahasa-inggris" → "Bahasa Inggris"
    return cat.split(/[-_\s]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  /**
   * Handler saat input pencarian berubah.
   * Memperbarui searchInput dan searchQuery secara bersamaan.
   */
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setSearchQuery(value);
    setCurrentPage(1);
  };

  /** Reset semua filter pencarian */
  const handleResetFilters = () => {
    setSearchQuery("");
    setSearchInput("");
    setSelectedCategory("All");
  };

  // ════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════

  return (
    <div className="h-screen bg-[#04060f] relative overflow-hidden font-body text-white selection:bg-[#2d6af2] selection:text-white flex flex-col">
      {/* ── Efek visual latar belakang ── */}
      <BackgroundEffects />

      {/* ── Konten utama dengan z-index di atas background ── */}
      <div className="relative z-10 flex-1 flex flex-col h-full overflow-hidden">
        {/* ── Bar atas: logo ── */}
        <TopBar />

        {/* ── Area scrollable ── */}
        <div className="flex-1 overflow-y-auto relative w-full pt-0.5">
          <div className="container mx-auto px-6 pb-8 max-w-6xl">
            {/* ── Bar pencarian & filter ── */}
            <SearchFilterBar
              searchInput={searchInput}
              onSearchChange={handleSearchChange}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categories={categories}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              getCategoryDisplayName={getCategoryDisplayName}
            />

            {/* ── Grid kuis (loading / data / empty) ── */}
            <QuizGrid
              quizzes={quizzes}
              isLoading={isFetching || isReturning || creating}
              activeTab={activeTab}
              favorites={favorites}
              isCreating={creating}
              currentPage={currentPage}
              onToggleFavorite={toggleFavorite}
              onOpenDetail={handleOpenQuizDetail}
              onSelectQuiz={handleSelectQuiz}
              onTabChange={setActiveTab}
              onResetFilters={handleResetFilters}
              onRefresh={() => fetchQuizzes(1)}
              getCategoryDisplayName={getCategoryDisplayName}
            />

            {/* ── Paginasi ── */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              isDisabled={isFetching || creating || isReturning}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>

      {/* ── Dialog detail kuis ── */}
      <QuizDetailDialog
        quizDetail={selectedQuizDetail}
        isLoading={isDetailLoading}
        isCreating={creating}
        isDescriptionExpanded={isDescriptionExpanded}
        onToggleDescription={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
        onClose={() => setSelectedQuizDetail(null)}
        onStart={handleSelectQuiz}
        getCategoryDisplayName={getCategoryDisplayName}
      />
    </div>
  );
}