/**
 * types.ts — Tipe data untuk halaman Kuis
 * ═══════════════════════════════════════
 *
 * Berisi tipe data dan konstanta yang digunakan
 * oleh halaman kuis (/player/[roomCode]/quiz).
 */

// ════════════════════════════════════════════════════════════════
// TIPE DATA SOAL KUIS (format halaman quiz — berbeda dari game)
// ════════════════════════════════════════════════════════════════

/** Opsi jawaban kuis */
export interface QuizOption {
  text: string;
  image?: string;
}

/**
 * Struktur satu soal kuis untuk halaman quiz.
 * Format ini memiliki options sebagai objek (text + image),
 * berbeda dari format game yang hanya string.
 */
export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  correctAnswer: number;
  imageUrl?: string;
  /** Dokumen asli dari database, digunakan untuk ekstrak answer_id */
  originalDoc?: any;
}

// ════════════════════════════════════════════════════════════════
// KONSTANTA
// ════════════════════════════════════════════════════════════════

/** Jumlah soal per ronde sebelum kembali ke game */
export const QUESTIONS_PER_ROUND = 3;

/** Warna untuk setiap opsi jawaban (A=biru, B=amber, C=merah, D=ungu) */
export const OPTION_COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
