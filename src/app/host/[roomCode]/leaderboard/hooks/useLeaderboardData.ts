/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CUSTOM HOOK: useLeaderboardData
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Hook yang mengelola seluruh state dan logika bisnis halaman leaderboard:
 * - Mengambil data sesi dan peserta dari database
 * - Mengurutkan peserta berdasarkan skor, durasi, dan waktu bergabung
 * - Mengelola logika restart game (buat sesi baru)
 * - Menangani efek confetti saat hasil ditampilkan
 * - Menyediakan fungsi format durasi
 *
 * CATATAN: Hook ini tidak mengandung JSX apapun.
 * Semua tampilan ditangani oleh komponen di folder components/.
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import confetti from "canvas-confetti";

import { generateXID } from "@/lib/id-generator";
import { createGFSClient } from "@/lib/supabase/gfs-client";
import { supabaseGame } from "@/lib/supabase/game-client";
import { Participant } from "../types";

// ═══════════════════════════════════════════════════════════════════════════
// FUNGSI UTILITAS INTERNAL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Mengacak urutan elemen array menggunakan algoritma Fisher-Yates.
 * Digunakan untuk mengacak soal saat restart game.
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Menjalankan animasi confetti selama 5 detik.
 * Partikel ditembakkan dari sisi kiri dan kanan layar secara bergantian.
 */
function triggerConfetti() {
  const duration = 5000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 50 };
  const randomInRange = (min: number, max: number) =>
    Math.random() * (max - min) + min;

  const interval: any = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(interval);

    const particleCount = 50 * (timeLeft / duration);

    // Tembakkan confetti dari sisi kiri
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });

    // Tembakkan confetti dari sisi kanan
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK UTAMA
// ═══════════════════════════════════════════════════════════════════════════

export function useLeaderboardData() {
  // ── Inisialisasi klien dan routing ──
  const supabaseCentral = createGFSClient();
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const roomCode = params.roomCode as string;

  // ── State utama ──
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRestarting, setIsRestarting] = useState(false);

  // ═════════════════════════════════════════════════════════════════════════
  // EFEK: Mengambil Data Leaderboard
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Saat halaman dimuat, ambil data sesi berdasarkan roomCode,
   * lalu ambil semua peserta dari sesi tersebut.
   */
  useEffect(() => {
    const fetchResults = async () => {
      try {
        // Cari sesi berdasarkan game_pin (roomCode)
        const { data: sessionData, error: sessionError } = await supabaseGame
          .from("sessions")
          .select("id")
          .eq("game_pin", roomCode)
          .single();

        if (sessionError || !sessionData) {
          console.error("Session not found", sessionError);
          return;
        }

        setSessionId(sessionData.id);

        // Ambil semua peserta dari sesi
        const { data: pData, error: pError } = await supabaseGame
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

  // ═════════════════════════════════════════════════════════════════════════
  // PENGURUTAN PESERTA (RANKING)
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Urutkan peserta berdasarkan prioritas:
   * 1. Skor tertinggi terlebih dahulu
   * 2. Durasi tercepat (lebih kecil = lebih baik)
   * 3. Waktu bergabung lebih awal (lebih termotivasi)
   * 4. ID sebagai fallback terakhir untuk konsistensi
   */
  const rankedPlayers = [...participants].sort((a, b) => {
    // 1. Skor tertinggi dulu
    if (b.score !== a.score) return b.score - a.score;

    // 2. Durasi tercepat dulu
    const durA = a.duration || 999999;
    const durB = b.duration || 999999;
    if (durA !== durB) return durA - durB;

    // 3. Yang bergabung lebih awal dulu
    const joinA = new Date(a.joined_at).getTime();
    const joinB = new Date(b.joined_at).getTime();
    if (joinA !== joinB) return joinA - joinB;

    // 4. Fallback berdasarkan ID
    return a.id.localeCompare(b.id);
  });

  // ═════════════════════════════════════════════════════════════════════════
  // EFEK: Tampilkan Hasil + Confetti
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Setelah loading selesai, tunggu 800ms lalu tampilkan hasil.
   * Jika ada peserta, jalankan confetti 1.5 detik kemudian.
   */
  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        setShowResults(true);
        if (rankedPlayers.length > 0) setTimeout(() => triggerConfetti(), 1500);
      }, 800);
    }
  }, [isLoading, rankedPlayers.length]);

  // ═════════════════════════════════════════════════════════════════════════
  // AKSI: Restart Game (Main Lagi)
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Membuat sesi game baru berdasarkan sesi sebelumnya:
   * 1. Ambil data sesi lama
   * 2. Ambil soal-soal dari kuis original
   * 3. Acak soal dan batasi sesuai limit
   * 4. Buat sesi baru di kedua database (central + game)
   * 5. Redirect ke lobby baru
   */
  const handleRestart = async () => {
    if (isRestarting) return;
    setIsRestarting(true);

    try {
      // 1. Ambil session saat ini
      const { data: oldSess, error: oldSessErr } = await supabaseGame
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

      // 3. Acak soal-soalnya dan batasi jumlahnya
      const shuffled = shuffleArray(allQuestions);
      const limit = oldSess.question_limit || 5;
      const sliced = shuffled.slice(0, limit);

      // 4. Generate PIN dan ID baru
      const newPin = Math.floor(100000 + Math.random() * 900000).toString();
      const newSessionId = generateXID();

      // 5. Siapkan objek sesi baru untuk database game
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

      // 6. Siapkan objek sesi baru untuk database central (dengan field tambahan)
      const newMainSession = {
        ...newSession,
        game_end_mode: "manual",
        allow_join_after_start: false,
        participants: [],
        responses: [],
        application: "NitroQuiz",
      };

      // 7. Insert ke kedua database secara paralel
      const [mainResult, gameResult] = await Promise.allSettled([
        supabaseCentral.from("game_sessions").insert(newMainSession),
        supabaseGame.from("sessions").insert(newSession),
      ]);

      const mainError = mainResult.status === "rejected" ? mainResult.reason : mainResult.value.error;
      const gameError = gameResult.status === "rejected" ? gameResult.reason : gameResult.value.error;

      if (mainError || gameError) {
        throw new Error("Failed to create new session");
      }

      // 8. Update localStorage dan redirect ke lobby baru
      localStorage.setItem("hostGamePin", newPin);
      router.push(`/host/${newPin}/lobby`);

    } catch (err) {
      console.error("Restart failed:", err);
      setIsRestarting(false);
    }
  };

  // ═════════════════════════════════════════════════════════════════════════
  // UTILITAS: Format Durasi
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Mengubah durasi dalam detik menjadi format "MM:SS".
   * Mengembalikan "--:--" jika durasi tidak valid.
   */
  const formatDuration = (seconds: number | undefined | null): string => {
    if (!seconds || seconds === Infinity) return "--:--";
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ═════════════════════════════════════════════════════════════════════════
  // DATA YANG DIKEMBALIKAN
  // ═════════════════════════════════════════════════════════════════════════

  // Ambil 3 besar untuk podium
  const firstPlace = rankedPlayers[0] ?? null;
  const secondPlace = rankedPlayers[1] ?? null;
  const thirdPlace = rankedPlayers[2] ?? null;

  return {
    // Fungsi terjemahan
    t,
    // Navigasi
    router,
    // Data utama
    roomCode,
    sessionId,
    rankedPlayers,
    firstPlace,
    secondPlace,
    thirdPlace,
    // State UI
    isLoading,
    showResults,
    isRestarting,
    // Aksi
    handleRestart,
    // Utilitas
    formatDuration,
  };
}
