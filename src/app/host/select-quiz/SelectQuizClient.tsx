/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HALAMAN: SelectQuizClient (Komponen Utama Pilih Quiz)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Komponen klien utama untuk halaman pemilihan quiz oleh host.
 * Bertindak sebagai "orkestrator" yang menyatukan semua sub-komponen:
 *
 * Struktur file hasil refaktor:
 * ┌─ types.ts              → Definisi tipe data (QuizView, Props, dll.)
 * ├─ constants.ts           → Peta warna kategori & fungsi getCategoryColor
 * ├─ hooks/useQuizData.ts   → Custom hook untuk semua state & logika data
 * └─ components/
 *    ├─ SearchFilterBar.tsx  → Bar pencarian, tab navigasi, filter kategori
 *    ├─ QuizCard.tsx         → Kartu quiz individual
 *    ├─ QuizGrid.tsx         → Grid kartu quiz (termasuk skeleton & empty state)
 *    ├─ PaginationControls.tsx → Kontrol navigasi halaman
 *    └─ QuizDetailDialog.tsx → Dialog detail quiz
 *
 * CATATAN: File ini hanya mengatur layout dan meneruskan data/aksi ke
 * sub-komponen. Semua logika bisnis ada di useQuizData hook.
 */

"use client";

import Image from "next/image";
import { Logo } from "@/components/ui/logo";
import { FloatingHostActions } from "@/components/FloatingHostActions";

// Sub-komponen halaman pilih quiz
import { SearchFilterBar, QuizGrid, PaginationControls, QuizDetailDialog } from "./components";

// Custom hook & tipe data
import { useQuizData } from "./hooks/useQuizData";

// Re-export tipe agar kompatibel dengan import yang sudah ada di file lain
export type { QuizView, SelectQuizClientProps } from "./types";

// ═══════════════════════════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════════════════

