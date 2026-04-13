/**
 * types.ts — Tipe Data Settings
 * ══════════════════════════════
 *
 * Berisi tipe data yang digunakan oleh komponen-komponen
 * halaman pengaturan room kuis.
 */

/** Detail kuis yang dipilih untuk dimainkan */
export interface QuizDetail {
  title: string;
  description: string;
  totalQuestions: number;
  questions: any[];
}
