/**
 * utils.ts — Fungsi Utilitas Lobby
 * ═════════════════════════════════
 *
 * Berisi fungsi-fungsi helper yang digunakan oleh komponen lobby.
 */

/** Daftar warna untuk avatar inisial */
const AVATAR_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#10b981', '#ec4899', '#06b6d4', '#f97316'];

/**
 * Menghasilkan 2 huruf inisial dari nama pengguna.
 * Jika nama memiliki 2+ kata, ambil huruf pertama dari 2 kata pertama.
 * Jika hanya 1 kata, ambil 2 karakter pertama.
 *
 * @param name - Nama pengguna
 * @returns Inisial 2 karakter dalam huruf kapital
 */
export function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/**
 * Menentukan warna avatar berdasarkan hash dari nama.
 * Warna konsisten untuk nama yang sama.
 *
 * @param name - Nama pengguna
 * @returns Kode warna HEX
 */
export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
