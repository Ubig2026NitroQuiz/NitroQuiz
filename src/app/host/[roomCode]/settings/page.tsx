"use client"

/**
 * page.tsx — Halaman Pengaturan Room (Settings)
 * ══════════════════════════════════════════════
 *
 * Halaman ini memungkinkan host mengkonfigurasi pengaturan room
 * sebelum memulai permainan. Ditampilkan setelah host memilih kuis
 * dan sebelum masuk ke lobby.
 *
 * Pengaturan yang tersedia:
 * 1. Durasi permainan (5-30 menit)
 * 2. Jumlah pertanyaan (tergantung ketersediaan di kuis)
 * 3. Toggle suara (on/off)
 * 4. Tingkat kesulitan (Easy/Normal/Hard)
 *
 * Struktur komponen:
 * ├── SettingsLoading    → Layar loading saat fetch data kuis
 * ├── BackgroundEffects  → Efek visual latar belakang
 * ├── TopBar             → Tombol kembali, logo
 * ├── SettingsForm       → Formulir pengaturan utama
 * └── CancelDialog       → Dialog konfirmasi pembatalan session
 *
 * Alur:
 * 1. Ambil data kuis dari database central berdasarkan ID di localStorage
 * 2. Host mengatur pengaturan sesuai preferensi
 * 3. Saat "Continue" diklik, update session di kedua database
 * 4. Redirect ke lobby (/host/{roomCode}/lobby)
 *
 * Jika host menekan tombol kembali:
 * - Dialog konfirmasi muncul
 * - Session dihapus dari kedua database
 * - Redirect ke halaman pemilihan kuis
 */

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { supabase, supabaseCentral } from "@/lib/supabase"
import { useTranslation } from "react-i18next"

// ── Komponen halaman pengaturan ──
import {
  BackgroundEffects,
  SettingsLoading,
  TopBar,
  SettingsForm,
  CancelDialog,
} from "@/components/settings"
import type { QuizDetail } from "@/components/settings"

// ════════════════════════════════════════════════════════════════
// FUNGSI UTILITAS
// ════════════════════════════════════════════════════════════════

