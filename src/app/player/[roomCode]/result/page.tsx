"use client";

/**
 * page.tsx — Halaman Hasil Permainan (Player Result)
 * ════════════════════════════════════════════════════
 *
 * Halaman ini ditampilkan setelah pemain menyelesaikan semua ronde.
 * Menampilkan peringkat, skor, dan leaderboard untuk semua peserta.
 *
 * Fitur:
 * 1. Profil pemain dengan avatar/inisial dan gambar karakter
 * 2. Statistik: peringkat, skor, jawaban benar, durasi
 * 3. Leaderboard realtime (update via Supabase channel)
 * 4. Podium 3 besar (mobile stats view)
 * 5. Efek confetti saat semua peserta selesai
 * 6. Dua layout responsif: mobile (full-screen cards) & desktop (showroom)
 * 7. Guard realtime: redirect jika session diulang/dikembalikan
 *
 * Arsitektur:
 * ├── components/result/types.ts             → Participant, CAR_IMAGE_MAP, helpers
 * ├── components/result/InitialsAvatar.tsx    → Avatar inisial pemain
 * ├── components/result/StatCards.tsx         → MobileStatCard, DesktopStatCard
 * ├── components/result/BackgroundEffects.tsx → MobileBG, DesktopBG
 * ├── components/result/ResultLoading.tsx     → Layar loading
 * └── page.tsx (file ini)                    → Logika bisnis & layout
 */

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { House, BarChart2, Home } from "lucide-react";
import { supabase } from "@/lib/supabase";
import confetti from "canvas-confetti";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

// ── Komponen UI terekstrak ──
import {
  CAR_IMAGE_MAP,
  getRankSuffix,
  formatDuration,
  InitialsAvatar,
  MobileStatCard,
  DesktopStatCard,
  MobileBG,
  DesktopBG,
  ResultLoading,
} from "@/components/result";
import type { Participant } from "@/components/result";

// ════════════════════════════════════════════════════════════════
//  KOMPONEN UTAMA: PlayerResultPage
// ════════════════════════════════════════════════════════════════

