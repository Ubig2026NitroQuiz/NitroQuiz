/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HALAMAN: GameMonitorPage (Monitor Game Host)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Halaman monitor yang ditampilkan kepada host selama game berlangsung.
 * Host dapat memantau progres semua pemain dan mengakhiri game kapan saja.
 *
 * Struktur file hasil refaktor:
 * ┌─ page.tsx                              → Orkestrator utama (file ini)
 * ├─ types.ts                              → Definisi tipe (Participant, MonitorSession, dll.)
 * ├─ hooks/useMonitorData.ts               → Custom hook untuk state & logika data
 * └─ components/
 *    ├─ PlayerCard.tsx                      → Kartu individual pemain + avatar + status
 *    ├─ MonitorHeader.tsx                   → Header (logo, timer, tombol end race)
 *    ├─ PlayersGrid.tsx                     → Grid daftar pemain + state kosong
 *    ├─ EndGameDialog.tsx                   → Dialog konfirmasi akhiri game
 *    └─ index.ts                           → Barrel exports
 *
 * CATATAN: File ini hanya mengatur layout dan meneruskan data/aksi ke
 * sub-komponen. Semua logika bisnis ada di useMonitorData hook.
 */

"use client";

import { FloatingHostActions } from "@/components/FloatingHostActions";

// Custom hook & sub-komponen halaman ini
import { useMonitorData } from "./hooks/useMonitorData";
import { MonitorHeader, PlayersGrid, EndGameDialog } from "./components";

// ═══════════════════════════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════════════════

export default function GameMonitorPage() {
  // ── Ambil semua state dan fungsi dari custom hook ──
  const {
    t,
    session,
    participants,
    rankedParticipants,
    totalQuestions,
    timeLeft,
    isEnding,
    endGameDialogOpen,
    setEndGameDialogOpen,
    handleEndRace,
    formatTime,
  } = useMonitorData();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#04060f",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        color: "white",
      }}
      className="font-display"
    >
      {/* ═══ Lapisan Latar Belakang ═══ */}
      <BackgroundLayers />

      {/* ═══ Header: Logo, Timer, Tombol End Race ═══ */}
      <MonitorHeader
        timeLeft={timeLeft}
        isEnding={isEnding}
        formattedTime={formatTime(timeLeft)}
        onEndRaceClick={() => setEndGameDialogOpen(true)}
      />

      {/* ═══ Grid Pemain ═══ */}
      <PlayersGrid
        participants={participants}
        rankedParticipants={rankedParticipants}
        totalQuestions={totalQuestions}
        t={t}
      />

      {/* ═══ Dialog Konfirmasi Akhiri Game ═══ */}
      <EndGameDialog
        open={endGameDialogOpen}
        onOpenChange={setEndGameDialogOpen}
        onConfirmEnd={handleEndRace}
        t={t}
      />

      {/* ═══ CSS Lokal ═══ */}
      <MonitorStyles />

      {/* ═══ Tombol Aksi Mengambang Host ═══ */}
      <FloatingHostActions />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN INTERNAL: Lapisan Latar Belakang
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Lapisan-lapisan dekoratif latar belakang halaman monitor.
 * Termasuk: racing stripe, gambar background, overlay, grid pattern, dan efek glow.
 */
function BackgroundLayers() {
  return (
    <>
      {/* Garis balap dekoratif di atas */}
      <div className="racing-stripe z-50 pointer-events-none absolute top-0 inset-x-0 h-1" />

      {/* Gambar latar belakang */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-30"
        style={{
          backgroundImage: 'url("/assets/backgorund/homepage_bg.webp")',
          backgroundAttachment: "fixed",
        }}
      />

      {/* Overlay gradient untuk keterbacaan */}
      <div className="fixed inset-0 z-0 bg-gradient-to-t from-[#04060f] via-[#04060f]/85 to-[#2d6af2]/10 pointer-events-none" />

      {/* Pola grid halus */}
      <div className="fixed inset-0 z-0 bg-[linear-gradient(rgba(45,106,242,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(45,106,242,0.04)_1px,transparent_1px)] bg-[length:40px_40px] pointer-events-none" />

      {/* Efek glow kiri atas */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-[#2d6af2]/8 blur-[150px] rounded-full pointer-events-none" />

      {/* Efek glow kanan bawah */}
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-[#7C3AED]/8 blur-[120px] rounded-full pointer-events-none" />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN INTERNAL: CSS Lokal
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Definisi CSS lokal untuk:
 * - Grid responsif leaderboard
 * - State kosong grid (span seluruh kolom)
 * - Animasi pulse untuk indikator status aktif
 */
function MonitorStyles() {
  return (
    <style>{`
      .leaderboard-grid {
        display: grid;
        gap: 10px;
        grid-template-columns: 1fr;
      }
      @media (min-width: 768px) {
        .leaderboard-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      @media (min-width: 1280px) {
        .leaderboard-grid {
          grid-template-columns: repeat(4, 1fr);
        }
      }
      .empty-grid-msg {
        grid-column: 1 / -1;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
    `}</style>
  );
}