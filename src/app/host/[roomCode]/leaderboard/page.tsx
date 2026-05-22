"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Crown,
  Medal,
  Users,
  Clock,
  Star,
  ChevronRight,
  LayoutDashboard,
  House,
  BarChart2,
  RotateCw,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import confetti from "canvas-confetti";
import { useTranslation } from "react-i18next";
import { generateXID } from "@/lib/id-generator";
import { FloatingHostActions } from "@/components/FloatingHostActions";
import { createGFSClient } from "@/lib/supabase/gfs-client";
import { supabaseGame } from "@/lib/supabase/game-client";

const carImageMap: Record<string, string> = {
  purple: "/assets/characters/rico/showroom/showroom1.png",
  white: "/assets/characters/rico/showroom/showroom2.png",
  black: "/assets/characters/rico/showroom/showroom1.png",
  aqua: "/assets/characters/rico/showroom/showroom2.png",
  blue: "/assets/characters/rico/showroom/showroom1.png",
};


// Helper: Generate initials from a name
const getInitials = (name: string): string => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

// Initials avatar colors based on nickname hash
const AVATAR_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#10b981', '#ec4899', '#06b6d4', '#f97316'];
const getAvatarColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// Reusable InitialsAvatar component
const InitialsAvatar = ({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) => {
  const fontSize = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-base' : 'text-xs';
  return (
    <div
      className={`w-full h-full rounded-full flex items-center justify-center ${fontSize} font-black text-white select-none`}
      style={{ backgroundColor: getAvatarColor(name) }}
    >
      {getInitials(name)}
    </div>
  );
};

// Score Counter Component for Motorsport Odometer effect
const Odometer = ({ value, delay = 0 }: { value: number; delay?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let timeout = setTimeout(() => {
      let start = 0;
      const end = value;
      const duration = 1500; // 1.5s animation
      const increment = end / (duration / 16);

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setDisplayValue(end);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return <span>{displayValue.toLocaleString()}</span>;
};

// Helper: Shuffle Array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface Participant {
  id: string;
  nickname: string;
  car_character: string;
  score: number;
  current_question: number;
  finished_at: string | null;
  duration: number;
  joined_at: string;
  avatar_url?: string | null;
  eliminated?: boolean;
}

export default function LeaderboardPage() {
  const supabaseCentral = createGFSClient();
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const roomCode = params.roomCode as string;

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRestarting, setIsRestarting] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabaseGame
          .from("sessions")
          .select("id")
          .eq("game_pin", roomCode)
          .single();

        if (sessionError || !sessionData) {
          console.error("Session not found", sessionError);
          return;
        }

        setSessionId(sessionData.id);

        const { data: pData, error: pError } = await supabaseGame
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

    fetchResults();
  }, [roomCode, router]);

  const rankedPlayers = [...participants].sort((a, b) => {
    // 1. Higher score first
    if (b.score !== a.score) return b.score - a.score;

    // 2. Lower duration first (faster)
    const durA = a.duration || 999999;
    const durB = b.duration || 999999;
    if (durA !== durB) return durA - durB;

    // 3. Earlier join first (more motivated)
    const joinA = new Date(a.joined_at).getTime();
    const joinB = new Date(b.joined_at).getTime();
    if (joinA !== joinB) return joinA - joinB;

    // 4. Final fallback
    return a.id.localeCompare(b.id);
  });

  const triggerConfetti = () => {
    const duration = 5000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 50 };
    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;
    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  };

  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        setShowResults(true);
        if (rankedPlayers.length > 0) setTimeout(() => triggerConfetti(), 1500);
      }, 800);
    }
  }, [isLoading, rankedPlayers.length]);

  // NITRO LAUNCH SEQUENCE — stands rocket up like cars launching from the start line
  const standVariants: Variants = {
    hidden: { y: 500, opacity: 0 },
    visible: (custom: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 28,
        mass: 1.5,
        delay: custom * 0.55, // 3rd → 2nd → 1st stagger
      },
    }),
  };

  // Name tag slides in like a telemetry data panel deploying
  const nameplateVariants: Variants = {
    hidden: { x: -60, opacity: 0 },
    visible: (custom: number) => ({
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 22,
        delay: custom * 0.55 + 0.5,
      },
    }),
  };

  // RPM gauge sweeps like a tachometer redlining
  const rpmGaugeVariants: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (custom: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 1.2,
        ease: [0.12, 0, 0.39, 0], // custom "punch" easing
        delay: custom * 0.55 + 0.2,
      },
    }),
  };

  // Crown drops + bounces, like flagging the race finish
  const crownVariants: Variants = {
    hidden: { y: -120, opacity: 0, scale: 1.6 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 150,
        damping: 14,
        delay: 3 * 0.55 + 1.0,
      },
    },
  };

  const firstPlace = rankedPlayers[0];
  const secondPlace = rankedPlayers[1];
  const thirdPlace = rankedPlayers[2];

  const formatDuration = (seconds: number | undefined | null) => {
    if (!seconds || seconds === Infinity) return "--:--";
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleRestart = async () => {
    if (isRestarting) return;
    setIsRestarting(true);

    try {
      // 1. Ambil session saat ini
      const { data: oldSess, error: oldSessErr } = await supabaseGame
        .from("sessions")
        .select("*")
        .eq("game_pin", roomCode)
        .single();

      if (oldSessErr || !oldSess) throw new Error("Session not found");

      // 2. Ambil data kuis original untuk mendapatkan semua pertanyaannya
      const { data: quizData, error: quizError } = await supabaseCentral
        .from("quizzes")
        .select("questions")
        .eq("id", oldSess.quiz_id)
        .single();

      if (quizError || !quizData) throw new Error("Quiz data not found");

      const allQuestions = typeof quizData.questions === 'string'
        ? JSON.parse(quizData.questions)
        : quizData.questions;

      // 3. Acak soal-soalnya
      const shuffled = shuffleArray(allQuestions);
      const limit = oldSess.question_limit || 5;
      const sliced = shuffled.slice(0, limit);

      const newPin = Math.floor(100000 + Math.random() * 900000).toString();
      const newSessionId = generateXID();

      const newSession = {
        id: newSessionId,
        quiz_id: oldSess.quiz_id,
        host_id: oldSess.host_id,
        game_pin: newPin,
        total_time_minutes: oldSess.total_time_minutes,
        question_limit: limit,
        difficulty: oldSess.difficulty,
        current_questions: sliced,
        status: "waiting",
      };

      const newMainSession = {
        ...newSession,
        game_end_mode: "manual",
        allow_join_after_start: false,
        participants: [],
        responses: [],
        application: "NitroQuiz",
      };

      // 4. Insert ke kedua database
      const [mainResult, gameResult] = await Promise.allSettled([
        supabaseCentral.from("game_sessions").insert(newMainSession),
        supabaseGame.from("sessions").insert(newSession),
      ]);

      const mainError = mainResult.status === "rejected" ? mainResult.reason : mainResult.value.error;
      const gameError = gameResult.status === "rejected" ? gameResult.reason : gameResult.value.error;

      if (mainError || gameError) {
        throw new Error("Failed to create new session");
      }

      // 5. Update localStorage dan redirect
      localStorage.setItem("hostGamePin", newPin);
      router.push(`/host/${newPin}/lobby`);

    } catch (err) {
      console.error("Restart failed:", err);
      setIsRestarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f] font-display text-white">
        <div className="text-center z-10">
          <div className="w-16 h-16 border-4 border-[#2d6af2]/30 border-t-[#2d6af2] rounded-full animate-spin mx-auto mb-6"></div>
          <p className="mt-4 text-[#2d6af2] text-xl tracking-[0.2em] uppercase animate-pulse">
            {t("host_leaderboard.loading")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#04060f] relative overflow-hidden font-body text-white flex flex-col items-center pb-12">
      {/* Racing Stripe at top */}
      <div className="racing-stripe z-50 pointer-events-none"></div>

      {/* Background Image */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-40"
        style={{
          backgroundImage: 'url("/assets/backgorund/homepage_bg.webp")',
          backgroundAttachment: 'fixed'
        }}
      ></div>

      {/* Overlays for readability */}
      <div className="fixed inset-0 z-0 bg-gradient-to-t from-[#04060f] via-[#04060f]/80 to-[#7C3AED]/10 pointer-events-none"></div>

      {/* Grid Pattern */}
      <div className="fixed inset-0 z-0 bg-[linear-gradient(rgba(45,106,242,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(45,106,242,0.03)_1px,transparent_1px)] bg-[length:40px_40px] pointer-events-none" />

      {/* Glow Effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#2d6af2]/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#7C3AED]/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Top Bar: Logo1 left, Logo2 right */}
      <div className="w-full z-30 px-4 md:px-6 pt-2 flex items-center justify-between">
        <div className="flex items-center justify-center">
          <button
            onClick={() => router.push("/")}
            className="cursor-pointer hover:opacity-80 active:opacity-60 transition-opacity duration-200"
            title="Ke Halaman Utama"
            aria-label="Ke halaman utama"
          >
            <img
              src="/assets/logo/logo1.png"
              alt="NitroQuiz Logo"
              width={120}
              height={36}
              className="object-contain"
            />
          </button>
        </div>
        <img
          src="/assets/logo/logo2.png"
          alt="GameForSmart.com"
          width={200}
          height={50}
          className="object-contain opacity-70 hover:opacity-100 transition-opacity duration-300 drop-shadow-[0_0_10px_rgba(45,106,242,0.3)]"
        />
      </div>

      <div className="w-full max-w-5xl z-20 px-4 sm:px-6 -mt-2">
        {/* Floating Side Buttons - Desktop only */}
        <div className="fixed left-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50 hidden md:flex">
          <Button
            onClick={() => router.push("/")}
            className="w-12 h-12 rounded-sm p-0 bg-[#0d1a3a] backdrop-blur-md border-2 border-[#2d6af2] shadow-[0_0_12px_rgba(45,106,242,0.5)] hover:bg-[#2d6af2]/40 hover:shadow-[0_0_22px_rgba(45,106,242,0.8)] flex items-center justify-center text-[#60a5fa] transition-all transform -skew-x-[15deg]"
            title={t("host_leaderboard.home_tooltip")}
          >
            <div className="transform skew-x-[15deg]"><House size={20} /></div>
          </Button>
          <Button
            onClick={handleRestart}
            disabled={isRestarting}
            className={`w-12 h-12 rounded-sm p-0 bg-[#0a2a1f] backdrop-blur-md border-2 border-[#00ff9d] shadow-[0_0_12px_rgba(0,255,157,0.5)] hover:bg-[#00ff9d]/30 hover:shadow-[0_0_22px_rgba(0,255,157,0.8)] flex items-center justify-center text-[#00ff9d] transition-all transform -skew-x-[15deg] ${isRestarting ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={t("host_leaderboard.play_again_tooltip")}
          >
            <div className="transform skew-x-[15deg]"><RotateCw size={20} className={isRestarting ? 'animate-spin' : ''} /></div>
          </Button>
        </div>

        {/* Floating Side Buttons - Desktop only */}
        <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50 hidden md:flex">
          <Button
            onClick={() =>
              sessionId &&
              window.open(
                `https://app.gameforsmart.com/stat/${sessionId}`,
                "_blank",
              )
            }
            className="w-12 h-12 rounded-sm p-0 bg-[#2a1a00] backdrop-blur-md border-2 border-[#f59e0b] shadow-[0_0_12px_rgba(245,158,11,0.5)] hover:bg-[#f59e0b]/30 hover:shadow-[0_0_22px_rgba(245,158,11,0.8)] flex items-center justify-center text-[#fbbf24] transition-all transform -skew-x-[15deg]"
            title={t("host_leaderboard.stats_tooltip")}
          >
            <div className="transform skew-x-[15deg]"><BarChart2 size={20} /></div>
          </Button>
        </div>

        {/* ══════════════════════════════════════════
              NITRO QUIZ — PODIUM LAUNCH SEQUENCE
           ══════════════════════════════════════════ */}
        {showResults && rankedPlayers.length > 0 && (
          <div className="relative w-full max-w-3xl mx-auto mt-4 mb-6 px-2">

            {/* ── PODIUM STANDS ── */}
            <div className="relative flex items-end justify-center h-[230px] sm:h-[320px]">

              {/* Ground Nitro Glow */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-8 bg-[#00ff9d]/10 blur-2xl rounded-full pointer-events-none" />

              {/* ── 2ND PLACE ── */}
              {secondPlace && (
                <div className="flex flex-col items-center relative z-10 mx-1 sm:mx-2">
                  {/* Name Tag — speed-slides from left */}
                  <motion.div
                    custom={2}
                    variants={nameplateVariants}
                    initial="hidden"
                    animate="visible"
                    className="mb-2 z-30 relative group cursor-pointer"
                  >
                    <div className="bg-[#0d1526]/90 border-l-4 border-slate-400 backdrop-blur-xl pl-3 pr-4 py-1 transform -skew-x-[10deg] shadow-[4px_4px_0px_rgba(148,163,184,0.2)] relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-400/10 to-transparent" />
                      <p className="font-display text-white text-xs sm:text-base font-black tracking-widest truncate max-w-[100px] sm:max-w-[130px] skew-x-[10deg]">
                        {secondPlace.nickname}
                      </p>
                    </div>

                    {/* Tooltip Player Name 2 */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 flex flex-col items-center drop-shadow-xl translate-y-2 group-hover:translate-y-0">
                      <div className="bg-slate-800 border-2 border-slate-400 text-slate-100 text-[10px] sm:text-xs font-display tracking-widest py-1 px-3 transform -skew-x-[15deg] shadow-[0_0_10px_rgba(148,163,184,0.5)]">
                        <span className="transform skew-x-[15deg] block whitespace-nowrap">
                          {secondPlace.nickname}
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Stand — ROCKETS UP */}
                  <motion.div
                    custom={2}
                    variants={standVariants}
                    initial="hidden"
                    animate="visible"
                    className="w-[88px] sm:w-[130px] h-[120px] sm:h-[185px] relative overflow-hidden rounded-t-md"
                    style={{ background: "linear-gradient(to bottom, #1e2d45 0%, #0d1526 60%, #04060f 100%)", borderTop: "3px solid #94a3b8" }}
                  >
                    {/* Speed lines flash on entry */}
                    <motion.div
                      initial={{ x: "-100%", opacity: 0.7 }}
                      animate={{ x: "200%", opacity: 0 }}
                      transition={{ delay: 2 * 0.55 + 0.1, duration: 0.5, ease: "easeOut" }}
                      className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] pointer-events-none z-20"
                    />
                    {/* Exhaust Flame at base */}
                    <motion.div
                      animate={{ scaleY: [1, 1.4, 0.9, 1.2, 1], opacity: [0.6, 1, 0.5, 0.9, 0.6] }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut", delay: 2 * 0.55 + 0.6 }}
                      className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none z-10"
                      style={{ background: "linear-gradient(to top, rgba(148,163,184,0.3), transparent)", filter: "blur(4px)" }}
                    />
                    {/* RPM Gauge + Avatar */}
                    <div className="flex flex-col items-center justify-start pt-4 h-full relative z-10">
                      <div className="relative">
                        <svg className="w-[60px] h-[60px] sm:w-[80px] sm:h-[80px]" style={{ transform: "rotate(-90deg)" }}>
                          <circle cx="50%" cy="50%" r="44%" fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="6" />
                          <motion.circle
                            custom={2}
                            variants={rpmGaugeVariants}
                            cx="50%" cy="50%" r="44%" fill="none" stroke="#94a3b8" strokeWidth="6"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center p-2">
                          <div className="w-full h-full rounded-full overflow-hidden bg-slate-900/80 border border-slate-600/50">
                            {secondPlace.avatar_url ? (
                              <img src={secondPlace.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <InitialsAvatar name={secondPlace.nickname} size="md" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Score */}
                      <div className={`mt-auto mb-3 font-mono text-lg sm:text-2xl font-black tracking-tighter ${secondPlace.score >= 75 ? 'text-green-400 drop-shadow-[0_0_12px_rgba(34,197,94,0.5)]' : 'text-red-400 drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]'}`}>
                        <Odometer value={secondPlace.score} delay={2 * 0.55 + 0.8} />
                      </div>
                    </div>
                    <div className="absolute -bottom-1 right-1 font-display text-[60px] sm:text-[80px] font-black leading-none text-white opacity-[0.04] select-none pointer-events-none">2</div>
                  </motion.div>
                </div>
              )}

              {/* ── 1ST PLACE ── */}
              {firstPlace && (
                <div className="flex flex-col items-center relative z-20 mx-2 sm:mx-3">
                  {/* Name Tag */}
                  <motion.div
                    custom={3}
                    variants={nameplateVariants}
                    initial="hidden"
                    animate="visible"
                    className="mb-2 z-30 relative group cursor-pointer"
                  >
                    <div className="bg-yellow-500 border-l-4 border-yellow-200 pl-4 pr-5 py-1.5 transform -skew-x-[10deg] shadow-[4px_4px_0px_rgba(234,179,8,0.4),0_0_20px_rgba(234,179,8,0.3)] relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-300/20 to-transparent" />
                      <p className="font-display text-white text-sm sm:text-2xl font-black tracking-widest uppercase truncate max-w-[160px] sm:max-w-[200px] skew-x-[10deg] drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
                        {firstPlace.nickname}
                      </p>
                    </div>

                    {/* Tooltip Player Name 1 */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 flex flex-col items-center drop-shadow-xl translate-y-2 group-hover:translate-y-0">
                      <div className="bg-yellow-900 border-2 border-yellow-400 text-yellow-300 text-xs sm:text-sm font-display tracking-widest py-1.5 px-4 transform -skew-x-[15deg] shadow-[0_0_15px_rgba(250,204,21,0.6)]">
                        <span className="transform skew-x-[15deg] block whitespace-nowrap font-black">
                          {firstPlace.nickname}
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Stand — ROCKETS UP FIRST */}
                  <motion.div
                    custom={3}
                    variants={standVariants}
                    initial="hidden"
                    animate="visible"
                    className="w-[105px] sm:w-[160px] h-[165px] sm:h-[260px] relative overflow-hidden rounded-t-xl"
                    style={{ background: "linear-gradient(to bottom, #78350f 0%, #451a03 50%, #04060f 100%)", borderTop: "4px solid #facc15", boxShadow: "0 0 40px rgba(234,179,8,0.15), 0 0 80px rgba(234,179,8,0.06)" }}
                  >
                    {/* Speed line flash */}
                    <motion.div
                      initial={{ x: "-100%", opacity: 0.9 }}
                      animate={{ x: "200%", opacity: 0 }}
                      transition={{ delay: 3 * 0.55 + 0.1, duration: 0.6, ease: "easeOut" }}
                      className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-yellow-300/40 to-transparent skew-x-[-20deg] pointer-events-none z-20"
                    />
                    {/* NITRO EXHAUST — animated flame jets */}
                    <motion.div
                      animate={{ scaleY: [1, 1.8, 0.7, 1.5, 1], opacity: [0.7, 1, 0.4, 1, 0.7] }}
                      transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut", delay: 3 * 0.55 + 0.6 }}
                      className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none z-10"
                      style={{ background: "linear-gradient(to top, rgba(251,191,36,0.4), rgba(251,191,36,0.1), transparent)", filter: "blur(6px)" }}
                    />
                    <motion.div
                      animate={{ scaleY: [1, 1.3, 0.8, 1.2, 1], opacity: [0.4, 0.7, 0.2, 0.6, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut", delay: 3 * 0.55 + 0.65 }}
                      className="absolute bottom-0 left-1/4 right-1/4 h-14 pointer-events-none z-10"
                      style={{ background: "linear-gradient(to top, rgba(250,204,21,0.6), rgba(251,146,60,0.3), transparent)", filter: "blur(8px)" }}
                    />

                    {/* RPM Gauge + Avatar */}
                    <div className="flex flex-col items-center justify-start pt-5 sm:pt-7 h-full relative z-10">
                      <div className="relative">
                        <svg className="w-[72px] h-[72px] sm:w-[96px] sm:h-[96px]" style={{ transform: "rotate(-90deg)" }}>
                          <circle cx="50%" cy="50%" r="44%" fill="none" stroke="rgba(250,204,21,0.08)" strokeWidth="7" />
                          <motion.circle
                            custom={3}
                            variants={rpmGaugeVariants}
                            cx="50%" cy="50%" r="44%" fill="none" stroke="#facc15" strokeWidth="7"
                            strokeLinecap="round"
                          />
                        </svg>
                        {/* Rotating nitro ring */}
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                          className="absolute inset-0 rounded-full"
                          style={{ border: "2px dashed rgba(250,204,21,0.2)" }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-3">
                          <div className="w-full h-full rounded-full overflow-hidden bg-yellow-950/60 border-2 border-yellow-500/60 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                            {firstPlace.avatar_url ? (
                              <img src={firstPlace.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <InitialsAvatar name={firstPlace.nickname} size="lg" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Score */}
                      <div className={`mt-auto mb-5 sm:mb-7 font-mono text-3xl sm:text-5xl font-black tracking-tighter italic ${firstPlace.score >= 75 ? 'text-green-400 drop-shadow-[0_0_20px_rgba(34,197,94,0.5)]' : 'text-red-400 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]'}`}>
                        <Odometer value={firstPlace.score} delay={3 * 0.55 + 0.8} />
                      </div>
                    </div>
                    <div className="absolute -bottom-3 right-1 font-display text-[90px] sm:text-[130px] font-black leading-none text-yellow-400 opacity-[0.05] select-none pointer-events-none">1</div>
                  </motion.div>
                </div>
              )}

              {/* ── 3RD PLACE ── */}
              {thirdPlace && (
                <div className="flex flex-col items-center relative z-10 mx-1 sm:mx-2">
                  {/* Name Tag */}
                  <motion.div
                    custom={1}
                    variants={nameplateVariants}
                    initial="hidden"
                    animate="visible"
                    className="mb-2 z-30 relative group cursor-pointer"
                  >
                    <div className="bg-[#0d1526]/90 border-l-4 border-orange-700 backdrop-blur-xl pl-3 pr-4 py-1 transform -skew-x-[10deg] shadow-[4px_4px_0px_rgba(194,65,12,0.2)] relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-700/10 to-transparent" />
                      <p className="font-display text-white text-xs sm:text-sm font-black tracking-widest truncate max-w-[90px] sm:max-w-[110px] skew-x-[10deg]">
                        {thirdPlace.nickname}
                      </p>
                    </div>

                    {/* Tooltip Player Name 3 */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 flex flex-col items-center drop-shadow-xl translate-y-2 group-hover:translate-y-0">
                      <div className="bg-[#1a0a05] border-2 border-orange-600 text-orange-400 text-[10px] sm:text-xs font-display tracking-widest py-1 px-3 transform -skew-x-[15deg] shadow-[0_0_10px_rgba(194,65,12,0.5)]">
                        <span className="transform skew-x-[15deg] block whitespace-nowrap">
                          {thirdPlace.nickname}
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Stand */}
                  <motion.div
                    custom={1}
                    variants={standVariants}
                    initial="hidden"
                    animate="visible"
                    className="w-[78px] sm:w-[115px] h-[95px] sm:h-[155px] relative overflow-hidden rounded-t-md"
                    style={{ background: "linear-gradient(to bottom, #2a1309 0%, #1a0a05 60%, #04060f 100%)", borderTop: "3px solid #c2410c" }}
                  >
                    {/* Speed line flash */}
                    <motion.div
                      initial={{ x: "-100%", opacity: 0.7 }}
                      animate={{ x: "200%", opacity: 0 }}
                      transition={{ delay: 1 * 0.55 + 0.1, duration: 0.5, ease: "easeOut" }}
                      className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-orange-400/25 to-transparent skew-x-[-20deg] pointer-events-none z-20"
                    />
                    {/* Exhaust Flame */}
                    <motion.div
                      animate={{ scaleY: [1, 1.4, 0.8, 1.3, 1], opacity: [0.5, 0.9, 0.3, 0.8, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2.0, ease: "easeInOut", delay: 1 * 0.55 + 0.6 }}
                      className="absolute bottom-0 left-0 right-0 h-5 pointer-events-none z-10"
                      style={{ background: "linear-gradient(to top, rgba(194,65,12,0.3), transparent)", filter: "blur(4px)" }}
                    />
                    {/* RPM Gauge + Avatar */}
                    <div className="flex flex-col items-center justify-start pt-3 sm:pt-4 h-full relative z-10">
                      <div className="relative">
                        <svg className="w-[52px] h-[52px] sm:w-[64px] sm:h-[64px]" style={{ transform: "rotate(-90deg)" }}>
                          <circle cx="50%" cy="50%" r="44%" fill="none" stroke="rgba(194,65,12,0.08)" strokeWidth="5" />
                          <motion.circle
                            custom={1}
                            variants={rpmGaugeVariants}
                            cx="50%" cy="50%" r="44%" fill="none" stroke="#ea580c" strokeWidth="5"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center p-1.5 sm:p-2">
                          <div className="w-full h-full rounded-full overflow-hidden bg-orange-950/40 border border-orange-700/40">
                            {thirdPlace.avatar_url ? (
                              <img src={thirdPlace.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <InitialsAvatar name={thirdPlace.nickname} size="sm" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Score */}
                      <div className={`mt-auto mb-2 sm:mb-3 font-mono text-base sm:text-xl font-bold tracking-tighter ${thirdPlace.score >= 75 ? 'text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]'}`}>
                        <Odometer value={thirdPlace.score} delay={1 * 0.55 + 0.8} />
                      </div>
                    </div>
                    <div className="absolute -bottom-1 right-1 font-display text-[50px] sm:text-[70px] font-black leading-none text-orange-700 opacity-[0.05] select-none pointer-events-none">3</div>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        {showResults && rankedPlayers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 2.2,
              type: "spring",
              stiffness: 100,
              damping: 14,
            }}
            className="bg-[#111729]/80 backdrop-blur-xl border border-white/5 p-0 shadow-[0_15px_40px_rgba(0,0,0,0.6)] relative overflow-hidden group md:max-w-xl lg:max-w-3xl xl:max-w-5xl w-full mx-auto"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%)' }}
          >
            {/* Top laser accent */}
            <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-[#2d6af2] to-transparent" />
            {/* Cyber texture on table */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />

            <div className="p-4 sm:p-6">

              <div className="overflow-x-auto w-full custom-scrollbar max-h-[470px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#2d6af2]/20 text-gray-400 font-display text-[10px] sm:text-xs tracking-wider">
                      <th className="px-2 sm:px-4 py-3 w-12 sm:w-16 text-center">
                        {t("host_leaderboard.rank")}
                      </th>
                      <th className="px-2 sm:px-4 py-3 text-left rtl:text-right">{t("host_leaderboard.player")}</th>
                      <th className="px-2 sm:px-4 py-3 text-right">{t("host_leaderboard.score")}</th>
                      <th className="px-2 sm:px-4 py-3 text-center">{t("host_leaderboard.time")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {rankedPlayers.map((player, index) => {
                        const isTop3 = index < 3;
                        return (
                          <motion.tr
                            key={player.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 2.5 + index * 0.1 }}
                            className={`border-b border-white/[0.03] transition-colors ${isTop3
                              ? index === 0
                                ? "bg-yellow-500/5 hover:bg-yellow-500/10"
                                : index === 1
                                  ? "bg-slate-300/5 hover:bg-slate-300/10"
                                  : "bg-orange-600/5 hover:bg-orange-600/10"
                              : "hover:bg-white/[0.02]"
                              }`}
                          >
                            <td className="px-2 sm:px-4 py-3 text-center">
                              <div
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mx-auto font-display text-xs sm:text-sm
                                                            ${index === 0
                                    ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/50"
                                    : index === 1
                                      ? "bg-slate-300/20 text-slate-300 border border-slate-300/50"
                                      : index === 2
                                        ? "bg-orange-600/20 text-orange-400 border border-orange-600/50"
                                        : "bg-white/5 text-gray-500"
                                  }`}
                              >
                                {index + 1}
                              </div>
                            </td>
                            <td className="px-2 sm:px-4 py-3">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-lg shadow-inner overflow-hidden flex-shrink-0">
                                  {player.avatar_url ? (
                                    <img
                                      src={player.avatar_url}
                                      alt="Avatar"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <InitialsAvatar name={player.nickname} size="sm" />
                                  )}
                                </div>
                                <p
                                  className={`font-display tracking-wider text-xs sm:text-sm truncate ${isTop3 ? "text-white" : "text-gray-300"} ${index === 0 && "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"}`}
                                  title={player.nickname}
                                >
                                  {player.nickname}
                                </p>
                              </div>
                            </td>
                            <td className="px-2 sm:px-4 py-3 text-right">
                              <span
                                className={`font-mono font-bold text-sm sm:text-base ${player.score >= 75 ? "text-green-400" : "text-red-400"}`}
                              >
                                {player.score.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-2 sm:px-4 py-3 text-center">
                              <span
                                className={`font-mono text-xs sm:text-sm ${
                                  player.finished_at
                                    ? "text-[#00ff9d]"
                                    : "text-cyan-400"
                                }`}
                              >
                                {formatDuration(player.duration)}
                              </span>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
        {/* Actions Mobile (sm ke bawah) */}
        <div className="md:hidden bg-[#04060f]/90 backdrop-blur-xl w-full text-center py-5 fixed bottom-0 left-0 z-50 flex items-center justify-center space-x-3 border-t border-white/10 px-4 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
          {/* Tombol Home */}
          <button
            onClick={() => router.push("/")}
            className="flex-1 bg-[#0d1a3a]/60 border-2 border-[#2d6af2] shadow-[0_0_15px_rgba(45,106,242,0.3)] rounded-sm text-[#60a5fa] py-3.5 text-[10px] font-display font-bold tracking-[0.15em] uppercase hover:bg-[#2d6af2]/20 transition-all flex items-center justify-center gap-2 transform -skew-x-[15deg]"
          >
            <div className="transform skew-x-[15deg] flex items-center gap-1.5">
              <House size={14} />
              {t("host_leaderboard.home_tooltip")}
            </div>
          </button>

          {/* Tombol Play Again (Restart) */}
          <button
            onClick={handleRestart}
            disabled={isRestarting}
            className={`flex-1 bg-[#0a2a1f]/60 border-2 border-[#00ff9d] shadow-[0_0_15px_rgba(0,255,157,0.3)] rounded-sm text-[#00ff9d] py-3.5 text-[10px] font-display font-bold tracking-[0.15em] uppercase hover:bg-[#00ff9d]/20 transition-all flex items-center justify-center gap-2 transform -skew-x-[15deg] ${isRestarting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="transform skew-x-[15deg] flex items-center gap-1.5">
              <RotateCw size={14} className={isRestarting ? 'animate-spin' : ''} />
              {isRestarting ? "WAIT..." : t("host_leaderboard.play_again_tooltip")}
            </div>
          </button>

          {/* Tombol Statistics */}
          <button
            onClick={() =>
              sessionId &&
              window.open(
                `https://app.gameforsmart.com/stat/${sessionId}`,
                "_blank",
              )
            }
            className="flex-1 bg-[#2a1a00]/60 border-2 border-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.3)] rounded-sm text-[#fbbf24] py-3.5 text-[10px] font-display font-bold tracking-[0.15em] uppercase hover:bg-[#f59e0b]/20 transition-all flex items-center justify-center gap-2 transform -skew-x-[15deg]"
          >
            <div className="transform skew-x-[15deg] flex items-center gap-1.5">
              <BarChart2 size={14} />
              STAT
            </div>
          </button>
        </div>
      </div>
      <FloatingHostActions />
    </div>
  );
}
