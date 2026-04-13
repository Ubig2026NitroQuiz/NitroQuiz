/**
 * types.ts — Tipe Data Leaderboard
 * ═════════════════════════════════
 *
 * Berisi semua tipe data dan interface yang digunakan
 * oleh komponen-komponen halaman leaderboard.
 */

/** Data peserta kuis yang ditampilkan di leaderboard */
export interface Participant {
  id: string;
  nickname: string;
  car_character: string;
  score: number;
  current_question: number;
  finished_at: string | null;
  duration: number;
  joined_at: string;
  avatar_url?: string | null;
}
