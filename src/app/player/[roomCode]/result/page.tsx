"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Users,
  Clock,
  Star,
  ChevronRight,
  House,
  RotateCcw,
  BarChart2,
  LogOut,
  Home,
  RotateCcwIcon,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { supabaseGame } from "@/lib/supabase/game-client";

const carImageMap: Record<string, string> = {
  rico: "/assets/characters/rico/showroom/showroom1.png",
  gecho: "/assets/characters/gecho/showroom/showroom1.png",
  roadhog: "/assets/characters/roadhog/showroom/showroom1.png",
  // Legacy fallbacks
  purple: "/assets/characters/rico/showroom/showroom1.png",
  white: "/assets/characters/gecho/showroom/showroom1.png",
  black: "/assets/characters/roadhog/showroom/showroom1.png",
  aqua: "/assets/characters/rico/showroom/showroom1.png",
  blue: "/assets/characters/rico/showroom/showroom1.png",
};


interface Participant {
  id: string;
  nickname: string;
  car_character: string;
  score: number;
  correct: number;
  current_question: number;
  finished_at: string | null;
  duration: number;
  eliminated: boolean;
  avatar_url?: string | null;
  user_id?: string | null;
}

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
  const fontSize = size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-xl' : 'text-xs';
  return (
    <div
      className={`w-full h-full rounded-full flex items-center justify-center ${fontSize} font-black text-white`}
      style={{ backgroundColor: getAvatarColor(name) }}
    >
      {getInitials(name)}
    </div>
  );
};

