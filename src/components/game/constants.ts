/**
 * constants.ts — Konstanta Game Engine
 * ═════════════════════════════════════
 *
 * Berisi semua nilai numerik tetap yang digunakan
 * oleh engine balap pseudo-3D.
 */

// ════════════════════════════════════════════════════════════════
// FRAMERATE & WAKTU
// ════════════════════════════════════════════════════════════════

/** Target frame per detik */
export const FPS = 60;

/** Interval waktu per frame (detik) */
export const STEP = 1 / FPS;

// ════════════════════════════════════════════════════════════════
// PARAMETER JALAN / TRACK
// ════════════════════════════════════════════════════════════════

/** Lebar jalan (satuan dunia) */
export const ROAD_WIDTH = 2000;

/** Panjang satu segmen jalan */
export const SEGMENT_LENGTH = 200;

/** Jumlah segmen per rumble strip */
export const RUMBLE_LENGTH = 3;

/** Jumlah jalur (lane) */
export const LANES = 4;

/** Jarak render maksimum (jumlah segmen ke depan) */
export const DRAW_DISTANCE = 300;

// ════════════════════════════════════════════════════════════════
// PARAMETER KECEPATAN & FISIKA
// ════════════════════════════════════════════════════════════════

/** Kecepatan maksimum */
export const MAX_SPEED = SEGMENT_LENGTH / STEP;

/** Akselerasi normal */
export const ACCEL = MAX_SPEED / 5;

/** Kekuatan pengereman (lebih kuat untuk mobile) */
export const BREAKING = -MAX_SPEED * 2.5;

/** Deselerasi saat idle (tidak gas/rem) */
export const DECEL = -MAX_SPEED / 5;

/** Deselerasi saat di luar jalan */
export const OFF_ROAD_DECEL = -MAX_SPEED / 2;

/** Batas kecepatan di luar jalan */
export const OFF_ROAD_LIMIT = MAX_SPEED / 4;

// ════════════════════════════════════════════════════════════════
// JUMLAH SOAL PER RONDE
// ════════════════════════════════════════════════════════════════

/** Berapa soal ditampilkan per "lap" */
export const QUESTIONS_PER_ROUND = 3;

// ════════════════════════════════════════════════════════════════
// WARNA TRACK
// ════════════════════════════════════════════════════════════════

export const COLORS = {
  /** Warna langit malam */
  SKY: '#020617',
  TREE: '#064e3b',
  FOG: '#020617',
  /** Palet segmen ganjil */
  LIGHT: { road: '#0a0d14', grass: '#1e293b', rumble: '#111827', strip: '#fbbf24', sidewalk: '#334155', curb: '#475569' },
  /** Palet segmen genap */
  DARK: { road: '#05070a', grass: '#0f172a', rumble: '#0d1117', strip: '', sidewalk: '#1e293b', curb: '#334155' },
  /** Palet garis start */
  START: { road: '#ffffff', grass: '#334155', rumble: '#ffffff', strip: '', sidewalk: '#ffffff', curb: '#ffffff' },
  /** Palet garis finish */
  FINISH: { road: '#000000', grass: '#111827', rumble: '#000000', strip: '', sidewalk: '#000000', curb: '#000000' },
};

// ════════════════════════════════════════════════════════════════
// KONFIGURASI BENTUK JALAN (digunakan oleh road builder)
// ════════════════════════════════════════════════════════════════

export const ROAD_CONF = {
  LENGTH: { NONE: 0, SHORT: 25, MEDIUM: 50, LONG: 100 },
  HILL: { NONE: 0, LOW: 20, MEDIUM: 40, HIGH: 60 },
  CURVE: { NONE: 0, EASY: 2, MEDIUM: 4, HARD: 6 },
};

// ════════════════════════════════════════════════════════════════
// KONFIGURASI KESULITAN
// ════════════════════════════════════════════════════════════════

/** Parameter game berdasarkan tingkat kesulitan */
export interface DifficultyConfig {
  fieldOfView: number;
  cameraHeight: number;
  fogDensity: number;
  npcCount: number;
  obstacleCount: number;
  trackType: 'simple' | 'complex';
}

/**
 * Mengembalikan konfigurasi game berdasarkan kesulitan.
 *
 * - easy   : Track lurus, tanpa obstacle, kamera standar
 * - normal : Track berkelok + S-curve + bumps, ada obstacle
 * - hard   : Kamera tinggi (drone view), banyak NPC & obstacle
 */
export function getDifficultyConfig(difficulty: string): DifficultyConfig {
  if (difficulty === 'hard') {
    return { fieldOfView: 85, cameraHeight: 1000, fogDensity: 3, npcCount: 30, obstacleCount: 25, trackType: 'complex' };
  } else if (difficulty === 'normal' || difficulty === 'medium') {
    return { fieldOfView: 100, cameraHeight: 500, fogDensity: 5, npcCount: 20, obstacleCount: 25, trackType: 'complex' };
  } else {
    return { fieldOfView: 100, cameraHeight: 500, fogDensity: 5, npcCount: 20, obstacleCount: 0, trackType: 'simple' };
  }
}
