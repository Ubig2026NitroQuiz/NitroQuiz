/**
 * ============================================================================
 *  HALAMAN LOGIN — NITROQUIZ
 * ============================================================================
 *
 *  Halaman utama untuk autentikasi pengguna. Mendukung dua metode login:
 *    1. Login via email/username + password (Supabase Auth)
 *    2. Login via Google OAuth
 *
 *  Alur kerja:
 *    - Jika pengguna sudah login, otomatis diarahkan ke halaman utama
 *      atau ke room yang tertunda (pending room code di localStorage).
 *    - Jika belum login, tampilkan form login dengan tema balap NitroQuiz.
 *
 *  Struktur file:
 *    - constants.ts       → Skema validasi & URL eksternal
 *    - components/        → Komponen dekoratif (background, speedometer, dll)
 *    - page.tsx (ini)     → Logika utama & layout halaman
 * ============================================================================
 */

'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { createGFSClient } from "@/lib/supabase/gfs-client";

// Import konstanta dan tipe dari file terpisah
import { loginSchema, REGISTER_URL } from "./constants";
import type { LoginFormData } from "./constants";

// Import komponen dekoratif
import {
  Speedometer,
  RpmBar,
  RacingBackground,
  TopBarLogos,
} from "./components";

// ════════════════════════════════════════════════════════════════════════════
//  KOMPONEN UTAMA: LoginPage
// ════════════════════════════════════════════════════════════════════════════