export default function PlayerResultPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const roomCode = (params.roomCode as string)?.toUpperCase();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileView, setMobileView] = useState<"result" | "stats">("result");
  const [showResults, setShowResults] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { user, profile, loading: authLoading } = useAuth();
  const [storedParticipantId, setStoredParticipantId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setStoredParticipantId(localStorage.getItem("nitroquiz_game_participantId"));
    }
  }, []);

  const fetchResults = async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabaseGame
        .from("sessions")
        .select("id, question_limit, status")
        .eq("game_pin", roomCode)
        .single();

      if (sessionError || !sessionData) {
        console.error("Session not found", sessionError);
        return;
      }

      if (sessionData.question_limit)
        setTotalQuestions(sessionData.question_limit);

      setSessionId(sessionData.id);
      setSessionStatus(sessionData.status);

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

  useEffect(() => {
    fetchResults();
    const channel = supabaseGame
      .channel(`leaderboard_updates_${roomCode}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "participants",
          filter: sessionId ? `session_id=eq.${sessionId}` : undefined
        },
        () => {
          fetchResults();
        },
      )
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
    return () => {
      supabaseGame.removeChannel(channel);
    };
  }, [roomCode, router]);

  const rankedPlayers = [...participants].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const dA = a.duration || Infinity;
    const dB = b.duration || Infinity;
    return dA - dB;
  });

  const isCurrentPlayer = (p: Participant) => {
    // 1. Match by user_id if logged in
    if (user?.id && p.user_id === user.id) return true;
    // 2. Match by stored participantId from joining
    if (storedParticipantId && p.id === storedParticipantId) return true;
    // 3. Fallback to nickname for extreme cases
    if (!user?.id && !storedParticipantId && p.nickname === profile?.username) return true;
    return false;
  };

  const currentPlayerRank = rankedPlayers.findIndex(isCurrentPlayer) + 1;
  const currentPlayerData = rankedPlayers.find(isCurrentPlayer);
  const getDisplayName = (p: Participant) => {
    if (p.nickname) return p.nickname;
    if (profile?.fullname) return profile.fullname;
    if (profile?.username) return profile.username;
    return user?.email || t("player_result.player_fallback");
  };

  const currentPlayerCarSrc = (() => {
    if (!currentPlayerData) return carImageMap["purple"];
    const base = (currentPlayerData.car_character || "purple").replace(
      "-bot",
      "",
    );
    return carImageMap[base] || carImageMap["purple"];
  })();

  const getRankSuffix = (rank: number) => {
    if (rank === 1) return "st";
    if (rank === 2) return "nd";
    if (rank === 3) return "rd";
    return "th";
  };

  const triggerConfetti = () => {
    const duration = 4000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 50 };
    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;
    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 40 * (timeLeft / duration);
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

  const allFinished =
    sessionStatus === "completed" || sessionStatus === "finished" ||
    (participants.length > 0 &&
      participants.every((p) => p.finished_at || p.eliminated));

  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        setShowResults(true);
        if (rankedPlayers.length > 0 && allFinished) setTimeout(() => triggerConfetti(), 1000);
      }, 600);
    }
  }, [isLoading, rankedPlayers.length, allFinished]);

  // Force portrait on result page
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

  const podiumVariants: any = {
    hidden: { y: 150, opacity: 0 },
    visible: (custom: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 70,
        damping: 12,
        delay: custom * 0.35 + 0.4,
      },
    }),
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

  const NitroBackground = () => (
    <>
      <div className="racing-stripe z-50 pointer-events-none absolute top-0 inset-x-0 h-1"></div>

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
    </>
  );

  const MobileStatCard = ({ children }: { children: React.ReactNode }) => (
    <div
      className="flex flex-col items-center justify-center py-4 px-1 transform -skew-x-[8deg]"
      style={{
        background: "linear-gradient(155deg,#1a2540,#0d1526)",
        border: "1px solid rgba(45,106,242,0.4)",
        boxShadow: "0 0 16px rgba(45,106,242,0.1)",
        clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)',
      }}
    >
      <div className="transform skew-x-[8deg]">{children}</div>
    </div>
  );

  const DesktopStatCard = ({
    label,
    children,
  }: {
    label: string;
    children: React.ReactNode;
  }) => (
    <div
      className="overflow-hidden flex-1 flex flex-col justify-center items-center"
      style={{
        background: "rgba(200,215,240,0.08)",
        border: "1px solid rgba(180,200,240,0.25)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
        clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)',
      }}
    >
      <div className="text-center mb-1">
        <p
          className="font-display text-[12px] font-bold uppercase tracking-[0.28em]"
          style={{ color: "rgba(190,205,235,0.7)" }}
        >
          {label}
        </p>
      </div>
      <div className="text-center">{children}</div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f] font-display text-white">
        <div className="text-center z-10">
          <div className="w-16 h-16 border-4 border-[#2d6af2]/30 border-t-[#2d6af2] rounded-full animate-spin mx-auto mb-6" />
          <p className="mt-4 text-[#2d6af2] text-xl tracking-[0.2em] uppercase animate-pulse">
            {t("player_result.establishing_signal")}
          </p>
        </div>
      </div>
    );
  }

  // Separated waiting screens deleted to unify layout

  return (
    <>
      {/* ══ MOBILE ══ */}
      <div className="md:hidden min-h-screen bg-[#04060f] text-white flex flex-col relative overflow-hidden font-body">
        <NitroBackground />
        {mobileView === "result" && showResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 flex flex-col min-h-screen px-4 pt-8 pb-8"
          >
            <div className="flex justify-center mb-5 flex-shrink-0">
              <button
                onClick={() => router.push("/")}
                className="cursor-pointer hover:opacity-80 active:opacity-60 transition-opacity duration-200"
                title="Ke Halaman Utama"
                aria-label="Ke halaman utama"
              >
                <img
                  src="/assets/logo/logo1.png"
                  alt="NitroQuiz"
                  className="h-14 object-contain drop-shadow-[0_0_30px_rgba(45,106,242,0.8)]"
                />
              </button>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 80 }}
              className="relative w-full rounded-2xl overflow-hidden mb-4 flex-shrink-0"
              style={{
                background:
                  "linear-gradient(155deg,#0d1b3e 0%,#091428 55%,#05101f 100%)",
                border: "1.5px solid rgba(45,106,242,0.55)",
                boxShadow:
                  "0 0 40px rgba(45,106,242,0.18),inset 0 0 40px rgba(0,0,0,0.25)",
              }}
            >
              <div className="absolute top-5 left-7 w-5 h-5 rounded-full bg-slate-700/30 border border-slate-600/20" />
              <div className="absolute top-12 right-10 w-3.5 h-3.5 rounded-full bg-blue-900/35 border border-blue-700/20" />
              <div className="absolute bottom-16 left-5 w-2 h-2 rounded-full bg-slate-600/25" />
              <div className="absolute top-8 right-5 w-1.5 h-1.5 rounded-full bg-white/15" />
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-32 h-16 bg-[#2d6af2]/15 blur-2xl rounded-full" />
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
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="grid grid-cols-4 gap-2 mb-6 flex-shrink-0"
            >
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
              <MobileStatCard>
                <span className="font-display text-white text-2xl font-black leading-none">
                  {currentPlayerData?.score ?? 0}
                </span>
                <span className="text-gray-400 text-[9px] uppercase tracking-widest mt-1.5 font-mono">
                  {t("player_result.score")}
                </span>
              </MobileStatCard>
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
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="flex gap-3 flex-shrink-0"
            >
              <button
                onClick={() => router.push("/")}
                className="group/btn flex-1 h-14 flex items-center justify-center gap-2 font-display text-sm font-bold uppercase tracking-widest text-white active:scale-95 transition-all transform -skew-x-[12deg] relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg,#00bcd4,#0288d1)",
                  boxShadow: "0 0 24px rgba(0,188,212,0.38)",
                }}
              >
                <div className="absolute inset-0 bg-white/15 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                <span className="relative z-10 transform skew-x-[12deg] flex items-center gap-2"><House className="w-5 h-5" /> {t("player_result.home")}</span>
              </button>
              <button
                onClick={() => sessionId && (window.location.href = `https://app.gameforsmart.com/stat/${sessionId}`)}
                className="group/btn flex-1 h-14 flex items-center justify-center gap-2 font-display text-sm font-bold uppercase tracking-widest text-white active:scale-95 transition-all transform -skew-x-[12deg] relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg,#f59e0b,#d97706)",
                  boxShadow: "0 0 24px rgba(245,158,11,0.38)",
                }}
              >
                <div className="absolute inset-0 bg-white/15 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                <span className="relative z-10 transform skew-x-[12deg] flex items-center gap-2"><BarChart2 className="w-5 h-5" /> {t("player_result.stats")}</span>
              </button>
            </motion.div>
          </motion.div>
        )}
        {mobileView === "stats" && showResults && (
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative z-10 flex flex-col min-h-screen px-4 pt-6 pb-8"
          >
            <div className="flex items-center gap-3 mb-4 flex-shrink-0">
              <button
                onClick={() => setMobileView("result")}
                className="w-10 h-10 bg-white/10 border border-white/20 flex items-center justify-center text-white text-lg active:scale-95 transition-transform transform -skew-x-[10deg]"
              >
                <span className="transform skew-x-[10deg]">←</span>
              </button>
              <h2 className="font-display text-lg font-black uppercase tracking-widest text-white">
                {t("player_result.leaderboard")}
              </h2>
            </div>
            <div className="relative flex items-end justify-center w-full h-[200px] mb-4 flex-shrink-0">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-8 bg-[#2d6af2]/20 blur-[18px] rounded-full pointer-events-none" />
              {secondPlace && (
                <motion.div
                  custom={2}
                  variants={podiumVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col items-center z-10 mx-[-4px]"
                >
                  <div className="mb-1 text-center">
                    <div className="bg-black/60 border border-slate-300/40 backdrop-blur-md px-2 py-0.5 rounded-lg">
                      <p
                        className={`font-display text-[9px] tracking-wider truncate max-w-[68px] ${(secondPlace.id === storedParticipantId || (secondPlace.nickname === profile?.username && !storedParticipantId)) ? "text-[#00ff9d] font-bold" : "text-slate-200"}`}
                        title={secondPlace.nickname}
                      >
                        {secondPlace.nickname}
                        {(secondPlace.id === storedParticipantId || (secondPlace.nickname === profile?.username && !storedParticipantId)) &&
                          t("player_result.you")}
                      </p>
                      <p className="font-mono text-slate-400 text-[8px]">
                        {secondPlace.score.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="relative mb-2">
                    <div className="w-16 h-16 rounded-full border-2 border-slate-400/50 bg-black/40 overflow-hidden flex items-center justify-center p-0 shadow-lg relative z-10">
                      {secondPlace.avatar_url ? (
                        <img src={secondPlace.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <InitialsAvatar name={secondPlace.nickname} size="sm" />
                      )}
                    </div>
                    <div className="absolute -right-2 -bottom-1 w-10 h-10 bg-black/60 rounded-full border border-white/20 p-1 flex items-center justify-center z-20 shadow-xl">
                      <img
                        src={carImageMap[(secondPlace.car_character || "white").replace("-bot", "")] || carImageMap["white"]}
                        alt="Car"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  <div className="w-[62px] h-[95px] bg-gradient-to-b from-[#1a2235] to-[#0a0f1a] border-t-2 border-l border-r border-[#64748b] rounded-t-xl flex items-end justify-center pb-2">
                    <span className="font-display text-2xl text-slate-600/40 font-bold">
                      2
                    </span>
                  </div>
                </motion.div>
              )}
              {firstPlace && (
                <motion.div
                  custom={3}
                  variants={podiumVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col items-center z-20 mx-0.5 -mb-1"
                >
                  <div className="mb-1 text-center">
                    <div className="bg-[#1a1500]/80 border border-yellow-500/60 backdrop-blur-md px-2.5 py-1 rounded-xl">
                      <p
                        className={`font-display text-[9px] font-bold tracking-widest uppercase truncate max-w-[88px] ${(firstPlace.id === storedParticipantId || (firstPlace.nickname === profile?.username && !storedParticipantId)) ? "text-[#00ff9d]" : "text-yellow-500"}`}
                        title={firstPlace.nickname}
                      >
                        {firstPlace.nickname}
                        {(firstPlace.id === storedParticipantId || (firstPlace.nickname === profile?.username && !storedParticipantId)) &&
                          t("player_result.you")}
                      </p>
                      <p className="font-mono text-white text-[8px] mt-0.5 font-bold">
                        {firstPlace.score.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="relative mb-2">
                    <div className="w-20 h-20 rounded-full border-2 border-yellow-500/50 bg-black/40 overflow-hidden flex items-center justify-center p-0 shadow-[0_0_20px_rgba(250,204,21,0.3)] relative z-10">
                      {firstPlace.avatar_url ? (
                        <img src={firstPlace.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <InitialsAvatar name={firstPlace.nickname} size="md" />
                      )}
                    </div>
                    <div className="absolute -right-3 -bottom-1 w-12 h-12 bg-black/60 rounded-full border border-yellow-500/40 p-1.5 flex items-center justify-center z-20 shadow-xl">
                      <img
                        src={carImageMap[(firstPlace.car_character || "purple").replace("-bot", "")] || carImageMap["purple"]}
                        alt="Car"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  <div className="w-[76px] h-[140px] bg-gradient-to-b from-[#2a1f0a] to-[#0a0f1a] border-t-4 border-l-2 border-r-2 border-[#eab308] rounded-t-xl relative overflow-hidden flex items-end justify-center pb-4">
                    <div className="absolute top-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#eab308] to-transparent" />
                    <span className="font-display text-4xl text-yellow-600/40 font-bold">
                      1
                    </span>
                  </div>
                </motion.div>
              )}
              {thirdPlace && (
                <motion.div
                  custom={1}
                  variants={podiumVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col items-center z-10 mx-[-4px]"
                >
                  <div className="mb-1 text-center">
                    <div className="bg-black/60 border border-orange-700/40 backdrop-blur-md px-2 py-0.5 rounded-lg">
                      <p
                        className={`font-display text-[9px] tracking-wider truncate max-w-[68px] ${(thirdPlace.id === storedParticipantId || (thirdPlace.nickname === profile?.username && !storedParticipantId)) ? "text-[#00ff9d] font-bold" : "text-orange-200"}`}
                        title={thirdPlace.nickname}
                      >
                        {thirdPlace.nickname}
                        {(thirdPlace.id === storedParticipantId || (thirdPlace.nickname === profile?.username && !storedParticipantId)) &&
                          t("player_result.you")}
                      </p>
                      <p className="font-mono text-orange-400 text-[8px]">
                        {thirdPlace.score.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="relative mb-2">
                    <div className="w-14 h-14 rounded-full border-2 border-orange-700/50 bg-black/40 overflow-hidden flex items-center justify-center p-0 shadow-lg relative z-10">
                      {thirdPlace.avatar_url ? (
                        <img src={thirdPlace.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <InitialsAvatar name={thirdPlace.nickname} size="sm" />
                      )}
                    </div>
                    <div className="absolute -right-2 -bottom-1 w-9 h-9 bg-black/60 rounded-full border border-white/20 p-1 flex items-center justify-center z-20 shadow-xl">
                      <img
                        src={carImageMap[(thirdPlace.car_character || "black").replace("-bot", "")] || carImageMap["black"]}
                        alt="Car"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  <div className="w-[52px] h-[75px] bg-gradient-to-b from-[#25140b] to-[#0a0f1a] border-t-2 border-l border-r border-[#c2410c] rounded-t-xl flex items-end justify-center pb-1.5">
                    <span className="font-display text-2xl text-orange-700/40 font-bold">
                      3
                    </span>
                  </div>
                </motion.div>
              )}
            </div>
            <div className="bg-black/40 backdrop-blur-xl border border-[#2d6af2]/30 p-3 shadow-[0_0_30px_rgba(0,0,0,0.5)] mb-4 overflow-y-auto flex-1" style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)' }}>
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
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-display text-[10px] font-bold flex-shrink-0 ${index === 0 ? "bg-yellow-500/20 text-yellow-500" : index === 1 ? "bg-slate-300/20 text-slate-300" : index === 2 ? "bg-orange-600/20 text-orange-400" : "bg-white/5 text-gray-500"}`}
                      >
                        {index + 1}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-black/40 border border-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {player.eliminated
                          ? "💀"
                          : player.avatar_url ? (
                            <img src={player.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <InitialsAvatar name={player.nickname} size="sm" />
                          )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-display text-[10px] tracking-wider uppercase truncate ${isMe ? "text-[#00ff9d] font-bold" : index === 0 ? "text-yellow-400" : "text-gray-300"}`}
                          title={player.nickname}
                        >
                          {getDisplayName(player)} {isMe && t("player_result.you")}
                        </p>
                      </div>
                      <span
                        className={`font-mono font-bold text-xs flex-shrink-0 ${isMe ? "text-[#00ff9d]" : index === 0 ? "text-yellow-400" : "text-[#00ff9d]"}`}
                      >
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
            <button
              onClick={() => sessionId && (window.location.href = `https://app.gameforsmart.com/stat/${sessionId}`)}
              className="group/btn w-full h-12 flex items-center justify-center gap-2 border border-[#f59e0b]/50 text-[#f59e0b] font-display text-sm uppercase tracking-widest hover:bg-[#f59e0b]/10 active:scale-95 transition-all flex-shrink-0 transform -skew-x-[10deg] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[#f59e0b]/10 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
              <span className="relative z-10 transform skew-x-[10deg] flex items-center gap-2"><BarChart2 className="w-4 h-4" /> {t("player_result.stats")}</span>
            </button>
          </motion.div>
        )}
      </div>

      <div
        className="hidden md:block fixed inset-0 font-body text-white overflow-hidden"
        style={{ background: "#04060f" }}
      >
        <NitroBackground />

        {/* Floating Logos */}
        <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-8 py-6">
          <button
            onClick={() => router.push("/")}
            className="cursor-pointer hover:opacity-80 active:opacity-60 transition-opacity duration-200"
            title="Ke Halaman Utama"
            aria-label="Ke halaman utama"
          >
            <img src="/assets/logo/logo1.png" alt="Logo" className="h-14 object-contain" />
          </button>
          <img src="/assets/logo/logo2.png" alt="NitroQuiz" className="h-10 object-contain ml-auto opacity-90 pointer-events-none" />
        </div>

        {showResults && (
          <>
            {/* ── LEFT — Driver Profile Card ── */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 90 }}
              className="absolute z-10"
              style={{ top: "20%", left: "12%", bottom: "18%", width: "min(260px, 17vw)" }}
            >
              <div
                className="w-full h-full overflow-hidden flex flex-col"
                style={{
                  background: "linear-gradient(170deg, #0a1628 0%, #050a18 100%)",
                  border: "1px solid rgba(45,106,242,0.4)",
                  boxShadow: "0 0 50px rgba(45,106,242,0.12), inset 0 1px 0 rgba(255,255,255,0.05)",
                  backdropFilter: "blur(20px)",
                  clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%)',
                }}
              >
                {/* Racing stripe top */}
                <div className="h-[3px] w-full flex-shrink-0" style={{ background: "linear-gradient(90deg, #7c3aed, #2d6af2, #06b6d4)" }} />

                {/* Avatar zone — large top area */}
                <div className="relative flex-1 flex items-center justify-center" style={{ background: "rgba(2,5,15,0.4)" }}>
                  {/* Background radial glow */}
                  <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(45,106,242,0.12) 0%, transparent 65%)" }} />

                  <div className="relative">
                    {/* Outer pulse ring */}
                    <motion.div
                      className="absolute rounded-full"
                      style={{ inset: "-18px", border: "1px solid rgba(45,106,242,0.2)" }}
                      animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.8, 0.3] }}
                      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    />
                    {/* Mid rotating dashed ring */}
                    <motion.div
                      className="absolute rounded-full"
                      style={{ inset: "-8px", border: "1.5px dashed rgba(96,165,250,0.3)" }}
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                    />
                    {/* Avatar circle */}
                    <div
                      className="w-28 h-28 rounded-full overflow-hidden relative z-10"
                      style={{
                        border: "2.5px solid rgba(45,106,242,0.9)",
                        boxShadow: "0 0 25px rgba(45,106,242,0.5), 0 0 50px rgba(45,106,242,0.15)",
                      }}
                    >
                      {currentPlayerData?.avatar_url ? (
                        <img src={currentPlayerData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <InitialsAvatar name={currentPlayerData ? getDisplayName(currentPlayerData) : 'P'} size="lg" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Divider stripe */}
                <div className="flex-shrink-0 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(45,106,242,0.5), transparent)" }} />

                {/* Name + Status bottom section */}
                <div
                  className="flex-shrink-0 flex flex-col items-center justify-center gap-3 px-5 py-6"
                  style={{ background: "rgba(4,8,20,0.6)" }}
                >
                  <p
                    className="font-display text-white font-black uppercase tracking-widest text-center leading-snug"
                    style={{ fontSize: "clamp(13px,1.2vw,17px)", textShadow: "0 0 20px rgba(255,255,255,0.15)" }}
                    title={currentPlayerData ? getDisplayName(currentPlayerData) : ""}
                  >
                    {currentPlayerData ? getDisplayName(currentPlayerData) : t("player_result.player_fallback")}
                  </p>

                  {currentPlayerData?.eliminated ? (
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg"
                      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.4)" }}>
                      <span className="text-base">💀</span>
                      <span className="font-display text-xs font-black uppercase tracking-widest" style={{ color: "#f87171" }}>{t("player_result.eliminated")}</span>
                    </div>
                  ) : !allFinished ? (
                    <motion.div className="flex items-center gap-2 px-4 py-1.5 rounded-lg"
                      style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.35)" }}
                      animate={{ opacity: [0.7, 1, 0.7] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                      <span className="text-base">⏳</span>
                      <span className="font-display text-xs font-black uppercase tracking-widest" style={{ color: "#93c5fd" }}>{t("player_result.waiting")}</span>
                    </motion.div>
                  ) : currentPlayerRank === 1 ? (
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg"
                      style={{ background: "rgba(250,204,21,0.1)", border: "1px solid rgba(250,204,21,0.45)" }}>
                      <span className="text-base">🏆</span>
                      <span className="font-display text-xs font-black uppercase tracking-widest" style={{ color: "#fde047" }}>{t("player_result.champion")}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg"
                      style={{ background: "rgba(0,255,157,0.08)", border: "1px solid rgba(0,255,157,0.35)" }}>
                      <span className="text-base">✅</span>
                      <span className="font-display text-xs font-black uppercase tracking-widest" style={{ color: "#4ade80" }}>{t("player_result.finished")}</span>
                    </div>
                  )}
                </div>

                {/* Bottom racing stripe */}
                <div className="h-[3px] w-full flex-shrink-0" style={{ background: "linear-gradient(90deg, #06b6d4, #2d6af2, #7c3aed)" }} />
              </div>
            </motion.div>

            {/* ── CENTER — Character Showcase ── */}
            <div
              className="absolute z-10 flex items-center justify-center"
              style={{ top: "60px", left: "26%", right: "26%", bottom: "20px" }}
            >
              <motion.div
                className="relative flex flex-col items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 80 }}
              >
                {/* Ambient background glow behind character */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "radial-gradient(ellipse at 50% 55%, rgba(45,106,242,0.15) 0%, transparent 65%)",
                    filter: "blur(20px)",
                  }}
                />

                {/* Character image — natural, no color filters */}
                <motion.img
                  src={currentPlayerCarSrc}
                  alt="Your Car"
                  className="object-contain relative z-10"
                  style={{
                    width: "clamp(280px,36vw,500px)",
                    maxHeight: "52vh",
                    filter: "drop-shadow(0 12px 40px rgba(0,0,0,0.55))",
                  }}
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                />

                {/* Ground shadow */}
                <div
                  className="relative z-10 flex-shrink-0"
                  style={{
                    width: "clamp(180px,22vw,320px)",
                    height: "18px",
                    marginTop: "-6px",
                    background: "radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, transparent 70%)",
                    filter: "blur(8px)",
                  }}
                />
              </motion.div>
            </div>

            {/* ── RIGHT — Telemetry Stats Panel ── */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 90 }}
              className="absolute z-10 flex flex-col"
              style={{
                top: "20%",
                right: "12%",
                bottom: "18%",
                width: "min(280px, 19vw)",
                background: "linear-gradient(170deg, #0a1628 0%, #050a18 100%)",
                border: "1px solid rgba(45,106,242,0.4)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: "0 0 50px rgba(45,106,242,0.12), inset 0 1px 0 rgba(255,255,255,0.05)",
                clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%)',
                overflow: "hidden",
              }}
            >
              {/* Racing stripe top */}
              <div className="h-[3px] w-full flex-shrink-0" style={{ background: "linear-gradient(90deg, #7c3aed, #2d6af2, #06b6d4)" }} />

              {/* RANK — hero stat */}
              <div
                className="flex-[1.6] flex flex-col items-center justify-center relative"
                style={{ background: "rgba(250,204,21,0.06)", borderBottom: "1px solid rgba(250,204,21,0.2)" }}
              >
                <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(250,204,21,0.08) 0%, transparent 65%)" }} />
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.4em] mb-1" style={{ color: "rgba(250,204,21,0.6)" }}>
                  {t("player_result.rank")}
                </p>
                <motion.p
                  className="font-display font-black text-white leading-none"
                  style={{ fontSize: "clamp(52px,5.5vw,72px)", textShadow: "0 0 30px rgba(250,204,21,0.6), 0 0 60px rgba(250,204,21,0.2)" }}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                >
                  {allFinished ? currentPlayerRank : "?"}
                </motion.p>
                <p className="font-display font-bold mt-0.5" style={{ fontSize: "13px", letterSpacing: "0.25em", color: "#facc15" }}>
                  {allFinished ? getRankSuffix(currentPlayerRank) : t("player_result.wait_for_host")}
                </p>
              </div>

              {/* SCORE */}
              <div
                className="flex-1 flex items-center justify-between px-5 relative"
                style={{ borderBottom: "1px solid rgba(0,255,157,0.15)" }}
              >
                <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: "linear-gradient(to bottom, transparent, #00ff9d, transparent)" }} />
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: "rgba(0,255,157,0.65)" }}>{t("player_result.score")}</p>
                <p className="font-display font-black text-white" style={{ fontSize: "clamp(24px,2.8vw,36px)", textShadow: "0 0 18px rgba(0,255,157,0.5)" }}>
                  {currentPlayerData?.score ?? 0}
                </p>
              </div>

              {/* CORRECT */}
              <div
                className="flex-1 flex items-center justify-between px-5 relative"
                style={{ borderBottom: "1px solid rgba(34,211,238,0.15)" }}
              >
                <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: "linear-gradient(to bottom, transparent, #22d3ee, transparent)" }} />
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: "rgba(34,211,238,0.65)" }}>{t("player_result.correct")}</p>
                <p className="font-display font-black text-white" style={{ fontSize: "clamp(22px,2.6vw,34px)", textShadow: "0 0 16px rgba(34,211,238,0.5)" }}>
                  {totalQuestions > 0 ? `${currentPlayerData?.correct ?? 0}/${totalQuestions}` : (currentPlayerData?.correct ?? 0)}
                </p>
              </div>

              {/* TIME */}
              <div
                className="flex-1 flex items-center justify-between px-5 relative"
              >
                <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: "linear-gradient(to bottom, transparent, #60a5fa, transparent)" }} />
                <p className="font-display text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: "rgba(96,165,250,0.65)" }}>{t("player_result.time")}</p>
                <p className="font-display font-black text-white font-mono" style={{ fontSize: "clamp(20px,2.4vw,30px)", textShadow: "0 0 16px rgba(96,165,250,0.5)" }}>
                  {formatDuration(currentPlayerData?.duration)}
                </p>
              </div>

              {/* Racing stripe bottom */}
              <div className="h-[3px] w-full flex-shrink-0" style={{ background: "linear-gradient(90deg, #06b6d4, #2d6af2, #7c3aed)" }} />
            </motion.div>
          </>
        )}

        {/* Left floating button — Home */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-4">
          <button
            onClick={() => router.push("/")}
            className="w-12 h-12 flex items-center justify-center rounded-sm bg-[#0d1a3a] backdrop-blur-md border-2 border-[#2d6af2] shadow-[0_0_12px_rgba(45,106,242,0.5)] hover:bg-[#2d6af2]/40 hover:shadow-[0_0_22px_rgba(45,106,242,0.8)] text-[#60a5fa] transition-all transform -skew-x-[15deg] active:scale-95"
            title={t("player_result.home")}
          >
            <div className="transform skew-x-[15deg]"><Home className="w-5 h-5" /></div>
          </button>
        </div>

        {/* Right floating button — Statistics */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-4">
          <button
            onClick={() => sessionId && (window.location.href = `https://app.gameforsmart.com/stat/${sessionId}`)}
            className="w-12 h-12 flex items-center justify-center rounded-sm bg-[#2a1a00] backdrop-blur-md border-2 border-[#f59e0b] shadow-[0_0_12px_rgba(245,158,11,0.5)] hover:bg-[#f59e0b]/30 hover:shadow-[0_0_22px_rgba(245,158,11,0.8)] text-[#fbbf24] transition-all transform -skew-x-[15deg] active:scale-95"
            title={t("player_result.stats")}
          >
            <div className="transform skew-x-[15deg]"><BarChart2 className="w-5 h-5" /></div>
          </button>
        </div>
      </div>
    </>
  );
}
