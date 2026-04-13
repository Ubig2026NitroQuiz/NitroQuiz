/**
 * utils.ts — Fungsi Utilitas Game Engine
 * ═══════════════════════════════════════
 *
 * Kumpulan fungsi matematika murni (pure functions)
 * yang digunakan oleh engine balap pseudo-3D.
 * Semua fungsi stateless — tidak mengakses state komponen.
 */

import type { Point } from './types';

// ════════════════════════════════════════════════════════════════
// KONVERSI TIPE
// ════════════════════════════════════════════════════════════════

/** Konversi aman ke integer */
export function toInt(obj: any, def: number): number {
  if (obj !== null) { const x = parseInt(obj, 10); if (!isNaN(x)) return x; }
  return toInt(def, 0);
}

/** Konversi aman ke float */
export function toFloat(obj: any, def: number): number {
  if (obj !== null) { const x = parseFloat(obj); if (!isNaN(x)) return x; }
  return toFloat(def, 0.0);
}

// ════════════════════════════════════════════════════════════════
// MATEMATIKA UMUM
// ════════════════════════════════════════════════════════════════

/** Pembatas nilai antara min dan max */
export function limit(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

/** Angka random integer inklusif */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Pilih elemen random dari array */
export function randomChoice<T>(options: T[]): T {
  return options[randomInt(0, options.length - 1)];
}

/** Sisa persentase dari modulo */
export function percentRemaining(n: number, total: number): number {
  return (n % total) / total;
}

// ════════════════════════════════════════════════════════════════
// FISIKA
// ════════════════════════════════════════════════════════════════

/** Hitung kecepatan setelah akselerasi */
export function accelerate(v: number, accel: number, dt: number): number {
  return v + (accel * dt);
}

// ════════════════════════════════════════════════════════════════
// INTERPOLASI
// ════════════════════════════════════════════════════════════════

/** Interpolasi linear */
export function interpolate(a: number, b: number, percent: number): number {
  return a + (b - a) * percent;
}

/** Ease-in (kuadratik) */
export function easeIn(a: number, b: number, percent: number): number {
  return a + (b - a) * Math.pow(percent, 2);
}

/** Ease-in-out (kosinus) */
export function easeInOut(a: number, b: number, percent: number): number {
  return a + (b - a) * ((-Math.cos(percent * Math.PI) / 2) + 0.5);
}

// ════════════════════════════════════════════════════════════════
// EFEK VISUAL
// ════════════════════════════════════════════════════════════════

/** Fog eksponensial berdasarkan jarak */
export function exponentialFog(distance: number, density: number): number {
  return 1 / (Math.pow(Math.E, (distance * distance * density)));
}

// ════════════════════════════════════════════════════════════════
// POSISI TRACK (WRAP-AROUND)
// ════════════════════════════════════════════════════════════════

/** Posisi + increment dengan wrapping di batas max */
export function increase(start: number, increment: number, max: number): number {
  let result = start + increment;
  while (result >= max) result -= max;
  while (result < 0) result += max;
  return result;
}

// ════════════════════════════════════════════════════════════════
// PROYEKSI 3D → 2D
// ════════════════════════════════════════════════════════════════

/** Proyeksikan titik dunia ke koordinat layar */
export function project(p: Point, cameraX: number, cameraY: number, cameraZ: number, cameraDepth: number, width: number, height: number, roadWidth: number): void {
  p.camera.x = (p.world.x || 0) - cameraX;
  p.camera.y = (p.world.y || 0) - cameraY;
  p.camera.z = (p.world.z || 0) - cameraZ;
  p.screen.scale = cameraDepth / p.camera.z;
  p.screen.x = Math.round((width / 2) + (p.screen.scale * p.camera.x * width / 2));
  p.screen.y = Math.round((height / 2) - (p.screen.scale * p.camera.y * height / 2));
  p.screen.w = Math.round(p.screen.scale * roadWidth * width / 2);
}

// ════════════════════════════════════════════════════════════════
// DETEKSI TABRAKAN
// ════════════════════════════════════════════════════════════════

/** Cek apakah dua objek horizontal saling overlap */
export function overlap(x1: number, w1: number, x2: number, w2: number, percent: number = 1): boolean {
  const half1 = (percent || 1) * w1 / 2;
  const half2 = (percent || 1) * w2 / 2;
  return !(x1 - half1 > x2 + half2 || x1 + half1 < x2 - half2);
}

// ════════════════════════════════════════════════════════════════
// EXPORT SEBAGAI OBJEK (untuk backward-compat)
// ════════════════════════════════════════════════════════════════

/**
 * Objek Util — wrapper untuk semua fungsi di atas.
 * Digunakan di file page.tsx sebagai `Util.xxx()`.
 */
export const Util = {
  toInt,
  toFloat,
  limit,
  randomInt,
  randomChoice,
  percentRemaining,
  accelerate,
  interpolate,
  easeIn,
  easeInOut,
  exponentialFog,
  increase,
  project,
  overlap,
};
