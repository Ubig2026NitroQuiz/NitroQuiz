/**
 * =====================================================
 * TIPE DATA HASIL - NitroQuiz Result Page
 * =====================================================
 * File ini berisi semua interface dan tipe data yang
 * digunakan pada halaman hasil permainan NitroQuiz.
 * =====================================================
 */

// --- Tipe Data untuk Peserta ---
/** Representasi satu peserta dalam sesi permainan */
export interface Participant {
  id: string;
  /** Nama panggilan pemain */
  nickname: string;
  /** Karakter mobil yang dipilih (contoh: 'rico', 'gecho', 'roadhog') */
  car_character: string;
  /** Skor akhir pemain */
  score: number;
  /** Jumlah jawaban benar */
  correct: number;
  /** Nomor pertanyaan saat ini (terakhir) */
  current_question: number;
  /** Waktu selesai (ISO string, null jika belum selesai) */
  finished_at: string | null;
  /** Durasi bermain dalam detik */
  duration: number;
  /** Apakah pemain tereliminasi */
  eliminated: boolean;
  /** URL avatar pemain (opsional) */
  avatar_url?: string | null;
  /** ID user terdaftar (opsional, null untuk guest) */
  user_id?: string | null;
}

// --- Tipe Data untuk Tampilan Mobile ---
/** Mode tampilan mobile: halaman hasil atau halaman statistik/leaderboard */
export type MobileViewMode = "result" | "stats";
