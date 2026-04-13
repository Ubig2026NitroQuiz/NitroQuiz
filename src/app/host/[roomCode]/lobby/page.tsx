"use client";

/**
 * page.tsx — Halaman Lobby Host
 * ═════════════════════════════
 *
 * Halaman ini adalah ruang tunggu host sebelum permainan dimulai.
 * Pemain bergabung melalui kode room atau QR code, dan host
 * menunggu sampai cukup peserta sebelum memulai.
 *
 * Fitur utama:
 * 1. Kode room & QR Code (klik untuk copy / fullscreen)
 * 2. Daftar pemain real-time (Supabase Realtime)
 * 3. Undang teman mutual
 * 4. Undang anggota grup
 * 5. Tambah bot ke lobby
 * 6. Kick pemain
 * 7. Countdown 3-2-1 sebelum mulai (traffic light)
 * 8. Toggle fullscreen & suara
 *
 * Struktur komponen:
 * ├── BackgroundEffects      → Efek visual latar belakang
 * ├── RoomInfoCard           → Kode room, QR, link, tombol aksi
 * ├── PlayersCard            → Grid pemain & tombol invite/bot
 * ├── InviteFriendDialog     → Dialog undang teman
 * ├── InviteGroupDialog      → Dialog undang grup
 * ├── KickDialog             → Dialog konfirmasi kick
 * ├── ExitDialog             → Dialog konfirmasi keluar
 * ├── QrFullscreen           → QR Code fullscreen
 * ├── InviteToast            → Notifikasi toast undangan
 * ├── CountdownOverlay       → Overlay hitung mundur
 * └── FullscreenButton       → Tombol toggle fullscreen
 *
 * Alur real-time:
 * 1. Load session & peserta dari database
 * 2. Subscribe Supabase channel untuk update real-time
 * 3. Saat host klik Start, countdown_started_at ditulis ke DB
 * 4. Semua client menghitung mundur berdasarkan server time
 * 5. Saat countdown habis, status berubah ke "active"
 * 6. Redirect ke halaman monitor (/host/{roomCode}/monitor)
 */

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase, supabaseCentral } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { syncServerTime, getSyncedServerTime } from '@/lib/serverTime';

// ── Komponen lobby ──
import {
  BackgroundEffects,
  LobbyLoading,
  RoomInfoCard,
  PlayersCard,
  InviteFriendDialog,
  InviteGroupDialog,
  KickDialog,
  ExitDialog,
  QrFullscreen,
  InviteToast,
  CountdownOverlay,
  FullscreenButton,
} from "@/components/lobby";

