/**
 * utils.ts — Fungsi Utilitas Leaderboard
 * ═══════════════════════════════════════
 *
 * Berisi fungsi-fungsi helper yang digunakan
 * di berbagai komponen leaderboard.
 */

import { AVATAR_COLORS } from "./constants";
import { Participant } from "./types";

// ════════════════════════════════════════════════════════════════
// FUNGSI AVATAR
// ════════════════════════════════════════════════════════════════

/**
 * Menghasilkan inisial dari nama pengguna.
 * - Jika nama terdiri dari 2+ kata → ambil huruf pertama dari 2 kata pertama
 * - Jika nama hanya 1 kata → ambil 2 huruf pertama
 * - Jika nama kosong → tampilkan "?"
 *
 * @param name - Nama pengguna
 * @returns Inisial dalam huruf kapital (contoh: "AB" atau "AN")
 */
export const getInitials = (name: string): string => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

/**
 * Menghitung warna avatar berdasarkan hash dari nama.
 * Menghasilkan warna yang konsisten untuk setiap nama yang sama.
 *
 * @param name - Nama pengguna
 * @returns Kode warna hex (contoh: "#3b82f6")
 */
export const getAvatarColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// ════════════════════════════════════════════════════════════════
// FUNGSI FORMAT
// ════════════════════════════════════════════════════════════════

/**
 * Memformat durasi (detik) menjadi format MM:SS.
 * Digunakan untuk menampilkan waktu penyelesaian kuis.
 *
 * @param seconds - Durasi dalam detik
 * @returns String format "MM:SS" (contoh: "02:45") atau "--:--" jika tidak valid
 */
export const formatDuration = (seconds: number | undefined | null): string => {
  if (!seconds || seconds === Infinity) return "--:--";
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

// ════════════════════════════════════════════════════════════════
// FUNGSI ARRAY
// ════════════════════════════════════════════════════════════════

/**
 * Mengacak urutan elemen dalam array menggunakan algoritma Fisher-Yates.
 * Mengembalikan array baru tanpa mengubah array asli.
 *
 * @param array - Array yang akan diacak
 * @returns Array baru dengan urutan acak
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ════════════════════════════════════════════════════════════════
// FUNGSI RANKING
// ════════════════════════════════════════════════════════════════

/**
 * Mengurutkan peserta berdasarkan peringkat dengan kriteria:
 * 1. Skor tertinggi di atas
 * 2. Jika skor sama → durasi tercepat lebih tinggi
 * 3. Jika durasi sama → yang bergabung lebih awal lebih tinggi
 * 4. Fallback → berdasarkan ID
 *
 * @param participants - Array peserta yang akan diurutkan
 * @returns Array peserta yang sudah diurutkan berdasarkan peringkat
 */
export function rankParticipants(participants: Participant[]): Participant[] {
  return [...participants].sort((a, b) => {
    // 1. Skor lebih tinggi di atas
    if (b.score !== a.score) return b.score - a.score;

    // 2. Durasi lebih cepat (lebih kecil) di atas
    const durA = a.duration || 999999;
    const durB = b.duration || 999999;
    if (durA !== durB) return durA - durB;

    // 3. Bergabung lebih awal (waktu lebih kecil) di atas
    const joinA = new Date(a.joined_at).getTime();
    const joinB = new Date(b.joined_at).getTime();
    if (joinA !== joinB) return joinA - joinB;

    // 4. Fallback: berdasarkan ID
    return a.id.localeCompare(b.id);
  });
}
