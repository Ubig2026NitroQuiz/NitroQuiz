/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CUSTOM HOOK: useLobbyData
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Hook utama untuk mengelola data dan logika inti halaman lobby host.
 *
 * Tanggung Jawab:
 * - Memuat data sesi (session) dan peserta (participants) dari database
 * - Langganan realtime (Supabase Realtime) untuk update peserta & sesi
 * - Logika countdown sebelum game dimulai (sinkronisasi waktu server)
 * - Aksi game: memulai game, menambah bot, mengeluarkan (kick) pemain
 * - Menyediakan join link & clipboard helper
 *
 * CATATAN: Hook ini TIDAK menangani logika undangan (invite).
 * Untuk undangan, lihat useInviteSystem.ts
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { useBgm } from "@/contexts/BgmContext";
import { syncServerTime, getSyncedServerTime } from "@/lib/serverTime";
import { supabaseGame } from "@/lib/supabase/game-client";
import type { Participant, GameSession } from "../types";

// ═══════════════════════════════════════════════════════════════════════════
// HOOK UTAMA
// ═══════════════════════════════════════════════════════════════════════════

export function useLobbyData() {
  // ── Dependensi eksternal ──
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { isMuted, toggleMute } = useBgm();
  const roomCode = params.roomCode as string;

  // ── State inti lobby ──
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [session, setSession] = useState<GameSession | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [joinLink, setJoinLink] = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);

  // ── State UI clipboard ──
  const [copiedRoom, setCopiedRoom] = useState(false);
  const [copiedJoin, setCopiedJoin] = useState(false);

  // ── State dialog ──
  const [selectedPlayer, setSelectedPlayer] = useState<Participant | null>(null);
  const [kickDialogOpen, setKickDialogOpen] = useState(false);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════
  // MUAT DATA SESI & PESERTA
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Memuat data sesi dari database berdasarkan game_pin (roomCode).
   * Jika countdown sudah dimulai sebelumnya, akan dilanjutkan atau
   * langsung redirect ke monitor jika sudah lewat.
   */
  const loadSession = useCallback(async () => {
    // Sinkronkan waktu server terlebih dahulu
    await syncServerTime();

    const { data, error } = await supabaseGame
      .from("sessions")
      .select("*")
      .eq("game_pin", roomCode)
      .single();

    if (error || !data) return;

    setSession(data);
    setSessionId(data.id);

    // ── Lanjutkan countdown jika sudah dimulai tapi belum selesai ──
    if (data.countdown_started_at && data.status !== "active" && data.status !== "finished") {
      const now = getSyncedServerTime();
      const diff = Math.floor((now - new Date(data.countdown_started_at).getTime()) / 1000);
      const remaining = Math.max(0, Math.min(3, 3 - diff));

      if (remaining > 0) {
        // Countdown masih berjalan — lanjutkan
        setCountdown(remaining);
      } else if (remaining <= 0) {
        // Countdown sudah habis — langsung mulai sesi
        const startSessionFallback = async () => {
          await supabaseGame
            .from("sessions")
            .update({
              status: "active",
              started_at: new Date(getSyncedServerTime()).toISOString(),
              countdown_started_at: null,
            })
            .eq("id", data.id);
          router.push(`/host/${roomCode}/monitor`);
        };
        startSessionFallback();
      }
    }

    // ── Muat daftar peserta ──
    const { data: pData } = await supabaseGame
      .from("participants")
      .select("*")
      .eq("session_id", data.id);

    if (pData) setParticipants(pData as Participant[]);
  }, [roomCode, router]);

  // ═══════════════════════════════════════════════════════════════════════
  // INISIALISASI: Set join link & muat sesi saat pertama kali render
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (typeof window !== "undefined") {
      setJoinLink(`${window.location.origin}/join/${roomCode}`);
    }
    loadSession();
  }, [roomCode, loadSession]);

  // ═══════════════════════════════════════════════════════════════════════
  // LANGGANAN REALTIME: Pantau perubahan peserta & sesi secara real-time
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!sessionId) return;

    /**
     * Handler untuk status sesi yang sudah dimulai/selesai.
     * Redirect ke halaman yang sesuai.
     */
    const handleStartedOrFinished = (status: string) => {
      if (status === "active") router.push(`/host/${roomCode}/monitor`);
      else if (status === "finished" || status === "completed")
        router.push(`/host/${roomCode}/leaderboard`);
    };

    const channel = supabaseGame
      .channel(`lobby-${roomCode}`)
      // ── Pantau perubahan tabel participants ──
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            // Tambah peserta baru (hindari duplikat)
            setParticipants((prev) => {
              if (prev.some((p) => p.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
          } else if (payload.eventType === "UPDATE") {
            // Perbarui data peserta yang sudah ada
            setParticipants((prev) =>
              prev.map((p) => (p.id === payload.new.id ? payload.new : p))
            );
          } else if (payload.eventType === "DELETE") {
            // Hapus peserta yang keluar / di-kick
            setParticipants((prev) =>
              prev.filter((p) => p.id !== payload.old.id)
            );
          }
        }
      )
      // ── Pantau perubahan tabel sessions ──
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload: any) => {
          setSession(payload.new);

          // Mulai countdown saat server mengkonfirmasi
          if (payload.new.countdown_started_at && !payload.new.started_at) {
            setCountdown((prev) => (prev === null ? 3 : prev));
          }

          handleStartedOrFinished(payload.new.status);
        }
      )
      .subscribe();

    // Bersihkan channel saat unmount
    return () => {
      supabaseGame.removeChannel(channel);
    };
  }, [sessionId, roomCode, router]);

  // ═══════════════════════════════════════════════════════════════════════
  // LOGIKA COUNTDOWN: Hitung mundur tersinkronisasi dengan waktu server
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (countdown === null) return;
    const startTimeStr = session?.countdown_started_at;
    if (!startTimeStr) return;

    let active = true;
    const startTime = new Date(startTimeStr).getTime();

    /**
     * Cek sisa waktu countdown berdasarkan waktu server.
     * Mengembalikan true jika countdown sudah selesai.
     */
    const checkCountdown = () => {
      const now = getSyncedServerTime();
      const elapsed = Math.max(0, now - startTime);
      const totalCountdown = 3000; // 3 detik dalam milidetik
      const remaining = Math.max(0, Math.min(totalCountdown, totalCountdown - elapsed));
      const displayVal = Math.ceil(remaining / 1000);

      setCountdown((prev) => (prev !== displayVal ? displayVal : prev));

      if (remaining <= 0 && active) {
        active = false; // Cegah trigger berulang

        // Langsung mulai sesi
        const startSession = async () => {
          await supabaseGame
            .from("sessions")
            .update({
              status: "active",
              started_at: new Date(getSyncedServerTime()).toISOString(),
              countdown_started_at: null,
            })
            .eq("id", session!.id);

          router.push(`/host/${roomCode}/monitor`);
        };
        startSession();
        return true; // Selesai
      }
      return false; // Masih berjalan
    };

    // ── Loop utama menggunakan requestAnimationFrame untuk presisi ──
    const syncLoop = () => {
      if (!active) return;
      const finished = checkCountdown();
      if (!finished) requestAnimationFrame(syncLoop);
    };

    // ── Interval cadangan untuk keamanan di background tab ──
    // (browser throttle RAF lebih agresif daripada setInterval)
    const backgroundInterval = setInterval(() => {
      if (active) checkCountdown();
    }, 1000);

    // ── Listener visibility: snap kembali saat tab aktif ──
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && active) {
        checkCountdown();
      }
    };

    requestAnimationFrame(syncLoop);
    document.addEventListener("visibilitychange", handleVisibility);

    // Bersihkan saat unmount atau dependency berubah
    return () => {
      active = false;
      clearInterval(backgroundInterval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [session?.countdown_started_at, roomCode]);

  // ═══════════════════════════════════════════════════════════════════════
  // AKSI: Mulai Game (trigger countdown)
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Memulai proses countdown game.
   * Menyimpan timestamp countdown ke database dan mengupdate state lokal
   * agar UI langsung responsif tanpa menunggu realtime event.
   */
  const startGame = async () => {
    if (!session || participants.length === 0) return;

    // Sinkronkan waktu server
    await syncServerTime();
    const nowServer = getSyncedServerTime();
    const isoTime = new Date(nowServer).toISOString();

    // Update state lokal segera (menghindari delay realtime)
    setSession((prev: any) => ({ ...prev, countdown_started_at: isoTime }));
    setCountdown(3);

    // Simpan ke database
    await supabaseGame
      .from("sessions")
      .update({ countdown_started_at: isoTime })
      .eq("id", session.id);
  };

  // ═══════════════════════════════════════════════════════════════════════
  // AKSI: Tambah Bot
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Menambahkan pemain bot (CPU) ke sesi.
   * Karakter bot dipilih secara acak dari daftar karakter bot.
   */
  const handleAddBot = async () => {
    if (!session) return;

    // Hitung jumlah bot yang sudah ada
    const botCount = participants.filter((p) =>
      p.car_character?.endsWith("-bot")
    ).length;

    const botNickname = `CPU_${botCount + 1}`;
    const botCharacters = ["rico-bot", "roadhog-bot", "gecho-bot"];
    const selectedChar =
      botCharacters[Math.floor(Math.random() * botCharacters.length)];

    try {
      await supabaseGame.from("participants").insert({
        session_id: session.id,
        nickname: botNickname,
        car_character: selectedChar,
        score: 0,
        current_question: 0,
      });
    } catch (e) {
      console.error("Gagal menambahkan bot:", e);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // AKSI: Keluarkan (Kick) Pemain
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Konfirmasi dan hapus peserta yang dipilih dari sesi.
   */
  const confirmKick = async () => {
    if (selectedPlayer) {
      await supabaseGame
        .from("participants")
        .delete()
        .eq("id", selectedPlayer.id);
    }
    setKickDialogOpen(false);
  };

  // ═══════════════════════════════════════════════════════════════════════
  // HELPER: Salin ke Clipboard
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Menyalin teks ke clipboard dan menampilkan feedback visual sementara.
   */
  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RETURN: Semua state dan aksi yang dibutuhkan komponen
  // ═══════════════════════════════════════════════════════════════════════

  return {
    // Konteks & navigasi
    t,
    profile,
    roomCode,
    router,
    isMuted,
    toggleMute,

    // Data sesi & peserta
    session,
    sessionId,
    participants,
    joinLink,
    countdown,

    // State UI
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

    // Aksi
    startGame,
    handleAddBot,
    confirmKick,
    copyToClipboard,
  };
}
