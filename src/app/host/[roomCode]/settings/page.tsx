/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HALAMAN: SettingsPage (Pengaturan Game)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Halaman pengaturan sebelum memulai game quiz.
 * Host dapat mengatur: durasi, jumlah soal, suara, dan tingkat kesulitan.
 *
 * Struktur file hasil refaktor:
 * ┌─ page.tsx                          → Orkestrator utama (file ini)
 * ├─ types.ts                          → Definisi tipe (QuizDetail, Difficulty, dll.)
 * ├─ hooks/useSettingsData.ts          → Custom hook untuk state & logika data
 * └─ components/
 *    ├─ SettingsForm.tsx               → Formulir pengaturan lengkap
 *    └─ CancelSessionDialog.tsx        → Dialog konfirmasi pembatalan
 *
 * Warna kategori menggunakan shared constants dari:
 *    @/app/host/select-quiz/constants  → getCategoryColor()
 *
 * CATATAN: File ini hanya mengatur layout dan meneruskan data/aksi ke
 * sub-komponen. Semua logika bisnis ada di useSettingsData hook.
 */

"use client";

import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import Image from "next/image";
import { Logo } from "@/components/ui/logo";
import { FloatingHostActions } from "@/components/FloatingHostActions";

// Warna kategori dari shared constants (menghindari duplikasi)
import { getCategoryColor } from "@/app/host/select-quiz/constants";

// Custom hook & sub-komponen halaman ini
import { useSettingsData } from "./hooks/useSettingsData";
import { SettingsForm, CancelSessionDialog } from "./components";

// ═══════════════════════════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════════════════

