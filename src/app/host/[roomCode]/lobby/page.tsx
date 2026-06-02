/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HALAMAN: HostLobby (Ruang Tunggu Host)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Halaman ruang tunggu (lobby) yang ditampilkan kepada host sebelum
 * memulai game. Host dapat melihat pemain yang bergabung, mengundang
 * teman/grup, menambah bot, dan memulai permainan.
 *
 * Struktur file hasil refaktor:
 * ┌─ page.tsx                              → Orkestrator utama (file ini)
 * ├─ types.ts                              → Definisi tipe (Participant, GameSession, dll.)
 * ├─ hooks/
 * │  ├─ useLobbyData.ts                    → Hook utama (session, countdown, realtime, aksi)
 * │  └─ useInviteSystem.ts                 → Hook undangan (teman & grup)
 * └─ components/
 *    ├─ InitialsAvatar.tsx                 → Avatar inisial pemain
 *    ├─ RoomInfoCard.tsx                   → Kartu info ruangan (kode, QR, link, tombol)
 *    ├─ PlayersCard.tsx                    → Kartu daftar pemain + grid
 *    ├─ LobbyDialogs.tsx                   → Semua dialog (kick, exit, invite, QR, toast)
 *    ├─ CountdownOverlay.tsx               → Overlay hitung mundur fullscreen
 *    └─ index.ts                           → Barrel exports
 *
 * CATATAN: File ini hanya mengatur layout dan meneruskan data/aksi ke
 * sub-komponen. Semua logika bisnis ada di custom hooks.
 */

"use client";

import Image from "next/image";
import { Logo } from "@/components/ui/logo";
import { FloatingHostActions } from "@/components/FloatingHostActions";
import { TooltipProvider } from "@/components/ui/tooltip";

// Custom hooks halaman ini
import { useLobbyData } from "./hooks/useLobbyData";
import { useInviteSystem } from "./hooks/useInviteSystem";

// Sub-komponen halaman ini
import {
  RoomInfoCard,
  PlayersCard,
  CountdownOverlay,
  KickDialog,
  ExitDialog,
  QrFullscreen,
  InviteGroupDialog,
  InviteFriendDialog,
  InviteToast,
} from "./components";

// ═══════════════════════════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════════════════

