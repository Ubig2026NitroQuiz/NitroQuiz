/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CUSTOM HOOK: useMonitorData
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Hook utama untuk mengelola data dan logika inti halaman monitor host.
 *
 * Tanggung Jawab:
 * - Memuat data sesi dan peserta dari database game
 * - Langganan realtime (Supabase Realtime) untuk update peserta & sesi
 * - Timer countdown tersinkronisasi dengan waktu server
 * - Logika bot otomatis (simulasi jawaban bot setiap interval)
 * - Deteksi semua pemain selesai → auto end
 * - Aksi mengakhiri game dan sinkronisasi hasil ke database utama
 *
 * CATATAN: Semua logika bisnis terpusat di hook ini.
 * Komponen UI hanya menerima data dan callback dari hook.
 */

"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { syncServerTime, getSyncedServerTime } from "@/lib/serverTime";
import { generateXID } from "@/lib/id-generator";
import { createGFSClient } from "@/lib/supabase/gfs-client";
import { supabaseGame } from "@/lib/supabase/game-client";
import type { Participant, MonitorSession } from "../types";

// ═══════════════════════════════════════════════════════════════════════════
// HOOK UTAMA
// ═══════════════════════════════════════════════════════════════════════════

export function useMonitorData() {
  // ── Dependensi eksternal ──
  const supabaseCentral = createGFSClient();
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const roomCode = params.roomCode as string;

  // ── State utama ──
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<MonitorSession | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [timeLeft, setTimeLeft] = useState(300);
  const [isEnding, setIsEnding] = useState(false);
  const [endGameDialogOpen, setEndGameDialogOpen] = useState(false);

  // ── Ref untuk akses terkini di interval/callback ──
  const participantsRef = useRef(participants);
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  // ID unik per instance channel realtime
  const channelIdRef = useRef(0);

  // ═══════════════════════════════════════════════════════════════════════
  // FORMAT WAKTU: Konversi detik ke format MM:SS
  // ═══════════════════════════════════════════════════════════════════════

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // SINKRONISASI HASIL: Kirim data hasil game ke database utama (central)
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Mengambil data sesi & peserta dari database game,
   * memformat hasilnya, lalu menyimpan ke tabel game_sessions
   * di database utama (Supabase Central).
   */
  const syncResultsToMainSupabase = useCallback(
    async (activeSessionId: string) => {
      try {
        // Ambil data sesi
        const { data: sess } = await supabaseGame
          .from("sessions")
          .select(
            "id, host_id, quiz_id, question_limit, total_time_minutes, current_questions, started_at, ended_at"
          )
          .eq("id", activeSessionId)
          .single();

        if (!sess) throw new Error("Session tidak ditemukan");

        const totalQuestionsLimit =
          sess.question_limit || (sess.current_questions || []).length;

        // Ambil data peserta
        const { data: participantsData } = await supabaseGame
          .from("participants")
          .select(
            "id, user_id, nickname, car_character, score, correct, answers, duration, eliminated, current_question, finished_at"
          )
          .eq("session_id", activeSessionId);

        if (!participantsData || participantsData.length === 0) return;

        // ── FORMAT DATA PESERTA ──
        const formattedParticipants = participantsData.map((p) => {
          const correctCount = p.correct || 0;
          const accuracy =
            totalQuestionsLimit > 0
              ? Number(
                  ((correctCount / totalQuestionsLimit) * 100).toFixed(2)
                )
              : 0;

          return {
            id: p.id,
            user_id: p.user_id || null,
            nickname: p.nickname,
            car_character: p.car_character || "purple",
            score: p.score || 0,
            correct: correctCount,
            eliminated: p.eliminated || false,
            started: sess.started_at,
            ended:
              p.finished_at || sess.ended_at || new Date().toISOString(),
            total_question: totalQuestionsLimit,
            current_question: p.current_question || 0,
            accuracy: accuracy.toFixed(2),
          };
        });

        // ── FORMAT DATA JAWABAN ──
        const formattedResponses = participantsData
          .filter((p) => (p.answers || []).length > 0)
          .map((p) => ({
            id: generateXID(),
            participant: p.id,
            answers: p.answers || [],
          }));

        // ── SIMPAN KE DATABASE UTAMA ──
        const { error } = await supabaseCentral
          .from("game_sessions")
          .update({
            status: "finished",
            started_at: sess.started_at,
            ended_at: sess.ended_at || new Date().toISOString(),
            participants: formattedParticipants,
            responses: formattedResponses,
          })
          .eq("game_pin", roomCode);

        if (error) throw error;
        console.log("Hasil berhasil disinkronkan ke supabase utama!");
      } catch (err: any) {
        console.error("Gagal sync:", err);
      }
    },
    [roomCode, supabaseCentral]
  );

  // ═══════════════════════════════════════════════════════════════════════
  // AKSI: Akhiri Game (End Race)
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Mengakhiri game:
   * 1. Update status sesi ke "finished"
   * 2. Paksa semua peserta yang belum selesai menjadi finished
   * 3. Sinkronkan hasil ke database utama
   * 4. Redirect ke halaman leaderboard
   */
  const handleEndRace = useCallback(async () => {
    if (isEnding || !sessionId) return;
    setIsEnding(true);

    try {
      const now = new Date().toISOString();

      // Update status sesi
      await supabaseGame
        .from("sessions")
        .update({ status: "finished", ended_at: now })
        .eq("id", sessionId);

      // Paksa peserta yang belum selesai
      await supabaseGame
        .from("participants")
        .update({
          finished_at: now,
          eliminated: false,
          minigame: false,
        })
        .eq("session_id", sessionId)
        .is("finished_at", null);

      // Sinkronkan hasil ke database utama
      await syncResultsToMainSupabase(sessionId);

      // Redirect ke leaderboard
      router.push(`/host/${roomCode}/leaderboard`);
    } catch (error) {
      console.error("Gagal mengakhiri game:", error);
      setIsEnding(false);
    }
  }, [isEnding, sessionId, roomCode, router, syncResultsToMainSupabase]);

  // ═══════════════════════════════════════════════════════════════════════
  // INISIALISASI: Muat sesi & langganan realtime
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    let channel: ReturnType<typeof supabaseGame.channel> | null = null;
    let cancelled = false;
    const instanceId = ++channelIdRef.current;

    const fetchAndSubscribe = async () => {
      try {
        // Sinkronkan waktu server terlebih dahulu
        await syncServerTime();

        // Ambil data sesi
        const { data: sessionData, error: sessionError } = await supabaseGame
          .from("sessions")
          .select("id, question_limit, total_time_minutes, started_at")
          .eq("game_pin", roomCode)
          .single();

        if (sessionError || !sessionData || cancelled) return;

        const fetchedSessionId = sessionData.id;

        setSessionId(fetchedSessionId);
        setSession(sessionData);
        setTotalQuestions(sessionData.question_limit || 5);

        // ── Hitung waktu tersisa untuk tampilan awal ──
        if (sessionData.started_at) {
          const start = new Date(sessionData.started_at).getTime();
          const now = getSyncedServerTime();
          const elapsedSeconds = Math.floor((now - start) / 1000);
          const totalSeconds =
            (sessionData.total_time_minutes || 5) * 60;
          const remaining = Math.max(
            0,
            Math.min(totalSeconds, totalSeconds - elapsedSeconds)
          );
          setTimeLeft(remaining);
        }

        // ── Ambil daftar peserta awal ──
        const { data: pData } = await supabaseGame
          .from("participants")
          .select("*")
          .eq("session_id", fetchedSessionId);

        if (cancelled) return;
        if (pData) setParticipants(pData as Participant[]);

        // ── Langganan Realtime ──
        const channelName = `host_monitor_${roomCode?.toUpperCase()}_${fetchedSessionId}_${instanceId}`;

        channel = supabaseGame
          .channel(channelName)
          // Pantau perubahan tabel participants
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "participants",
              filter: `session_id=eq.${fetchedSessionId}`,
            },
            (payload) => {
              if (cancelled) return;

              if (payload.eventType === "UPDATE") {
                // Perbarui data peserta
                const updated = payload.new as Participant;
                setParticipants((prev) =>
                  prev.map((p) =>
                    String(p.id) === String(updated.id)
                      ? { ...p, ...updated }
                      : p
                  )
                );
              } else if (payload.eventType === "INSERT") {
                // Tambah peserta baru (hindari duplikat)
                const inserted = payload.new as Participant;
                if (inserted.session_id !== fetchedSessionId) return;
                setParticipants((prev) => {
                  if (
                    prev.some(
                      (p) => String(p.id) === String(inserted.id)
                    )
                  )
                    return prev;
                  return [...prev, inserted];
                });
              } else if (payload.eventType === "DELETE") {
                // Hapus peserta yang keluar
                const deleted = payload.old as { id: any };
                setParticipants((prev) =>
                  prev.filter(
                    (p) => String(p.id) !== String(deleted.id)
                  )
                );
              }
            }
          )
          // Pantau perubahan tabel sessions
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "sessions",
              filter: `id=eq.${fetchedSessionId}`,
            },
            (payload) => {
              if (cancelled) return;
              setSession((prev: any) => ({ ...prev, ...payload.new }));

              // Redirect berdasarkan status baru
              if (
                payload.new.status === "finished" ||
                payload.new.status === "completed"
              ) {
                router.push(`/host/${roomCode}/leaderboard`);
              } else if (
                payload.new.status === "waiting" ||
                payload.new.status === "lobby"
              ) {
                router.push(`/host/${roomCode}/lobby`);
              }
            }
          )
          .subscribe((status) => {
            if (status === "CHANNEL_ERROR") {
              console.error(
                `[Realtime] CHANNEL_ERROR pada ${channelName}`
              );
            }
          });
      } catch (err) {
        console.error("Error inisialisasi monitor:", err);
      }
    };

    fetchAndSubscribe();

    // Bersihkan channel saat unmount
    return () => {
      cancelled = true;
      if (channel) {
        supabaseGame.removeChannel(channel);
      }
    };
  }, [roomCode]);

  // ═══════════════════════════════════════════════════════════════════════
  // TIMER: Hitung mundur akurat berbasis waktu server
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!session?.started_at) return;

    const interval = setInterval(() => {
      const start = new Date(session.started_at!).getTime();
      const now = getSyncedServerTime();
      const elapsedSeconds = Math.floor((now - start) / 1000);
      const totalSeconds = (session.total_time_minutes || 5) * 60;
      const remaining = Math.max(
        0,
        Math.min(totalSeconds, totalSeconds - elapsedSeconds)
      );

      setTimeLeft(remaining);

      // Auto end jika waktu habis
      if (remaining <= 0 && !isEnding) {
        handleEndRace();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session, isEnding, handleEndRace]);

  // ═══════════════════════════════════════════════════════════════════════
  // AUTO END: Deteksi semua pemain selesai
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!sessionId || participants.length === 0 || isEnding) return;

    // Cek apakah semua peserta sudah selesai atau tereliminasi
    const allDone = participants.every(
      (p) => p.finished_at !== null || p.eliminated === true
    );

    if (allDone) handleEndRace();
  }, [participants, sessionId, isEnding, handleEndRace]);

  // ═══════════════════════════════════════════════════════════════════════
  // LOGIKA BOT: Simulasi jawaban otomatis untuk pemain bot
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Setiap 4 detik, bot aktif memiliki 70% kemungkinan menjawab soal.
   * Bot mendapat skor acak dan status minigame acak.
   * Jika sudah menjawab semua soal, bot ditandai sebagai selesai.
   */
  useEffect(() => {
    if (!sessionId || isEnding) return;

    const botInterval = setInterval(() => {
      const currentPlayers = participantsRef.current;

      // Filter bot yang masih aktif bermain
      const activeBots = currentPlayers.filter(
        (p) =>
          String(p.car_character).endsWith("-bot") &&
          !p.eliminated &&
          p.current_question < totalQuestions &&
          p.finished_at === null
      );

      activeBots.forEach(async (bot) => {
        // 70% kemungkinan bot menjawab
        if (Math.random() > 0.3) {
          const nextQ = bot.current_question + 1;
          const pointsPerQ = Math.ceil(100 / totalQuestions);
          const newScore = Math.min(
            100,
            bot.score + Math.floor(Math.random() * 5) + (pointsPerQ - 2)
          );
          const isFinished = nextQ >= totalQuestions;

          const updates = {
            current_question: nextQ,
            score: newScore,
            finished_at: isFinished ? new Date().toISOString() : null,
            minigame: Math.random() > 0.5, // true = racing, false = quiz
          };

          // Update state lokal segera
          setParticipants((prev) =>
            prev.map((p) =>
              String(p.id) === String(bot.id) ? { ...p, ...updates } : p
            )
          );

          // Simpan ke database
          try {
            await supabaseGame
              .from("participants")
              .update(updates)
              .eq("id", bot.id);
          } catch (e) {
            console.error("Error bot:", e);
          }
        }
      });
    }, 4000);

    return () => clearInterval(botInterval);
  }, [sessionId, isEnding, totalQuestions]);

  // ═══════════════════════════════════════════════════════════════════════
  // DATA TERURUT: Daftar peserta (saat ini tanpa sorting khusus)
  // ═══════════════════════════════════════════════════════════════════════

  const rankedParticipants = useMemo(() => {
    // Sorting dinonaktifkan saat ini, bisa diaktifkan kembali:
    // return [...participants].sort((a, b) => {
    //   if (b.score !== a.score) return b.score - a.score;
    //   if (b.current_question !== a.current_question) return b.current_question - a.current_question;
    //   return (b.lap_race || 0) - (a.lap_race || 0);
    // });
    return participants;
  }, [participants]);

  // ═══════════════════════════════════════════════════════════════════════
  // RETURN: Semua state dan aksi yang dibutuhkan komponen
  // ═══════════════════════════════════════════════════════════════════════

  return {
    // Konteks
    t,
    roomCode,

    // Data
    session,
    participants,
    rankedParticipants,
    totalQuestions,
    timeLeft,
    isEnding,

    // State UI dialog
    endGameDialogOpen,
    setEndGameDialogOpen,

    // Aksi
    handleEndRace,
    formatTime,
  };
}
