"use client";

/**
 * LoginForm.tsx
 * ─────────────
 * Formulir login utama.
 * Berisi:
 * - Header HUD (judul, speedometer, RPM bar)
 * - Tombol login Google OAuth
 * - Input field: identifier (username/email) & password
 * - Tombol submit "Nitro Launch"
 * - Link registrasi
 *
 * Props:
 * - isLoggingIn: status loading keseluruhan
 * - isSubmitting: status loading form submit
 * - isGoogleLoading: status loading Google OAuth
 * - serverError: pesan error dari server
 * - errors: error dari form validation
 * - identifierVal: nilai field identifier saat ini
 * - showPassword: toggle tampilkan password
 * - registerUrl: URL halaman registrasi
 * - register: fungsi register dari react-hook-form
 * - onSubmit: handler submit form
 * - onGoogleLogin: handler login Google
 * - onTogglePassword: handler toggle show password
 */

import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import Speedometer from "./Speedometer";
import RpmBar from "./RpmBar";

interface LoginFormProps {
  isLoggingIn: boolean;
  isSubmitting: boolean;
  isGoogleLoading: boolean;
  serverError: string | null;
  errors: any;
  identifierVal: string;
  showPassword: boolean;
  registerUrl: string;
  register: any;
  onSubmit: (e: React.FormEvent) => void;
  onGoogleLogin: () => void;
  onTogglePassword: () => void;
}

export default function LoginForm({
  isLoggingIn,
  isSubmitting,
  isGoogleLoading,
  serverError,
  errors,
  identifierVal,
  showPassword,
  registerUrl,
  register,
  onSubmit,
  onGoogleLogin,
  onTogglePassword,
}: LoginFormProps) {
  const { t } = useTranslation();

  return (
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

          {/* ══════════════════════════════════════════════ */}
          {/* HEADER HUD: Judul, Speedometer, RPM Bar       */}
          {/* ══════════════════════════════════════════════ */}
          <div className="relative px-5 pt-5 pb-4 border-b border-white/[0.05] overflow-hidden">
            {/* Garis diagonal background */}
            <div className="absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: "repeating-linear-gradient(135deg, #fff, #fff 1px, transparent 1px, transparent 16px)" }}
            />
            {/* Aksen bar kiri */}
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

              {/* Speedometer animasi */}
              <div className="flex flex-col items-center gap-0.5">
                <Speedometer active={isLoggingIn} />
                <span className="text-[8px] text-white/20 tracking-[0.2em] uppercase font-mono">
                  {isLoggingIn ? "AUTH..." : "READY"}
                </span>
              </div>
            </div>

            {/* RPM bar */}
            <div className="flex items-center justify-between mt-3 ps-2">
              <RpmBar active={isLoggingIn} />
            </div>
          </div>

          {/* ══════════════════════════════════════════════ */}
          {/* FORM BODY                                     */}
          {/* ══════════════════════════════════════════════ */}
          <div className="px-6 py-5">

            {/* ── Tombol Login Google ── */}
            <motion.button
              type="button"
              onClick={onGoogleLogin}
              disabled={isGoogleLoading}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              className="w-full flex items-center justify-center gap-2.5 h-11 rounded-xl border border-white/[0.08]
                bg-white/[0.04] hover:bg-white/[0.07] transition-all text-white text-sm font-semibold mb-5
                group hover:border-white/15 disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden"
            >
              {/* Efek shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              {/* Aksen neon kiri */}
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

            {/* ── Divider ── */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-white/[0.05]" />
              <div className="flex items-center gap-1.5"></div>
              <div className="flex-1 h-px bg-white/[0.05]" />
            </div>

            {/* ── Formulir Email/Username + Password ── */}
            <form onSubmit={onSubmit} className="space-y-4">

              {/* Error dari server */}
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

              {/* ── Field: Identifier (username atau email) ── */}
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
                  {/* Indikator valid (titik hijau) */}
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

              {/* ── Field: Password ── */}
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
                  {/* Toggle show/hide password */}
                  <button
                    type="button"
                    onClick={onTogglePassword}
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

              {/* ── Tombol Submit: NITRO LAUNCH ── */}
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="relative w-full h-14 mt-2 rounded-xl overflow-hidden group transition-all
                  disabled:opacity-60 disabled:cursor-not-allowed
                  shadow-[0_15px_30px_rgba(0,0,0,0.4),0_0_20px_rgba(124,58,237,0.2)]"
              >
                {/* Gradien dasar */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#5b21b6] via-[#7C3AED] to-[#2d6af2] group-hover:from-[#6d28d9] group-hover:to-[#3b82f6] transition-colors duration-500" />
                {/* Lapisan glossy */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/5 to-transparent opacity-60" />
                {/* Tekstur aerodinamis */}
                <div className="absolute inset-0 opacity-[0.06] group-hover:opacity-[0.10] transition-opacity"
                  style={{ backgroundImage: "repeating-linear-gradient(45deg, #000, #000 1px, transparent 1px, transparent 10px)" }}
                />
                {/* Aksen neon hijau kiri */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00ff9d] shadow-[0_0_15px_#00ff9d,0_0_5px_#00ff9d] z-20" />
                {/* Efek shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

                {/* Konten tombol */}
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

            {/* ── Link registrasi ── */}
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
  );
}
