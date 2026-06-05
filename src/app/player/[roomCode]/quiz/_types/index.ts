/**
 * =====================================================
 * TIPE DATA - Halaman Quiz NitroQuiz
 * =====================================================
 * Berisi seluruh interface dan type yang digunakan
 * di seluruh modul halaman Quiz.
 * =====================================================
 */

/** Representasi satu soal kuis */
export interface QuizQuestion {
    /** ID unik soal */
    id: string;
    /** Teks pertanyaan */
    question: string;
    /** Daftar pilihan jawaban (teks dan opsional gambar) */
    options: { text: string; image?: string }[];
    /** Indeks jawaban benar (opsional, validasi di backend) */
    correctAnswer?: number;
    /** URL gambar pendukung soal */
    imageUrl?: string;
    /** Data dokumen asli (opsional) */
    originalDoc?: any;
}

/** State inisialisasi quiz yang dikembalikan oleh hook useQuizInit */
export interface QuizInitState {
    /** Apakah komponen sudah di-mount */
    mounted: boolean;
    /** Daftar soal yang sudah di-fetch */
    questions: QuizQuestion[];
    /** Indeks soal saat ini */
    currentIndex: number;
    /** Skor pemain saat ini */
    score: number;
    /** ID sesi game aktif */
    sessionId: string | null;
    /** Kode room yang sedang aktif */
    roomCode: string | null;
    /** Setter untuk currentIndex */
    setCurrentIndex: (idx: number) => void;
    /** Setter untuk score */
    setScore: (s: number) => void;
}

/** State navigasi soal yang dikembalikan oleh hook useQuizNavigation */
export interface QuizNavigationState {
    /** Indeks opsi yang dipilih pemain */
    selectedOption: number | null;
    /** Apakah soal sudah dijawab */
    isAnswered: boolean;
    /** Teks status transisi */
    statusText: string;
    /** Handler saat pemain memilih jawaban */
    handleAnswer: (optionIndex: number) => void;
}

/** State timer global yang dikembalikan oleh hook useQuizTimer */
export interface QuizTimerState {
    /** Sisa waktu global dalam detik */
    globalTimeLeft: number | null;
    /** Apakah timer sudah siap (sudah fetch data pertama kali) */
    isTimerReady: boolean;
}
