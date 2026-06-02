/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TIPE DATA: Host Monitor
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Definisi tipe-tipe data yang digunakan di seluruh modul halaman monitor.
 * Memisahkan tipe dari logika untuk mempermudah maintenance dan type-safety.
 */

// ── Tipe Peserta / Partisipan ──
export interface Participant {
  id: string;
  session_id: string;
  nickname: string;
  car_character: string;
  score: number;
  current_question: number;
  finished_at: string | null;
  eliminated: boolean;
  minigame?: boolean;
  user_id?: string | null;
  avatar_url?: string | null;
  lap_race?: number;
}

// ── Tipe Data Sesi (subset yang digunakan monitor) ──
export interface MonitorSession {
  id: string;
  question_limit: number;
  total_time_minutes: number;
  started_at: string | null;
  [key: string]: any; // properti tambahan dari database
}

// ── Konstanta peta gambar logo karakter ──
export const LOGO_IMAGE_MAP: Record<string, string> = {
  purple: "/assets/characters/rico/logo/logo1.png",
  white: "/assets/characters/rico/logo/logo1.png",
  black: "/assets/characters/rico/logo/logo1.png",
  aqua: "/assets/characters/rico/logo/logo1.png",
  blue: "/assets/characters/rico/logo/logo1.png",
};

// ── Konstanta warna avatar ──
export const AVATAR_COLORS = [
  "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6",
  "#10b981", "#ec4899", "#06b6d4", "#f97316",
];
