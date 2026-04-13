'use client';

/**
 * page.tsx — Halaman Login
 * ════════════════════════
 *
 * Halaman login NitroQuiz dengan tema sirkuit balap malam.
 * Mendukung login via email/username + password dan Google OAuth.
 *
 * Fitur utama:
 * 1. Login via email/username + password
 * 2. Login via Google OAuth
 * 3. Resolve username → email secara otomatis
 * 4. Auto-redirect ke halaman utama setelah login
 * 5. Redirect ke room jika ada pending roomCode (dari QR/link)
 * 6. Validasi form dengan Zod + react-hook-form
 * 7. Animasi bertema balap (speedometer, RPM bar, checkered flag)
 *
 * Struktur komponen:
 * ├── BackgroundEffects  → Semua efek visual latar belakang
 * ├── TopBar             → Logo kiri & kanan
 * └── LoginForm          → Kartu login (header HUD + form)
 *     ├── Speedometer    → Animasi speedometer
 *     ├── RpmBar         → Animasi bar RPM
 *     └── (inline)       → Google button, input fields, submit button
 *
 * Alur login:
 * 1. User mengisi identifier (username/email) + password
 * 2. Jika identifier bukan email → resolve username → email via database
 * 3. Panggil supabase.auth.signInWithPassword
 * 4. AuthContext mendeteksi user → trigger redirect
 */

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from 'next/navigation';
import { supabaseCentral } from '@/lib/supabase';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

// ── Komponen login ──
import { BackgroundEffects, TopBar, LoginForm } from "@/components/login";

// ════════════════════════════════════════════════════════════════
// VALIDASI FORM
// ════════════════════════════════════════════════════════════════

/** Schema validasi form login menggunakan Zod */
const loginSchema = z.object({
  identifier: z.string().min(3, "login.form.identifier_error_min"),
  password: z.string().min(6, "login.form.password_error_min"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ════════════════════════════════════════════════════════════════
// Komponen Utama: LoginPage
// ════════════════════════════════════════════════════════════════
export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, profile, loading } = useAuth();

  // ── State UI ──
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [nitroCount, setNitroCount] = useState(0);

  // ── Data stabil untuk partikel (tidak di-regenerate saat re-render) ──
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

  /**
   * URL halaman registrasi.
   * Berbeda tergantung domain saat ini (production vs staging).
   */
  const registerUrl =
    typeof window !== "undefined" &&
      window.location.hostname.includes("gameforsmart.com")
      ? "https://app.gameforsmart.com/register"
      : "https://gameforsmartnewui.vercel.app/register";

  // ════════════════════════════════════════════════════════════════
  // HOOKS
  // ════════════════════════════════════════════════════════════════

  /** Trigger animasi "launched" setelah 400ms */
  useEffect(() => {
    const timer = setTimeout(() => setLaunched(true), 400);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Setup react-hook-form dengan Zod resolver.
   */
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  /** Nilai field saat ini (untuk indikator visual) */
  const identifierVal = watch("identifier", "");
  const passwordVal = watch("password", "");

  /**
   * Hook: Auto-redirect jika sudah login.
   *
   * Jika ada pending roomCode di localStorage (dari QR/link join),
   * redirect ke halaman join room tersebut.
   * Jika tidak, redirect ke halaman utama.
   */
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

  // ════════════════════════════════════════════════════════════════
  // FUNGSI AUTENTIKASI
  // ════════════════════════════════════════════════════════════════

  /**
   * Resolve identifier menjadi email.
   * Jika input sudah berupa email (mengandung @), langsung return.
   * Jika bukan, cari email dari tabel profiles berdasarkan username.
   *
   * @param input - Username atau email
   * @returns Email yang telah di-resolve
   */
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

  /**
   * Handler login via email/username + password.
   * 1. Resolve identifier → email
   * 2. Sign in via Supabase Auth
   */
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

  /**
   * Handler login via Google OAuth.
   * Redirect ke halaman OAuth Google.
   */
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

  // ════════════════════════════════════════════════════════════════
  // DATA TURUNAN
  // ════════════════════════════════════════════════════════════════

  /** True ketika ada proses login aktif (form submit atau Google) */
  const isLoggingIn = isSubmitting || isGoogleLoading;

  // ════════════════════════════════════════════════════════════════
  // RENDER UTAMA
  // ════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#04060f] relative overflow-hidden flex items-center justify-center font-body">
      {/* ── Efek visual latar belakang ── */}
      <BackgroundEffects isLoggingIn={isLoggingIn} />

      {/* ── Logo bar atas ── */}
      <TopBar />

      {/* ── Kartu formulir login ── */}
      <LoginForm
        isLoggingIn={isLoggingIn}
        isSubmitting={isSubmitting}
        isGoogleLoading={isGoogleLoading}
        serverError={serverError}
        errors={errors}
        identifierVal={identifierVal}
        showPassword={showPassword}
        registerUrl={registerUrl}
        register={register}
        onSubmit={handleSubmit(handleEmailLogin)}
        onGoogleLogin={handleGoogleLogin}
        onTogglePassword={() => setShowPassword(!showPassword)}
      />
    </div>
  );
}