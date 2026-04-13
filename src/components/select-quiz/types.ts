/**
 * types.ts — Tipe Data Select Quiz
 * ═════════════════════════════════
 *
 * Berisi tipe data dan interface yang digunakan
 * oleh komponen-komponen halaman pemilihan kuis.
 */

/** Data kuis yang ditampilkan di kartu dan grid */
export interface QuizView {
  id: string;
  title: string;
  category: string;
  questionCount: number;
  description: string;
  imageUrl?: string;
  played?: number;
  creatorId?: string;
  isPublic: boolean;
}

/** Skema warna untuk setiap kategori kuis */
export interface CategoryColors {
  bar: string;          // Warna garis aksen di atas kartu
  badge: string;        // Warna latar badge kategori
  badgeBorder: string;  // Warna border badge kategori
  badgeText: string;    // Warna teks badge kategori
  hoverBorder: string;  // Warna border kartu saat hover
}

/** Tipe tab yang tersedia di halaman pemilihan kuis */
export type QuizTab = 'all' | 'favorites' | 'myquiz';
