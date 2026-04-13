/**
 * types.ts — Tipe data untuk Game Canvas
 * ═══════════════════════════════════════
 *
 * Berisi semua interface dan tipe data yang digunakan
 * oleh halaman game (pseudo-3D racing engine).
 */

// ════════════════════════════════════════════════════════════════
// TIPE DATA SOAL KUIS
// ════════════════════════════════════════════════════════════════

/** Struktur satu soal kuis */
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  image?: string;
}

// ════════════════════════════════════════════════════════════════
// TIPE DATA ENGINE BALAP
// ════════════════════════════════════════════════════════════════

/** Titik di dunia 3D dengan proyeksi ke layar */
export interface Point {
  world: { x: number; y: number; z: number };
  camera: { x: number; y: number; z: number };
  screen: { scale: number; x: number; y: number; w: number };
}

/** Sprite (gambar) yang ditempatkan di sisi jalan */
export interface Sprite {
  source: any;
  offset: number;
  offsetY?: number;
}

/** Kendaraan NPC, rival, atau obstacle di jalan */
export interface Car {
  offset: number;
  z: number;
  sprite: any;
  speed: number;
  percent: number;
  isRival?: boolean;
  type?: 'jne' | 'truck' | 'odong' | 'taxi';
  animTimer?: number;
  animFrame?: number;
}

/** Segmen jalan — unit dasar track balap */
export interface Segment {
  index: number;
  p1: Point;
  p2: Point;
  color: { road: string; grass: string; rumble: string; strip: string };
  curve: number;
  fog: number;
  clip: number;
  looped: boolean;
  sprites: Sprite[];
  cars: Car[];
  zebra?: boolean;
}

/** Status game */
export type GameState = 'preparation' | 'playing' | 'finished' | 'gameover';

/** Pilihan orientasi mobile */
export type MobileOrientation = 'portrait' | 'landscape' | null;

/** Mode kamera */
export type ViewMode = 'first' | 'third';