export default function SelectQuizClient({
    initialQuizzes,
    initialTotalCount,
    initialCategories,
    serverProfileId,
}: {
    initialQuizzes: any[];
    initialTotalCount: number;
    initialCategories: string[];
    serverProfileId: string | null;
}) {
    // ── Ambil semua state dan fungsi dari custom hook ──
    const {
        // Pencarian & filter
        searchInput, setSearchInput,
        searchQuery, setSearchQuery,
        selectedCategory, setSelectedCategory,
        activeTab, setActiveTab,
        categories,

        // Data quiz
        quizzes, favorites, toggleFavorite,
        fetchQuizzes,

        // Pagination
        currentPage, setCurrentPage,
        totalPages,

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

        // Utilitas
        t, router,
        getCategoryDisplayName,
    } = useQuizData({ initialQuizzes, initialTotalCount, initialCategories, serverProfileId });

    return (
        <div className="h-screen bg-[#04060f] relative overflow-hidden font-body text-white selection:bg-[#7C3AED]/30 selection:text-white flex flex-col">

            {/* ═══ Lapisan Latar Belakang ═══ */}
            <BackgroundLayers />

            {/* ═══ Konten Utama ═══ */}
            <div className="relative z-10 flex-1 flex flex-col h-full overflow-hidden">

                {/* ── Top Bar: Logo & Branding ── */}
                <TopBar onBack={() => router.back()} />

                {/* ── Area Konten yang Bisa Di-scroll ── */}
                <div className="flex-1 overflow-y-auto relative w-full pt-0.5">
                    <div className="container mx-auto px-6 pb-8 max-w-6xl">

                        {/* Bar Pencarian & Filter */}
                        <SearchFilterBar
                            searchInput={searchInput}
                            setSearchInput={setSearchInput}
                            onSearch={() => { setSearchQuery(searchInput); setCurrentPage(1); }}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            selectedCategory={selectedCategory}
                            setSelectedCategory={setSelectedCategory}
                            categories={categories}
                            getCategoryDisplayName={getCategoryDisplayName}
                            t={t}
                        />

                        {/* Grid Daftar Quiz */}
                        <QuizGrid
                            quizzes={quizzes}
                            favorites={favorites}
                            activeTab={activeTab}
                            currentPage={currentPage}
                            isFetching={isFetching}
                            isReturning={isReturning}
                            creating={creating}
                            hoveredTooltipId={hoveredTooltipId}
                            setHoveredTooltipId={setHoveredTooltipId}
                            onToggleFavorite={toggleFavorite}
                            onOpenDetail={handleOpenQuizDetail}
                            onSelectQuiz={handleSelectQuiz}
                            onResetFilters={() => { setSearchQuery(""); setSearchInput(""); setSelectedCategory("All"); }}
                            onBrowseAll={() => setActiveTab('all')}
                            onRefresh={() => fetchQuizzes(1)}
                            getCategoryDisplayName={getCategoryDisplayName}
                            t={t}
                        />

                        {/* Kontrol Pagination */}
                        <PaginationControls
                            currentPage={currentPage}
                            totalPages={totalPages}
                            isFetching={isFetching}
                            creating={creating}
                            isReturning={isReturning}
                            setCurrentPage={setCurrentPage}
                            t={t}
                        />
                    </div>
                </div>
            </div>

            {/* ═══ Tombol Aksi Mengambang Host ═══ */}
            <FloatingHostActions />

            {/* ═══ Dialog Detail Quiz ═══ */}
            <QuizDetailDialog
                selectedQuizDetail={selectedQuizDetail}
                isDetailLoading={isDetailLoading}
                isDescriptionExpanded={isDescriptionExpanded}
                setIsDescriptionExpanded={setIsDescriptionExpanded}
                onClose={() => setSelectedQuizDetail(null)}
                onStartQuiz={handleSelectQuiz}
                creating={creating}
                getCategoryDisplayName={getCategoryDisplayName}
                t={t}
            />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN INTERNAL: Lapisan Latar Belakang
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Lapisan-lapisan dekoratif latar belakang halaman.
 * Termasuk: racing stripe, gambar background, overlay gradient, dan scanlines.
 */
function BackgroundLayers() {
    return (
        <>
            {/* Garis balap dekoratif di atas */}
            <div className="racing-stripe z-0 pointer-events-none"></div>

            {/* Gambar latar belakang (sama dengan HomePage) */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
                style={{
                    backgroundImage: 'url("/assets/backgorund/homepage_bg.png")',
                    backgroundAttachment: 'fixed'
                }}
            ></div>

            {/* Overlay gradient untuk keterbacaan teks */}
            <div className="fixed inset-0 z-0 bg-gradient-to-t from-[#04060f] via-[#04060f]/80 to-[#7C3AED]/20 pointer-events-none"></div>

            {/* Efek scanlines halus */}
            <div className="scanlines"></div>
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN INTERNAL: Top Bar (Navigasi & Branding)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Bar atas halaman berisi logo navigasi kembali dan branding NitroQuiz.
 */
function TopBar({ onBack }: { onBack: () => void }) {
    return (
        <div className="w-full px-4 md:px-6 pt-2 pb-0 flex items-center justify-between flex-shrink-0">
            {/* Logo klik untuk kembali */}
            <div className="flex items-center gap-2">
                <button
                    onClick={onBack}
                    className="cursor-pointer hover:opacity-80 active:opacity-60 transition-opacity duration-200"
                    title="Kembali"
                    aria-label="Kembali ke halaman sebelumnya"
                >
                    <Logo width={100} height={30} withText={false} animated={false} />
                </button>
            </div>

            {/* Logo branding NitroQuiz */}
            <Image
                src="/assets/logo/logo2.png"
                alt="NitroQuiz"
                width={150}
                height={38}
                className="object-contain opacity-70 hover:opacity-100 transition-opacity duration-300 drop-shadow-[0_0_8px_rgba(169,141,197,0.4)]"
            />
        </div>
    );
}
