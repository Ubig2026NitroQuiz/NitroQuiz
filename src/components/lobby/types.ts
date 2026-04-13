/**
 * types.ts — Tipe Data Lobby
 * ═══════════════════════════
 *
 * Berisi tipe data yang digunakan oleh komponen lobby.
 */

/** Data peserta/pemain di lobby */
export interface LobbyParticipant {
  id: string;
  session_id: string;
  nickname: string;
  avatar_url?: string;
  car_character?: string;
  score: number;
  current_question: number;
  [key: string]: any;
}

/** Data session/room */
export interface LobbySession {
  id: string;
  game_pin: string;
  status: string;
  countdown_started_at?: string | null;
  started_at?: string | null;
  [key: string]: any;
}

/** Data teman mutual */
export interface MutualFriend {
  id: string;
  username: string;
  nickname?: string;
  fullname?: string;
  avatar_url?: string;
}

/** Data grup pengguna */
export interface UserGroup {
  id: string;
  name: string;
  membersCount: number;
  members: any[];
  role: string;
}