// ════════════════════════════════════════════════════════════════
// Komponen Utama: HostLobby
// ════════════════════════════════════════════════════════════════
export default function HostLobby() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const { profile } = useAuth();
  const roomCode = params.roomCode as string;

  // ── State data utama ──
  const [participants, setParticipants] = useState<any[]>([]);    // Daftar peserta
  const [session, setSession] = useState<any>(null);              // Data session
  const [sessionId, setSessionId] = useState<string | null>(null); // ID session
  const [joinLink, setJoinLink] = useState("");                   // URL link join

  // ── State UI: copy clipboard ──
  const [copiedRoom, setCopiedRoom] = useState(false);
  const [copiedJoin, setCopiedJoin] = useState(false);

  // ── State UI: dialog & overlay ──
  const [qrOpen, setQrOpen] = useState(false);                    // QR fullscreen
  const [inviteFriendOpen, setInviteFriendOpen] = useState(false); // Dialog undang teman
  const [inviteGroupOpen, setInviteGroupOpen] = useState(false);  // Dialog undang grup
  const [kickDialogOpen, setKickDialogOpen] = useState(false);    // Dialog kick
  const [exitDialogOpen, setExitDialogOpen] = useState(false);    // Dialog exit
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null); // Pemain yang dipilih untuk kick

  // ── State UI: countdown & misc ──
  const [countdown, setCountdown] = useState<number | null>(null); // Nilai countdown
  const [isMuted, setIsMuted] = useState(false);                  // Status mute
  const [isFullscreen, setIsFullscreen] = useState(false);        // Status fullscreen
  const [inviteToastVisible, setInviteToastVisible] = useState(false); // Toast visible

  // ── State: undang teman ──
  const [searchFriendQuery, setSearchFriendQuery] = useState("");
  const [invitedFriends, setInvitedFriends] = useState<string[]>([]);
  const [mutualFriends, setMutualFriends] = useState<any[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // ── State: undang grup ──
  const [searchGroupQuery, setSearchGroupQuery] = useState("");
  const [invitedGroups, setInvitedGroups] = useState<string[]>([]);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // ════════════════════════════════════════════════════════════════
  // HOOKS: DATA FETCHING
  // ════════════════════════════════════════════════════════════════

  /**
   * Hook: Mengambil daftar teman mutual saat dialog undang teman dibuka.
   * Mutual = kedua arah pertemanan (I follow them AND they follow me).
   */
  useEffect(() => {
    if (!inviteFriendOpen || !profile?.id) return;
    const fetchMutualFriends = async () => {
      setLoadingFriends(true);
      try {
        // Ambil user yang saya follow
        const { data: iFollow, error: e1 } = await supabaseCentral
          .from('friendships').select('addressee_id')
          .eq('requester_id', profile.id).eq('status', 'accepted');

        // Ambil user yang follow saya
        const { data: followMe, error: e2 } = await supabaseCentral
          .from('friendships').select('requester_id')
          .eq('addressee_id', profile.id).eq('status', 'accepted');

        if (e1 || e2) { console.error('Error fetching friendships:', e1 || e2); setLoadingFriends(false); return; }

        // Interseksi = mutual friends
        const iFollowIds = new Set((iFollow || []).map(f => f.addressee_id));
        const followMeIds = new Set((followMe || []).map(f => f.requester_id));
        const mutualIds = [...iFollowIds].filter(id => followMeIds.has(id));

        if (mutualIds.length === 0) { setMutualFriends([]); setLoadingFriends(false); return; }

        // Ambil profil teman mutual
        const { data: profiles, error: profileError } = await supabaseCentral
          .from('profiles').select('id, username, nickname, fullname, avatar_url')
          .in('id', mutualIds);

        if (profileError) { console.error('Error fetching friend profiles:', profileError); setLoadingFriends(false); return; }
        setMutualFriends(profiles || []);
      } catch (e) { console.error('Failed to fetch mutual friends:', e); }
      finally { setLoadingFriends(false); }
    };
    fetchMutualFriends();
  }, [inviteFriendOpen, profile?.id]);

  /**
   * Hook: Mengambil daftar grup pengguna saat dialog undang grup dibuka.
   */
  useEffect(() => {
    if (!inviteGroupOpen || !profile?.id) return;
    const fetchGroups = async () => {
      setLoadingGroups(true);
      try {
        const { data, error } = await supabaseCentral
          .from('groups').select('id, name, members, creator_id')
          .is('deleted_at', null);

        if (error) { console.error('Error fetching groups:', error); setLoadingGroups(false); return; }

        // Filter grup di mana user adalah anggota, tentukan role
        const myGroups = (data || []).reduce((acc: any[], group: any) => {
          const members = Array.isArray(group.members) ? group.members : [];
          const member = members.find((m: any) => (m.user_id === profile.id || m.id === profile.id));
          if (member) {
            let role = member.role || 'member';
            if (group.creator_id === profile.id) role = 'owner';
            acc.push({ id: group.id, name: group.name, membersCount: members.length, members, role });
          }
          return acc;
        }, []);
        setUserGroups(myGroups);
      } catch (e) { console.error('Failed to fetch groups:', e); }
      finally { setLoadingGroups(false); }
    };
    fetchGroups();
  }, [inviteGroupOpen, profile?.id]);

  // ════════════════════════════════════════════════════════════════
  // HOOKS: SESSION & REALTIME
  // ════════════════════════════════════════════════════════════════

  /** Hook: Listener fullscreen change */
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  /**
   * Hook: Load session awal dan peserta.
   * Juga menangani resume countdown jika host me-refresh halaman.
   */
  useEffect(() => {
    if (typeof window !== "undefined") {
      setJoinLink(`${window.location.origin}/join/${roomCode}`);
    }

    const loadSession = async () => {
      await syncServerTime();
      const { data, error } = await supabase
        .from("sessions").select("*").eq("game_pin", roomCode).single();
      if (error || !data) return;
      setSession(data);
      setSessionId(data.id);

      // Resume countdown jika sudah dimulai tapi belum active
      if (data.countdown_started_at && data.status !== "active" && data.status !== "finished") {
        const now = getSyncedServerTime();
        const diff = Math.floor((now - new Date(data.countdown_started_at).getTime()) / 1000);
        const remaining = Math.max(0, Math.min(3, 3 - diff));
        if (remaining > 0) {
          setCountdown(remaining);
        } else if (remaining <= 0) {
          // Countdown sudah habis saat offline, langsung start
          await supabase.from("sessions").update({
            status: "active",
            started_at: new Date(getSyncedServerTime()).toISOString(),
            countdown_started_at: null
          }).eq("id", data.id);
          router.push(`/host/${roomCode}/monitor`);
        }
      }

      // Ambil peserta
      const { data: pData } = await supabase
        .from("participants").select("*").eq("session_id", data.id);
      if (pData) setParticipants(pData);
    };
    loadSession();
  }, [roomCode, router]);

  /**
   * Hook: Subscribe ke Supabase Realtime untuk update peserta & session.
   */
  useEffect(() => {
    if (!sessionId) return;

    const handleStartedOrFinished = (status: string) => {
      if (status === "active") router.push(`/host/${roomCode}/monitor`);
      else if (status === "finished" || status === "completed") router.push(`/host/${roomCode}/leaderboard`);
    };

    const channel = supabase
      .channel(`lobby-${roomCode}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "participants", filter: `session_id=eq.${sessionId}` },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            setParticipants(prev => { if (prev.some(p => p.id === payload.new.id)) return prev; return [...prev, payload.new]; });
          } else if (payload.eventType === "UPDATE") {
            setParticipants(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
          } else if (payload.eventType === "DELETE") {
            setParticipants(prev => prev.filter(p => p.id !== payload.old.id));
          }
        })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${sessionId}` },
        (payload: any) => {
          setSession(payload.new);
          if (payload.new.countdown_started_at && !payload.new.started_at) {
            setCountdown(prev => prev === null ? 3 : prev);
          }
          handleStartedOrFinished(payload.new.status);
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId, roomCode, router]);

  /**
   * Hook: Countdown timer berbasis server time.
   * Menggunakan RAF + interval sebagai fallback untuk akurasi.
   */
  useEffect(() => {
    if (countdown === null) return;
    const startTimeStr = session?.countdown_started_at;
    if (!startTimeStr) return;

    let active = true;
    const startTime = new Date(startTimeStr).getTime();

    const checkCountdown = () => {
      const now = getSyncedServerTime();
      const elapsed = Math.max(0, now - startTime);
      const totalCountdown = 3000;
      const remaining = Math.max(0, Math.min(totalCountdown, totalCountdown - elapsed));
      const displayVal = Math.ceil(remaining / 1000);
      setCountdown((prev) => (prev !== displayVal ? displayVal : prev));

      if (remaining <= 0 && active) {
        active = false;
        const startSession = async () => {
          await supabase.from("sessions").update({
            status: "active",
            started_at: new Date(getSyncedServerTime()).toISOString(),
            countdown_started_at: null
          }).eq("id", session.id);
          router.push(`/host/${roomCode}/monitor`);
        };
        startSession();
        return true;
      }
      return false;
    };

    const syncLoop = () => { if (!active) return; const finished = checkCountdown(); if (!finished) requestAnimationFrame(syncLoop); };
    const backgroundInterval = setInterval(() => { if (active) checkCountdown(); }, 1000);
    const handleVisibility = () => { if (document.visibilityState === "visible" && active) checkCountdown(); };

    requestAnimationFrame(syncLoop);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => { active = false; clearInterval(backgroundInterval); document.removeEventListener("visibilitychange", handleVisibility); };
  }, [session?.countdown_started_at, roomCode]);

  // ════════════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ════════════════════════════════════════════════════════════════

  /** Copy teks ke clipboard dengan feedback visual */
  const copyToClipboard = (text: string, setCopied: any) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /** Mulai game — tulis countdown_started_at ke database */
  const startGame = async () => {
    if (!session || participants.length === 0) return;
    await syncServerTime();
    const nowServer = getSyncedServerTime();
    const isoTime = new Date(nowServer).toISOString();

    setSession((prev: any) => ({ ...prev, countdown_started_at: isoTime }));
    setCountdown(3);

    await supabase.from("sessions").update({ countdown_started_at: isoTime }).eq("id", session.id);
  };

  /** Tambah bot ke lobby */
  const handleAddBot = async () => {
    if (!session) return;
    const botCount = participants.filter((p) => p.car_character?.endsWith("-bot")).length;
    const botNickname = `CPU_${botCount + 1}`;
    const botCharacters = ['rico-bot', 'roadhog-bot', 'gecho-bot'];
    const selectedChar = botCharacters[Math.floor(Math.random() * botCharacters.length)];
    try {
      await supabase.from("participants").insert({ session_id: session.id, nickname: botNickname, car_character: selectedChar, score: 0, current_question: 0 });
    } catch (e) { console.error("Failed to add bot", e); }
  };

  /** Konfirmasi kick pemain */
  const confirmKick = async () => {
    if (selectedPlayer) {
      await supabase.from("participants").delete().eq("id", selectedPlayer.id);
    }
    setKickDialogOpen(false);
  };

  /** Undang teman — kirim notifikasi ke database */
  const handleInviteFriend = async (friendId: string) => {
    setInvitedFriends(prev => [...prev, friendId]);
    setInviteToastVisible(true);
    setTimeout(() => setInviteToastVisible(false), 3000);
    if (profile?.id && sessionId) {
      try {
        await supabaseCentral.from('notifications').insert({ user_id: friendId, actor_id: profile.id, type: 'sessionFriend', entity_type: 'session', entity_id: sessionId });
      } catch (e) { console.error('Failed to send invite notification:', e); }
    }
  };

  /** Undang grup — kirim notifikasi ke semua anggota */
  const handleInviteGroup = async (groupId: string) => {
    const group = userGroups.find(g => g.id === groupId);
    if (!group) return;
    const members = Array.isArray(group.members) ? group.members : [];
    const recipientIds = members.map((m: any) => m.user_id || m.id).filter((id: string) => id && id !== profile?.id);
    const notifications = recipientIds.map((userId: string) => ({
      user_id: userId, actor_id: profile?.id, type: 'sessionGroup', entity_type: 'session', entity_id: sessionId, from_group_id: groupId,
    }));
    if (notifications.length > 0) {
      const { error } = await supabaseCentral.from('notifications').insert(notifications);
      if (error) console.error('Failed to send group notifications:', error);
    }
    setInvitedGroups(prev => [...prev, groupId]);
    setInviteToastVisible(true);
    setTimeout(() => setInviteToastVisible(false), 3000);
  };

  /** Toggle fullscreen */
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else if (document.exitFullscreen) document.exitFullscreen();
  };

  // ════════════════════════════════════════════════════════════════
  // KONDISI LOADING
  // ════════════════════════════════════════════════════════════════

  if (!session) return <LobbyLoading />;

  // ════════════════════════════════════════════════════════════════
  // RENDER UTAMA
  // ════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#06080d] relative font-body text-white flex flex-col">
      {/* ── Efek visual latar belakang ── */}
      <BackgroundEffects />

      {/* ── Konten utama ── */}
      <div className="relative z-10 flex flex-col flex-1 w-full max-w-[1400px] mx-auto px-3 sm:px-6 md:px-8 pt-3 sm:pt-4 pb-4 sm:pb-6 gap-3 sm:gap-4">
        {/* ── Header: logo ── */}
        <div className="flex items-center justify-between shrink-0">
          <img src="/assets/logo/logo1.png" alt="Logo" className="h-8 sm:h-10 object-contain" />
          <img src="/assets/logo/logo2.png" alt="NitroQuiz" className="h-7 sm:h-9 object-contain brightness-125" />
        </div>

        {/* ── Layout utama: Room Info (kiri) & Players (kanan) ── */}
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 flex-1">
          {/* Kartu info room */}
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
            onExit={() => setExitDialogOpen(true)}
            onStart={startGame}
          />

          {/* Kartu daftar pemain */}
          <PlayersCard
            participants={participants}
            isMuted={isMuted}
            onMuteToggle={() => setIsMuted(!isMuted)}
            onInviteFriend={() => setInviteFriendOpen(true)}
            onInviteGroup={() => setInviteGroupOpen(true)}
            onAddBot={handleAddBot}
            onKickPlayer={(player) => { setSelectedPlayer(player); setKickDialogOpen(true); }}
          />
        </div>
      </div>

      {/* ── Toast notifikasi undangan ── */}
      <InviteToast isVisible={inviteToastVisible} />

      {/* ── Dialog kick pemain ── */}
      <KickDialog
        isOpen={kickDialogOpen}
        onClose={() => setKickDialogOpen(false)}
        onConfirm={confirmKick}
        playerName={selectedPlayer?.nickname || ''}
      />

      {/* ── Dialog konfirmasi keluar ── */}
      <ExitDialog
        isOpen={exitDialogOpen}
        onClose={() => setExitDialogOpen(false)}
        onConfirm={() => router.push("/host/select-quiz")}
      />

      {/* ── QR Code fullscreen ── */}
      <QrFullscreen isOpen={qrOpen} onClose={() => setQrOpen(false)} joinLink={joinLink} />

      {/* ── Dialog undang teman ── */}
      <InviteFriendDialog
        isOpen={inviteFriendOpen}
        onClose={() => setInviteFriendOpen(false)}
        friends={mutualFriends}
        isLoading={loadingFriends}
        searchQuery={searchFriendQuery}
        onSearchChange={setSearchFriendQuery}
        invitedFriends={invitedFriends}
        onInvite={handleInviteFriend}
      />

      {/* ── Dialog undang grup ── */}
      <InviteGroupDialog
        isOpen={inviteGroupOpen}
        onClose={() => setInviteGroupOpen(false)}
        groups={userGroups}
        isLoading={loadingGroups}
        searchQuery={searchGroupQuery}
        onSearchChange={setSearchGroupQuery}
        invitedGroups={invitedGroups}
        onInvite={handleInviteGroup}
      />

      {/* ── Overlay countdown ── */}
      <CountdownOverlay countdown={countdown} />

      {/* ── Tombol fullscreen melayang ── */}
      <FullscreenButton isFullscreen={isFullscreen} onToggle={toggleFullscreen} />

      {/* ── CSS kustom untuk siluet kota dan scrollbar ── */}
      <style jsx>{`
        .city-silhouette {
          background: url('/assets/bg/city_silhouette.png') bottom center no-repeat;
          background-size: cover;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}
