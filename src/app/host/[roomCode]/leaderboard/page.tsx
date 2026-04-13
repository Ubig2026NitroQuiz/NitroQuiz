"use client";

/**
 * page.tsx — Halaman Leaderboard Host
 * ════════════════════════════════════
 *
 * Halaman ini menampilkan hasil akhir kuis setelah permainan selesai.
 * Ditampilkan dari sudut pandang host (pembuat kuis).
 *
 * Fitur utama:
 * 1. Podium 3 besar dengan animasi spring
 * 2. Tabel peringkat lengkap semua peserta
 * 3. Efek confetti saat hasil ditampilkan
 * 4. Tombol navigasi: Home, Play Again, Statistics
 * 5. Responsive: side buttons (desktop) & bottom bar (mobile)
 *
 * Struktur komponen:
 * ├── LeaderboardLoading  → Layar loading saat fetch data
 * ├── BackgroundEffects   → Efek visual latar belakang
 * ├── TopBar              → Logo NitroQuiz & GameForSmart
 * ├── SideButtons         → Tombol navigasi desktop (kiri & kanan)
 * ├── Podium              → Podium 3 peringkat teratas
 * ├── LeaderboardTable    → Tabel peringkat lengkap
 * └── MobileActions       → Tombol navigasi mobile (bottom bar)
 *
 * Alur data:
 * 1. Ambil session berdasarkan roomCode (game_pin)
 * 2. Ambil semua peserta dari session tersebut
 * 3. Urutkan peserta berdasarkan skor, durasi, waktu gabung
 * 4. Tampilkan podium & tabel dengan animasi bertahap
 */

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase, supabaseCentral } from "@/lib/supabase";
import { useTranslation } from "react-i18next";
import { generateXID } from "@/lib/id-generator";
import confetti from "canvas-confetti";

// ── Komponen leaderboard ──
import {
  LeaderboardLoading,
  BackgroundEffects,
  TopBar,
  SideButtons,
  Podium,
  LeaderboardTable,
  MobileActions,
  rankParticipants,
  shuffleArray,
} from "@/components/leaderboard";
import type { Participant } from "@/components/leaderboard";

