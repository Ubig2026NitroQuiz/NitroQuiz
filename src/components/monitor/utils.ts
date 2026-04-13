/**
 * utils.ts — Fungsi Utilitas Monitor
 * ═══════════════════════════════════
 *
 * Berisi fungsi-fungsi helper yang digunakan oleh komponen monitor.
 */

/** Daftar warna untuk avatar inisial */
const AVATAR_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#10b981', '#ec4899', '#06b6d4', '#f97316'];

/**
 * Menghasilkan 2 huruf inisial dari nama pemain.
 */
export function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/**
 * Menentukan warna avatar berdasarkan hash dari nama.
 */
export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * Format detik menjadi MM:SS.
 * Contoh: 125 → "02:05"
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/** Warna rank berdasarkan posisi (0-indexed) */
export const RANK_COLORS: Record<number, string> = {
  0: "#f59e0b",         // Emas (posisi 1)
  1: "#94a3b8",         // Perak (posisi 2)
  2: "#b45309",         // Perunggu (posisi 3)
};

/** Warna default jika posisi > 3 */
export const DEFAULT_RANK_COLOR = "rgba(255,255,255,0.15)";