export default function HostLobby() {
  // ── Ambil semua state dan fungsi dari hook lobby ──
  const {
    t,
    profile,
    roomCode,
    router,
    session,
    sessionId,
    participants,
    joinLink,
    countdown,
    copiedRoom,
    setCopiedRoom,
    copiedJoin,
    setCopiedJoin,
    qrOpen,
    setQrOpen,
    kickDialogOpen,
    setKickDialogOpen,
    exitDialogOpen,
    setExitDialogOpen,
    selectedPlayer,
    setSelectedPlayer,
    startGame,
    handleAddBot,
    confirmKick,
    copyToClipboard,
  } = useLobbyData();

  // ── Ambil semua state dan fungsi dari hook undangan ──
  const invite = useInviteSystem({
    profileId: profile?.id,
    sessionId,
  });

  // ── Tampilkan loading jika sesi belum dimuat ──
  if (!session) {
    return <LoadingScreen t={t} />;
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className="min-h-screen bg-[#04060f] relative font-body text-white flex flex-col">
        {/* ═══ Lapisan Latar Belakang ═══ */}
        <BackgroundLayers />

        {/* ═══ Konten Utama ═══ */}
        <div className="relative z-10 flex flex-col w-full max-w-[1400px] mx-auto px-3 sm:px-6 md:px-8 pt-1 sm:pt-2 pb-2 sm:pb-4 gap-2 sm:gap-3">

          {/* ── Header: Logo & Branding ── */}
          <TopBar />

          {/* ── Layout Utama: Info Ruangan + Daftar Pemain ── */}
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">

            {/* Kartu Info Ruangan (kiri / atas) */}
            <RoomInfoCard
              roomCode={roomCode}
              joinLink={joinLink}
              copiedRoom={copiedRoom}
              copiedJoin={copiedJoin}
              countdown={countdown}
              participantCount={participants.length}
              onCopyRoom={() => copyToClipboard(roomCode, setCopiedRoom)}
              onCopyJoin={() => copyToClipboard(joinLink, setCopiedJoin)}
              onQrOpen={() => setQrOpen(true)}
              onExitOpen={() => setExitDialogOpen(true)}
              onStartGame={startGame}
              t={t}
            />

            {/* Kartu Daftar Pemain (kanan / bawah) */}
            <PlayersCard
              participants={participants}
              onKickPlayer={(player) => {
                setSelectedPlayer(player);
                setKickDialogOpen(true);
              }}
              onInviteGroupOpen={() => invite.setInviteGroupOpen(true)}
              onInviteFriendOpen={() => invite.setInviteFriendOpen(true)}
              onAddBot={handleAddBot}
              t={t}
            />
          </div>
        </div>

        {/* ═══ Toast Notifikasi Undangan ═══ */}
        <InviteToast visible={invite.inviteToastVisible} />

        {/* ═══ Dialog Kick Pemain ═══ */}
        <KickDialog
          open={kickDialogOpen}
          onOpenChange={setKickDialogOpen}
          selectedPlayer={selectedPlayer}
          onConfirmKick={confirmKick}
          t={t}
        />

        {/* ═══ Dialog Konfirmasi Keluar ═══ */}
        <ExitDialog
          open={exitDialogOpen}
          onOpenChange={setExitDialogOpen}
          onConfirmExit={() => router.push("/host/select-quiz")}
          t={t}
        />

        {/* ═══ QR Code Fullscreen ═══ */}
        <QrFullscreen
          open={qrOpen}
          joinLink={joinLink}
          onClose={() => setQrOpen(false)}
        />

        {/* ═══ Dialog Undang Grup ═══ */}
        <InviteGroupDialog
          open={invite.inviteGroupOpen}
          onOpenChange={invite.setInviteGroupOpen}
          searchQuery={invite.searchGroupQuery}
          onSearchChange={invite.setSearchGroupQuery}
          loading={invite.loadingGroups}
          filteredGroups={invite.filteredGroups}
          invitedGroups={invite.invitedGroups}
          onInviteGroup={invite.handleInviteGroup}
          t={t}
        />

        {/* ═══ Dialog Undang Teman ═══ */}
        <InviteFriendDialog
          open={invite.inviteFriendOpen}
          onOpenChange={invite.setInviteFriendOpen}
          searchQuery={invite.searchFriendQuery}
          onSearchChange={invite.setSearchFriendQuery}
          loading={invite.loadingFriends}
          filteredFriends={invite.filteredFriends}
          invitedFriends={invite.invitedFriends}
          onInviteFriend={invite.handleInviteFriend}
          t={t}
        />

        {/* ═══ Overlay Hitung Mundur ═══ */}
        {countdown !== null && (
          <CountdownOverlay countdown={countdown} t={t} />
        )}

        {/* ═══ Tombol Aksi Mengambang Host ═══ */}
        <FloatingHostActions />

        {/* ═══ CSS Custom Scrollbar ═══ */}
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
        `}</style>
      </div>
    </TooltipProvider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN INTERNAL: Layar Loading
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Tampilan loading saat data sesi sedang dimuat dari database.
 */
function LoadingScreen({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f] text-white">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#2d6af2]/30 rounded-full animate-spin mx-auto mb-6" />
        <p className="text-[#2d6af2] text-xl tracking-widest uppercase animate-pulse">
          {t("host_lobby.loading")}
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN INTERNAL: Lapisan Latar Belakang
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Lapisan-lapisan dekoratif latar belakang halaman lobby.
 * Termasuk: racing stripe, gambar background, overlay gradient, dan scanlines.
 */
function BackgroundLayers() {
  return (
    <>
      {/* Garis balap dekoratif di atas */}
      <div className="racing-stripe z-0 pointer-events-none" />

      {/* Gambar latar belakang */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: 'url("/assets/backgorund/homepage_bg.webp")',
          backgroundAttachment: "fixed",
        }}
      />

      {/* Overlay gradient untuk keterbacaan */}
      <div className="fixed inset-0 z-0 bg-gradient-to-t from-[#04060f] via-[#04060f]/80 to-[#7C3AED]/20 pointer-events-none" />

      {/* Efek scanlines halus */}
      <div className="scanlines z-0" />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN INTERNAL: Top Bar (Header Navigasi & Branding)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Bar atas halaman berisi logo NitroQuiz dan branding.
 */
function TopBar() {
  return (
    <div className="w-full flex items-center justify-between shrink-0 z-20 relative pt-1">
      <div className="flex items-center gap-2">
        <Logo width={120} height={35} withText={false} animated={false} />
      </div>
      <Image
        src="/assets/logo/logo2.png"
        alt="NitroQuiz"
        width={160}
        height={40}
        className="object-contain opacity-70 hover:opacity-100 transition-opacity duration-300 drop-shadow-[0_0_8px_rgba(169,141,197,0.4)]"
      />
    </div>
  );
}
