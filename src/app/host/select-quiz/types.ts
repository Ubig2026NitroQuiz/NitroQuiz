/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TIPE DATA HALAMAN PILIH QUIZ
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * File ini berisi semua definisi tipe/interface yang digunakan
 * pada halaman pemilihan quiz (Select Quiz).
 */

/** Representasi quiz yang ditampilkan di daftar/grid */
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

/** Props untuk komponen utama SelectQuizClient */
export interface SelectQuizClientProps {
    /** Data awal yang sudah di-fetch di server (halaman 1, tanpa filter) */
    initialQuizzes: QuizView[];
    /** Jumlah total quiz yang tersedia */
    initialTotalCount: number;
    /** Daftar kategori yang tersedia */
    initialCategories: string[];
    /** Profile ID dari server (untuk personalisasi tanpa menunggu client auth) */
    serverProfileId: string | null;
}

/** Tipe tab navigasi yang tersedia */
export type QuizTab = 'all' | 'favorites' | 'myquiz';
