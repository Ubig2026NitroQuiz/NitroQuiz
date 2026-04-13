'use client';

/**
 * page.tsx — Halaman Kuis Pemain
 * ═════════════════════════════════════════════
 *
 * Halaman ini menampilkan soal kuis kepada pemain.
 * Pemain menjawab soal setelah menyelesaikan satu lap balapan.
 *
 * Alur:
 * 1. Fetch soal dari database (sessions.current_questions)
 * 2. Sinkronkan progress pemain (score, current_question) dari DB
 * 3. Tampilkan soal satu per satu dengan animasi
 * 4. Setelah 3 soal (1 ronde) → kembali ke game
 * 5. Setelah semua soal habis → redirect ke result
 *
 * Fitur:
 * - Timer global berbasis server time
 * - Guard realtime: redirect jika status session berubah
 * - Zoom gambar soal / opsi (klik untuk fullscreen)
 * - Progress bar dan skor pemain
 * - Transisi halus antar soal (framer-motion)
 *
 * Arsitektur:
 * ├── components/quiz/types.ts         → QuizQuestion, QUESTIONS_PER_ROUND, OPTION_COLORS
 * ├── components/quiz/QuizHeader.tsx    → Progress bar, timer, skor
 * ├── components/quiz/QuizOptionCard.tsx → Satu kartu opsi jawaban
 * ├── components/quiz/ImageZoomModal.tsx → Modal zoom gambar
 * ├── components/quiz/QuizLoading.tsx   → Layar loading
 * └── page.tsx (file ini)              → Logika bisnis & orchestrator
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useTranslation } from "react-i18next";
import { getSyncedServerTime, syncServerTime } from '@/lib/serverTime';
import { generateXID } from '@/lib/id-generator';

// ── Komponen UI terekstrak ──
import {
  QuizHeader,
  QuizOptionCard,
  ImageZoomModal,
  QuizLoading,
  QUESTIONS_PER_ROUND,
} from '@/components/quiz';
import type { QuizQuestion } from '@/components/quiz';

// Re-export tipe agar file lain yang import dari sini tetap bekerja
export type { QuizQuestion };

// ════════════════════════════════════════════════════════════════
//  KOMPONEN UTAMA: QuizPage
// ════════════════════════════════════════════════════════════════

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const roomCodeFromParams = (params?.roomCode as string)?.toUpperCase();

  // ════════════════════════════════════════════════════════════════
  // STATE
  // ════════════════════════════════════════════════════════════════

  // ── State: UI ──
  const [mounted, setMounted] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // ── State: Kuis ──
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // ── State: Session & navigasi ──
  const [roomCode, setRoomCode] = useState<string | null>(roomCodeFromParams || null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [statusText, setStatusText] = useState(t("player_quiz.round_complete"));

  // ── State: Timer global ──
  const [globalTimeLeft, setGlobalTimeLeft] = useState<number | null>(null);
  const [isTimerReady, setIsTimerReady] = useState(false);

  // ── Refs ──
  /** Flag untuk mencegah redirect ganda saat transisi halaman */
  const isTransitioningRef = useRef(false);
  /** Promise update database terakhir (untuk await sebelum navigasi) */
  const lastUpdateRef = useRef<Promise<void> | null>(null);

  // ════════════════════════════════════════════════════════════════
  // HOOK: Inisialisasi data dari database
  // ════════════════════════════════════════════════════════════════

  useEffect(() => {
    setMounted(true);
    syncServerTime();

    /**
     * Ambil data terbaru dari Supabase:
     * 1. Session → soal kuis, status, difficulty
     * 2. Participant → skor, progress, guard minigame
     */
    const fetchLatestData = async () => {
      const participantId = localStorage.getItem('nitroquiz_game_participantId');
      const storedRoom = localStorage.getItem('nitroquiz_game_roomCode');
      const roomToUse = roomCodeFromParams || storedRoom;

      // Validasi: harus ada participantId dan roomCode
      if (!participantId || !roomToUse) {
        console.warn("Quiz: No participantId or roomCode found, redirecting home.");
        router.push('/');
        return;
      }

      try {
        // ── 1. Fetch data session (soal & status) ──
        const { data: sessionData, error: sessError } = await supabase
          .from('sessions')
          .select('id, status, current_questions, difficulty')
          .eq('game_pin', roomToUse)
          .single();

        if (sessError || !sessionData) {
          router.push('/');
          return;
        }

        // ── 2. Fetch data peserta (progress & guard) ──
        const { data: pData, error: pError } = await supabase
          .from('participants')
          .select('score, current_question, minigame, finished_at')
          .eq('id', participantId)
          .single();

        if (pError || !pData) {
          router.push('/');
          return;
        }

        // ── Guard: Jika minigame = true, seharusnya di halaman game ──
        if (pData.minigame === true && !pData.finished_at) {
          router.push(`/player/${roomToUse}/game`);
          return;
        }

        // ── Guard: Jika session sudah selesai, langsung ke result ──
        if (sessionData.status === 'finished' || sessionData.status === 'completed') {
          router.push(`/player/${roomToUse}/result`);
          return;
        }

        // ── Sinkronkan state lokal dari database ──
        setSessionId(sessionData.id);
        setRoomCode(roomToUse);
        setScore(pData.score || 0);
        setCurrentIndex(pData.current_question || 0);

        // ── Normalisasi soal kuis ──
        let rawQuestions = sessionData.current_questions;
        if (typeof rawQuestions === 'string') {
          try { rawQuestions = JSON.parse(rawQuestions); } catch (e) { }
        }

        if (Array.isArray(rawQuestions)) {
          const normalized: QuizQuestion[] = rawQuestions.map((q: any, idx: number) => {
            let options: { text: string; image?: string }[] = [];
            let correctAnswer = 0;

            // Format DB: answers = [{id, answer, image?}]
            if (Array.isArray(q.answers)) {
              options = q.answers.map((a: any) => ({
                text: a.answer || a.text || '',
                image: a.image || a.image_url || a.imageUrl || undefined,
              }));
              const correctId = String(q.correct);
              const correctIdx = q.answers.findIndex((a: any) => String(a.id) === correctId);
              correctAnswer = correctIdx >= 0 ? correctIdx : 0;
            }
            // Format sederhana: options = string[] atau object[]
            else if (Array.isArray(q.options)) {
              options = q.options.map((opt: any) => {
                if (typeof opt === 'string') return { text: opt };
                return { text: opt.text || opt.answer || '', image: opt.image || opt.image_url || opt.imageUrl || undefined };
              });
              correctAnswer = q.correctAnswer ?? 0;
            }

            return {
              id: q.id || `q-${idx}`,
              question: q.question || q.text || '',
              options,
              correctAnswer,
              imageUrl: q.image || q.image_url || q.imageUrl || undefined,
              originalDoc: q,
            };
          });

          setQuestions(normalized);

          // Simpan cache ke localStorage
          localStorage.setItem('nitroquiz_game_questions', JSON.stringify(rawQuestions));
          localStorage.setItem('nitroquiz_game_sessionId', sessionData.id);
          localStorage.setItem('nitroquiz_game_roomCode', roomToUse);
          localStorage.setItem('nitroquiz_game_difficulty', sessionData.difficulty || 'easy');
        }
      } catch (err) {
        console.error("Quiz Initialization Error:", err);
        router.push('/');
      }
    };

    fetchLatestData();

    // Prefetch halaman game agar transisi instan
    router.prefetch(`/player/${roomCodeFromParams}/game`);
  }, [router, roomCodeFromParams]);

  // ════════════════════════════════════════════════════════════════
  // HANDLER: Jawab soal
  // ════════════════════════════════════════════════════════════════

  /**
   * Proses jawaban pemain:
   * 1. Hitung skor
   * 2. Update UI langsung (optimistic)
   * 3. Transisi ke soal berikutnya setelah 300ms
   * 4. Simpan ke database di background
   */
  const handleAnswer = async (optionIndex: number) => {
    if (isAnswered) return;

    const currentQ = questions[currentIndex];
    const correct = optionIndex === currentQ.correctAnswer;

    // Update UI langsung (optimistic update)
    setSelectedOption(optionIndex);
    setIsAnswered(true);

    // Hitung skor baru
    const earnedPoints = correct ? Math.ceil(100 / questions.length) : 0;
    const newScore = Math.min(100, score + earnedPoints);
    setScore(newScore);
    localStorage.setItem('nitroquiz_game_score', newScore.toString());

    // Transisi langsung untuk UX yang cepat
    setTimeout(() => { nextQuestion(); }, 300);

    // Update database di background (tidak blocking UI)
    const participantId = localStorage.getItem('nitroquiz_game_participantId');
    lastUpdateRef.current = (async () => {
      if (!participantId) return;
      try {
        // Ambil state terkini dari DB untuk mencegah overwrite
        const { data: currentData } = await supabase
          .from('participants')
          .select('answers, correct, score, current_question')
          .eq('id', participantId)
          .single();

        if (currentData) {
          // Parse jawaban sebelumnya
          let currentAnswers: any[] = [];
          if (currentData.answers) {
            try {
              currentAnswers = typeof currentData.answers === 'string'
                ? JSON.parse(currentData.answers) : currentData.answers;
            } catch (e) { }
          }

          // Ekstrak answer_id dari dokumen asli
          let answer_id = "";
          if (currentQ.originalDoc?.answers?.[optionIndex]?.id) {
            answer_id = currentQ.originalDoc.answers[optionIndex].id;
          }

          // Buat entri jawaban baru
          const newEntry = {
            id: generateXID(),
            correct: correct,
            answer_id: answer_id,
            question_id: currentQ.id,
          };

          // Simpan ke database
          await supabase
            .from('participants')
            .update({
              answers: [...currentAnswers, newEntry],
              correct: (currentData.correct || 0) + (correct ? 1 : 0),
              score: newScore,
              current_question: currentIndex + 1,
            })
            .eq('id', participantId);
        }
      } catch (e) {
        console.error("Failed to update score/lap in background", e);
      }
    })();
  };

  // ════════════════════════════════════════════════════════════════
  // HANDLER: Lanjut ke soal berikutnya
  // ════════════════════════════════════════════════════════════════

  /**
   * Tentukan aksi setelah menjawab:
   * - Akhir kuis (semua soal habis) → redirect ke result
   * - Akhir ronde (kelipatan QUESTIONS_PER_ROUND) → kembali ke game
   * - Lainnya → tampilkan soal berikutnya
   */
  const nextQuestion = async () => {
    const nextIdx = currentIndex + 1;
    const isEndOfQuiz = nextIdx >= questions.length;
    const isRoundEnd = !isEndOfQuiz && (nextIdx % QUESTIONS_PER_ROUND === 0);

    if (isEndOfQuiz) {
      // ── Kuis selesai total → ke halaman result ──
      if (lastUpdateRef.current) await lastUpdateRef.current;
      isTransitioningRef.current = true;

      const participantId = localStorage.getItem('nitroquiz_game_participantId');
      if (participantId) {
        try {
          await supabase.from('participants')
            .update({ minigame: false, finished_at: new Date().toISOString(), current_question: nextIdx })
            .eq('id', participantId);
        } catch (e) { console.error("Error finishing quiz:", e); }
      }

      setStatusText(t("player_quiz.quiz_finished"));
      router.push(`/player/${roomCode}/result`);
      return;
    }

    if (isRoundEnd) {
      // ── Selesai 1 ronde → kembali ke game balap ──
      if (lastUpdateRef.current) await lastUpdateRef.current;
      isTransitioningRef.current = true;

      const participantId = localStorage.getItem('nitroquiz_game_participantId');
      if (participantId) {
        try {
          await supabase.from('participants')
            .update({ minigame: true, current_question: nextIdx })
            .eq('id', participantId);
        } catch (e) { console.error("Critical error during quiz transition:", e); }
      }

      setStatusText(t("player_quiz.round_complete"));
      router.push(`/player/${roomCode}/game`);
      return;
    }

    // ── Soal biasa: lanjut ke soal berikutnya ──
    setCurrentIndex(nextIdx);
    setIsAnswered(false);
    setSelectedOption(null);
    localStorage.setItem('nitroquiz_game_questionIndex', nextIdx.toString());
  };

  // ════════════════════════════════════════════════════════════════
  // HOOK: Guard realtime (session status & minigame flag)
  // ════════════════════════════════════════════════════════════════

  useEffect(() => {
    const sessId = typeof window !== 'undefined' ? localStorage.getItem('nitroquiz_game_sessionId') : null;
    const participantId = typeof window !== 'undefined' ? localStorage.getItem('nitroquiz_game_participantId') : null;
    if (!sessId || !participantId) return;

    const channel = supabase
      .channel(`player_quiz_guards_${participantId}`)
      // ── Pantau perubahan status session ──
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessId}` },
        (payload) => {
          const status = payload.new.status;
          if (status === 'finished' || status === 'completed') {
            router.push(`/player/${roomCode || roomCodeFromParams}/result`);
          } else if (status === 'waiting' || status === 'lobby') {
            router.push(`/player/${roomCode || roomCodeFromParams}/waiting`);
          }
        }
      )
      // ── Pantau flag minigame peserta ──
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'participants', filter: `id=eq.${participantId}` },
        (payload) => {
          // Abaikan jika sedang transisi (menghindari redirect loop)
          if (isTransitioningRef.current) return;
          // Jika minigame = true, pemain harus di halaman game
          if (payload.new.minigame === true && !payload.new.finished_at) {
            router.push(`/player/${roomCode || roomCodeFromParams}/game`);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [router, roomCode, roomCodeFromParams]);

  // ════════════════════════════════════════════════════════════════
  // HOOK: Timer global sinkron server
  // ════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!sessionId) return;

    const fetchAndStartTimer = async () => {
      const { data } = await supabase
        .from('sessions')
        .select('started_at, total_time_minutes')
        .eq('id', sessionId)
        .single();

      if (!data?.started_at) {
        setIsTimerReady(true);
        return;
      }

      const start = new Date(data.started_at).getTime();
      const totalSeconds = (data.total_time_minutes || 5) * 60;

      // Hitung langsung tanpa menunggu interval (menghilangkan flicker)
      const nowFirst = getSyncedServerTime();
      const elapsedFirst = Math.floor((nowFirst - start) / 1000);
      setGlobalTimeLeft(Math.max(0, totalSeconds - elapsedFirst));
      setIsTimerReady(true);

      // Interval update tiap detik
      const interval = setInterval(() => {
        const now = getSyncedServerTime();
        const elapsed = Math.floor((now - start) / 1000);
        const remaining = Math.max(0, totalSeconds - elapsed);
        setGlobalTimeLeft(remaining);

        if (remaining <= 0) {
          clearInterval(interval);
          router.push(`/player/${roomCode || roomCodeFromParams}/result`);
        }
      }, 1000);

      return interval;
    };

    let intervalId: NodeJS.Timeout | undefined;
    fetchAndStartTimer().then(id => { intervalId = id; });
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [sessionId, router, roomCode, roomCodeFromParams]);

  // ════════════════════════════════════════════════════════════════
  // RENDER: Loading & guard
  // ════════════════════════════════════════════════════════════════

  // Layar kosong saat mounting awal atau state belum valid
  if (!mounted || questions.length === 0 || (currentIndex >= questions.length && (currentIndex % QUESTIONS_PER_ROUND !== 0))) {
    return <div className="min-h-screen bg-[#04060f]" />;
  }

  // Layar loading saat data atau timer belum siap
  if (!mounted || questions.length === 0 || !isTimerReady) {
    return <QuizLoading />;
  }

  // ════════════════════════════════════════════════════════════════
  // RENDER: Halaman kuis utama
  // ════════════════════════════════════════════════════════════════

  const currentQ = questions[currentIndex];

  return (
    <div className="min-h-[100dvh] w-full bg-[#07091a] text-white font-rajdhani overflow-hidden relative flex flex-col items-center justify-center p-3 md:p-6">

      {/* ── Efek background ── */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-[#07091a] to-[#050508] pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-[linear-gradient(rgba(45,106,242,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(45,106,242,0.03)_1px,transparent_1px)] bg-[length:35px_35px] pointer-events-none" />

      <div className="w-full max-w-4xl mx-auto relative z-10 flex flex-col items-center">
        {/* ── Panel utama ── */}
        <div className="w-full bg-[#0c1225]/40 backdrop-blur-xl border border-white/5 rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-2xl">

          {/* ── Header: progress, timer, skor ── */}
          <QuizHeader
            currentIndex={currentIndex}
            totalQuestions={questions.length}
            globalTimeLeft={globalTimeLeft}
            score={score}
          />

          {/* ── Konten soal & opsi jawaban ── */}
          <div className="px-5 md:px-12 py-5 md:py-10">

            {/* ── Teks & gambar soal ── */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                className="mb-6 md:mb-10 flex flex-col items-center"
              >
                {/* Gambar soal (klik untuk zoom) */}
                {currentQ.imageUrl && (
                  <div className="!mb-6 flex justify-center">
                    <img
                      src={currentQ.imageUrl}
                      alt="Quiz visual"
                      className="rounded-lg max-h-[120px] md:max-h-[180px] object-contain cursor-pointer shadow-lg hover:scale-105 transition-transform duration-300"
                      onClick={() => setZoomedImage(currentQ.imageUrl || null)}
                    />
                  </div>
                )}
                {/* Teks pertanyaan */}
                <h3 className="text-base md:text-2xl font-black leading-tight text-white text-center text-balance max-w-3xl tracking-tight">
                  {currentQ.question}
                </h3>
              </motion.div>
            </AnimatePresence>

            {/* ── Grid opsi jawaban ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6">
              {currentQ.options.map((option, idx) => (
                <QuizOptionCard
                  key={`${currentIndex}-${idx}`}
                  index={idx}
                  text={option.text}
                  image={option.image}
                  isSelected={selectedOption === idx}
                  isAnswered={isAnswered}
                  animationKey={`${currentIndex}-${idx}`}
                  onSelect={() => handleAnswer(idx)}
                  onImageZoom={(url) => setZoomedImage(url)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal zoom gambar ── */}
      <ImageZoomModal
        imageUrl={zoomedImage}
        onClose={() => setZoomedImage(null)}
      />
    </div>
  );
}
