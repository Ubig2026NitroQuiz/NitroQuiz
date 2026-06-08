"use client";
/**
 * =====================================================
 * HALAMAN UTAMA HASIL - NitroQuiz Result Page
 * =====================================================
 * File ini adalah entry point (orchestrator) yang
 * menggabungkan semua modul: hooks dan komponen UI.
 * Logika berat sudah dipindahkan ke modul terpisah:
 *
 * - _types/         → Interface dan tipe data (Participant, MobileViewMode)
 * - _constants/     → Konstanta (peta gambar karakter, warna avatar, URL)
 * - _utils/         → Fungsi utilitas (ranking, format, identifikasi pemain)
 * - _hooks/         → Custom hooks (inisialisasi data, efek visual)
 * - _components/    → Komponen UI (profil, statistik, podium, background)
 *
 * CATATAN: Tidak ada perubahan fungsi, logika, atau tampilan
 * dari versi sebelumnya. Hanya restrukturisasi kode.
 * =====================================================
 */

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

// --- Tipe Data ---
import type { MobileViewMode } from "./_types";

// --- Fungsi Utilitas ---
import {
  rankPlayers,
  isCurrentPlayer,
  getDisplayName,
  getCarImageSrc,
  checkAllFinished,
} from "./_utils";

// --- Custom Hooks ---
import { useResultInit } from "./_hooks/useResultInit";
import { useResultEffects } from "./_hooks/useResultEffects";

// --- Komponen UI ---
import { ResultLoadingScreen } from "./_components/ResultLoadingScreen";
import { NitroBackground } from "./_components/NitroBackground";
import { MobileResultView } from "./_components/MobileResultView";
import { MobileLeaderboardView } from "./_components/MobileLeaderboardView";
import { DesktopResultView } from "./_components/DesktopResultView";

// ==========================================
// Komponen Utama
// ==========================================
export default function PlayerResultPage() {
  const params = useParams();
  const { t } = useTranslation();
  const roomCode = (params.roomCode as string)?.toUpperCase();
  const { user, profile } = useAuth();

  // --- State tampilan mobile (result vs leaderboard/stats) ---
  const [mobileView, setMobileView] = useState<MobileViewMode>("result");

  // --- Hook Inisialisasi: fetch data sesi, peserta, dan validasi keamanan ---
  const {
    participants,
    isLoading,
    totalQuestions,
    sessionStatus,
    sessionId,
    storedParticipantId,
  } = useResultInit(roomCode);

  // --- Data turunan: ranking, identifikasi pemain saat ini ---
  const rankedPlayers = rankPlayers(participants);
  const allFinished = checkAllFinished(sessionStatus, participants);

  /** Fungsi pencocokan pemain saat ini (digunakan untuk highlight dan data) */
  const matchCurrentPlayer = (p: typeof participants[0]) =>
    isCurrentPlayer(p, user?.id, storedParticipantId, profile?.username);

  const currentPlayerRank = rankedPlayers.findIndex(matchCurrentPlayer) + 1;
  const currentPlayerData = rankedPlayers.find(matchCurrentPlayer);

  /** Nama tampilan pemain saat ini */
  const displayName = currentPlayerData
    ? getDisplayName(currentPlayerData, profile, user?.email, t("player_result.player_fallback"))
    : t("player_result.player_fallback");

  /** URL gambar karakter mobil pemain saat ini */
  const currentPlayerCarSrc = getCarImageSrc(currentPlayerData);

  // --- Hook Efek Visual: animasi entrance, confetti, reset orientasi ---
  const showResults = useResultEffects(isLoading, rankedPlayers.length > 0, allFinished);

  // ==========================================
  // RENDER: Kondisi Loading
  // ==========================================
  if (isLoading) {
    return <ResultLoadingScreen />;
  }

  // ==========================================
  // RENDER: Halaman Hasil Utama
  // ==========================================
  return (
    <>
      {/* ══ TAMPILAN MOBILE ══ */}
      <div className="md:hidden min-h-[100dvh] bg-[#04060f] text-white flex flex-col relative overflow-y-auto overflow-x-hidden font-body">
        <NitroBackground />

        {/* Tampilan hasil pemain */}
        {mobileView === "result" && showResults && (
          <MobileResultView
            currentPlayerData={currentPlayerData}
            currentPlayerRank={currentPlayerRank}
            displayName={displayName}
            totalQuestions={totalQuestions}
            allFinished={allFinished}
            sessionId={sessionId}
          />
        )}

        {/* Tampilan leaderboard/podium */}
        {mobileView === "stats" && showResults && (
          <MobileLeaderboardView
            rankedPlayers={rankedPlayers}
            storedParticipantId={storedParticipantId}
            profileUsername={profile?.username}
            allFinished={allFinished}
            sessionId={sessionId}
            profile={profile}
            userEmail={user?.email}
            fallbackName={t("player_result.player_fallback")}
            onBack={() => setMobileView("result")}
          />
        )}
      </div>

      {/* ══ TAMPILAN DESKTOP ══ */}
      <div
        className="hidden md:block fixed inset-0 font-body text-white overflow-hidden"
        style={{ background: "#04060f" }}
      >
        <NitroBackground />
        <DesktopResultView
          currentPlayerData={currentPlayerData}
          currentPlayerRank={currentPlayerRank}
          displayName={displayName}
          currentPlayerCarSrc={currentPlayerCarSrc}
          totalQuestions={totalQuestions}
          allFinished={allFinished}
          sessionId={sessionId}
          showResults={showResults}
        />
      </div>
    </>
  );
}