export default function SettingsPage() {
    // ── Ambil semua state dan fungsi dari custom hook ──
    const {
        quizDetail,
        duration, setDuration,
        questionCount, setQuestionCount, questionCountOptions,
        selectedDifficulty, setSelectedDifficulty,
        isMuted, setIsMuted,
        saving,
        showCancelDialog, setShowCancelDialog,
        isDeleting,
        handleCreateRoom,
        handleCancelSession,
        t,
    } = useSettingsData();

    // ── Tampilkan loading jika quiz belum dimuat ──
    if (!quizDetail) {
        return <LoadingScreen t={t} />;
    }

    // ── Hitung skema warna berdasarkan kategori quiz ──
    const theme = getCategoryColor(quizDetail.category || 'general');

    return (
        <div className="h-screen bg-[#04060f] relative overflow-hidden font-body selection:bg-[#2d6af2] selection:text-white">

            {/* ═══ Lapisan Latar Belakang ═══ */}
            <BackgroundLayers />

            {/* ═══ Konten Utama ═══ */}
            <div className="absolute inset-0 overflow-y-auto z-10 flex flex-col">

                {/* ── Top Bar: Logo & Branding ── */}
                <TopBar onBack={() => setShowCancelDialog(true)} />

                {/* ── Kartu Pengaturan ── */}
                <div className="relative container mx-auto px-4 sm:px-6 pb-6 max-w-3xl flex-1 flex flex-col justify-center py-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1, type: "spring", stiffness: 100, damping: 12 }}
                    >
                        <Card
                            className="bg-[#0c1328]/85 border backdrop-blur-xl rounded-md relative overflow-hidden p-0 transition-colors"
                            style={{
                                borderTop: `4px solid ${theme.bar}`,
                                borderColor: theme.badgeBorder,
                                boxShadow: `0 20px 50px rgba(0,0,0,0.8), 0 0 40px ${theme.badge}`,
                            }}
                        >
                            <SettingsForm
                                theme={theme}
                                quizTitle={quizDetail.title}
                                duration={duration}
                                setDuration={setDuration}
                                questionCount={questionCount}
                                setQuestionCount={setQuestionCount}
                                questionCountOptions={questionCountOptions}
                                isMuted={isMuted}
                                setIsMuted={setIsMuted}
                                selectedDifficulty={selectedDifficulty}
                                setSelectedDifficulty={setSelectedDifficulty}
                                saving={saving}
                                onSubmit={handleCreateRoom}
                                t={t}
                            />
                        </Card>
                    </motion.div>

                    {/* Dialog Konfirmasi Pembatalan */}
                    <CancelSessionDialog
                        open={showCancelDialog}
                        onOpenChange={setShowCancelDialog}
                        onConfirmCancel={handleCancelSession}
                        isDeleting={isDeleting}
                        t={t}
                    />
                </div>
            </div>

            {/* ═══ Tombol Aksi Mengambang Host ═══ */}
            <FloatingHostActions />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN INTERNAL: Layar Loading
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Tampilan loading saat data quiz sedang dimuat dari database.
 */
function LoadingScreen({ t }: { t: (key: string) => string }) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-[#04060f] relative overflow-hidden font-display text-white">
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-20"
                style={{ backgroundImage: 'url("/assets/backgorund/homepage_bg.webp")', backgroundAttachment: 'fixed' }}
            />
            <div className="fixed inset-0 z-0 bg-gradient-to-t from-[#04060f] via-[#04060f]/85 to-[#2d6af2]/10 pointer-events-none" />
            <div className="text-center z-10">
                <div className="w-16 h-16 border-4 border-[#2d6af2]/30 border-t-[#2d6af2] rounded-full animate-spin mx-auto mb-6"></div>
                <p className="mt-4 text-[#5a9cff] text-xl tracking-[0.2em] uppercase animate-pulse">
                    {/* {t('room_settings.loading')} */}
                    Loading...
                </p>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN INTERNAL: Lapisan Latar Belakang
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Lapisan-lapisan dekoratif latar belakang halaman pengaturan.
 * Termasuk: racing stripe, gambar background, grid, efek radial, dan scanlines.
 */
function BackgroundLayers() {
    return (
        <>
            {/* Garis balap dekoratif di atas */}
            <div className="racing-stripe z-50 pointer-events-none absolute top-0 inset-x-0 h-1" />

            {/* Gambar latar belakang */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-20"
                style={{ backgroundImage: 'url("/assets/backgorund/homepage_bg.webp")', backgroundAttachment: 'fixed' }}
            />

            {/* Pola grid halus */}
            <div className="fixed inset-0 z-0 bg-[linear-gradient(rgba(0,255,157,0.022)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,157,0.022)_1px,transparent_1px)] bg-[length:80px_80px]" />

            {/* Grid perspektif di bawah */}
            <div className="fixed bottom-0 left-0 right-0 h-52 z-0 bg-[linear-gradient(transparent_0%,rgba(45,106,242,0.06)_1px,transparent_1px),linear-gradient(90deg,transparent_0%,rgba(45,106,242,0.06)_1px,transparent_1px)] bg-[length:80px_40px] [transform:perspective(400px)_rotateX(60deg)] origin-bottom pointer-events-none opacity-60" />

            {/* Efek radial gradient */}
            <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(45,106,242,0.07),transparent)] pointer-events-none" />

            {/* Overlay gradient untuk keterbacaan */}
            <div className="fixed inset-0 z-0 bg-gradient-to-t from-[#04060f] via-[#04060f]/50 to-[#2d6af2]/10 pointer-events-none" />

            {/* Efek scanlines */}
            <div className="scanlines" />
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN INTERNAL: Top Bar (Navigasi & Branding)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Bar atas halaman berisi logo navigasi kembali dan branding NitroQuiz.
 * Klik logo akan membuka dialog konfirmasi pembatalan.
 */
function TopBar({ onBack }: { onBack: () => void }) {
    return (
        <div className="w-full px-4 md:px-6 pt-4 pb-2 flex items-center justify-between">
            {/* Logo klik untuk kembali (menampilkan dialog konfirmasi) */}
            <div className="flex items-center gap-3">
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.05, filter: "brightness(1.2) drop-shadow(0 0 8px rgba(45,106,242,0.5))" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onBack}
                    className="cursor-pointer transition-all focus:outline-none w-32 md:w-40"
                >
                    <Logo withText={false} animated={false} />
                </motion.button>
            </div>

            {/* Logo branding */}
            <div className="relative w-32 md:w-60 h-10 md:h-14">
                <Image
                    src="/assets/logo/logo2.png"
                    alt="GameForSmart.com"
                    fill
                    className="object-contain opacity-70 hover:opacity-100 transition-opacity duration-300 drop-shadow-[0_0_10px_rgba(169,141,197,0.4)]"
                />
            </div>
        </div>
    );
}