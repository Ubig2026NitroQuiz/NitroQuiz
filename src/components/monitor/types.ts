/**
 * types.ts — Tipe Data Monitor
 * ═════════════════════════════
 *
 * Berisi tipe data yang digunakan pada halaman monitor permainan.
 */

/** Data peserta/pemain selama permainan berlangsung */
export interface MonitorParticipant {
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
  correct?: number;
  answers?: any[];
  duration?: number;
}
