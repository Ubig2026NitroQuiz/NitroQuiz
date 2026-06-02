/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CUSTOM HOOK: useAutoJoin
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Hook yang mengelola seluruh logika "auto-join" ke room game:
 *
 * Alur kerja:
 * 1. Tunggu autentikasi selesai loading
 * 2. Jika belum login → redirect ke /login (simpan roomCode di localStorage)
 * 3. Jika sudah login & profil tersedia → panggil RPC `join_game`
 * 4. Jika berhasil → simpan data pemain ke localStorage & redirect ke waiting room
 * 5. Jika gagal → tampilkan alert error sesuai jenis errornya
 *
 * CATATAN: Hook ini menggunakan `hasAttempted` ref untuk memastikan
 * join hanya dilakukan sekali (mencegah duplikasi saat re-render).
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { supabaseGame } from "@/lib/supabase/game-client";
import { AlertReasonKey } from "../constants";

// ═══════════════════════════════════════════════════════════════════════════
// HOOK UTAMA
// ═══════════════════════════════════════════════════════════════════════════

export function useAutoJoin() {
  // ── Inisialisasi routing & autentikasi ──
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const roomCode = (params.roomCode as string)?.toUpperCase();
  const { user, profile, loading: authLoading } = useAuth();

  // ── State UI ──
  const [showAlert, setShowAlert] = useState(false);
  const [alertReason, setAlertReason] = useState<AlertReasonKey | "">("");
  const [isLoading, setIsLoading] = useState(true);

  // Ref untuk mencegah percobaan join ganda
  const hasAttempted = useRef(false);

  // ═════════════════════════════════════════════════════════════════════════
  // HANDLER: Tutup Alert
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Menutup dialog alert error dan mengarahkan kembali ke halaman utama.
   * Dipanggil ketika user menekan tombol "Return to Home" di alert.
   */
  const closeAlert = () => {
    setShowAlert(false);
    setAlertReason("");
    setIsLoading(false);
    router.replace("/");
  };

  // ═════════════════════════════════════════════════════════════════════════
  // EFEK: Proses Auto-Join
  // ═════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    // Jangan lanjutkan jika: roomCode kosong, auth masih loading, atau sudah pernah dicoba
    if (!roomCode || authLoading || hasAttempted.current) return;

    // ── Jika belum login → redirect ke halaman login ──
    // Simpan roomCode agar bisa lanjut join setelah login
    if (!user) {
      localStorage.setItem("nitroquiz_pendingRoomCode", roomCode);
      setIsLoading(false);
      router.replace("/login");
      return;
    }

    // ── Tunggu profil selesai dimuat ──
    if (!profile?.id) return;

    // Tandai bahwa percobaan join sudah dilakukan
    hasAttempted.current = true;

    /**
     * Fungsi utama untuk bergabung ke room game secara otomatis.
     * Memanggil RPC `join_game` dan menangani berbagai skenario response.
     */
    const autoJoin = async () => {
      try {
        // ── 1. Generate nickname dari profil ──
        // Prioritas: nickname > fullname > username > email prefix > fallback
        const nickname =
          profile.nickname?.trim() ||
          profile.fullname?.trim() ||
          profile.username?.trim() ||
          user.email?.split("@")[0] ||
          "Player";

        // ── 2. Panggil RPC join_game ──
        const { data, error } = await supabaseGame.rpc("join_game", {
          p_room_code: roomCode,
          p_user_id: profile.id,
          p_nickname: nickname,
        });

        // ── 3. Tangani error dari Supabase (network/query error) ──
        if (error) {
          console.error("Join RPC error:", error);
          setAlertReason("general");
          setShowAlert(true);
          setIsLoading(false);
          return;
        }

        // ── 4. Tangani error spesifik dari RPC (business logic error) ──
        if (data.error) {
          handleRpcError(data.error);
          return;
        }

        // ── 5. Berhasil join! Simpan avatar ke tabel participants ──
        // Agar host bisa melihat avatar pemain di lobby
        if (profile?.avatar_url) {
          await supabaseGame
            .from("participants")
            .update({ avatar_url: profile.avatar_url })
            .eq("id", data.participant_id);
        }

        // ── 6. Simpan data pemain ke localStorage ──
        localStorage.setItem("nitroquiz_game_playerName", data.nickname);
        localStorage.setItem("nitroquiz_game_participantId", data.participant_id);
        localStorage.setItem("nitroquiz_game_roomCode", roomCode);
        localStorage.setItem("nitroquiz_game_sessionId", data.session_id);
        localStorage.setItem("nitroquiz_game_carCharacter", data.car_character || "");

        // Hapus pending room code karena sudah berhasil join
        localStorage.removeItem("nitroquiz_pendingRoomCode");

        // ── 7. Redirect ke waiting room ──
        router.replace(`/player/${roomCode}/waiting`);
      } catch (err) {
        console.error("Auto-join error:", err);
        setAlertReason("general");
        setShowAlert(true);
        setIsLoading(false);
      }
    };

    autoJoin();
  }, [roomCode, user, profile, authLoading, router]);

  // ═════════════════════════════════════════════════════════════════════════
  // HANDLER: Petakan Error RPC ke Alert Reason
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Memetakan kode error dari RPC `join_game` ke kunci alert yang sesuai.
   * Kemudian menampilkan alert dan menghentikan loading.
   */
  const handleRpcError = (errorCode: string) => {
    switch (errorCode) {
      case "duplicate_nickname":
        setAlertReason("duplicate");
        break;
      case "room_not_found":
      case "room_not_exist":
        setAlertReason("roomNotFound");
        break;
      case "session_locked":
        setAlertReason("sessionLocked");
        break;
      case "room_full":
        setAlertReason("roomFull");
        break;
      default:
        setAlertReason("general");
    }
    setShowAlert(true);
    setIsLoading(false);
  };

  // ═════════════════════════════════════════════════════════════════════════
  // DATA YANG DIKEMBALIKAN
  // ═════════════════════════════════════════════════════════════════════════

  return {
    /** Fungsi terjemahan i18n */
    t,
    /** Apakah sedang dalam proses loading/join */
    isLoading,
    /** Apakah alert error sedang ditampilkan */
    showAlert,
    /** Kunci alasan error untuk menentukan pesan yang ditampilkan */
    alertReason,
    /** Handler untuk menutup alert dan kembali ke home */
    closeAlert,
  };
}
