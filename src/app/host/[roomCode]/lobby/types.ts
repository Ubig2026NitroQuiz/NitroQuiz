/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TIPE DATA: Host Lobby
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Definisi tipe-tipe data yang digunakan di seluruh modul halaman lobby host.
 * Memisahkan tipe dari logika untuk mempermudah maintenance dan type-safety.
 */

// ── Tipe Peserta / Partisipan ──
export interface Participant {
  id: string;
  session_id: string;
  nickname: string;
  car_character?: string;
  avatar_url?: string;
  score: number;
  current_question: number;
}

// ── Tipe Sesi Game ──
export interface GameSession {
  id: string;
  game_pin: string;
  status: string;
  countdown_started_at: string | null;
  started_at: string | null;
  [key: string]: any; // properti tambahan dari database
}

// ── Tipe Profil Teman (mutual friend) ──
export interface FriendProfile {
  id: string;
  username: string;
  nickname?: string;
  fullname?: string;
  avatar_url?: string;
}

// ── Tipe Grup Pengguna ──
export interface UserGroup {
  id: string;
  name: string;
  membersCount: number;
  members: GroupMember[];
  role: string;
}

// ── Tipe Anggota Grup ──
export interface GroupMember {
  user_id?: string;
  id?: string;
  role?: string;
}

// ── Konfigurasi Lampu Traffic Light untuk Countdown ──
export interface TrafficLight {
  color: string;    // warna lampu (hex)
  activeAt: number; // aktif pada hitungan keberapa
}

// ── Konstanta warna avatar ──
export const AVATAR_COLORS = [
  '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6',
  '#10b981', '#ec4899', '#06b6d4', '#f97316'
];