export default function LoginPage() {
  // ── Inisialisasi layanan & hook ────────────────────────────────────────
  const supabase = createGFSClient();
  const router = useRouter();
  const { t } = useTranslation();
  const { user, profile, loading } = useAuth();

  // ── State lokal ────────────────────────────────────────────────────────
  /** Mengontrol visibilitas password (tampil/sembunyi) */
  const [showPassword, setShowPassword] = useState(false);

  /** Menyimpan pesan error dari server (null jika tidak ada error) */
  const [serverError, setServerError] = useState<string | null>(null);

  /** Status loading khusus untuk login Google OAuth */
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  /** Status animasi awal halaman (delayed launch) */
  const [launched, setLaunched] = useState(false);

  /** Penghitung percobaan login (untuk animasi) */
  const [nitroCount, setNitroCount] = useState(0);

  // ── Data stabil untuk animasi (tidak berubah saat re-render) ──────────
  /** Partikel dekoratif di latar belakang — dibuat sekali saja via useMemo */
  const particles = useMemo(() =>
    Array.from({ length: 22 }, (_, i) => ({
      x: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      delay: Math.random() * 7,
      color: i % 5 === 0 ? "#00ff9d" : i % 5 === 1 ? "#2d6af2" : i % 5 === 2 ? "#7C3AED" : i % 5 === 3 ? "#E10600" : "#f59e0b",
      dur: 5 + Math.random() * 4,
    }))
    , []);

  /** Bekas ban (tyre marks) dekoratif */
  const tyreMarks = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      x: 5 + Math.random() * 90,
      y: 10 + Math.random() * 80,
      angle: -20 + Math.random() * 40,
      len: 60 + Math.random() * 120,
      delay: i * 0.6,
    }))
    , []);

  /** Data lampu start (street lights) */
  const streetLights = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      delay: i * 0.15,
      duration: 0.4,
    }))
    , []);

  // ── Efek samping: Animasi peluncuran awal ─────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setLaunched(true), 400);
    return () => clearTimeout(timer);
  }, []);

  // ── Konfigurasi React Hook Form ───────────────────────────────────────
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  /** Nilai input saat ini (untuk indikator validasi real-time) */
  const identifierVal = watch("identifier", "");
  const passwordVal = watch("password", "");

  // ── Efek samping: Redirect otomatis jika sudah login ──────────────────
  useEffect(() => {
    if (!loading && (user || profile)) {
      // Cek apakah ada kode room yang tertunda di localStorage
      const pendingCode = localStorage.getItem("nitroquiz_pendingRoomCode");
      if (pendingCode) {
        // Hapus dulu untuk mencegah loop redirect
        localStorage.removeItem("nitroquiz_pendingRoomCode");
        console.log("[NitroQuiz] Mengarahkan ke room tertunda:", pendingCode);
        router.replace(`/join/${pendingCode.toUpperCase()}`);
      } else {
        router.replace('/');
      }
    }
  }, [user, profile, loading, router]);

  // ════════════════════════════════════════════════════════════════════════
  //  FUNGSI HANDLER
  // ════════════════════════════════════════════════════════════════════════

  /**
   * Mengubah input identifier (email atau username) menjadi alamat email.
   * - Jika input mengandung "@", langsung dianggap email.
   * - Jika tidak, cari email dari tabel profiles berdasarkan username.
   */
  const resolveEmail = async (input: string): Promise<string> => {
    if (input.includes("@")) return input.toLowerCase();

    const { data, error } = await supabase
      .from("profiles")
      .select("email")
      .eq("username", input)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("login.form.username_not_found");
    return data.email.toLowerCase();
  };

  /**
   * Handler untuk login menggunakan email/username + password.
   * Dipanggil saat form di-submit.
   */
  const handleEmailLogin = async (data: LoginFormData) => {
    setServerError(null);
    setNitroCount(c => c + 1);

    try {
      const resolvedEmail = await resolveEmail(data.identifier.trim());
      const { error } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password: data.password,
      });
      if (error) throw error;
    } catch (err: any) {
      setServerError(t(err.message) || t('login.form.generic_error'));
    }
  };

  /**
   * Handler untuk login menggunakan Google OAuth.
   * Mengarahkan pengguna ke halaman login Google.
   */
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setNitroCount(c => c + 1);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + window.location.pathname
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setServerError(t('login.google.failed'));
      setIsGoogleLoading(false);
    }
  };

  // ── Status gabungan: apakah sedang dalam proses login ─────────────────
  const isLoggingIn = isSubmitting || isGoogleLoading;

  // ════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#04060f] relative overflow-hidden flex items-center justify-center font-body">

      {/* ── LATAR BELAKANG BERTEMA BALAP ── */}
      <RacingBackground />

      {/* ── LOGO DI BAGIAN ATAS ── */}
      <TopBarLogos />

      {/* ══════════════════════════════════════════════════════════════════
           KARTU LOGIN UTAMA
         ══════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 w-full max-w-[400px] mx-4 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {/* ── Border luar dengan efek glow ── */}
          <div className="absolute -inset-[1px] rounded-2xl z-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#7C3AED]/40 via-[#2d6af2]/20 to-[#E10600]/20 rounded-2xl" />
          </div>

          {/* ── Badan kartu ── */}
          <div className="relative bg-[#060913]/96 backdrop-blur-2xl rounded-2xl overflow-hidden z-10
            shadow-[0_0_60px_rgba(124,58,237,0.15),0_24px_48px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)]">

            {/* ════════════════════════════════════════════════════════════
                 HEADER HUD (Speedometer + RPM Bar)
               ════════════════════════════════════════════════════════════ */}
            <div className="relative px-5 pt-5 pb-4 border-b border-white/[0.05] overflow-hidden">
              {/* Pola garis diagonal di latar header */}
              <div className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: "repeating-linear-gradient(135deg, #fff, #fff 1px, transparent 1px, transparent 16px)",
                }}
              />
              {/* Aksen garis vertikal kiri */}
              <div className="absolute left-0 top-0 bottom-0 w-[3px]"
                style={{ background: "linear-gradient(to bottom, #7C3AED, #E10600)" }}
              />

              <div className="flex items-center justify-between ps-2">
                {/* Judul halaman */}
                <div>
                  <h1 className="text-white font-black text-3xl uppercase tracking-[0.15em] leading-none">
                    {t('login.title')}
                  </h1>
                </div>

                {/* Speedometer sebagai indikator visual */}
                <div className="flex flex-col items-center gap-0.5">
                  <Speedometer active={isLoggingIn} />
                  <span className="text-[8px] text-white/20 tracking-[0.2em] uppercase font-mono">
                    {isLoggingIn ? "AUTH..." : "READY"}
                  </span>
                </div>
              </div>

              {/* Baris RPM bar */}
              <div className="flex items-center justify-between mt-3 ps-2">
                <RpmBar active={isLoggingIn} />
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════
                 BADAN FORM
               ════════════════════════════════════════════════════════════ */}
            <div className="px-6 py-5">

              {/* ── Tombol Login Google OAuth ── */}
              <GoogleOAuthButton
                isLoading={isGoogleLoading}
                onClick={handleGoogleLogin}
                t={t}
              />

              {/* ── Pembatas (Divider) ── */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-white/[0.05]" />
                <div className="flex items-center gap-1.5" />
                <div className="flex-1 h-px bg-white/[0.05]" />
              </div>

              {/* ── Form Login Email/Username ── */}
              <form onSubmit={handleSubmit(handleEmailLogin)} className="space-y-4">

                {/* Pesan error dari server */}
                <ServerErrorAlert error={serverError} />

                {/* Field identifier (email/username) */}
                <IdentifierField
                  register={register}
                  error={errors.identifier}
                  value={identifierVal}
                  isSubmitting={isSubmitting}
                  t={t}
                />

                {/* Field password */}
                <PasswordField
                  register={register}
                  error={errors.password}
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                  isSubmitting={isSubmitting}
                  t={t}
                />

                {/* Tombol submit "NITRO LAUNCH" */}
                <NitroLaunchButton isLoggingIn={isLoggingIn} isSubmitting={isSubmitting} t={t} />
              </form>

              {/* ── Link Registrasi ── */}
              <div className="mt-5 pt-4 border-t border-white/[0.04]">
                <p className="text-center text-gray-700 text-[11px] font-mono">
                  {t('login.register.text')}{' '}
                  <a
                    href={REGISTER_URL}
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


// ════════════════════════════════════════════════════════════════════════════════
//  SUB-KOMPONEN FORM (diletakkan di bawah agar file utama tetap terbaca)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Tombol login via Google OAuth.
 * Menampilkan ikon Google dan teks yang berubah saat loading.
 */
function GoogleOAuthButton({
  isLoading,
  onClick,
  t,
}: {
  isLoading: boolean;
  onClick: () => void;
  t: (key: string) => string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      whileTap={{ scale: 0.98 }}
      className="w-full flex items-center justify-center gap-2.5 h-11 border border-white/[0.08]
        bg-white/[0.04] hover:bg-white/[0.07] transition-all text-white text-sm font-semibold mb-5
        group hover:border-white/15 disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden transform -skew-x-[12deg] rounded-sm"
    >
      {/* Efek kilau saat hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-[200%] transition-transform duration-1000" />

      <div className="relative z-10 flex items-center justify-center gap-2.5 transform skew-x-[12deg]">
        {isLoading
          ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          : <GoogleIcon />
        }
        <span>{isLoading ? t('login.google.redirecting') : t('login.google.continue')}</span>
      </div>
    </motion.button>
  );
}

/** Ikon SVG logo Google berwarna */
function GoogleIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

/**
 * Alert animasi untuk menampilkan pesan error dari server.
 * Muncul/hilang dengan animasi expand/collapse.
 */
function ServerErrorAlert({ error }: { error: string | null }) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-2 text-red-400 text-xs bg-[#E10600]/8 border border-[#E10600]/20 rounded-lg px-3 py-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#E10600] flex-shrink-0 animate-pulse" />
            {error}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Field input untuk identifier (email atau username).
 * Dilengkapi indikator validasi real-time (titik hijau jika valid).
 */
function IdentifierField({
  register,
  error,
  value,
  isSubmitting,
  t,
}: {
  register: any;
  error: any;
  value: string;
  isSubmitting: boolean;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-gray-500 text-[9px] font-mono tracking-[0.25em] uppercase">
        <span className="text-[#7C3AED]/60">▶</span>
        {t('login.form.identifier_label')}
      </label>
      <div className="relative group/field">
        {/* Efek glow saat fokus */}
        <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-[#7C3AED]/0 to-[#2d6af2]/0 group-focus-within/field:from-[#7C3AED]/30 group-focus-within/field:to-[#2d6af2]/20 transition-all duration-300 z-0 pointer-events-none" />
        <input
          type="text"
          placeholder={t('login.form.identifier_placeholder')}
          autoComplete="username"
          disabled={isSubmitting}
          className={`relative z-10 w-full h-11 bg-white/[0.03] border ${error ? 'border-[#E10600]/40' :
              value ? 'border-[#00ff9d]/25' : 'border-white/[0.07]'
            } text-white text-sm px-4 rounded-xl outline-none transition-all duration-200
            placeholder:text-gray-700 focus:border-[#7C3AED]/60 focus:bg-white/[0.05]
            focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)] font-mono tracking-wide`}
          {...register("identifier")}
        />
        {/* Indikator valid (titik hijau) */}
        {value && !error && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute end-3 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#00ff9d] shadow-[0_0_6px_#00ff9d]" />
          </motion.div>
        )}
      </div>
      {/* Pesan error validasi */}
      {error && (
        <p className="text-[#E10600] text-[10px] ps-1 flex items-center gap-1">
          <span>⚠</span> {t(error.message as string)}
        </p>
      )}
    </div>
  );
}

/**
 * Field input untuk password.
 * Dilengkapi tombol toggle untuk menampilkan/menyembunyikan password.
 */
function PasswordField({
  register,
  error,
  showPassword,
  onTogglePassword,
  isSubmitting,
  t,
}: {
  register: any;
  error: any;
  showPassword: boolean;
  onTogglePassword: () => void;
  isSubmitting: boolean;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-gray-500 text-[9px] font-mono tracking-[0.25em] uppercase">
        <span className="text-[#2d6af2]/60">▶</span>
        {t('login.form.password_label')}
      </label>
      <div className="relative group/field">
        {/* Efek glow saat fokus */}
        <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-[#2d6af2]/0 to-[#7C3AED]/0 group-focus-within/field:from-[#2d6af2]/30 group-focus-within/field:to-[#7C3AED]/20 transition-all duration-300 z-0 pointer-events-none" />
        <input
          type={showPassword ? "text" : "password"}
          placeholder={t('login.form.password_placeholder')}
          autoComplete="current-password"
          disabled={isSubmitting}
          className={`relative z-10 w-full h-11 bg-white/[0.03] border ${error ? 'border-[#E10600]/40' : 'border-white/[0.07]'
            } text-white text-sm ps-4 pe-11 rounded-xl outline-none transition-all duration-200
            placeholder:text-gray-700 focus:border-[#2d6af2]/60 focus:bg-white/[0.05]
            focus:shadow-[0_0_0_3px_rgba(45,106,242,0.1)] font-mono`}
          {...register("password")}
        />
        {/* Tombol toggle tampilkan/sembunyikan password */}
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute end-3 top-1/2 -translate-y-1/2 z-10 text-gray-600 hover:text-gray-400 transition-colors"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {/* Pesan error validasi */}
      {error && (
        <p className="text-[#E10600] text-[10px] ps-1 flex items-center gap-1">
          <span>⚠</span> {t(error.message as string)}
        </p>
      )}
    </div>
  );
}

/**
 * Tombol submit utama bertema "Nitro Launch".
 * Memiliki banyak lapisan efek visual: gradien, glossy, tekstur, neon, dan kilau.
 */
function NitroLaunchButton({
  isLoggingIn,
  isSubmitting,
  t,
}: {
  isLoggingIn: boolean;
  isSubmitting: boolean;
  t: (key: string) => string;
}) {
  return (
    <motion.button
      type="submit"
      disabled={isSubmitting}
      whileTap={{ scale: 0.98 }}
      className="relative w-full h-14 mt-4 overflow-hidden group transition-all
        disabled:opacity-60 disabled:cursor-not-allowed
        shadow-[0_15px_30px_rgba(0,0,0,0.4),0_0_20px_rgba(124,58,237,0.2)] transform -skew-x-[12deg] rounded-sm"
    >
      {/* Lapisan 1: Gradien utama */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#5b21b6] via-[#7C3AED] to-[#2d6af2] group-hover:from-[#6d28d9] group-hover:to-[#3b82f6] transition-colors duration-500" />

      {/* Lapisan 2: Efek glossy (kaca) */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/5 to-transparent opacity-60" />

      {/* Lapisan 3: Tekstur aerodinamis */}
      <div className="absolute inset-0 opacity-[0.06] group-hover:opacity-[0.10] transition-opacity"
        style={{
          backgroundImage: "repeating-linear-gradient(45deg, #000, #000 1px, transparent 1px, transparent 10px)",
        }}
      />

      {/* Lapisan 4: Aksen neon hijau di sisi kiri */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00ff9d] shadow-[0_0_15px_#00ff9d,0_0_5px_#00ff9d] z-20" />

      {/* Lapisan 5: Efek kilau saat hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />

      {/* Konten tombol */}
      <div className="relative z-10 flex items-center justify-center gap-3 transform skew-x-[12deg] transition-transform duration-300">
        <span className="font-black text-white uppercase tracking-[0.3em] text-base italic drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] flex items-center gap-3">
          {isLoggingIn ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('login.form.authenticating')}
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              {t('login.form.button')}
            </>
          )}
        </span>
      </div>
    </motion.button>
  );
}