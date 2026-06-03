/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HALAMAN: AutoJoinPage (Bergabung ke Room Game)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Halaman yang otomatis menggabungkan pemain ke room game berdasarkan
 * kode room di URL (contoh: /join/696660).
 *
 * Alur halaman:
 * 1. Tampilkan loading spinner saat proses join berlangsung
 * 2. Jika gagal → tampilkan alert error dengan gaya HUD cyberpunk
 * 3. Jika berhasil → redirect otomatis ke waiting room
 *
 * Struktur file:
 * ┌─ page.tsx               → Orkestrator utama (file ini)
 * ├─ constants.ts            → Peta pesan error
 * ├─ layout.tsx              → Layout metadata
 * └─ hooks/
 *    └── useAutoJoin.ts      → Custom hook untuk logika auto-join
 *
 * CATATAN: File ini hanya mengatur tampilan (loading & alert).
 * Semua logika bisnis (autentikasi, RPC, localStorage) ada di useAutoJoin.
 */

"use client";

import { LogIn } from "lucide-react";
import { TFunction } from "i18next";
import { useAutoJoin } from "./hooks/useAutoJoin";
import { ERROR_MESSAGES } from "./constants";

// ═══════════════════════════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════════════════

export default function AutoJoinPage() {
  // ── Ambil state dan handler dari custom hook ──
  const { t, isLoading, showAlert, alertReason, closeAlert } = useAutoJoin();

  // Tentukan detail error berdasarkan alertReason
  const errorDetails = alertReason
    ? ERROR_MESSAGES[alertReason]
    : ERROR_MESSAGES.general;

  return (
    <div className="min-h-screen bg-[#04060f] text-white flex items-center justify-center p-4 relative overflow-hidden font-display">
      {/* ═══ Lapisan Latar Belakang ═══ */}
      <BackgroundLayers />

      {/* ═══ Area Konten Utama ═══ */}
      <div className="relative z-10 w-full max-w-md">
        {/* Tampilan loading saat proses join */}
        {isLoading && <JoiningSpinner t={t} />}

        {/* Dialog alert error jika gagal join */}
        {showAlert && (
          <ErrorAlert
            title={errorDetails.title}
            message={errorDetails.message}
            onClose={closeAlert}
          />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: Lapisan Latar Belakang
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Lapisan dekoratif latar belakang halaman join.
 * Termasuk: racing stripe, gambar background, overlay gradient,
 * grid pattern, dan efek ambient glow.
 */
function BackgroundLayers() {
  return (
    <>
      {/* Garis balap dekoratif di atas */}
      <div className="racing-stripe z-50 pointer-events-none absolute top-0 inset-x-0 h-1" />

      {/* Gambar latar belakang */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-30"
        style={{
          backgroundImage: 'url("/assets/backgorund/homepage_bg.webp")',
          backgroundAttachment: "fixed",
        }}
      />

      {/* Overlay gradient untuk keterbacaan */}
      <div className="fixed inset-0 z-0 bg-gradient-to-t from-[#04060f] via-[#04060f]/85 to-[#2d6af2]/10 pointer-events-none" />

      {/* Pola grid halus */}
      <div className="fixed inset-0 z-0 bg-[linear-gradient(rgba(45,106,242,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(45,106,242,0.04)_1px,transparent_1px)] bg-[length:35px_35px] pointer-events-none" />

      {/* Efek ambient glow kiri atas */}
      <div className="fixed top-0 left-1/3 w-[500px] h-[500px] bg-[#2d6af2]/8 blur-[140px] rounded-full pointer-events-none" />

      {/* Efek ambient glow kanan bawah */}
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-[#7C3AED]/8 blur-[120px] rounded-full pointer-events-none" />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: Spinner Saat Bergabung
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Tampilan loading yang ditampilkan saat proses join sedang berlangsung.
 * Menampilkan logo NitroQuiz, spinner berputar, dan teks "JOINING ROOM...".
 */
function JoiningSpinner({ t }: { t: TFunction }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      {/* Logo NitroQuiz */}
      <img
        src="/assets/logo/logo1.png"
        alt="NitroQuiz"
        className="h-16 object-contain drop-shadow-[0_0_30px_rgba(45,106,242,0.6)] mb-2"
      />

      {/* Spinner dengan ikon login di tengah */}
      <div className="relative">
        <div className="w-14 h-14 border-[3px] border-[#2d6af2]/15 border-t-[#2d6af2] rounded-full animate-spin" />
        <LogIn className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-[#2d6af2]/50" />
      </div>

      {/* Teks status bergabung */}
      <h2 className="font-display text-sm font-bold tracking-[0.3em] text-[#5a9cff] uppercase animate-pulse">
        {/* {t("joining_room", "JOINING ROOM...")} */}
        Loading...
      </h2>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: Dialog Alert Error
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Dialog error bergaya HUD cyberpunk yang ditampilkan saat pemain
 * gagal bergabung ke room. Menampilkan judul error, pesan deskripsi,
 * dan tombol "Return to Home" untuk kembali ke halaman utama.
 *
 * Fitur visual:
 * - ClipPath polygon untuk efek potongan sudut kanan bawah
 * - Laser merah di bagian atas
 * - Efek hover sweep pada tombol
 */
function ErrorAlert({
  title,
  message,
  onClose,
}: {
  title: string;
  message: string;
  onClose: () => void;
}) {
  return (
    <div
      className="bg-[#0a0e1a]/95 backdrop-blur-2xl border border-red-500/30 overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.15)]"
      style={{
        clipPath:
          "polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)",
      }}
    >
      {/* Aksen laser merah di atas */}
      <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-red-500 to-transparent" />

      <div className="p-8 text-center">
        {/* Judul error */}
        <h2 className="font-display text-xl font-black text-red-500 mb-2 uppercase tracking-[0.15em] drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
          {title}
        </h2>

        {/* Pesan deskripsi error */}
        <p className="text-gray-400 font-semibold mb-8 text-base leading-relaxed">
          {message}
        </p>

        {/* Tombol kembali ke home */}
        <button
          onClick={onClose}
          className="group/btn relative h-12 px-8 font-display text-sm font-bold uppercase tracking-[0.2em] text-white active:scale-95 transition-all transform -skew-x-[12deg] overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.08))",
            border: "1px solid rgba(239,68,68,0.4)",
          }}
        >
          {/* Efek sweep saat hover */}
          <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
          <span className="relative z-10 transform skew-x-[12deg]">
            Return to Home
          </span>
        </button>
      </div>
    </div>
  );
}