export default function PlayerResultPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const roomCode = (params.roomCode as string)?.toUpperCase();

  // ════════════════════════════════════════════════════════════════
  // STATE
  // ════════════════════════════════════════════════════════════════

  // ── State: Data peserta & session ──
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // ── State: UI ──
  const [mobileView, setMobileView] = useState<"result" | "stats">("result");
  const [showResults, setShowResults] = useState(false);

  // ── Auth & identifikasi pemain ──
  const { user, profile, loading: authLoading } = useAuth();
  const [storedParticipantId, setStoredParticipantId] = useState<string | null>(null);

  // ════════════════════════════════════════════════════════════════
  // HOOK: Ambil participant ID dari localStorage
  // ════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (typeof window !== "undefined") {
      setStoredParticipantId(localStorage.getItem("nitroquiz_game_participantId"));
    }
  }, []);

  // ════════════════════════════════════════════════════════════════
  // FUNGSI: Fetch data hasil dari database
  // ════════════════════════════════════════════════════════════════

  const fetchResults = async () => {
    try {
      // ── 1. Ambil data session ──
      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .select("id, question_limit, status")
        .eq("game_pin", roomCode)
        .single();

      if (sessionError || !sessionData) {
        console.error("Session not found", sessionError);
        return;
      }

      if (sessionData.question_limit) setTotalQuestions(sessionData.question_limit);
      setSessionId(sessionData.id);
      setSessionStatus(sessionData.status);

      // ── 2. Ambil semua peserta session ──
      const { data: pData, error: pError } = await supabase
        .from("participants")
        .select("*")
        .eq("session_id", sessionData.id);

      if (!pError && pData) {
        setParticipants(pData as Participant[]);
      }
    } catch (err) {
      console.error("Failed to load leaderboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════════════
  // HOOK: Fetch awal + Realtime updates
  // ════════════════════════════════════════════════════════════════

  useEffect(() => {
    fetchResults();

    // ── Langganan perubahan realtime ──
    const channel = supabase
      .channel(`leaderboard_updates_${roomCode}`)
      // Pantau perubahan peserta → refresh data
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "participants",
          filter: sessionId ? `session_id=eq.${sessionId}` : undefined,
        },
        () => { fetchResults(); }
      )
      // Pantau perubahan status session → redirect
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sessions", filter: `game_pin=eq.${roomCode}` },
        (payload) => {
          if (payload.new.status === "active") {
            router.push(`/player/${roomCode}/game`);
          } else if (payload.new.status === "waiting" || payload.new.status === "lobby") {
            router.push(`/player/${roomCode}/waiting`);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomCode, router]);

  // ════════════════════════════════════════════════════════════════
  // DATA TURUNAN (derived)
  // ════════════════════════════════════════════════════════════════

  /** Peserta diurutkan berdasarkan skor (desc) lalu durasi (asc) */
  const rankedPlayers = [...participants].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const dA = a.duration || Infinity;
    const dB = b.duration || Infinity;
    return dA - dB;
  });

  /**
   * Deteksi apakah peserta p adalah pemain saat ini.
   * Prioritas: user_id → participantId → nickname fallback.
   */
  const isCurrentPlayer = (p: Participant): boolean => {
    if (user?.id && p.user_id === user.id) return true;
    if (storedParticipantId && p.id === storedParticipantId) return true;
    if (!user?.id && !storedParticipantId && p.nickname === profile?.username) return true;
    return false;
  };

  /** Peringkat pemain saat ini (1-based, 0 jika tidak ditemukan) */
  const currentPlayerRank = rankedPlayers.findIndex(isCurrentPlayer) + 1;
  /** Data peserta pemain saat ini */
  const currentPlayerData = rankedPlayers.find(isCurrentPlayer);

  /** Tampilkan nama pemain dengan fallback */
  const getDisplayName = (p: Participant): string => {
    if (p.nickname) return p.nickname;
    if (profile?.fullname) return profile.fullname;
    if (profile?.username) return profile.username;
    return user?.email || t("player_result.player_fallback");
  };

  /** Path gambar karakter di showroom */
  const currentPlayerCarSrc = (() => {
    if (!currentPlayerData) return CAR_IMAGE_MAP["purple"];
    const base = (currentPlayerData.car_character || "purple").replace("-bot", "");
    return CAR_IMAGE_MAP[base] || CAR_IMAGE_MAP["purple"];
  })();

  /** Podium 3 besar */
  const firstPlace = rankedPlayers[0];
  const secondPlace = rankedPlayers[1];
  const thirdPlace = rankedPlayers[2];

  /** Apakah semua peserta sudah selesai */
  const allFinished =
    sessionStatus === "completed" || sessionStatus === "finished" ||
    (participants.length > 0 && participants.every((p) => p.finished_at || p.eliminated));

  // ════════════════════════════════════════════════════════════════
  // HOOK: Efek confetti & animasi muncul
  // ════════════════════════════════════════════════════════════════

  /** Jalankan animasi confetti selama 4 detik */
  const triggerConfetti = () => {
    const duration = 4000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 50 };
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 40 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        setShowResults(true);
        if (rankedPlayers.length > 0 && allFinished) setTimeout(() => triggerConfetti(), 1000);
      }, 600);
    }
  }, [isLoading, rankedPlayers.length, allFinished]);

  // ════════════════════════════════════════════════════════════════
  // HOOK: Paksa orientasi portrait di halaman result
  // ════════════════════════════════════════════════════════════════

  useEffect(() => {
    localStorage.removeItem('nitroquiz_orientation');
    try {
      if (screen.orientation && (screen.orientation as any).unlock) {
        (screen.orientation as any).unlock();
      }
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => { });
      }
    } catch (e) { }
  }, []);

  // ════════════════════════════════════════════════════════════════
  // ANIMASI PODIUM
  // ════════════════════════════════════════════════════════════════

  /** Varian animasi spring untuk munculnya podium */
  const podiumVariants: any = {
    hidden: { y: 150, opacity: 0 },
    visible: (custom: number) => ({
      y: 0, opacity: 1,
      transition: { type: "spring", stiffness: 70, damping: 12, delay: custom * 0.35 + 0.4 },
    }),
  };

  // ════════════════════════════════════════════════════════════════
  // RENDER: Loading
  // ════════════════════════════════════════════════════════════════

  if (isLoading) return <ResultLoading />;

  // ════════════════════════════════════════════════════════════════
  // RENDER: Layout utama
  // ════════════════════════════════════════════════════════════════

  return (
    <>
      {/* ══════════════════════════════════════════════════════════ */}
      {/*  LAYOUT MOBILE                                           */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="md:hidden min-h-screen bg-[#070d1c] text-white flex flex-col relative overflow-hidden font-body">
        <MobileBG />

        {/* ── View: Hasil Pribadi ── */}
        {mobileView === "result" && showResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 flex flex-col min-h-screen px-4 pt-8 pb-8"
          >
            {/* Logo */}
            <div className="flex justify-center mb-5 flex-shrink-0">
              <img
                src="/assets/logo/logo1.png"
                alt="NitroQuiz"
                className="h-14 object-contain drop-shadow-[0_0_30px_rgba(45,106,242,0.8)]"
              />
            </div>

            {/* Kartu profil pemain */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 80 }}
              className="relative w-full rounded-2xl overflow-hidden mb-4 flex-shrink-0"
              style={{
                background: "linear-gradient(155deg,#0d1b3e 0%,#091428 55%,#05101f 100%)",
                border: "1.5px solid rgba(45,106,242,0.55)",
                boxShadow: "0 0 40px rgba(45,106,242,0.18),inset 0 0 40px rgba(0,0,0,0.25)",
              }}
            >
              {/* Dekorasi partikel */}
              <div className="absolute top-5 left-7 w-5 h-5 rounded-full bg-slate-700/30 border border-slate-600/20" />
              <div className="absolute top-12 right-10 w-3.5 h-3.5 rounded-full bg-blue-900/35 border border-blue-700/20" />
              <div className="absolute bottom-16 left-5 w-2 h-2 rounded-full bg-slate-600/25" />
              <div className="absolute top-8 right-5 w-1.5 h-1.5 rounded-full bg-white/15" />
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-32 h-16 bg-[#2d6af2]/15 blur-2xl rounded-full" />

              {/* Avatar pemain */}
              <div className="flex justify-center pt-10 pb-4">
                <div className="relative">
                  <motion.div
                    className="w-32 h-32 rounded-full border-4 border-[#2d6af2]/50 bg-black/40 overflow-hidden flex items-center justify-center p-0 shadow-[0_0_30px_rgba(45,106,242,0.3)] relative z-10"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  >
                    {currentPlayerData?.avatar_url ? (
                      <img src={currentPlayerData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <InitialsAvatar name={currentPlayerData ? getDisplayName(currentPlayerData) : 'P'} size="lg" />
                    )}
                  </motion.div>
                </div>
              </div>

              {/* Nama & status */}
              <div className="text-center pb-8">
                <p
                  className="font-display text-[#00d4ff] text-xl font-bold tracking-[0.18em] uppercase"
                  style={{ textShadow: "0 0 12px rgba(0,212,255,0.55)" }}
                >
                  {currentPlayerData ? getDisplayName(currentPlayerData) : t("player_result.player_fallback")}
                </p>
                {!allFinished && (
                  <p className="text-[#00ff9d]/70 text-[10px] uppercase tracking-[0.2em] font-mono mt-1 animate-pulse">
                    {t("player_result.waiting_others")}
                  </p>
                )}
              </div>
            </motion.div>

            {/* Grid statistik 4 kolom */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="grid grid-cols-4 gap-2 mb-6 flex-shrink-0"
            >
              {/* Peringkat */}
              <MobileStatCard>
                <div className="flex items-baseline gap-0.5">
                  <span className="font-display text-white text-2xl font-black leading-none">
                    {allFinished ? currentPlayerRank : "?"}
                  </span>
                  <span className="font-display text-[#00ff9d] text-xs font-bold">
                    {allFinished ? getRankSuffix(currentPlayerRank) : ""}
                  </span>
                </div>
                <span className="text-gray-400 text-[9px] uppercase tracking-widest mt-1.5 font-mono">
                  {t("player_result.rank")}
                </span>
              </MobileStatCard>
              {/* Skor */}
              <MobileStatCard>
                <span className="font-display text-white text-2xl font-black leading-none">
                  {currentPlayerData?.score ?? 0}
                </span>
                <span className="text-gray-400 text-[9px] uppercase tracking-widest mt-1.5 font-mono">
                  {t("player_result.score")}
                </span>
              </MobileStatCard>
              {/* Jawaban benar */}
              <MobileStatCard>
                <span className="font-display text-white text-2xl font-black leading-none">
                  {totalQuestions > 0
                    ? `${currentPlayerData?.correct ?? 0}/${totalQuestions}`
                    : (currentPlayerData?.correct ?? 0)}
                </span>
                <span className="text-gray-400 text-[9px] uppercase tracking-widest mt-1.5 font-mono">
                  {t("player_result.correct")}
                </span>
              </MobileStatCard>
              {/* Durasi */}
              <MobileStatCard>
                <span className="font-display text-white text-2xl font-black leading-none">
                  {formatDuration(currentPlayerData?.duration)}
                </span>
                <span className="text-gray-400 text-[9px] uppercase tracking-widest mt-1.5 font-mono">
                  {t("player_result.time")}
                </span>
              </MobileStatCard>
            </motion.div>

            <div className="flex-1" />

            {/* Tombol aksi */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="flex gap-3 flex-shrink-0"
            >
              <button
                onClick={() => router.push("/")}
                className="flex-1 h-14 flex items-center justify-center gap-2 rounded-full font-display text-sm font-bold uppercase tracking-widest text-white active:scale-95 transition-transform"
                style={{ background: "linear-gradient(135deg,#00bcd4,#0288d1)", boxShadow: "0 0 24px rgba(0,188,212,0.38)" }}
              >
                <House className="w-5 h-5" /> {t("player_result.home")}
              </button>
              <button
                onClick={() => sessionId && (window.location.href = `https://gameforsmartnewui.vercel.app/stat/${sessionId}`)}
                className="flex-1 h-14 flex items-center justify-center gap-2 rounded-full font-display text-sm font-bold uppercase tracking-widest text-white active:scale-95 transition-transform"
                style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", boxShadow: "0 0 24px rgba(245,158,11,0.38)" }}
              >
                <BarChart2 className="w-5 h-5" /> {t("player_result.stats")}
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* ── View: Leaderboard (Stats) ── */}
        {mobileView === "stats" && showResults && (
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative z-10 flex flex-col min-h-screen px-4 pt-6 pb-8"
          >
            {/* Header dengan tombol kembali */}
            <div className="flex items-center gap-3 mb-4 flex-shrink-0">
              <button
                onClick={() => setMobileView("result")}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white text-lg active:scale-95 transition-transform"
              >
                ←
              </button>
              <h2 className="font-display text-lg font-black uppercase tracking-widest text-white">
                {t("player_result.leaderboard")}
              </h2>
            </div>

            {/* ── Podium 3 besar ── */}
            <div className="relative flex items-end justify-center w-full h-[200px] mb-4 flex-shrink-0">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-8 bg-[#2d6af2]/20 blur-[18px] rounded-full pointer-events-none" />

              {/* Peringkat 2 (kiri) */}
              {secondPlace && (
                <motion.div custom={2} variants={podiumVariants} initial="hidden" animate="visible" className="flex flex-col items-center z-10 mx-[-4px]">
                  <div className="mb-1 text-center">
                    <div className="bg-black/60 border border-slate-300/40 backdrop-blur-md px-2 py-0.5 rounded-lg">
                      <p className={`font-display text-[9px] tracking-wider truncate max-w-[68px] ${(secondPlace.id === storedParticipantId || (secondPlace.nickname === profile?.username && !storedParticipantId)) ? "text-[#00ff9d] font-bold" : "text-slate-200"}`} title={secondPlace.nickname}>
                        {secondPlace.nickname}
                        {(secondPlace.id === storedParticipantId || (secondPlace.nickname === profile?.username && !storedParticipantId)) && t("player_result.you")}
                      </p>
                      <p className="font-mono text-slate-400 text-[8px]">{secondPlace.score.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="relative mb-2">
                    <div className="w-16 h-16 rounded-full border-2 border-slate-400/50 bg-black/40 overflow-hidden flex items-center justify-center p-0 shadow-lg relative z-10">
                      {secondPlace.avatar_url ? (<img src={secondPlace.avatar_url} alt="Avatar" className="w-full h-full object-cover" />) : (<InitialsAvatar name={secondPlace.nickname} size="sm" />)}
                    </div>
                    <div className="absolute -right-2 -bottom-1 w-10 h-10 bg-black/60 rounded-full border border-white/20 p-1 flex items-center justify-center z-20 shadow-xl">
                      <img src={CAR_IMAGE_MAP[(secondPlace.car_character || "white").replace("-bot", "")] || CAR_IMAGE_MAP["white"]} alt="Car" className="w-full h-full object-contain" />
                    </div>
                  </div>
                  <div className="w-[62px] h-[95px] bg-gradient-to-b from-[#1a2235] to-[#0a0f1a] border-t-2 border-l border-r border-[#64748b] rounded-t-xl flex items-end justify-center pb-2">
                    <span className="font-display text-2xl text-slate-600/40 font-bold">2</span>
                  </div>
                </motion.div>
              )}

              {/* Peringkat 1 (tengah — paling tinggi) */}
              {firstPlace && (
                <motion.div custom={3} variants={podiumVariants} initial="hidden" animate="visible" className="flex flex-col items-center z-20 mx-0.5 -mb-1">
                  <div className="mb-1 text-center">
                    <div className="bg-[#1a1500]/80 border border-yellow-500/60 backdrop-blur-md px-2.5 py-1 rounded-xl">
                      <p className={`font-display text-[9px] font-bold tracking-widest uppercase truncate max-w-[88px] ${(firstPlace.id === storedParticipantId || (firstPlace.nickname === profile?.username && !storedParticipantId)) ? "text-[#00ff9d]" : "text-yellow-500"}`} title={firstPlace.nickname}>
                        {firstPlace.nickname}
                        {(firstPlace.id === storedParticipantId || (firstPlace.nickname === profile?.username && !storedParticipantId)) && t("player_result.you")}
                      </p>
                      <p className="font-mono text-white text-[8px] mt-0.5 font-bold">{firstPlace.score.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="relative mb-2">
                    <div className="w-20 h-20 rounded-full border-2 border-yellow-500/50 bg-black/40 overflow-hidden flex items-center justify-center p-0 shadow-[0_0_20px_rgba(250,204,21,0.3)] relative z-10">
                      {firstPlace.avatar_url ? (<img src={firstPlace.avatar_url} alt="Avatar" className="w-full h-full object-cover" />) : (<InitialsAvatar name={firstPlace.nickname} size="md" />)}
                    </div>
                    <div className="absolute -right-3 -bottom-1 w-12 h-12 bg-black/60 rounded-full border border-yellow-500/40 p-1.5 flex items-center justify-center z-20 shadow-xl">
                      <img src={CAR_IMAGE_MAP[(firstPlace.car_character || "purple").replace("-bot", "")] || CAR_IMAGE_MAP["purple"]} alt="Car" className="w-full h-full object-contain" />
                    </div>
                  </div>
                  <div className="w-[76px] h-[140px] bg-gradient-to-b from-[#2a1f0a] to-[#0a0f1a] border-t-4 border-l-2 border-r-2 border-[#eab308] rounded-t-xl relative overflow-hidden flex items-end justify-center pb-4">
                    <div className="absolute top-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#eab308] to-transparent" />
                    <span className="font-display text-4xl text-yellow-600/40 font-bold">1</span>
                  </div>
                </motion.div>
              )}

              {/* Peringkat 3 (kanan) */}
              {thirdPlace && (
                <motion.div custom={1} variants={podiumVariants} initial="hidden" animate="visible" className="flex flex-col items-center z-10 mx-[-4px]">
                  <div className="mb-1 text-center">
                    <div className="bg-black/60 border border-orange-700/40 backdrop-blur-md px-2 py-0.5 rounded-lg">
                      <p className={`font-display text-[9px] tracking-wider truncate max-w-[68px] ${(thirdPlace.id === storedParticipantId || (thirdPlace.nickname === profile?.username && !storedParticipantId)) ? "text-[#00ff9d] font-bold" : "text-orange-200"}`} title={thirdPlace.nickname}>
                        {thirdPlace.nickname}
                        {(thirdPlace.id === storedParticipantId || (thirdPlace.nickname === profile?.username && !storedParticipantId)) && t("player_result.you")}
                      </p>
                      <p className="font-mono text-orange-400 text-[8px]">{thirdPlace.score.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="relative mb-2">
                    <div className="w-14 h-14 rounded-full border-2 border-orange-700/50 bg-black/40 overflow-hidden flex items-center justify-center p-0 shadow-lg relative z-10">
                      {thirdPlace.avatar_url ? (<img src={thirdPlace.avatar_url} alt="Avatar" className="w-full h-full object-cover" />) : (<InitialsAvatar name={thirdPlace.nickname} size="sm" />)}
                    </div>
                    <div className="absolute -right-2 -bottom-1 w-9 h-9 bg-black/60 rounded-full border border-white/20 p-1 flex items-center justify-center z-20 shadow-xl">
                      <img src={CAR_IMAGE_MAP[(thirdPlace.car_character || "black").replace("-bot", "")] || CAR_IMAGE_MAP["black"]} alt="Car" className="w-full h-full object-contain" />
                    </div>
                  </div>
                  <div className="w-[52px] h-[75px] bg-gradient-to-b from-[#25140b] to-[#0a0f1a] border-t-2 border-l border-r border-[#c2410c] rounded-t-xl flex items-end justify-center pb-1.5">
                    <span className="font-display text-2xl text-orange-700/40 font-bold">3</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* ── Daftar leaderboard ── */}
            <div className="bg-black/40 backdrop-blur-xl border border-[#2d6af2]/30 rounded-2xl p-3 shadow-[0_0_30px_rgba(0,0,0,0.5)] mb-4 overflow-y-auto flex-1">
              <div className="space-y-1.5">
                {rankedPlayers.map((player, index) => {
                  const isMe = player.id === storedParticipantId || (player.nickname === profile?.username && !storedParticipantId);
                  const rankColors = [
                    "border-yellow-500/50 bg-yellow-500/5",
                    "border-slate-300/50 bg-slate-300/5",
                    "border-orange-600/50 bg-orange-600/5",
                  ];
                  return (
                    <div
                      key={player.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${isMe ? "bg-[#2d6af2]/15 border-[#2d6af2]/50" : index < 3 ? rankColors[index] : "border-white/5 bg-white/[0.02]"}`}
                    >
                      {/* Badge peringkat */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-display text-[10px] font-bold flex-shrink-0 ${index === 0 ? "bg-yellow-500/20 text-yellow-500" : index === 1 ? "bg-slate-300/20 text-slate-300" : index === 2 ? "bg-orange-600/20 text-orange-400" : "bg-white/5 text-gray-500"}`}>
                        {index + 1}
                      </div>
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-black/40 border border-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {player.eliminated
                          ? "💀"
                          : player.avatar_url ? (
                            <img src={player.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <InitialsAvatar name={player.nickname} size="sm" />
                          )}
                      </div>
                      {/* Nama */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-display text-[10px] tracking-wider uppercase truncate ${isMe ? "text-[#00ff9d] font-bold" : index === 0 ? "text-yellow-400" : "text-gray-300"}`}
                          title={player.nickname}
                        >
                          {getDisplayName(player)} {isMe && t("player_result.you")}
                        </p>
                      </div>
                      {/* Skor & durasi */}
                      <span className={`font-mono font-bold text-xs flex-shrink-0 ${isMe ? "text-[#00ff9d]" : index === 0 ? "text-yellow-400" : "text-[#00ff9d]"}`}>
                        {player.score.toLocaleString()}
                      </span>
                      <span className="text-cyan-400/70 font-mono text-[10px] flex-shrink-0">
                        {formatDuration(player.duration)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tombol lihat statistik */}
            <button
              onClick={() => sessionId && (window.location.href = `https://gameforsmartnewui.vercel.app/stat/${sessionId}`)}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-full border border-[#f59e0b]/50 text-[#f59e0b] font-display text-sm uppercase tracking-widest hover:bg-[#f59e0b]/10 active:scale-95 transition-all flex-shrink-0"
            >
              <BarChart2 className="w-4 h-4" /> {t("player_result.stats")}
            </button>
          </motion.div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/*  LAYOUT DESKTOP (Showroom)                                */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div
        className="hidden md:block fixed inset-0 font-body text-white overflow-hidden"
        style={{ background: "linear-gradient(180deg,#1e2230 0%,#1c2030 50%,#181c28 100%)" }}
      >
        <DesktopBG />

        {/* ── Top bar ── */}
        <div
          className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-6 py-3"
          style={{
            background: "rgba(16,20,32,0.65)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <img src="/assets/logo/logo1.png" alt="Logo" className="h-15 object-contain" />
          <h1
            className="font-display text-2xl font-black text-white uppercase tracking-[0.2em] absolute left-1/2 -translate-x-1/2"
            style={{ textShadow: "0 0 30px rgba(255,255,255,0.2)" }}
          >
            {t("player_result.race_complete")}
          </h1>
          <img src="/assets/logo/logo2.png" alt="NitroQuiz" className="h-10 object-contain" />
        </div>

        {showResults && (
          <>
            {/* ── Panel kiri: Profil pemain ── */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 90 }}
              className="absolute z-10 flex items-center"
              style={{ top: "10%", left: "8%", bottom: "10%", width: "min(280px, 18vw)" }}
            >
              <div
                className="w-full rounded-2xl overflow-hidden flex flex-col"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(220,230,250,0.18)",
                  backdropFilter: "blur(32px) saturate(1.4)",
                  WebkitBackdropFilter: "blur(32px) saturate(1.4)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.1), 0 8px 40px rgba(0,0,0,0.2)",
                  overflow: "hidden",
                }}
              >
                {/* Bagian avatar */}
                <div
                  className="flex flex-col items-center justify-center px-6 py-10 flex-shrink-0"
                  style={{ background: "rgba(10,15,30,0.55)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <div className="relative mb-4">
                    <div
                      className="w-28 h-28 rounded-full flex items-center justify-center relative z-10 overflow-hidden"
                      style={{
                        background: "rgba(45,106,242,0.15)",
                        border: "2.5px solid rgba(45,106,242,0.5)",
                        boxShadow: "0 0 30px rgba(45,106,242,0.25)",
                      }}
                    >
                      {currentPlayerData?.avatar_url ? (
                        <img src={currentPlayerData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <InitialsAvatar name={currentPlayerData ? getDisplayName(currentPlayerData) : 'P'} size="lg" />
                      )}
                    </div>
                    <div className="absolute inset-[-8px] rounded-full border border-[#2d6af2]/20 animate-pulse" />
                  </div>
                </div>

                {/* Nama & status */}
                <div className="flex flex-col items-center justify-center gap-6 px-6 py-10 flex-1">
                  <p className="font-display text-white text-xl font-bold uppercase tracking-widest text-center leading-tight" title={currentPlayerData ? getDisplayName(currentPlayerData) : ""}>
                    {currentPlayerData ? getDisplayName(currentPlayerData) : t("player_result.player_fallback")}
                  </p>
                  {currentPlayerData?.eliminated ? (
                    <span className="font-display text-xl font-black uppercase tracking-wider" style={{ color: "#ef4444", textShadow: "0 0 16px rgba(239,68,68,0.7)" }}>
                      {t("player_result.eliminated")}
                    </span>
                  ) : !allFinished ? (
                    <span className="font-display text-xl font-black uppercase tracking-wider" style={{ color: "#60a5fa", textShadow: "0 0 14px rgba(96,165,250,0.5)" }}>
                      {t("player_result.waiting")}
                    </span>
                  ) : currentPlayerRank === 1 ? (
                    <span className="font-display text-xl font-black uppercase tracking-wider" style={{ color: "#facc15", textShadow: "0 0 14px rgba(250,204,21,0.6)" }}>
                      {t("player_result.champion")}
                    </span>
                  ) : (
                    <span className="font-display text-xl font-black uppercase tracking-wider" style={{ color: "#00ff9d", textShadow: "0 0 14px rgba(0,255,157,0.5)" }}>
                      {t("player_result.finished")}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>

            {/* ── Tengah: Gambar karakter showroom ── */}
            <div
              className="absolute z-10 flex items-center justify-center"
              style={{ top: "60px", left: "28%", right: "28%", bottom: "60px" }}
            >
              <motion.div
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 80 }}
              >
                <motion.img
                  src={currentPlayerCarSrc}
                  alt="Your Car"
                  className="object-contain"
                  style={{
                    width: "clamp(300px,38vw,540px)",
                    maxHeight: "54vh",
                    filter: "drop-shadow(0 20px 50px rgba(0,0,0,0.4))",
                  }}
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                />
                <div
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[70%] h-3 rounded-full"
                  style={{ background: "rgba(0,0,0,0.35)", filter: "blur(12px)" }}
                />
              </motion.div>
            </div>

            {/* ── Panel kanan: Statistik ── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 90 }}
              className="absolute z-10 flex flex-col p-[22px]"
              style={{
                top: "15%", right: "8%", bottom: "10%", width: "min(300px, 20vw)",
                background: "rgba(160,180,210,0.12)",
                border: "1px solid rgba(220,230,250,0.18)",
                backdropFilter: "blur(32px) saturate(1.4)",
                WebkitBackdropFilter: "blur(32px) saturate(1.4)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.1), 0 8px 40px rgba(0,0,0,0.2)",
                borderRadius: "1rem",
              }}
            >
              <div className="w-full h-full flex flex-col justify-between gap-4">
                <DesktopStatCard label={t("player_result.rank")}>
                  <p className="font-display font-black text-white leading-none" style={{ fontSize: "52px", textShadow: "0 0 20px rgba(255,255,255,0.4)" }}>
                    {allFinished ? currentPlayerRank : "?"}
                  </p>
                  <p className="font-display font-bold text-[#facc15]" style={{ fontSize: "16px", letterSpacing: "0.2em" }}>
                    {allFinished ? getRankSuffix(currentPlayerRank) : t("player_result.wait_for_host")}
                  </p>
                </DesktopStatCard>
                <DesktopStatCard label={t("player_result.score")}>
                  <p className="font-display font-black text-white leading-none" style={{ fontSize: "clamp(32px,3.2vw,46px)" }}>
                    {currentPlayerData?.score ?? 0}
                  </p>
                </DesktopStatCard>
                <DesktopStatCard label={t("player_result.correct")}>
                  <p className="font-display font-black text-white leading-none" style={{ fontSize: "clamp(26px,2.8vw,40px)" }}>
                    {totalQuestions > 0 ? `${currentPlayerData?.correct ?? 0}/${totalQuestions}` : (currentPlayerData?.correct ?? 0)}
                  </p>
                </DesktopStatCard>
                <DesktopStatCard label={t("player_result.time")}>
                  <p className="font-display font-black text-white leading-none font-mono" style={{ fontSize: "clamp(26px,2.8vw,40px)" }}>
                    {formatDuration(currentPlayerData?.duration)}
                  </p>
                </DesktopStatCard>
              </div>
            </motion.div>
          </>
        )}

        {/* ── Tombol Home (kiri) ── */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-4">
          <button
            onClick={() => router.push("/")}
            className="w-[52px] h-[52px] flex items-center justify-center rounded-full active:scale-95 transition-all"
            style={{
              background: "rgba(10,18,35,0.85)", border: "2px solid #2d6af2", color: "#2d6af2",
              boxShadow: "0 0 18px rgba(45,106,242,0.6), inset 0 0 10px rgba(45,106,242,0.15)",
            }}
          >
            <Home className="w-5 h-5" />
          </button>
        </div>

        {/* ── Tombol Statistik (kanan) ── */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-4">
          <button
            onClick={() => sessionId && (window.location.href = `https://gameforsmartnewui.vercel.app/stat/${sessionId}`)}
            className="w-[52px] h-[52px] flex items-center justify-center rounded-full active:scale-95 transition-all"
            style={{
              background: "rgba(10,18,35,0.85)", border: "2px solid #f59e0b", color: "#f59e0b",
              boxShadow: "0 0 18px rgba(245,158,11,0.6), inset 0 0 10px rgba(245,158,11,0.15)",
            }}
          >
            <BarChart2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
}
