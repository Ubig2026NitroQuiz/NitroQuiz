/**
 * =====================================================
 * HOOK INISIALISASI HASIL - useResultInit
 * =====================================================
 * Hook ini menangani:
 * 1. Fetch data sesi dan peserta dari Supabase
 * 2. Validasi keamanan (guard) untuk mencegah akses URL langsung
 * 3. Langganan realtime untuk update peserta dan status sesi
 * 4. Pengambilan participant ID dari localStorage
 *
 * CATATAN: Logika guard dan fetch dipertahankan 100% identik
 * dengan versi monolitik sebelumnya.
 * =====================================================
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseGame } from "@/lib/supabase/game-client";
import type { Participant } from "../_types";

/** Tipe data kembalian dari hook useResultInit */
export interface UseResultInitReturn {
  /** Daftar peserta dari database */
  participants: Participant[];
  /** Status loading (true saat data belum siap) */
  isLoading: boolean;
  /** Total jumlah pertanyaan dalam sesi */
  totalQuestions: number;
  /** Status sesi saat ini (waiting, active, completed, finished, dll.) */
  sessionStatus: string | null;
  /** ID sesi dari database */
  sessionId: string | null;
  /** ID peserta saat ini dari localStorage */
  storedParticipantId: string | null;
}

/**
 * Hook utama untuk inisialisasi halaman hasil.
 * Mengelola fetch data, validasi keamanan, dan langganan realtime.
 *
 * @param roomCode - Kode ruangan (sudah di-uppercase)
 * @returns State dan data yang dibutuhkan halaman hasil
 */
export function useResultInit(roomCode: string): UseResultInitReturn {
  const router = useRouter();
  const { user, profile } = useAuth();

  // --- State Utama ---
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [storedParticipantId, setStoredParticipantId] = useState<string | null>(null);

  // --- Ambil participant ID dari localStorage saat mount ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      setStoredParticipantId(localStorage.getItem("nitroquiz_game_participantId"));
    }
  }, []);

  // --- Fungsi Fetch Data dan Validasi Keamanan ---
  /**
   * Mengambil data sesi dan peserta dari Supabase.
   * Termasuk validasi keamanan untuk mencegah akses URL langsung:
   * - Jika sesi tidak ditemukan → redirect ke halaman utama
   * - Jika status waiting/lobby → redirect ke halaman tunggu
   * - Jika status active dan pemain belum selesai → redirect ke game
   * - Jika pemain tidak ditemukan di sesi aktif → redirect ke halaman utama
   */
  const fetchResults = useCallback(async () => {
    let willRedirect = false;
    try {
      // Ambil data sesi berdasarkan game_pin
      const { data: sessionData, error: sessionError } = await supabaseGame
        .from("sessions")
        .select("id, question_limit, status")
        .eq("game_pin", roomCode)
        .single();

      // Guard: Sesi tidak ditemukan
      if (sessionError || !sessionData) {
        console.error("Session not found", sessionError);
        console.log("NitroQuiz Guard: Session missing, redirecting home.");
        willRedirect = true;
        window.location.replace("/");
        return;
      }

      // Simpan data sesi
      if (sessionData.question_limit)
        setTotalQuestions(sessionData.question_limit);
      setSessionId(sessionData.id);
      setSessionStatus(sessionData.status);

      // Ambil data semua peserta dalam sesi
      const { data: pData, error: pError } = await supabaseGame
        .from("participants")
        .select("*")
        .eq("session_id", sessionData.id);

      // Guard: Peserta tidak ditemukan
      if (pError || !pData) {
        console.error("Participants not found", pError);
        willRedirect = true;
        window.location.replace("/");
        return;
      }

      setParticipants(pData as Participant[]);

      // Guard: Cegah manipulasi URL — status masih waiting/lobby
      if (sessionData.status === "waiting" || sessionData.status === "lobby") {
        console.log("NitroQuiz Guard: Status is waiting/lobby, redirecting to waiting page.");
        willRedirect = true;
        window.location.replace(`/player/${roomCode}/waiting`);
        return;
      }

      // Guard: Cegah manipulasi URL — sesi masih aktif
      if (sessionData.status === "active") {
        const storedId = typeof window !== "undefined"
          ? localStorage.getItem("nitroquiz_game_participantId")
          : null;

        // Cari peserta saat ini berdasarkan user_id, storedId, atau nickname
        const currentP = (pData as Participant[]).find(p => {
          if (user?.id && p.user_id === user.id) return true;
          if (storedId && p.id === storedId) return true;
          if (!user?.id && !storedId && p.nickname === profile?.username) return true;
          return false;
        });

        // Jika pemain tidak ada dalam game, arahkan ke halaman utama
        if (!currentP) {
          console.log("NitroQuiz Guard: Player not found in active game, redirecting home.");
          willRedirect = true;
          window.location.replace(`/`);
          return;
        }

        // Jika pemain belum selesai dan belum tereliminasi, arahkan kembali ke game
        if (!currentP.eliminated && !currentP.finished_at) {
          console.log("NitroQuiz Guard: Player has not finished, redirecting to game.");
          willRedirect = true;
          window.location.replace(`/player/${roomCode}/game`);
          return;
        }
      }
    } catch (err) {
      console.error("Failed to load leaderboard data:", err);
    } finally {
      // Jangan hentikan loading jika akan redirect (mencegah flash tampilan)
      if (!willRedirect) {
        setIsLoading(false);
      }
    }
  }, [roomCode, user?.id, profile?.username]);

  // --- Langganan Realtime Supabase ---
  /**
   * Efek samping untuk:
   * 1. Fetch data awal
   * 2. Berlangganan perubahan tabel participants (update skor, dll.)
   * 3. Berlangganan perubahan tabel sessions (status berubah → navigasi otomatis)
   */
  useEffect(() => {
    fetchResults();

    const channel = supabaseGame
      .channel(`leaderboard_updates_${roomCode}`)
      // Langganan perubahan peserta → refresh data
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "participants",
          filter: sessionId ? `session_id=eq.${sessionId}` : undefined,
        },
        () => {
          fetchResults();
        },
      )
      // Langganan perubahan status sesi → navigasi otomatis
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `game_pin=eq.${roomCode}`,
        },
        (payload) => {
          if (payload.new.status === "active") {
            router.push(`/player/${roomCode}/game`);
          } else if (payload.new.status === "waiting" || payload.new.status === "lobby") {
            router.push(`/player/${roomCode}/waiting`);
          }
        },
      )
      .subscribe();

    // Bersihkan langganan saat unmount
    return () => {
      supabaseGame.removeChannel(channel);
    };
  }, [roomCode, router]);

  return {
    participants,
    isLoading,
    totalQuestions,
    sessionStatus,
    sessionId,
    storedParticipantId,
  };
}
