/**
 * =====================================================
 * KONSTANTA GAME - NitroQuiz Racing Game
 * =====================================================
 * File ini berisi semua konstanta yang digunakan dalam
 * game racing, termasuk konfigurasi fisika, visual,
 * dan tingkat kesulitan.
 * =====================================================
 */

import type { DifficultyConfig } from '../_types';

// ==========================================
// Konstanta Performa & Frame Rate
// ==========================================
/** Frame per detik target */
export const FPS = 60;
/** Interval waktu per frame (dalam detik) */
export const STEP = 1 / FPS;

// ==========================================
// Konstanta Jalan & Track
// ==========================================
/** Lebar jalan dalam satuan game */
export const ROAD_WIDTH = 2000;
/** Panjang setiap segmen jalan */
export const SEGMENT_LENGTH = 200;
/** Panjang area rumble strip (garis peringatan tepi jalan) */
export const RUMBLE_LENGTH = 3;
/** Jumlah lajur jalan */
export const LANES = 4;
/** Jarak pandang maksimum (jumlah segmen yang dirender) */
export const DRAW_DISTANCE = 300;

// ==========================================
// Konstanta Fisika Kendaraan
// ==========================================
/** Kecepatan maksimum kendaraan */
export const MAX_SPEED = SEGMENT_LENGTH / STEP;
/** Akselerasi normal (gas) */
export const ACCEL = MAX_SPEED / 5;
/** Kekuatan pengereman (lebih kuat untuk mobile) */
export const BREAKING = -MAX_SPEED * 2.5;
/** Perlambatan alami (deselerasi saat idle) */
export const DECEL = -MAX_SPEED / 5;
/** Perlambatan saat di luar jalan */
export const OFF_ROAD_DECEL = -MAX_SPEED / 2;
/** Batas kecepatan maksimum saat di luar jalan */
export const OFF_ROAD_LIMIT = MAX_SPEED / 4;

// ==========================================
// Jumlah pertanyaan per ronde kuis
// ==========================================
export const QUESTIONS_PER_ROUND = 3;

// ==========================================
// Konfigurasi Panjang, Ketinggian, dan Tikungan Jalan
// ==========================================
export const ROAD_CONF = {
    LENGTH: { NONE: 0, SHORT: 25, MEDIUM: 50, LONG: 100 },
    HILL: { NONE: 0, LOW: 20, MEDIUM: 40, HIGH: 60 },
    CURVE: { NONE: 0, EASY: 2, MEDIUM: 4, HARD: 6 }
};

// ==========================================
// Warna Tema Game (Dark/Midnight Theme)
// ==========================================
export const COLORS = {
    /** Warna langit (biru gelap tengah malam) */
    SKY: '#020617',
    /** Warna pohon */
    TREE: '#064e3b',
    /** Warna kabut */
    FOG: '#020617',
    /** Warna segmen terang (ganjil) */
    LIGHT: { road: '#0a0d14', grass: '#1e293b', rumble: '#111827', strip: '#fbbf24', sidewalk: '#334155', curb: '#475569' },
    /** Warna segmen gelap (genap) */
    DARK: { road: '#0a0d14', grass: '#1e293b', rumble: '#111827', strip: '', sidewalk: '#334155', curb: '#475569' },
    /** Warna garis start */
    START: { road: '#ffffff', grass: '#334155', rumble: '#ffffff', strip: '', sidewalk: '#ffffff', curb: '#ffffff' },
    /** Warna garis finish */
    FINISH: { road: '#000000', grass: '#111827', rumble: '#000000', strip: '', sidewalk: '#000000', curb: '#000000' }
};

// ==========================================
// Fungsi Konfigurasi Kesulitan
// ==========================================
/**
 * Mengembalikan konfigurasi berdasarkan tingkat kesulitan.
 * Setiap kesulitan memiliki jumlah NPC, obstacle, dan tipe track yang berbeda.
 *
 * @param difficulty - Tingkat kesulitan ('easy' | 'normal' | 'medium' | 'hard')
 * @returns Konfigurasi kesulitan
 */
export function getDifficultyConfig(difficulty: string): DifficultyConfig {
    if (difficulty === 'hard') {
        // Hard: lebih banyak NPC, semua obstacle, track unik lebih panjang
        return {
            fieldOfView: 100,
            cameraHeight: 500,
            fogDensity: 3,
            npcCount: 40,
            obstacleCount: 35,
            trackType: 'hard',
        };
    } else if (difficulty === 'normal' || difficulty === 'medium') {
        // Normal/Medium: kamera standar, track berkelok, ada obstacle
        return {
            fieldOfView: 100,
            cameraHeight: 500,
            fogDensity: 5,
            npcCount: 30,
            obstacleCount: 20,
            trackType: 'complex',
        };
    } else {
        // Easy: semuanya standar, track sederhana, tanpa obstacle
        return {
            fieldOfView: 100,
            cameraHeight: 500,
            fogDensity: 5,
            npcCount: 20,
            obstacleCount: 0,
            trackType: 'simple',
        };
    }
}
