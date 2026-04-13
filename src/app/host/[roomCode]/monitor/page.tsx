"use client";

/**
 * page.tsx — Halaman Monitor Permainan (Game Monitor)
 * ════════════════════════════════════════════════════
 *
 * Halaman ini adalah dashboard real-time untuk host memantau
 * progres pemain selama permainan berlangsung.
 *
 * Fitur utama:
 * 1. Timer countdown (sisa waktu permainan)
 * 2. Grid pemain dengan status real-time (quiz/racing/finish/crashed)
 * 3. Update skor & posisi secara langsung via Supabase Realtime
 * 4. Simulasi bot (CPU) yang bermain otomatis
 * 5. Auto-end saat waktu habis atau semua pemain selesai
 * 6. Sinkronisasi hasil ke database central
 * 7. Dialog konfirmasi end race manual
 *
 * Struktur komponen:
 * ├── BackgroundEffects   → Efek visual latar belakang
 * ├── MonitorHeader       → Logo, timer, tombol end race
 * ├── PlayersGrid         → Grid kartu pemain (PlayerCard)
 * └── EndGameDialog       → Dialog konfirmasi akhiri permainan
 *
 * Alur:
 * 1. Load session & peserta awal dari database
 * 2. Subscribe Supabase Realtime untuk update peserta/session
 * 3. Timer berhitung mundur berdasarkan server time
 * 4. Bot memainkan secara otomatis setiap 4 detik
 * 5. Saat semua selesai / waktu habis / host end race:
 *    a. Update status session → "finished"
 *    b. Force finish semua yang belum selesai
 *    c. Sync hasil ke database central
 *    d. Redirect ke leaderboard
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase, supabaseCentral } from "@/lib/supabase";
import { useTranslation } from "react-i18next";
import { syncServerTime, getSyncedServerTime } from "@/lib/serverTime";
import { generateXID } from "@/lib/id-generator";

// ── Komponen monitor ──
import {
  BackgroundEffects,
  MonitorHeader,
  PlayersGrid,
  EndGameDialog,
} from "@/components/monitor";
import type { MonitorParticipant } from "@/components/monitor";

// ════════════════════════════════════════════════════════════════
// Komponen Utama: GameMonitorPage
// ════════════════════════════════════════════════════════════════
export default function GameMonitorPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const roomCode = params.roomCode as string;

  // ── State data utama ──
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [participants, setParticipants] = useState<MonitorParticipant[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(5);

  // ── State UI ──
  const [timeLeft, setTimeLeft] = useState(300);                    // Sisa waktu (detik)
  const [isEnding, setIsEnding] = useState(false);                  // Sedang mengakhiri permainan
  const [endGameDialogOpen, setEndGameDialogOpen] = useState(false); // Dialog end game

  // ── Ref untuk akses peserta terkini di dalam interval bot ──
  const participantsRef = useRef(participants);
  useEffect(() => { participantsRef.current = participants; }, [participants]);

  // ════════════════════════════════════════════════════════════════
  // HOOKS: DATA FETCHING
  // ════════════════════════════════════════════════════════════════

  /**
   * Hook: Mengambil data session dan peserta awal.
   * Juga menghitung sisa waktu berdasarkan started_at.
   */
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await syncServerTime();
        const { data: sessionData, error: sessionError } = await supabase
          .from("sessions")
          .select("id, question_limit, total_time_minutes, started_at")
          .eq("game_pin", roomCode)
          .single();

        if (sessionError) return;

        if (sessionData) {
          setSessionId(sessionData.id);
          setSession(sessionData);
          setTotalQuestions(sessionData.question_limit || 5);

          // Hitung sisa waktu untuk tampilan awal
          if (sessionData.started_at) {
            const start = new Date(sessionData.started_at).getTime();
            const now = getSyncedServerTime();
            const elapsedSeconds = Math.floor((now - start) / 1000);
            const totalSeconds = (sessionData.total_time_minutes || 5) * 60;
            const remaining = Math.max(0, Math.min(totalSeconds, totalSeconds - elapsedSeconds));
            setTimeLeft(remaining);
          }

          // Ambil peserta
          const { data: pData } = await supabase
            .from("participants").select("*").eq("session_id", sessionData.id);
          if (pData) setParticipants(pData as MonitorParticipant[]);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      }
    };
    fetchInitialData();
  }, [roomCode]);

  // ════════════════════════════════════════════════════════════════
  // HOOKS: REALTIME
  // ════════════════════════════════════════════════════════════════

  /**
   * Hook: Subscribe Supabase Realtime untuk update peserta & session.
   */
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`host_monitor_${roomCode?.toUpperCase()}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "participants", filter: `session_id=eq.${sessionId}` },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as MonitorParticipant;
            setParticipants((prev) => prev.map((p) => (String(p.id) === String(updated.id) ? { ...p, ...updated } : p)));
          } else if (payload.eventType === "INSERT") {
            const inserted = payload.new as MonitorParticipant;
            if (inserted.session_id !== sessionId) return;
            setParticipants((prev) => {
              if (prev.some(p => String(p.id) === String(inserted.id))) return prev;
              return [...prev, inserted];
            });
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as { id: any };
            setParticipants((prev) => prev.filter(p => String(p.id) !== String(deleted.id)));
          }
        })
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "sessions", filter: `id=eq.${sessionId}` },
        (payload) => {
          setSession((prev: any) => ({ ...prev, ...payload.new }));
          if (payload.new.status === "finished" || payload.new.status === "completed") {
            router.push(`/host/${roomCode}/leaderboard`);
          } else if (payload.new.status === "waiting" || payload.new.status === "lobby") {
            router.push(`/host/${roomCode}/lobby`);
          }
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  // ════════════════════════════════════════════════════════════════
  // HOOKS: TIMER & AUTO-END
  // ════════════════════════════════════════════════════════════════

  /**
   * Hook: Timer akurat berbasis server time.
   * Auto-end jika waktu habis.
   */
  useEffect(() => {
    if (!session?.started_at) return;
    const interval = setInterval(() => {
      const start = new Date(session.started_at).getTime();
      const now = getSyncedServerTime();
      const elapsedSeconds = Math.floor((now - start) / 1000);
      const totalSeconds = (session.total_time_minutes || 5) * 60;
      const remaining = Math.max(0, Math.min(totalSeconds, totalSeconds - elapsedSeconds));
      setTimeLeft(remaining);

      // Auto end jika waktu habis
      if (remaining <= 0 && !isEnding) handleEndRace();
    }, 1000);
    return () => clearInterval(interval);
  }, [session, isEnding]);

  /**
   * Hook: Auto-end jika semua pemain sudah selesai atau eliminated.
   */
  useEffect(() => {
    if (!sessionId || participants.length === 0 || isEnding) return;
    const allDone = participants.every((p) => p.finished_at !== null || p.eliminated === true);
    if (allDone) handleEndRace();
  }, [participants, sessionId, isEnding]);

  // ════════════════════════════════════════════════════════════════
  // HOOKS: SIMULASI BOT
  // ════════════════════════════════════════════════════════════════

  /**
   * Hook: Simulasi bot (CPU) bermain otomatis.
   * Bot menjawab soal secara acak setiap 4 detik.
   */
  useEffect(() => {
    if (!sessionId || isEnding) return;
    const botInterval = setInterval(() => {
      const currentPlayers = participantsRef.current;
      const activeBots = currentPlayers.filter(
        (p) => String(p.car_character).endsWith("-bot") && !p.eliminated && p.current_question < totalQuestions && p.finished_at === null
      );

      activeBots.forEach(async (bot) => {
        if (Math.random() > 0.3) {
          const nextQ = bot.current_question + 1;
          const pointsPerQ = Math.ceil(100 / totalQuestions);
          const newScore = Math.min(100, bot.score + Math.floor(Math.random() * 5) + (pointsPerQ - 2));
          const isFinished = nextQ >= totalQuestions;

          const updates = {
            current_question: nextQ,
            score: newScore,
            finished_at: isFinished ? new Date().toISOString() : null,
            minigame: Math.random() > 0.5,
          };

          // Update state lokal dulu untuk responsifitas
          setParticipants(prev => prev.map(p => String(p.id) === String(bot.id) ? { ...p, ...updates } : p));

          try {
            await supabase.from("participants").update(updates).eq("id", bot.id);
          } catch (e) { console.error("Bot error:", e); }
        }
      });
    }, 4000);
    return () => clearInterval(botInterval);
  }, [sessionId, isEnding, totalQuestions]);

  // ════════════════════════════════════════════════════════════════
  // FUNGSI: SINKRONISASI & END RACE
  // ════════════════════════════════════════════════════════════════

  /**
   * Sinkronisasi hasil permainan ke database central (platform utama).
   * Mengformat data peserta dan jawaban untuk disimpan.
   */
  const syncResultsToMainSupabase = async (activeSessionId: string) => {
    try {
      const { data: sess } = await supabase
        .from("sessions")
        .select("id, host_id, quiz_id, question_limit, total_time_minutes, current_questions, started_at, ended_at")
        .eq("id", activeSessionId).single();

      if (!sess) throw new Error("Session tidak ditemukan");

      const totalQuestionsLimit = sess.question_limit || (sess.current_questions || []).length;

      const { data: participantsData } = await supabase
        .from("participants")
        .select("id, user_id, nickname, car_character, score, correct, answers, duration, eliminated, current_question, finished_at")
        .eq("session_id", activeSessionId);

      if (!participantsData || participantsData.length === 0) return;

      // Format data peserta untuk database central
      const formattedParticipants = participantsData.map(p => {
        const correctCount = p.correct || 0;
        const accuracy = totalQuestionsLimit > 0
          ? Number(((correctCount / totalQuestionsLimit) * 100).toFixed(2))
          : 0;

        return {
          id: p.id, user_id: p.user_id || null, nickname: p.nickname,
          car_character: p.car_character || "purple", score: p.score || 0,
          correct: correctCount, eliminated: p.eliminated || false,
          started: sess.started_at,
          ended: p.finished_at || sess.ended_at || new Date().toISOString(),
          total_question: totalQuestionsLimit,
          current_question: p.current_question || 0,
          accuracy: accuracy.toFixed(2),
        };
      });

      // Format data jawaban
      const formattedResponses = participantsData
        .filter(p => (p.answers || []).length > 0)
        .map(p => ({ id: generateXID(), participant: p.id, answers: p.answers || [] }));

      // Update ke database central
      const { error } = await supabaseCentral
        .from("game_sessions")
        .update({
          status: "finished",
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
  };

  /**
   * Mengakhiri permainan:
   * 1. Update status session → "finished"
   * 2. Force semua peserta yang belum selesai → finished + eliminated
   * 3. Sync hasil ke database central
   * 4. Redirect ke leaderboard
   */
  const handleEndRace = async () => {
    if (isEnding || !sessionId) return;
    setIsEnding(true);
    try {
      const now = new Date().toISOString();
      await supabase.from("sessions").update({ status: "finished", ended_at: now }).eq("id", sessionId);

      // Force finish semua yang belum selesai
      await supabase.from("participants")
        .update({ finished_at: now, eliminated: true, minigame: false })
        .eq("session_id", sessionId)
        .is("finished_at", null);

      await syncResultsToMainSupabase(sessionId);
      router.push(`/host/${roomCode}/leaderboard`);
    } catch (error) {
      console.error("Failed to end race:", error);
      setIsEnding(false);
    }
  };

  // ════════════════════════════════════════════════════════════════
  // DATA TURUNAN
  // ════════════════════════════════════════════════════════════════

  /** Peserta diurutkan berdasarkan skor (tertinggi), progress, dan lap */
  const rankedParticipants = useMemo(() => {
    return [...participants].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.current_question !== a.current_question) return b.current_question - a.current_question;
      return (b.lap_race || 0) - (a.lap_race || 0);
    });
  }, [participants]);

  // ════════════════════════════════════════════════════════════════
  // RENDER UTAMA
  // ════════════════════════════════════════════════════════════════

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#07091a",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Rajdhani, sans-serif",
        color: "white",
      }}
    >
      {/* ── Efek visual latar belakang ── */}
      <BackgroundEffects />

      {/* ── Header: logo, timer, end race ── */}
      <MonitorHeader
        timeLeft={timeLeft}
        isEnding={isEnding}
        onEndRace={() => setEndGameDialogOpen(true)}
      />

      {/* ── Grid pemain ── */}
      <PlayersGrid
        participants={rankedParticipants}
        totalQuestions={totalQuestions}
      />

      {/* ── Dialog konfirmasi akhiri permainan ── */}
      <EndGameDialog
        isOpen={endGameDialogOpen}
        onClose={() => setEndGameDialogOpen(false)}
        onConfirm={handleEndRace}
      />

      {/* ── CSS kustom ── */}
      <style>{`
        .leaderboard-grid {
          display: grid;
          gap: 10px;
          grid-template-columns: 1fr;
        }
        @media (min-width: 768px) {
          .leaderboard-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1280px) {
          .leaderboard-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .empty-grid-msg { grid-column: 1 / -1; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}