/**
 * Mengacak urutan elemen array menggunakan algoritma Fisher-Yates.
 * Digunakan untuk mengacak urutan soal sebelum dikirim ke session.
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// ════════════════════════════════════════════════════════════════
// Komponen Utama: SettingsPage
// ════════════════════════════════════════════════════════════════
export default function SettingsPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const params = useParams()
  const searchParams = useSearchParams()

  /** Kode room dari URL parameter */
  const roomCode = Array.isArray(params.roomCode) ? params.roomCode[0] : params.roomCode;

  // ── State data kuis ──
  const [quizId, setQuizId] = useState<string | null>(null)       // ID kuis yang dipilih
  const [quizDetail, setQuizDetail] = useState<QuizDetail | null>(null) // Detail kuis dari database

  // ── State pengaturan ──
  const [duration, setDuration] = useState("300")                  // Durasi dalam detik (default: 5 menit)
  const [questionCount, setQuestionCount] = useState("5")          // Jumlah pertanyaan
  const [selectedDifficulty, setSelectedDifficulty] = useState("easy") // Tingkat kesulitan
  const [isMuted, setIsMuted] = useState(true)                    // Status mute audio

  // ── State proses ──
  const [saving, setSaving] = useState(false)                      // Sedang menyimpan pengaturan
  const [showCancelDialog, setShowCancelDialog] = useState(false)  // Tampilkan dialog pembatalan
  const [isDeleting, setIsDeleting] = useState(false)              // Sedang menghapus session

  // ── Referensi audio ──
  const audioRef = useRef<HTMLAudioElement>(null)

  // ════════════════════════════════════════════════════════════════
  // DATA TURUNAN (Derived State)
  // ════════════════════════════════════════════════════════════════

  /**
   * Menghitung opsi jumlah pertanyaan yang valid.
   * Hanya menampilkan opsi yang tidak melebihi total soal yang tersedia.
   * Contoh: jika kuis punya 8 soal, opsi yang tersedia: [5]
   */
  const questionCountOptions = useMemo(() => {
    const totalQuestions = quizDetail?.totalQuestions || 0
    if (totalQuestions === 0) return [5]
    const baseOptions = [5, 10, 20]
    const validOptions = baseOptions.filter((count) => count <= totalQuestions)
    return validOptions.length > 0 ? validOptions : [totalQuestions]
  }, [quizDetail])

  // ════════════════════════════════════════════════════════════════
  // HOOKS & SIDE EFFECTS
  // ════════════════════════════════════════════════════════════════

  /**
   * Hook: Mengambil data kuis dari database central.
   * ID kuis diambil dari localStorage yang disimpan di halaman select-quiz.
   */
  useEffect(() => {
    const fetchQuizFromCentral = async () => {
      const storedQuizId = localStorage.getItem("currentQuizId")
      if (!storedQuizId) {
        console.error("No quiz ID found in storage")
        router.push('/host/select-quiz')
        return
      }
      setQuizId(storedQuizId)

      try {
        const { data, error } = await supabaseCentral
          .from('quizzes')
          .select('*')
          .eq('id', storedQuizId)
          .single()

        if (error) {
          console.error("Failed to load quiz metadata", error)
          return
        }

        if (data) {
          // Parse questions (bisa berupa string JSON atau array)
          let qs = data.questions || []
          if (typeof qs === 'string') {
            try { qs = JSON.parse(qs) } catch (e) { }
          }

          setQuizDetail({
            title: data.title || "Untitled Quiz",
            description: data.description || "No description provided.",
            totalQuestions: qs.length,
            questions: qs,
          })
        }
      } catch (err) {
        console.error("Error fetching quiz from central:", err)
      }
    }

    fetchQuizFromCentral()
  }, [router])

  /**
   * Hook: Mengontrol pemutaran audio berdasarkan status mute.
   */
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = 0.5
    if (isMuted) {
      audio.pause()
    } else {
      audio.play().catch(() => console.warn("Audio play blocked"))
    }
  }, [isMuted])

  /**
   * Hook: Mengatur jumlah pertanyaan default saat data kuis dimuat.
   * Prioritas: 5 soal → opsi pertama yang tersedia → total soal.
   */
  useEffect(() => {
    if (!quizDetail) return
    if (quizDetail.totalQuestions > 0) {
      if (questionCountOptions.includes(5)) {
        setQuestionCount("5")
      } else if (questionCountOptions.length > 0) {
        setQuestionCount(questionCountOptions[0].toString())
      } else {
        setQuestionCount(quizDetail.totalQuestions.toString())
      }
    }
  }, [quizDetail, questionCountOptions])

  // ════════════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ════════════════════════════════════════════════════════════════

  /**
   * Menyimpan pengaturan dan memulai room.
   * 1. Acak soal dan potong sesuai limit
   * 2. Update session di database game (NitroQuiz)
   * 3. Update session di database central (platform)
   * 4. Simpan pengaturan ke localStorage
   * 5. Redirect ke lobby
   */
  const handleCreateRoom = async () => {
    if (saving || !quizDetail || !quizId) return
    setSaving(true)

    try {
      const limit = parseInt(questionCount)
      const selectedQuestions = shuffleArray(quizDetail.questions).slice(0, limit)

      const sessionPayload = {
        status: 'waiting',
        question_limit: limit,
        total_time_minutes: parseInt(duration) / 60,
        difficulty: selectedDifficulty,
        current_questions: selectedQuestions,
      }

      console.log("[handleCreateRoom] Updating session payloads for pin:", roomCode)

      // Update di database game lokal
      const { data: sessionData, error } = await supabase
        .from('sessions')
        .update(sessionPayload)
        .eq('game_pin', roomCode)
        .select()
        .single()

      // Update di database platform central secara paralel
      const { error: mainError } = await supabaseCentral
        .from('game_sessions')
        .update(sessionPayload)
        .eq('game_pin', roomCode)

      if (error || mainError) {
        console.error("Error updating session:", { error, mainError })
        setSaving(false)
        return
      }

      if (!sessionData) {
        console.error("Session updated but no data returned.")
        setSaving(false)
        return
      }

      console.log("[handleCreateRoom] Session updated successfully:", sessionData.id)

      // Simpan pengaturan ke localStorage untuk akses cepat di lobby
      const settings = {
        sessionId: sessionData.id,
        gamePin: roomCode,
        quizId: quizId,
        quizTitle: quizDetail.title,
        totalTimeMinutes: parseInt(duration) / 60,
        questionLimit: limit,
        difficulty: selectedDifficulty,
        questions: selectedQuestions,
        status: 'waiting',
        players: [],
      }
      localStorage.setItem(`session_${roomCode}`, JSON.stringify(settings))
      localStorage.setItem("hostroomCode", roomCode as string)
      localStorage.setItem("settings_muted", isMuted.toString())

      // Redirect ke lobby
      router.push(`/host/${roomCode}/lobby`)
    } catch (err) {
      console.error("Unexpected error updating session:", err)
      setSaving(false)
    }
  }

  /**
   * Membatalkan session dan menghapusnya dari kedua database.
   * Redirect ke halaman pemilihan kuis setelah selesai.
   */
  const handleCancelSession = async () => {
    setIsDeleting(true)
    try {
      // Hapus dari kedua database secara paralel
      await Promise.allSettled([
        supabaseCentral.from('game_sessions').delete().eq('game_pin', roomCode),
        supabase.from('sessions').delete().eq('game_pin', roomCode),
      ])
      localStorage.removeItem(`session_${roomCode}`)
      router.push('/host/select-quiz')
    } catch (err) {
      console.error("Error deleting session:", err)
      router.push('/host/select-quiz')
    }
  }

  // ════════════════════════════════════════════════════════════════
  // KONDISI LOADING
  // ════════════════════════════════════════════════════════════════

  if (!quizDetail) {
    return <SettingsLoading />
  }

  // ════════════════════════════════════════════════════════════════
  // RENDER UTAMA
  // ════════════════════════════════════════════════════════════════

  return (
    <div className="h-screen bg-[#04060f] relative overflow-hidden font-body selection:bg-[#2d6af2] selection:text-white">
      {/* ── Efek visual latar belakang ── */}
      <BackgroundEffects />

      {/* ── Elemen audio tersembunyi ── */}
      <div className="hidden"><audio ref={audioRef} loop /></div>

      {/* ── Konten utama ── */}
      <div className="absolute inset-0 overflow-y-auto z-10 flex flex-col">
        {/* ── Bar atas: tombol kembali & logo ── */}
        <TopBar onBack={() => setShowCancelDialog(true)} />

        {/* ── Area formulir pengaturan (di tengah layar) ── */}
        <div className="relative container mx-auto px-4 sm:px-6 pb-6 max-w-3xl flex-1 flex flex-col justify-center py-4">
          {/* ── Formulir pengaturan ── */}
          <SettingsForm
            quizTitle={quizDetail.title}
            duration={duration}
            onDurationChange={setDuration}
            questionCount={questionCount}
            onQuestionCountChange={setQuestionCount}
            questionCountOptions={questionCountOptions}
            selectedDifficulty={selectedDifficulty}
            onDifficultyChange={setSelectedDifficulty}
            isMuted={isMuted}
            onMuteToggle={setIsMuted}
            isSaving={saving}
            onSubmit={handleCreateRoom}
          />

          {/* ── Dialog konfirmasi pembatalan ── */}
          <CancelDialog
            isOpen={showCancelDialog}
            onClose={() => setShowCancelDialog(false)}
            onConfirm={handleCancelSession}
            isDeleting={isDeleting}
          />
        </div>
      </div>
    </div>
  )
}
