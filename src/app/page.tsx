"use client";

/**
 * page.tsx — Halaman Utama (Homepage) NitroQuiz
 * ═══════════════════════════════════════════════
 *
 * Halaman ini merupakan entry point utama aplikasi NitroQuiz.
 * Pengguna dapat melakukan dua aksi utama dari sini:
 * 1. HOST  — Membuat room kuis baru sebagai pembuat soal/host
 * 2. JOIN  — Bergabung ke room kuis yang sudah ada dengan kode room
 *
 * Struktur komponen:
 * ├── LoadingScreen       → Layar loading saat autentikasi/redirect
 * ├── BackgroundLayers    → Lapisan visual latar belakang (gambar, overlay, speed lines)
 * ├── TopBarLogo          → Logo GameForSmart di pojok kiri atas
 * ├── UserDropdownMenu    → Menu dropdown pengguna di pojok kanan atas
 * ├── HowToPlayModal      → Modal panduan cara bermain
 * ├── HostCard            → Kartu untuk membuat room baru
 * ├── JoinCard            → Kartu untuk bergabung ke room
 * └── LogoutDialog        → Dialog konfirmasi logout
 *
 * Alur navigasi:
 * - Jika URL memiliki parameter ?room=XXX, pengguna langsung di-redirect ke room tersebut
 * - Jika ada pending room code di localStorage, pengguna juga di-redirect
 * - AuthGate di level layout menangani redirect ke /login jika belum login
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseCentral } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import Image from "next/image";

// ── Komponen halaman utama ──
import {
  LoadingScreen,
  BackgroundLayers,
  TopBarLogo,
  UserDropdownMenu,
  HowToPlayModal,
  HostCard,
  JoinCard,
  LogoutDialog,
} from "@/components/home";

// ════════════════════════════════════════════════════════════════
// Konstanta untuk kata-kata tagline pada header
// ════════════════════════════════════════════════════════════════
const TAGLINE_WORDS = [
  { word: "RACE", color: "#a78bfa" },
  { word: "LEARN", color: "#00ff9d" },
  { word: "DOMINATE", color: "#a78bfa" },
] as const;

// ════════════════════════════════════════════════════════════════
// Komponen Utama: Home
// ════════════════════════════════════════════════════════════════
export default function Home() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();

  // ── State pengguna ──
  /** Data pengguna yang diturunkan dari profil autentikasi */
  const user = profile
    ? {
        id: profile.auth_user_id,
        username: profile.nickname || profile.fullname || profile.username || "Racer",
        email: profile.email,
        avatar: profile.avatar_url || "",
      }
    : null;

  // ── State halaman ──
  const [roomCode, setRoomCode] = useState("");          // Kode room yang diinput pengguna
  const [isHosting, setIsHosting] = useState(false);     // Sedang proses membuat room
  const [isRedirecting, setIsRedirecting] = useState(false); // Sedang proses redirect dari QR code
  const [isFullscreen, setIsFullscreen] = useState(false);   // Status mode fullscreen

  // ── State modal & dialog ──
  const [showHowToPlay, setShowHowToPlay] = useState(false);    // Visibilitas modal cara bermain
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false); // Visibilitas dialog logout

  // ════════════════════════════════════════════════════════════════
  // HOOKS & SIDE EFFECTS
  // ════════════════════════════════════════════════════════════════

  /**
   * Hook: Pantau perubahan status fullscreen.
   * Memperbarui state isFullscreen saat pengguna masuk/keluar fullscreen
   * melalui shortcut keyboard atau API browser.
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  /**
   * Hook: Cek parameter URL untuk redirect otomatis dari QR code.
   * Jika URL mengandung ?room=XXX, pengguna langsung diarahkan ke halaman join.
   * Ini memungkinkan pengguna scan QR code dan langsung bergabung ke room.
   */
  useEffect(() => {
    async function init() {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get("room");
      if (roomParam) {
        const code = roomParam.toUpperCase();
        setIsRedirecting(true);
        router.push(`/join/${code}`);
      }
    }

    init();
  }, [router]);

  /**
   * Hook: Cek pending room code di localStorage.
   * Jika pengguna sebelumnya mencoba join sebelum login, kode room disimpan
   * di localStorage. Setelah login berhasil, pengguna otomatis diarahkan
   * ke room tersebut.
   */
  useEffect(() => {
    if (profile && !authLoading) {
      const pendingCode = localStorage.getItem("nitroquiz_pendingRoomCode");
      if (pendingCode) {
        localStorage.removeItem("nitroquiz_pendingRoomCode");
        router.replace(`/join/${pendingCode.toUpperCase()}`);
      }
    }
  }, [profile, authLoading, router]);

  // ════════════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ════════════════════════════════════════════════════════════════

  /** Toggle mode fullscreen browser */
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  /** Navigasi ke halaman pemilihan kuis untuk membuat room baru */
  const handleHost = () => {
    setIsHosting(true);
    setTimeout(() => {
      router.push("/host/select-quiz");
    }, 100);
  };

  /** Navigasi ke halaman join dengan kode room yang dimasukkan */
  const handleJoin = () => {
    if (roomCode.trim() && user) {
      router.push(`/join/${roomCode.trim()}`);
    }
  };

  /** Membuka dialog konfirmasi logout */
  const handleLogout = () => {
    setIsLogoutDialogOpen(true);
  };

  /** Menjalankan proses logout dan redirect ke halaman login */
  const performLogout = async () => {
    await supabaseCentral.auth.signOut();
    router.push("/login");
  };

  // ════════════════════════════════════════════════════════════════
  // KONDISI LOADING
  // ════════════════════════════════════════════════════════════════

  /**
   * Tampilkan loading screen saat:
   * - Autentikasi sedang dimuat
   * - Sedang proses membuat room (hosting)
   * - Sedang proses redirect dari QR code
   */
  if (authLoading || isHosting || isRedirecting) {
    return <LoadingScreen />;
  }

  // ════════════════════════════════════════════════════════════════
  // RENDER UTAMA
  // ════════════════════════════════════════════════════════════════

  return (
    <div className="bg-[#04060f] text-white min-h-screen relative overflow-hidden font-body selection:bg-[#7C3AED]/30 selection:text-white flex flex-col">
      {/* ── Lapisan latar belakang (background, overlay, animasi) ── */}
      <BackgroundLayers />

      {/* ── Logo di pojok kiri atas ── */}
      <TopBarLogo />

      {/* ── Menu dropdown pengguna di pojok kanan atas ── */}
      {user && (
        <UserDropdownMenu
          user={user}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onShowHowToPlay={() => setShowHowToPlay(true)}
          onLogout={handleLogout}
        />
      )}

      {/* ── Modal panduan cara bermain ── */}
      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />

      {/* ══════════════════════════════════════════════════════════ */}
      {/* KONTEN UTAMA: Logo, Tagline, dan Kartu Aksi               */}
      {/* ══════════════════════════════════════════════════════════ */}
      <main className="relative z-20 flex flex-col items-center justify-center h-screen w-full max-w-5xl mx-auto p-4 md:p-6 overflow-hidden">
        {/* ── Logo & Tagline ── */}
        <header className="text-center mb-6 md:mb-10 relative z-30 w-full flex flex-col items-center">
          {/* Logo NitroQuiz dengan animasi masuk */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <Image
              src="/assets/logo/logo1.png"
              alt="NitroQuiz Logo"
              width={500}
              height={150}
              className="object-contain w-[200px] md:w-[320px] drop-shadow-[0_0_30px_rgba(124,58,237,0.4)] group-hover:drop-shadow-[0_0_40px_rgba(124,58,237,0.6)] transition-all duration-500 scale-95 group-hover:scale-100"
              priority
            />
          </motion.div>

          {/* Tagline: RACE · LEARN · DOMINATE */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-3 md:mt-4 flex items-center justify-center gap-3 md:gap-4"
          >
            {TAGLINE_WORDS.map((item, idx) => (
              <div key={item.word} className="flex items-center gap-3 md:gap-4">
                <span
                  className="font-body text-[10px] sm:text-xs md:text-sm font-bold tracking-[0.25em] uppercase transition-all duration-300 cursor-default hover:tracking-[0.35em]"
                  style={{ color: item.color }}
                >
                  {item.word}
                </span>
                {/* Titik pemisah antar kata (kecuali kata terakhir) */}
                {idx < 2 && (
                  <div className="w-[3px] h-[3px] rounded-full bg-white/20" />
                )}
              </div>
            ))}
          </motion.div>
        </header>

        {/* ── Kartu Host & Join ── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex flex-col md:flex-row gap-4 lg:gap-6 w-full justify-center items-stretch max-w-5xl px-4 md:px-0"
        >
          {/* Kartu untuk membuat room baru (host) */}
          <HostCard onHost={handleHost} />

          {/* Kartu untuk bergabung ke room (join) */}
          <JoinCard
            roomCode={roomCode}
            onRoomCodeChange={setRoomCode}
            onJoin={handleJoin}
          />
        </motion.div>
      </main>

      {/* ── Dialog konfirmasi logout ── */}
      <LogoutDialog
        isOpen={isLogoutDialogOpen}
        onClose={() => setIsLogoutDialogOpen(false)}
        onConfirm={performLogout}
      />
    </div>
  );
}
