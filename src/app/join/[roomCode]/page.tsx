"use client";

/**
 * page.tsx — Halaman Auto Join Room
 * ══════════════════════════════════
 *
 * Halaman ini diakses saat pemain membuka link join atau men-scan QR Code.
 * Proses bergabung dilakukan secara otomatis tanpa input manual dari pemain.
 *
 * Alur:
 * 1. Ambil roomCode dari URL parameter
 * 2. Cek status autentikasi:
 *    - Jika belum login → simpan roomCode → redirect ke login
 *    - Jika sudah login → tunggu profil dimuat
 * 3. Generate nickname dari profil pengguna
 * 4. Panggil RPC `join_game` di database
 * 5. Handle response:
 *    - Sukses → simpan data ke localStorage → redirect ke waiting room
 *    - Error → tampilkan alert sesuai jenis error
 *
 * Jenis error yang ditangani:
 * - duplicate_nickname: Nickname sudah dipakai di room ini
 * - room_not_found: Kode room tidak valid
 * - session_locked: Session sudah mulai atau selesai
 * - room_full: Room sudah penuh
 * - general: Error tidak terduga
 */

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

// ════════════════════════════════════════════════════════════════
// KONSTANTA
// ════════════════════════════════════════════════════════════════

/** Peta pesan error berdasarkan jenis kesalahan */
const ERROR_MESSAGES = {
  duplicate: {
    title: "Duplicate Nickname",
    message: "This nickname is already taken in this room. Please change your profile nickname.",
  },
  roomNotFound: {
    title: "Room Not Found",
    message: "The game code you entered does not exist. Please check the code.",
  },
  sessionLocked: {
    title: "Session Locked",
    message: "This game session has already started or ended.",
  },
  roomFull: {
    title: "Room Full",
    message: "This room has reached its maximum capacity.",
  },
  general: {
    title: "Join Error",
    message: "Failed to join the game. Please try again later.",
  },
} as const;

/** Tipe kunci error yang valid */
type ErrorKey = keyof typeof ERROR_MESSAGES;

/**
 * Peta dari kode error RPC ke kunci error UI.
 * Digunakan untuk menerjemahkan error dari database ke pesan yang user-friendly.
 */
const RPC_ERROR_MAP: Record<string, ErrorKey> = {
  duplicate_nickname: "duplicate",
  room_not_found: "roomNotFound",
  room_not_exist: "roomNotFound",
  session_locked: "sessionLocked",
  room_full: "roomFull",
};

