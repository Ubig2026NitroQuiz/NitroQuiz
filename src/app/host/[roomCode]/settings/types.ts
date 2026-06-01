/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TIPE DATA HALAMAN PENGATURAN GAME
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * File ini berisi semua definisi tipe/interface yang digunakan
 * pada halaman pengaturan game (Settings Page).
 */

/** Detail quiz yang sedang dipilih untuk dimainkan */
export interface QuizDetail {
    title: string;
    description: string;
    totalQuestions: number;
    questions: any[];
    category?: string;
}

/** Tingkat kesulitan yang tersedia */
export type Difficulty = 'easy' | 'normal' | 'hard';

/** Konfigurasi visual untuk setiap tingkat kesulitan */
export interface DifficultyConfig {
    label: string;       // Label tampilan (Easy, Normal, Hard)
    main: string;        // Warna utama
    bg: string;          // Kelas CSS latar belakang aktif
    border: string;      // Kelas CSS border aktif
    glow: string;        // Kelas CSS efek glow aktif
}

/** Peta konfigurasi kesulitan */
export const DIFFICULTY_CONFIG: Record<string, DifficultyConfig> = {
    Easy: {
        label: 'Easy',
        main: '#00ff9d',
        bg: 'bg-[#00ff9d]/20',
        border: 'border-[#00ff9d]',
        glow: 'shadow-[0_0_15px_rgba(0,255,157,0.4)]',
    },
    Normal: {
        label: 'Normal',
        main: '#f59e0b',
        bg: 'bg-amber-500/20',
        border: 'border-amber-500',
        glow: 'shadow-[0_0_15px_rgba(245,158,11,0.4)]',
    },
    Hard: {
        label: 'Hard',
        main: '#ef4444',
        bg: 'bg-red-500/20',
        border: 'border-red-500',
        glow: 'shadow-[0_0_15px_rgba(239,68,68,0.4)]',
    },
};
