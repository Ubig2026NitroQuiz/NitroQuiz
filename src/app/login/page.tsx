'use client';

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from 'next/navigation';
import { supabaseCentral } from '@/lib/supabase';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Eye, EyeOff, Loader2, Zap, Flag, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { useTranslation } from "react-i18next";

const loginSchema = z.object({
  identifier: z.string().min(3, "login.form.identifier_error_min"),
  password: z.string().min(6, "login.form.password_error_min"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ── Speedometer needle component ──────────────────────────────────────
function Speedometer({ active }: { active: boolean }) {
  return (
    <div className="relative w-20 h-10 overflow-hidden">
      {/* Arc track */}
      <svg viewBox="0 0 80 40" className="w-full h-full" fill="none">
        <path d="M4 40 A36 36 0 0 1 76 40" stroke="rgba(255,255,255,0.06)" strokeWidth="6" strokeLinecap="round"/>
        <motion.path
          d="M4 40 A36 36 0 0 1 76 40"
          stroke="url(#speedGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="113"
          animate={{ strokeDashoffset: active ? 0 : 90 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="speedGrad" x1="0" y1="0" x2="80" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7C3AED"/>
            <stop offset="50%" stopColor="#2d6af2"/>
            <stop offset="100%" stopColor="#00ff9d"/>
          </linearGradient>
        </defs>
        {/* Needle */}
        <motion.line
          x1="40" y1="40" x2="40" y2="8"
          stroke="#00ff9d"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ transformOrigin: "40px 40px" }}
          animate={{ rotate: active ? 80 : -80 }}
          transition={{ duration: 1.2, ease: "easeOut", type: "spring", stiffness: 60 }}
        />
        <circle cx="40" cy="40" r="3" fill="#00ff9d" />
      </svg>
    </div>
  );
}

// ── Checkered flag strip ──────────────────────────────────────────────
function CheckeredStrip({ className = "" }: { className?: string }) {
  return (
    <div
      className={`${className}`}
      style={{
        backgroundImage: `
          linear-gradient(45deg, rgba(255,255,255,0.07) 25%, transparent 25%),
          linear-gradient(-45deg, rgba(255,255,255,0.07) 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.07) 75%),
          linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.07) 75%)
        `,
        backgroundSize: "10px 10px",
        backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0px",
      }}
    />
  );
}

// ── RPM Bar ───────────────────────────────────────────────────────────
function RpmBar({ active }: { active: boolean }) {
  const bars = Array.from({ length: 12 });
  return (
    <div className="flex items-end gap-[2px] h-4">
      {bars.map((_, i) => {
        const isRed = i >= 9;
        const isActive = active && true;
        return (
          <motion.div
            key={i}
            className="w-[3px] rounded-[1px]"
            style={{
              background: isRed ? "#E10600" : i >= 6 ? "#f59e0b" : "#00ff9d",
            }}
            animate={{
              height: isActive
                ? `${Math.min(100, 30 + i * 6 + Math.random() * 10)}%`
                : `${15 + i * 3}%`,
              opacity: isActive ? 1 : 0.25,
            }}
            transition={{
              duration: 0.3,
              delay: i * 0.04,
              repeat: isActive ? Infinity : 0,
              repeatType: "reverse",
              repeatDelay: 0.1 + i * 0.05,
            }}
          />
        );
      })}
    </div>
  );
}



// ── NightCircuit: Cinematic Racing Atmosphere ────────────────────────
// Model: Suasana sirkuit malam hari yang tenang dan berkelas (statis)
function NightCircuit() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-[#02040a]">
      
      {/* ── 1. MAIN CIRCUIT CANVAS (Static Horizon) ── */}
      <div 
        className="absolute inset-0 opacity-60"
        style={{ 
          backgroundImage: 'url("/assets/backgorund/homepage_bg.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.6) contrast(1.1)'
        }}
      />

      {/* ── 2. STATIC TELEMETRY GRID (Subtle Tech Feel) ── */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{ 
          backgroundImage: `
            linear-gradient(rgba(124,58,237,0.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124,58,237,0.2) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px"
        }}
      />

      {/* ── 3. RACING ACCENTS (Static HUD Elements) ── */}
      {/* Technical Labels */}




      {/* ── 4. ATMOSPHERIC LIGHTING (Subtle Glows) ── */}
      {/* Corner Glows */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[#7C3AED]/10 rounded-full blur-[120px]" />
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-[#2d6af2]/10 rounded-full blur-[120px]" />

      {/* ── 5. CROWD FLASHES (Keep but very subtle) ── */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-[2px] h-[2px] bg-white rounded-full"
          style={{ top: `${20 + Math.random() * 40}%`, left: `${Math.random() * 100}%` }}
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{ duration: 0.1, repeat: Infinity, repeatDelay: 5 + Math.random() * 10, delay: i * 2 }}
        />
      ))}

      {/* ── 6. VIGNETTE OVERLAY ── */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#02040a]/40 to-[#02040a] opacity-90" />
      
      {/* Bottom perspective line (Ghost of a track) */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, profile, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [nitroCount, setNitroCount] = useState(0);

  // stable random data (not re-generated on re-render)
  const particles = useMemo(() =>
    Array.from({ length: 22 }, (_, i) => ({
      x: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      delay: Math.random() * 7,
      color: i % 5 === 0 ? "#00ff9d" : i % 5 === 1 ? "#2d6af2" : i % 5 === 2 ? "#7C3AED" : i % 5 === 3 ? "#E10600" : "#f59e0b",
      dur: 5 + Math.random() * 4,
    }))
  , []);

  const tyreMarks = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      x: 5 + Math.random() * 90,
      y: 10 + Math.random() * 80,
      angle: -20 + Math.random() * 40,
      len: 60 + Math.random() * 120,
      delay: i * 0.6,
    }))
  , []);

  const streetLights = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      delay: i * 0.15,
      duration: 0.4,
    }))
  , []);

  const registerUrl =
    typeof window !== "undefined" &&
      window.location.hostname.includes("gameforsmart.com")
      ? "https://app.gameforsmart.com/register"
      : "https://gameforsmartnewui.vercel.app/register";

  useEffect(() => {
    const timer = setTimeout(() => setLaunched(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const identifierVal = watch("identifier", "");
  const passwordVal = watch("password", "");

  useEffect(() => {
    if ((user || profile) && !loading) {
      const pendingCode = localStorage.getItem("nitroquiz_pendingRoomCode");
      if (pendingCode) {
        localStorage.removeItem("nitroquiz_pendingRoomCode");
        router.replace(`/join/${pendingCode}`);
      } else {
        router.replace('/');
      }
    }
  }, [user, profile, loading, router]);

  const resolveEmail = async (input: string) => {
    if (input.includes("@")) return input.toLowerCase();
    const { data, error } = await supabaseCentral
      .from("profiles")
      .select("email")
      .eq("username", input)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("login.form.username_not_found");
    return data.email.toLowerCase();
  };

  const handleEmailLogin = async (data: LoginFormData) => {
    setServerError(null);
    setNitroCount(c => c + 1);
    try {
      const resolvedEmail = await resolveEmail(data.identifier.trim());
      const { error } = await supabaseCentral.auth.signInWithPassword({
        email: resolvedEmail,
        password: data.password,
      });
      if (error) throw error;
    } catch (err: any) {
      setServerError(t(err.message) || t('login.form.generic_error'));
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setNitroCount(c => c + 1);
    try {
      const { error } = await supabaseCentral.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}` },
      });
      if (error) throw error;
    } catch (err: any) {
      setServerError(t('login.google.failed'));
      setIsGoogleLoading(false);
    }
  };

  const isLoggingIn = isSubmitting || isGoogleLoading;

  return (
    <div className="min-h-screen bg-[#04060f] relative overflow-hidden flex items-center justify-center font-body">

      {/* ══════════════════════════════════════════════════════════
           ██  NITROQUIZ — SIGNATURE RACING BACKGROUND  ██
           Layer stack (bottom→top):
           [A] Full-screen bg image  →  [B] Dark overlay
           [C] Diagonal color split  →  [D] Huge neon glows
           [E] Asphalt texture       →  [F] Racing circuit SVG
           [G] Tyre marks            →  [H] Car silhouette
           [I] Nitro bloom           →  [J] Speed streaks
           [K] Ember particles       →  [L] Track floor + line
           [M] Checkered accents     →  [N] Start lights
      ══════════════════════════════════════════════════════════ */}

      {/* ── A. FULL-SCREEN BACKGROUND IMAGE ── */}
      <div
        className="absolute inset-0 z-0 pointer-events-none bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("/assets/backgorund/homepage_bg.png")' }}
      />
      {/* ── B. HEAVY DARK OVERLAY (make image feel like night race) ── */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[#04060f]/85" />
      {/* Gradient fade: dark top, slightly lighter mid */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-b from-[#04060f] via-[#04060f]/60 to-[#04060f]/90" />

      {/* ── C. DIAGONAL COLOR SPLIT (left=red/purple, right=blue) ── */}
      {/* Creates the "two sides of the track" feel */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(
              115deg,
              rgba(225,6,0,0.12)   0%,
              rgba(124,58,237,0.18) 35%,
              transparent          50%,
              rgba(45,106,242,0.14) 65%,
              rgba(0,255,157,0.06)  100%
            )
          `,
        }}
      />

      {/* ── D. HUGE ATMOSPHERIC GLOWS ── */}
      {/* Top-left: F1 red flare */}
      <div
        className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full z-0 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(225,6,0,0.18) 0%, transparent 65%)", filter: "blur(60px)" }}
      />
      {/* Top-right: purple nitro bloom */}
      <div
        className="absolute -top-32 -right-32 w-[650px] h-[650px] rounded-full z-0 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 65%)", filter: "blur(70px)" }}
      />
      {/* Bottom-left: speed blue */}
      <div
        className="absolute -bottom-32 -left-32 w-[550px] h-[550px] rounded-full z-0 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(45,106,242,0.20) 0%, transparent 65%)", filter: "blur(80px)" }}
      />
      {/* Bottom-right: nitro green hint */}
      <div
        className="absolute -bottom-20 -right-20 w-[500px] h-[500px] rounded-full z-0 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,255,157,0.10) 0%, transparent 65%)", filter: "blur(80px)" }}
      />
      {/* Center bloom (behind card) */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div
          className="w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.25) 0%, rgba(45,106,242,0.10) 40%, transparent 70%)", filter: "blur(40px)" }}
        />
      </motion.div>

      {/* ── E. ASPHALT DIAGONAL TEXTURE ── */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(-45deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 16px)`,
        }}
      />


      {/* ── F. NIGHT CIRCUIT (The Racing Experience) ── */}
      <NightCircuit />

      {/* ── G. NOISE OVERLAY (Premium Detail) ── */}
      <div 
        className="absolute inset-0 z-[1] pointer-events-none opacity-[0.035]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

      {/* ── M. CHECKERED FLAG ACCENTS ── */}
      {/* Top stripe */}
      <div className="absolute top-[3px] inset-x-0 h-[4px] z-[98] pointer-events-none overflow-hidden">
        <CheckeredStrip className="w-full h-full opacity-50" />
      </div>
      {/* Corner squares */}
      <CheckeredStrip className="absolute top-[7px] left-0 w-20 h-16 z-[97] opacity-60" />
      <CheckeredStrip className="absolute top-[7px] right-0 w-20 h-16 z-[97] opacity-60" />
      <CheckeredStrip className="absolute bottom-0 left-0 w-20 h-8 z-[2] opacity-30" />
      <CheckeredStrip className="absolute bottom-0 right-0 w-20 h-8 z-[2] opacity-30" />

      {/* ── N. RACE START LIGHTS ── */}


      {/* ── TOP RACING STRIPE (F1 tri-color) ── */}
      <div className="fixed top-0 inset-x-0 z-[100] h-[3px] overflow-hidden">
        <div className="h-full w-full bg-gradient-to-r from-[#E10600] via-[#7C3AED] to-[#2d6af2]" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 2.5, ease: "easeInOut" }}
        />
      </div>

      {/* ═══ TOP BAR LOGOS ═══ */}
      <div className="fixed top-0 inset-x-0 z-[89] px-4 md:px-8 py-4 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto">
          <Image
            src="/assets/logo/logo1.png"
            alt="NitroQuiz Logo"
            width={180}
            height={50}
            className="h-9 md:h-10 w-auto object-contain drop-shadow-[0_0_15px_rgba(124,58,237,0.5)]"
            priority
          />
        </div>
        <div className="pointer-events-auto">
          <Image
            src="/assets/logo/logo2.png"
            alt="GameForSmart"
            width={160}
            height={40}
            className="h-6 md:h-7 w-auto object-contain opacity-70
              drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
          />
        </div>
      </div>

      {/* ═══ MAIN LOGIN CARD ═══ */}
      <div className="relative z-10 w-full max-w-[400px] mx-4 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {/* ── Outer glow border ── */}
          <div className="absolute -inset-[1px] rounded-2xl z-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#7C3AED]/40 via-[#2d6af2]/20 to-[#E10600]/20 rounded-2xl" />
          </div>

          {/* ── Card body ── */}
          <div className="relative bg-[#060913]/96 backdrop-blur-2xl rounded-2xl overflow-hidden z-10
            shadow-[0_0_60px_rgba(124,58,237,0.15),0_24px_48px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)]">

            {/* ── TOP HUD HEADER BAR ── */}
            <div className="relative px-5 pt-5 pb-4 border-b border-white/[0.05] overflow-hidden">
              {/* BG diagonal stripes */}
              <div className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: "repeating-linear-gradient(135deg, #fff, #fff 1px, transparent 1px, transparent 16px)",
                }}
              />
              {/* Left accent bar */}
              <div className="absolute left-0 top-0 bottom-0 w-[3px]"
                style={{ background: "linear-gradient(to bottom, #7C3AED, #E10600)" }}
              />

              <div className="flex items-center justify-between ps-2">
                {/* Title + sector label */}
                <div>

                  <h1 className="text-white font-black text-3xl uppercase tracking-[0.15em] leading-none">
                    {t('login.title')}
                  </h1>
                </div>

                {/* Speedometer */}
                <div className="flex flex-col items-center gap-0.5">
                  <Speedometer active={isLoggingIn} />
                  <span className="text-[8px] text-white/20 tracking-[0.2em] uppercase font-mono">
                    {isLoggingIn ? "AUTH..." : "READY"}
                  </span>
                </div>
              </div>

              {/* RPM bar row */}
              <div className="flex items-center justify-between mt-3 ps-2">

                <RpmBar active={isLoggingIn} />
              </div>
            </div>

            {/* ── FORM BODY ── */}
            <div className="px-6 py-5">

              {/* Google OAuth Button */}
              <motion.button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                className="w-full flex items-center justify-center gap-2.5 h-11 rounded-xl border border-white/[0.08]
                  bg-white/[0.04] hover:bg-white/[0.07] transition-all text-white text-sm font-semibold mb-5
                  group hover:border-white/15 disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden"
              >
                {/* Shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                {/* Left accent pulse */}
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#4285F4] to-[#34A853] opacity-0 group-hover:opacity-100 transition-opacity" />
                {isGoogleLoading
                  ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  : <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                }
                <span>{isGoogleLoading ? t('login.google.redirecting') : t('login.google.continue')}</span>
              </motion.button>

              {/* Divider with racing flag icons */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-white/[0.05]" />
                <div className="flex items-center gap-1.5">

                </div>
                <div className="flex-1 h-px bg-white/[0.05]" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(handleEmailLogin)} className="space-y-4">

                {/* Server error */}
                <AnimatePresence>
                  {serverError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-2 text-red-400 text-xs bg-[#E10600]/8 border border-[#E10600]/20 rounded-lg px-3 py-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#E10600] flex-shrink-0 animate-pulse" />
                        {serverError}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Identifier field */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-gray-500 text-[9px] font-mono tracking-[0.25em] uppercase">
                    <span className="text-[#7C3AED]/60">▶</span>
                    {t('login.form.identifier_label')}
                  </label>
                  <div className="relative group/field">
                    {/* Focus glow */}
                    <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-[#7C3AED]/0 to-[#2d6af2]/0 group-focus-within/field:from-[#7C3AED]/30 group-focus-within/field:to-[#2d6af2]/20 transition-all duration-300 z-0 pointer-events-none" />
                    <input
                      type="text"
                      placeholder={t('login.form.identifier_placeholder')}
                      autoComplete="username"
                      disabled={isSubmitting}
                      className={`relative z-10 w-full h-11 bg-white/[0.03] border ${
                        errors.identifier ? 'border-[#E10600]/40' :
                        identifierVal ? 'border-[#00ff9d]/25' : 'border-white/[0.07]'
                      } text-white text-sm px-4 rounded-xl outline-none transition-all duration-200
                        placeholder:text-gray-700 focus:border-[#7C3AED]/60 focus:bg-white/[0.05]
                        focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)] font-mono tracking-wide`}
                      {...register("identifier")}
                    />
                    {/* Valid indicator */}
                    {identifierVal && !errors.identifier && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute end-3 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00ff9d] shadow-[0_0_6px_#00ff9d]" />
                      </motion.div>
                    )}
                  </div>
                  {errors.identifier && (
                    <p className="text-[#E10600] text-[10px] ps-1 flex items-center gap-1">
                      <span>⚠</span> {t(errors.identifier.message as string)}
                    </p>
                  )}
                </div>

                {/* Password field */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-gray-500 text-[9px] font-mono tracking-[0.25em] uppercase">
                    <span className="text-[#2d6af2]/60">▶</span>
                    {t('login.form.password_label')}
                  </label>
                  <div className="relative group/field">
                    <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-[#2d6af2]/0 to-[#7C3AED]/0 group-focus-within/field:from-[#2d6af2]/30 group-focus-within/field:to-[#7C3AED]/20 transition-all duration-300 z-0 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder={t('login.form.password_placeholder')}
                      autoComplete="current-password"
                      disabled={isSubmitting}
                      className={`relative z-10 w-full h-11 bg-white/[0.03] border ${
                        errors.password ? 'border-[#E10600]/40' : 'border-white/[0.07]'
                      } text-white text-sm ps-4 pe-11 rounded-xl outline-none transition-all duration-200
                        placeholder:text-gray-700 focus:border-[#2d6af2]/60 focus:bg-white/[0.05]
                        focus:shadow-[0_0_0_3px_rgba(45,106,242,0.1)] font-mono`}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute end-3 top-1/2 -translate-y-1/2 z-10 text-gray-600 hover:text-gray-400 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-[#E10600] text-[10px] ps-1 flex items-center gap-1">
                      <span>⚠</span> {t(errors.password.message as string)}
                    </p>
                  )}
                </div>

                {/* ── NITRO LAUNCH BUTTON ── */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative w-full h-14 mt-2 rounded-xl overflow-hidden group transition-all
                    disabled:opacity-60 disabled:cursor-not-allowed
                    shadow-[0_15px_30px_rgba(0,0,0,0.4),0_0_20px_rgba(124,58,237,0.2)]"
                >
                  {/* High-Octane Gradient Base */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#5b21b6] via-[#7C3AED] to-[#2d6af2] group-hover:from-[#6d28d9] group-hover:to-[#3b82f6] transition-colors duration-500" />
                  
                  {/* Glossy Glass Layer */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/5 to-transparent opacity-60" />
                  
                  {/* Aerodynamic Texture */}
                  <div className="absolute inset-0 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity"
                    style={{
                      backgroundImage: "repeating-linear-gradient(45deg, #000, #000 1px, transparent 1px, transparent 10px)",
                    }}
                  />

                  {/* Left "Live" Neon Accent */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00ff9d] shadow-[0_0_15px_#00ff9d,0_0_5px_#00ff9d] z-20" />
                  
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

                  {/* Content */}
                  <span className="relative z-10 flex items-center justify-center gap-3 font-black text-white uppercase tracking-[0.3em] text-base italic drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t('login.form.authenticating')}
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        {t('login.form.button')}
                      </>
                    )}
                  </span>
                </motion.button>
              </form>

              {/* Register link */}
              <div className="mt-5 pt-4 border-t border-white/[0.04]">
                <p className="text-center text-gray-700 text-[11px] font-mono">
                  {t('login.register.text')}{' '}
                  <a
                    href={registerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#7C3AED] hover:text-[#00ff9d] transition-colors font-bold tracking-wide"
                  >
                    {t('login.register.link')}
                  </a>
                </p>
              </div>
            </div>


          </div>
        </motion.div>
      </div>
    </div>
  );
}