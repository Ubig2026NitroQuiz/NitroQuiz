"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Users, Clock, Flag, Trophy, Skull } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

const carImageMap: Record<string, string> = {
  purple: "/assets/car/car1_v2.webp",
  white: "/assets/car/car2_v2.webp",
  black: "/assets/car/car3_v2.webp",
  aqua: "/assets/car/car4_v2.webp",
  blue: "/assets/car/car5_v2.webp",
};

interface Participant {
  id: string;
  nickname: string;
  car_character: string;
  score: number;
  current_question: number;
  finished_at: string | null;
  eliminated: boolean;
  user_id?: string | null;
}

export default function GameMonitorPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params.roomCode as string;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);

  // Session state
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [timeLeft, setTimeLeft] = useState(300); // 5 mins default
  const [isEnding, setIsEnding] = useState(false);

  // Track participants using ref for bot logic interval
  const participantsRef = useRef(participants);
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  // 1. Initial Load: Get Session and Participants
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch Session
        const { data: sessionData, error: sessionError } = await supabase
          .from("sessions")
          .select("id, question_limit, total_time_minutes, started_at")
          .eq("game_pin", roomCode)
          .single();

        if (sessionError) {
          console.error("Session fetch error:", sessionError);
          // alert("Could not load session data!");
          return;
        }

        if (sessionData) {
          setSessionId(sessionData.id);
          setTotalQuestions(sessionData.question_limit || 5);
          setTimeLeft((sessionData.total_time_minutes || 5) * 60);

          // Fetch Participants
          const { data: pData } = await supabase
            .from("participants")
            .select("*")
            .eq("session_id", sessionData.id);

          if (pData) {
            setParticipants(pData as Participant[]);
          }

          // Update session status to active if not already
          await supabase
            .from("sessions")
            .update({ status: "active", started_at: new Date().toISOString() })
            .eq("id", sessionData.id);
        }
      } catch (err) {
        console.error("Initialization error:", err);
      }
    };

    fetchInitialData();
  }, [roomCode]);

  // 2. Real-time Subscription for Player Updates
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel("host_game_monitor")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "participants",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const updated = payload.new as Participant;
          setParticipants((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p)),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "participants",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setParticipants((prev) => [...prev, payload.new as Participant]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // 3. Timer Logic
  useEffect(() => {
    if (timeLeft <= 0) {
      handleEndRace();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // 4. Bot Brain System
  useEffect(() => {
    if (!sessionId || isEnding) return;

    // Bot actions run every 3 seconds
    const botInterval = setInterval(() => {
      // Retrieve latest participant data from ref
      const currentPlayers = participantsRef.current;

      // Find all active bots who haven't finished yet
      const activeBots = currentPlayers.filter(
        (p) =>
          p.car_character?.endsWith("-bot") &&
          !p.eliminated &&
          p.current_question < totalQuestions &&
          p.finished_at === null,
      );

      // Give each bot a 60% chance to answer and advance per tick (simulates thinking)
      activeBots.forEach(async (bot) => {
        if (Math.random() > 0.4) {
          const nextQ = bot.current_question + 1;
          // Bots can gain random score simulating "Time Multiplier" logic
          const scoreAdd = Math.floor(Math.random() * 80) + 20;
          const isFinished = nextQ >= totalQuestions;

          try {
            await supabase
              .from("participants")
              .update({
                current_question: nextQ,
                score: bot.score + scoreAdd,
                finished_at: isFinished ? new Date().toISOString() : null,
              })
              .eq("id", bot.id);
          } catch (e) {
            console.error("Bot action error:", e);
          }
        }
      });
    }, 3000);

    return () => clearInterval(botInterval);
  }, [sessionId, isEnding, totalQuestions]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleEndRace = async () => {
    if (isEnding || !sessionId) return;
    setIsEnding(true);

    try {
      await supabase
        .from("sessions")
        .update({ status: "finished", ended_at: new Date().toISOString() })
        .eq("id", sessionId);

      // Navigate to Podium/Leaderboard
      router.push(`/host/${roomCode}/podium`);
    } catch (error) {
      console.error("Failed to end race:", error);
      setIsEnding(false);
    }
  };

  // Derived states
  // Sort players by position (score and progression)
  const rankedParticipants = useMemo(() => {
    return [...participants].sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.current_question - a.current_question;
    });
  }, [participants]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden font-body text-white flex flex-col">
      {/* Dark Space & Grids Background */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-[#0a0a0f] to-[#050508] pointer-events-none"></div>
      <div className="fixed inset-0 z-0 bg-[linear-gradient(rgba(45,106,242,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(45,106,242,0.05)_1px,transparent_1px)] bg-[length:40px_40px] pointer-events-none"></div>
      <div className="scanlines z-10 opacity-30 pointer-events-none"></div>

      {/* Header / HUD */}
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          type: "spring",
          stiffness: 100,
          damping: 14,
        }}
        className="relative z-20 w-full px-6 py-4 flex items-center justify-between border-b border-[#2d6af2]/20 bg-black/40 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-center gap-6">
          <div className="pointer-events-auto">
            {/* <Logo width={140} height={40} withText={false} animated={false} />
                            </div>
                            <div className="pointer-events-auto mr-16 md:mr-20"> */}
            <Image
              src="/assets/logo/logo2.png"
              alt="GameForSmart.com"
              width={240}
              height={60}
              className="object-contain opacity-70 hover:opacity-100 transition-opacity duration-300 drop-shadow-[0_0_10px_rgba(45,106,242,0.3)]"
              priority
            />
          </div>

          <div className="hidden md:flex items-center gap-2 bg-[#2d6af2]/10 border border-[#2d6af2]/30 px-4 py-2 rounded-lg">
            <Users size={16} className="text-[#2d6af2]" />
            <span className="font-display tracking-widest text-[#2d6af2]">
              {participants.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-8">
          {/* Timer */}
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 px-6 py-2 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <Clock
              size={20}
              className={
                timeLeft < 60 ? "text-red-500 animate-pulse" : "text-white"
              }
            />
            <span
              className={`font-display text-2xl tracking-widest ${timeLeft < 60 ? "text-red-500" : "text-white"}`}
            >
              {formatTime(timeLeft)}
            </span>
          </div>

          <Button
            onClick={handleEndRace}
            disabled={isEnding}
            className={`bg-red-500 hover:bg-red-600 text-white font-display text-sm px-8 py-5 rounded-lg border-2 shadow-[0_0_15px_rgba(239,68,68,0.5)] uppercase tracking-widest transition-all ${isEnding ? "border-red-500 opacity-80 cursor-not-allowed" : "border-red-400"}`}
          >
            {isEnding ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ENDING...
              </span>
            ) : (
              "END RACE"
            )}
          </Button>
        </div>
      </motion.div>

      {/* Main Tracks Area */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 0.6,
          delay: 0.1,
          type: "spring",
          stiffness: 100,
          damping: 14,
        }}
        className="relative z-20 flex-1 w-full mx-auto p-4 md:p-8 overflow-y-auto custom-scrollbar"
      >
        <div className="max-w-7xl mx-auto space-y-4">
          <AnimatePresence>
            {rankedParticipants.map((player, index) => {
              // Calculate progress percentage (avoiding division by zero)
              const rawProgress =
                totalQuestions > 0
                  ? (player.current_question / totalQuestions) * 100
                  : 0;
              // Cap at 100% just in case
              const progress = Math.min(100, Math.max(0, rawProgress));

              const isFinished = player.finished_at !== null || progress >= 100;

              return (
                <motion.div
                  key={player.id}
                  layout
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative flex items-center bg-gradient-to-r from-[#0a101f] to-[#111827] border border-[#2d6af2]/20 rounded-2xl p-4 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)] group"
                >
                  {/* Position Indicator */}
                  <div className="w-12 flex-shrink-0 flex justify-center z-10">
                    {index === 0 && participants.length > 1 && progress > 0 ? (
                      <Trophy
                        className="text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]"
                        size={28}
                      />
                    ) : (
                      <span className="font-display text-2xl text-white/40 group-hover:text-white/80 transition-colors">
                        #{index + 1}
                      </span>
                    )}
                  </div>

                  {/* Player Info */}
                  <div className="w-40 flex-shrink-0 space-y-1 z-10 px-2 border-r border-white/10">
                    <p
                      className="font-display text-white text-base truncate uppercase tracking-wider block"
                      title={player.nickname}
                    >
                      {player.nickname}
                    </p>
                    <p className="font-mono text-[#00ff9d] text-sm font-bold flex items-center gap-1">
                      <span>⭐</span>
                      {player.score.toLocaleString()}
                    </p>
                  </div>

                  {/* The Track Container */}
                  <div className="flex-1 relative h-[60px] mx-6 flex items-center z-10">
                    {/* Physical Track Background */}
                    <div className="absolute inset-x-0 h-4 bg-gray-900 rounded-full border border-gray-700 shadow-inner flex items-center overflow-hidden">
                      {/* Dashed Line inside asphalt */}
                      <div
                        className="w-full h-[2px] bg-auto"
                        style={{
                          backgroundImage:
                            "linear-gradient(to right, rgba(255,255,255,0.2) 50%, transparent 50%)",
                          backgroundSize: "20px 100%",
                        }}
                      ></div>
                    </div>

                    {/* Finish Line Checkered */}
                    <div className="absolute right-0 w-6 bottom-0 top-0 overflow-hidden flex flex-wrap content-start">
                      <div className="w-full h-full opacity-60 bg-[linear-gradient(45deg,transparent_25%,#fff_25%,#fff_50%,transparent_50%,transparent_75%,#fff_75%,#fff_100%)] bg-[length:10px_10px]"></div>
                    </div>

                    {/* Moving Car Absolute Element */}
                    <motion.div
                      className="absolute left-0 z-20 flex items-center justify-center -ml-6"
                      animate={{ left: `${progress}%` }}
                      transition={{
                        type: "spring",
                        stiffness: 40,
                        damping: 15,
                      }}
                    >
                      <div className="relative transform hover:scale-110 transition-transform">
                        {/* Fire Exhaust Glow behind car */}
                        <div className="absolute top-1/2 left-0 w-16 h-8 bg-[#00ff9d]/30 blur-md rounded-full -translate-y-1/2 -translate-x-10 animate-pulse"></div>

                        {player.eliminated ? (
                          <div className="w-16 h-12 flex items-center justify-center bg-red-500/20 rounded-full border border-red-500">
                            <Skull className="text-red-500" />
                          </div>
                        ) : (
                          (() => {
                            const baseCar = (
                              player.car_character || "purple"
                            ).replace("-bot", "");
                            const carSrc =
                              carImageMap[baseCar] || carImageMap["purple"];
                            return (
                              <div className="w-20 sm:w-24 group-hover:scale-110 drop-shadow-[0_0_15px_rgba(0,195,255,0.3)] transition-all">
                                <img
                                  src={carSrc}
                                  alt="car"
                                  className="w-full h-auto object-contain"
                                />
                              </div>
                            );
                          })()
                        )}

                        {/* Mini pop-up for progress text */}
                        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 px-2 py-0.5 rounded border border-[#2d6af2]/50 shadow-lg">
                          <span className="font-display text-[10px] text-[#2d6af2] tracking-widest">
                            {player.current_question}/{totalQuestions}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Finish Status */}
                  <div className="w-28 flex-shrink-0 flex justify-end z-10">
                    {isFinished ? (
                      <div className="bg-[#00ff9d]/20 border border-[#00ff9d]/50 px-3 py-1.5 rounded-lg text-[#00ff9d] font-display text-[10px] tracking-widest animate-pulse w-full text-center shadow-[0_0_15px_rgba(0,255,157,0.3)]">
                        FINISHED
                      </div>
                    ) : player.eliminated ? (
                      <div className="bg-red-500/20 border border-red-500/50 px-3 py-1.5 rounded-lg text-red-500 font-display text-[10px] tracking-widest w-full text-center">
                        CRASHED
                      </div>
                    ) : (
                      <div className="border border-white/10 px-3 py-1.5 rounded-lg text-gray-500 font-display text-[10px] tracking-widest w-full text-center opacity-50">
                        RACING
                      </div>
                    )}
                  </div>

                  {/* Position 1 Highlight glow */}
                  {index === 0 && participants.length > 1 && progress > 0 && (
                    <div className="absolute inset-0 border-2 border-yellow-400/30 rounded-2xl pointer-events-none animate-pulse"></div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {participants.length === 0 && (
            <div className="h-64 flex flex-col items-center justify-center text-gray-500 bg-black/40 rounded-3xl border border-white/5">
              <Clock size={48} className="mb-4 opacity-50 text-[#2d6af2]" />
              <p className="font-display tracking-[0.2em] text-lg uppercase text-[#2d6af2]/70">
                Waiting for Grid Protocol...
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
