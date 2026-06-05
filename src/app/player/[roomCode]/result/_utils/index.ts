/**
 * =====================================================
 * FUNGSI UTILITAS - NitroQuiz Result Page
 * =====================================================
 * File ini berisi fungsi-fungsi pembantu (utility) yang
 * digunakan di berbagai komponen halaman hasil.
 * =====================================================
 */

import { AVATAR_COLORS, CAR_IMAGE_MAP } from '../_constants';
import type { Participant } from '../_types';

// ==========================================
// Fungsi Utilitas Avatar
// ==========================================

/**
 * Menghasilkan inisial dari sebuah nama.
 * - Jika nama memiliki 2+ kata, ambil huruf pertama dari 2 kata pertama.
 * - Jika nama hanya 1 kata, ambil 2 huruf pertama.
 * - Jika kosong, kembalikan '?'.
 *
 * @param name - Nama lengkap pemain
 * @returns Inisial (2 karakter huruf besar)
 */
export const getInitials = (name: string): string => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

/**
 * Menentukan warna avatar berdasarkan hash dari nama pemain.
 * Menggunakan algoritma hash sederhana untuk menghasilkan indeks warna
 * yang konsisten untuk nama yang sama.
 *
 * @param name - Nama pemain
 * @returns Kode warna hex (contoh: '#3b82f6')
 */
export const getAvatarColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// ==========================================
// Fungsi Utilitas Peringkat
// ==========================================

/**
 * Mengembalikan sufiks ordinal bahasa Inggris untuk peringkat.
 * Contoh: 1 → "st", 2 → "nd", 3 → "rd", 4+ → "th"
 *
 * @param rank - Nomor peringkat (1-based)
 * @returns Sufiks ordinal
 */
export const getRankSuffix = (rank: number): string => {
  if (rank === 1) return "st";
  if (rank === 2) return "nd";
  if (rank === 3) return "rd";
  return "th";
};

// ==========================================
// Fungsi Utilitas Waktu
// ==========================================

/**
 * Memformat durasi dalam detik menjadi format MM:SS.
 * Jika durasi null/undefined/Infinity, kembalikan "--:--".
 *
 * @param seconds - Durasi dalam detik
 * @returns String format "MM:SS" atau "--:--"
 */
export const formatDuration = (seconds: number | undefined | null): string => {
  if (!seconds || seconds === Infinity) return "--:--";
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

// ==========================================
// Fungsi Utilitas Karakter
// ==========================================

/**
 * Mendapatkan URL gambar mobil untuk pemain berdasarkan data karakter.
 * Menghapus sufiks "-bot" karena bot menggunakan aset karakter yang sama.
 *
 * @param playerData - Data peserta (atau null jika tidak ditemukan)
 * @returns URL path ke gambar showroom karakter
 */
export const getCarImageSrc = (playerData: Participant | undefined): string => {
  if (!playerData) return CAR_IMAGE_MAP["purple"];
  const base = (playerData.car_character || "purple").replace("-bot", "");
  return CAR_IMAGE_MAP[base] || CAR_IMAGE_MAP["purple"];
};

// ==========================================
// Fungsi Utilitas Nama Tampilan
// ==========================================

/**
 * Mendapatkan nama tampilan terbaik untuk seorang peserta.
 * Prioritas: nickname → fullname profil → username profil → email → fallback.
 *
 * @param participant - Data peserta
 * @param profile - Profil pengguna (dari AuthContext)
 * @param userEmail - Email pengguna (dari AuthContext)
 * @param fallback - Teks fallback jika semua opsi kosong
 * @returns Nama yang paling sesuai untuk ditampilkan
 */
export const getDisplayName = (
  participant: Participant,
  profile: { fullname?: string; username?: string } | null,
  userEmail: string | undefined,
  fallback: string,
): string => {
  if (participant.nickname) return participant.nickname;
  if (profile?.fullname) return profile.fullname;
  if (profile?.username) return profile.username;
  return userEmail || fallback;
};

// ==========================================
// Fungsi Utilitas Identifikasi Pemain
// ==========================================

/**
 * Mengecek apakah peserta tertentu adalah pemain saat ini.
 * Pencocokan dilakukan berurutan:
 * 1. Cocokkan berdasarkan user_id (pemain yang login)
 * 2. Cocokkan berdasarkan participantId dari localStorage
 * 3. Fallback ke nickname jika tidak ada opsi lain
 *
 * @param participant - Data peserta yang dicek
 * @param userId - ID user yang login (dari AuthContext)
 * @param storedParticipantId - ID peserta dari localStorage
 * @param profileUsername - Username profil pengguna
 * @returns true jika peserta adalah pemain saat ini
 */
export const isCurrentPlayer = (
  participant: Participant,
  userId: string | undefined,
  storedParticipantId: string | null,
  profileUsername: string | undefined,
): boolean => {
  // 1. Cocokkan berdasarkan user_id jika pemain login
  if (userId && participant.user_id === userId) return true;
  // 2. Cocokkan berdasarkan participantId tersimpan di localStorage
  if (storedParticipantId && participant.id === storedParticipantId) return true;
  // 3. Fallback ke nickname untuk kasus ekstrem
  if (!userId && !storedParticipantId && participant.nickname === profileUsername) return true;
  return false;
};

/**
 * Mengurutkan peserta berdasarkan skor (tertinggi dulu).
 * Jika skor sama, yang lebih cepat (durasi lebih kecil) mendapat peringkat lebih tinggi.
 *
 * @param participants - Daftar peserta
 * @returns Daftar peserta yang sudah diurutkan
 */
export const rankPlayers = (participants: Participant[]): Participant[] => {
  return [...participants].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const dA = a.duration || Infinity;
    const dB = b.duration || Infinity;
    return dA - dB;
  });
};

/**
 * Mengecek apakah semua pemain sudah selesai bermain.
 * Kondisi: sesi sudah selesai ATAU semua peserta sudah menyelesaikan/tereliminasi.
 *
 * @param sessionStatus - Status sesi dari database
 * @param participants - Daftar peserta
 * @returns true jika semua pemain sudah selesai
 */
export const checkAllFinished = (
  sessionStatus: string | null,
  participants: Participant[],
): boolean => {
  return (
    sessionStatus === "completed" ||
    sessionStatus === "finished" ||
    (participants.length > 0 &&
      participants.every((p) => p.finished_at || p.eliminated))
  );
};