// ════════════════════════════════════════════════════════════════
// Komponen Utama: LeaderboardPage
// ════════════════════════════════════════════════════════════════
export default function LeaderboardPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const roomCode = params.roomCode as string;

  // ── State data ──
  const [participants, setParticipants] = useState<Participant[]>([]); // Data peserta dari database
  const [sessionId, setSessionId] = useState<string | null>(null);     // ID session untuk link statistik

  // ── State UI ──
  const [isLoading, setIsLoading] = useState(true);      // Status loading awal
  const [showResults, setShowResults] = useState(false);  // Tampilkan hasil (setelah delay animasi)
  const [isRestarting, setIsRestarting] = useState(false); // Status proses restart

  // ════════════════════════════════════════════════════════════════
  // DATA TURUNAN (Derived State)
  // ════════════════════════════════════════════════════════════════

  /** Daftar peserta yang sudah diurutkan berdasarkan peringkat */
  const rankedPlayers = rankParticipants(participants);

  // ════════════════════════════════════════════════════════════════
  // HOOKS & SIDE EFFECTS
  // ════════════════════════════════════════════════════════════════

  /**
   * Hook: Mengambil data hasil kuis dari database.
   * 1. Cari session berdasarkan game_pin (roomCode)
   * 2. Ambil semua data peserta dari session tersebut
   */
  useEffect(() => {
    const fetchResults = async () => {
      try {
        // Cari session berdasarkan kode room
        const { data: sessionData, error: sessionError } = await supabase
          .from("sessions")
          .select("id")
          .eq("game_pin", roomCode)
          .single();

        if (sessionError || !sessionData) {
          console.error("Session not found", sessionError);
          return;
        }

        setSessionId(sessionData.id);

        // Ambil semua peserta dari session
        const { data: pData, error: pError } = await supabase
          .from("participants")
          .select("*")
          .eq("session_id", sessionData.id);

        if (!pError && pData) {
          setParticipants(pData as Participant[]);
        }
      } catch (err) {
        console.error("Failed to load leaderboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [roomCode, router]);

  /**
   * Hook: Menampilkan hasil dengan delay dan memicu efek confetti.
   * - Delay 800ms sebelum menampilkan hasil (transisi visual)
   * - Delay tambahan 1500ms sebelum confetti (setelah podium muncul)
   */
  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        setShowResults(true);
        if (rankedPlayers.length > 0) setTimeout(() => triggerConfetti(), 1500);
      }, 800);
    }
  }, [isLoading, rankedPlayers.length]);

  // ════════════════════════════════════════════════════════════════
  // FUNGSI CONFETTI
  // ════════════════════════════════════════════════════════════════

  /**
   * Memicu animasi confetti dari dua sisi layar selama 5 detik.
   * Jumlah partikel berkurang secara bertahap seiring waktu.
   */
  const triggerConfetti = () => {
    const duration = 5000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 50 };
    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);

      // Confetti dari sisi kiri
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });

      // Confetti dari sisi kanan
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  };

  // ════════════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ════════════════════════════════════════════════════════════════

  /** Navigasi kembali ke halaman utama */
  const handleGoHome = () => {
    router.push("/");
  };

  /** Buka halaman statistik di tab baru */
  const handleViewStats = () => {
    if (sessionId) {
      window.open(
        `https://app.gameforsmart.com/stat/${sessionId}`,
        "_blank",
      );
    }
  };

  /**
   * Restart kuis dengan membuat session baru.
   *
   * Langkah-langkah:
   * 1. Ambil data session saat ini dari database
   * 2. Ambil soal-soal dari kuis original
   * 3. Acak urutan soal dan pilih sesuai limit
   * 4. Buat session baru di kedua database (central & game)
   * 5. Redirect host ke lobby baru
   */
  const handleRestart = async () => {
    if (isRestarting) return;
    setIsRestarting(true);

    try {
      // 1. Ambil session saat ini
      const { data: oldSess, error: oldSessErr } = await supabase
        .from("sessions")
        .select("*")
        .eq("game_pin", roomCode)
        .single();

      if (oldSessErr || !oldSess) throw new Error("Session not found");

      // 2. Ambil data kuis original untuk mendapatkan semua pertanyaannya
      const { data: quizData, error: quizError } = await supabaseCentral
        .from("quizzes")
        .select("questions")
        .eq("id", oldSess.quiz_id)
        .single();

      if (quizError || !quizData) throw new Error("Quiz data not found");

      const allQuestions = typeof quizData.questions === 'string'
        ? JSON.parse(quizData.questions)
        : quizData.questions;

      // 3. Acak soal-soalnya dan potong sesuai limit
      const shuffled = shuffleArray(allQuestions);
      const limit = oldSess.question_limit || 5;
      const sliced = shuffled.slice(0, limit);

      // 4. Generate PIN baru dan ID session baru
      const newPin = Math.floor(100000 + Math.random() * 900000).toString();
      const newSessionId = generateXID();

      // Data session untuk database game
      const newSession = {
        id: newSessionId,
        quiz_id: oldSess.quiz_id,
        host_id: oldSess.host_id,
        game_pin: newPin,
        total_time_minutes: oldSess.total_time_minutes,
        question_limit: limit,
        difficulty: oldSess.difficulty,
        current_questions: sliced,
        status: "waiting",
      };

      // Data session untuk database central (dengan field tambahan)
      const newMainSession = {
        ...newSession,
        game_end_mode: "manual",
        allow_join_after_start: false,
        participants: [],
        responses: [],
        application: "nitroquiz",
      };

      // 5. Insert ke kedua database secara paralel
      const [mainResult, gameResult] = await Promise.allSettled([
        supabaseCentral.from("game_sessions").insert(newMainSession),
        supabase.from("sessions").insert(newSession),
      ]);

      const mainError = mainResult.status === "rejected" ? mainResult.reason : mainResult.value.error;
      const gameError = gameResult.status === "rejected" ? gameResult.reason : gameResult.value.error;

      if (mainError || gameError) {
        throw new Error("Failed to create new session");
      }

      // 6. Update localStorage dan redirect ke lobby baru
      localStorage.setItem("hostGamePin", newPin);
      router.push(`/host/${newPin}/lobby`);

    } catch (err) {
      console.error("Restart failed:", err);
      setIsRestarting(false);
    }
  };

  // ════════════════════════════════════════════════════════════════
  // KONDISI LOADING
  // ════════════════════════════════════════════════════════════════

  if (isLoading) {
    return <LeaderboardLoading />;
  }

  // ════════════════════════════════════════════════════════════════
  // RENDER UTAMA
  // ════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden font-body text-white flex flex-col items-center pb-12">
      {/* ── Efek visual latar belakang ── */}
      <BackgroundEffects />

      {/* ── Bar atas: logo kiri & kanan ── */}
      <TopBar />

      {/* ── Area konten utama ── */}
      <div className="w-full max-w-5xl z-20 px-4 sm:px-6 -mt-2">
        {/* ── Tombol navigasi desktop (sisi kiri & kanan layar) ── */}
        <SideButtons
          onHome={handleGoHome}
          onRestart={handleRestart}
          onViewStats={handleViewStats}
          isRestarting={isRestarting}
        />

        {/* ── Podium 3 besar ── */}
        {showResults && rankedPlayers.length > 0 && (
          <Podium rankedPlayers={rankedPlayers} />
        )}

        {/* ── Tabel peringkat lengkap ── */}
        {showResults && rankedPlayers.length > 0 && (
          <LeaderboardTable rankedPlayers={rankedPlayers} />
        )}

        {/* ── Tombol navigasi mobile (bottom bar) ── */}
        <MobileActions
          onHome={handleGoHome}
          onRestart={handleRestart}
          onViewStats={handleViewStats}
          isRestarting={isRestarting}
        />
      </div>
    </div>
  );
}
