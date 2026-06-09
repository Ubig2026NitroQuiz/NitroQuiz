/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HALAMAN: LeaderboardPage (Leaderboard Host)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Halaman yang menampilkan hasil akhir game NitroQuiz kepada host.
 * Menampilkan podium 3 besar dengan animasi dramatis, tabel ranking
 * lengkap, dan tombol aksi (home, restart, statistik).
 *
 * Struktur file hasil refaktor:
 * ┌─ page.tsx                              → Orkestrator utama (file ini)
 * ├─ types.ts                              → Definisi tipe & konstanta animasi
 * ├─ hooks/useLeaderboardData.ts           → Custom hook untuk state & logika data
 * └─ components/
 *    ├─ InitialsAvatar.tsx                 → Avatar inisial nama pemain
 *    ├─ Odometer.tsx                       → Animasi penghitung skor
 *    ├─ PodiumSection.tsx                  → Podium 3 besar dengan animasi
 *    ├─ LeaderboardTable.tsx               → Tabel ranking semua peserta
 *    ├─ DesktopSideButtons.tsx             → Tombol aksi floating (desktop)
 *    ├─ MobileActions.tsx                  → Bar aksi fixed (mobile)
 *    └─ index.ts                           → Barrel exports
 *
 * CATATAN: File ini hanya mengatur layout dan meneruskan data/aksi ke
 * sub-komponen. Semua logika bisnis ada di useLeaderboardData hook.
 */

"use client";

import { useTranslation } from "react-i18next";
import { FloatingHostActions } from "@/components/FloatingHostActions";

// Custom hook & sub-komponen halaman ini
import { useLeaderboardData } from "./hooks/useLeaderboardData";
import {
  PodiumSection,
  LeaderboardTable,
  DesktopSideButtons,
  MobileActions,
} from "./components";

// ═══════════════════════════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════════════════

export default function LeaderboardPage() {
  // ── Ambil semua state dan fungsi dari custom hook ──
  const {
    t,
    router,
    sessionId,
    rankedPlayers,
    firstPlace,
    secondPlace,
    thirdPlace,
    isLoading,
    showResults,
    isRestarting,
    handleRestart,
    formatDuration,
  } = useLeaderboardData();

  // ── Tampilkan loading spinner saat data belum siap ──
  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-[#04060f] relative overflow-hidden font-body text-white flex flex-col items-center pb-12">
      {/* ═══ Lapisan Latar Belakang ═══ */}
      <BackgroundLayers />

      {/* ═══ Header: Logo kiri & kanan ═══ */}
      <HeaderLogos router={router} />

      {/* ═══ Area Konten Utama ═══ */}
      <div className="w-full max-w-5xl z-20 px-4 sm:px-6 -mt-2">
        {/* Tombol aksi floating — hanya desktop */}
        <DesktopSideButtons
          router={router}
          sessionId={sessionId}
          isRestarting={isRestarting}
          handleRestart={handleRestart}
          t={t}
        />

        {/* Podium 3 besar — muncul setelah animasi loading */}
        {showResults && rankedPlayers.length > 0 && (
          <PodiumSection
            firstPlace={firstPlace}
            secondPlace={secondPlace}
            thirdPlace={thirdPlace}
          />
        )}

        {/* Tabel ranking lengkap */}
        {showResults && rankedPlayers.length > 0 && (
          <LeaderboardTable
            rankedPlayers={rankedPlayers}
            formatDuration={formatDuration}
            t={t}
          />
        )}

        {/* Bar aksi fixed bawah — hanya mobile */}
        <MobileActions
          router={router}
          sessionId={sessionId}
          isRestarting={isRestarting}
          handleRestart={handleRestart}
          t={t}
        />
      </div>

      {/* ═══ Tombol Aksi Mengambang Host (global) ═══ */}
      <FloatingHostActions />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN INTERNAL: State Loading
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Tampilan loading saat data leaderboard sedang diambil dari database.
 * Spinner biru dengan teks berkedip.
 */
function LoadingState() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f] font-display text-white">
      <div className="text-center z-10">
        {/* Spinner */}
        <div className="w-16 h-16 border-4 border-[#2d6af2]/30 border-t-[#2d6af2] rounded-full animate-spin mx-auto mb-6" />
        {/* Teks loading */}
        <p className="mt-4 text-[#2d6af2] text-xl tracking-[0.2em] uppercase animate-pulse">
          {/* {t("host_leaderboard.loading")} */}
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
 * Lapisan-lapisan dekoratif latar belakang halaman leaderboard.
 * Termasuk: racing stripe, gambar background, overlay gradient,
 * grid pattern, dan efek glow.
 */
function BackgroundLayers() {
  return (
    <>
      {/* Garis balap dekoratif di atas */}
      <div className="racing-stripe z-50 pointer-events-none" />

      {/* Gambar latar belakang */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-40"
        style={{
          backgroundImage: 'url("/assets/backgorund/homepage_bg.webp")',
          backgroundAttachment: 'fixed',
        }}
      />

      {/* Overlay gradient untuk keterbacaan teks */}
      <div className="fixed inset-0 z-0 bg-gradient-to-t from-[#04060f] via-[#04060f]/80 to-[#7C3AED]/10 pointer-events-none" />

      {/* Pola grid halus */}
      <div className="fixed inset-0 z-0 bg-[linear-gradient(rgba(45,106,242,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(45,106,242,0.03)_1px,transparent_1px)] bg-[length:40px_40px] pointer-events-none" />

      {/* Efek glow kiri atas */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#2d6af2]/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Efek glow kanan bawah */}
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#7C3AED]/10 blur-[150px] rounded-full pointer-events-none" />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN INTERNAL: Header Logo
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Header dengan dua logo:
 * - Kiri: Logo NitroQuiz (klikable, navigasi ke home)
 * - Kanan: Logo GameForSmart.com
 */
function HeaderLogos({ router }: { router: any }) {
  return (
    <div className="w-full z-30 px-4 md:px-6 pt-2 flex items-center justify-between">
      {/* Logo NitroQuiz — klik untuk ke halaman utama */}
      <div className="flex items-center justify-center">
        <button
          onClick={() => router.push("/")}
          className="cursor-pointer hover:opacity-80 active:opacity-60 transition-opacity duration-200"
          title="Ke Halaman Utama"
          aria-label="Ke halaman utama"
        >
          <img
            src="/assets/logo/logo1.png"
            alt="NitroQuiz Logo"
            width={120}
            height={36}
            className="object-contain"
          />
        </button>
      </div>

      {/* Logo GameForSmart.com */}
      <img
        src="/assets/logo/logo2.png"
        alt="GameForSmart.com"
        width={200}
        height={50}
        className="object-contain opacity-70 hover:opacity-100 transition-opacity duration-300 drop-shadow-[0_0_10px_rgba(45,106,242,0.3)]"
      />
    </div>
  );
}