// ════════════════════════════════════════════════════════════════
// Komponen Utama: AutoJoinPage
// ════════════════════════════════════════════════════════════════
export default function AutoJoinPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();

  /** Kode room dari URL, dinormalisasi ke uppercase */
  const roomCode = (params.roomCode as string)?.toUpperCase();
  const { user, profile, loading: authLoading } = useAuth();

  // ── State ──
  const [showAlert, setShowAlert] = useState(false);           // Tampilkan modal error
  const [alertReason, setAlertReason] = useState<ErrorKey | "">(""); // Jenis error
  const [isLoading, setIsLoading] = useState(true);            // Status loading

  /** Ref untuk mencegah join ganda (strict mode / re-render) */
  const hasAttempted = useRef(false);

  // ════════════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ════════════════════════════════════════════════════════════════

  /**
   * Menutup modal error dan kembali ke halaman utama.
   */
  const closeAlert = () => {
    setShowAlert(false);
    setAlertReason("");
    setIsLoading(false);
    router.replace("/");
  };

  /**
   * Menampilkan error dan menghentikan loading.
   */
  const showError = (reason: ErrorKey) => {
    setAlertReason(reason);
    setShowAlert(true);
    setIsLoading(false);
  };

  // ════════════════════════════════════════════════════════════════
  // HOOK: AUTO JOIN
  // ════════════════════════════════════════════════════════════════

  /**
   * Hook utama: Mencoba bergabung ke room secara otomatis.
   *
   * Urutan pengecekan:
   * 1. Tunggu authLoading selesai
   * 2. Jika tidak login → redirect ke halaman login
   * 3. Jika login tapi profil belum dimuat → tunggu
   * 4. Panggil RPC join_game
   * 5. Handle sukses / error
   */
  useEffect(() => {
    // Jangan proses jika: roomCode kosong, auth masih loading, atau sudah pernah dicoba
    if (!roomCode || authLoading || hasAttempted.current) return;

    // ── Belum login: simpan roomCode lalu redirect ke login ──
    if (!user) {
      localStorage.setItem("nitroquiz_pendingRoomCode", roomCode);
      setIsLoading(false);
      router.replace("/login");
      return;
    }

    // ── Tunggu profil dimuat ──
    if (!profile?.id) return;

    // Tandai sudah pernah dicoba (cegah duplikasi)
    hasAttempted.current = true;

    const autoJoin = async () => {
      try {
        // Generate nickname dari profil pengguna
        // Prioritas: nickname → fullname → username → email prefix → "Player"
        const nickname =
          profile.nickname?.trim() ||
          profile.fullname?.trim() ||
          profile.username?.trim() ||
          user.email?.split("@")[0] ||
          "Player";

        // Panggil stored procedure join_game
        const { data, error } = await supabase.rpc("join_game", {
          p_room_code: roomCode,
          p_user_id: profile.id,
          p_nickname: nickname,
        });

        // ── Handle error dari Supabase ──
        if (error) {
          console.error("Join RPC error:", error);
          showError("general");
          return;
        }

        // ── Handle error spesifik dari RPC response ──
        if (data.error) {
          const errorKey = RPC_ERROR_MAP[data.error] || "general";
          showError(errorKey);
          return;
        }

        // ── Sukses bergabung ──

        // Simpan avatar ke tabel participants (agar terlihat di host)
        if (profile?.avatar_url) {
          await supabase
            .from("participants")
            .update({ avatar_url: profile.avatar_url })
            .eq("id", data.participant_id);
        }

        // Simpan data session ke localStorage
        localStorage.setItem("nitroquiz_game_playerName", data.nickname);
        localStorage.setItem("nitroquiz_game_participantId", data.participant_id);
        localStorage.setItem("nitroquiz_game_roomCode", roomCode);
        localStorage.setItem("nitroquiz_game_sessionId", data.session_id);
        localStorage.setItem("nitroquiz_game_carCharacter", data.car_character || "");
        localStorage.removeItem("nitroquiz_pendingRoomCode");

        // Redirect ke waiting room
        router.replace(`/player/${roomCode}/waiting`);
      } catch (err) {
        console.error("Auto-join error:", err);
        showError("general");
      }
    };

    autoJoin();
  }, [roomCode, user, profile, authLoading, router]);

  // ════════════════════════════════════════════════════════════════
  // DATA TURUNAN
  // ════════════════════════════════════════════════════════════════

  /** Detail error yang akan ditampilkan (judul & pesan) */
  const errorDetails = alertReason
    ? ERROR_MESSAGES[alertReason]
    : ERROR_MESSAGES.general;

  // ════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#07091a] text-white flex items-center justify-center p-4 relative overflow-hidden font-rajdhani">
      {/* ── Efek gradien radial latar belakang ── */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-[#07091a] to-[#050508] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* ── Tampilan loading: spinner + teks ── */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-[#2d6af2] border-t-transparent rounded-full animate-spin"></div>
            <h2 className="text-xl font-bold tracking-widest text-[#2d6af2] animate-pulse">
              {t("joining_room", "JOINING ROOM...")}
            </h2>
          </div>
        )}

        {/* ── Modal error ── */}
        {showAlert && (
          <div className="bg-[#0c1225]/80 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 text-center shadow-[0_0_30px_rgba(239,68,68,0.1)]">
            {/* Judul error */}
            <h2 className="text-2xl font-black text-red-500 mb-2 uppercase tracking-wide">
              {errorDetails.title}
            </h2>

            {/* Pesan error */}
            <p className="text-gray-300 font-semibold mb-8 text-lg leading-snug">
              {errorDetails.message}
            </p>

            {/* Tombol kembali ke home */}
            <button
              onClick={closeAlert}
              className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 border border-white/20 active:scale-95"
            >
              Return to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
