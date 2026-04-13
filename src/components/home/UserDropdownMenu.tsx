"use client";

/**
 * UserDropdownMenu.tsx
 * ────────────────────
 * Komponen menu dropdown pengguna di pojok kanan atas.
 *
 * Fitur yang tersedia:
 * - Toggle fullscreen
 * - Buka modal "Cara Bermain"
 * - Instal aplikasi (dinonaktifkan/coming soon)
 * - Pilihan bahasa (English, Indonesia, Arabic)
 * - Tombol logout
 *
 * Props:
 * - user: data pengguna yang sedang login
 * - isFullscreen: apakah sedang dalam mode fullscreen
 * - onToggleFullscreen: fungsi untuk toggle fullscreen
 * - onShowHowToPlay: fungsi untuk menampilkan modal cara bermain
 * - onLogout: fungsi untuk membuka dialog konfirmasi logout
 */

import { useState, useEffect, useRef } from "react";
import {
  Menu,
  Maximize,
  Minimize,
  PlayCircle,
  Globe,
  LogOut,
  X,
  ChevronRight,
  DownloadIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { getI18nInstance } from "@/lib/i18n";
import Image from "next/image";

/** Tipe data pengguna yang ditampilkan di dropdown */
interface UserData {
  id: string;
  username: string;
  email: string;
  avatar: string;
}

/** Daftar bahasa yang tersedia */
const AVAILABLE_LANGUAGES = [
  { code: "en", label: "English", sub: "Global" },
  { code: "id", label: "Indonesia", sub: "Bahasa" },
  { code: "ar", label: "العربية", sub: "Arabic" },
] as const;

/** Palet warna untuk avatar fallback (jika pengguna tidak punya foto) */
const AVATAR_COLORS = [
  '#7C3AED', '#2d6af2', '#f59e0b', '#8b5cf6',
  '#10b981', '#ec4899', '#06b6d4', '#f97316',
];

/**
 * Menghitung warna avatar berdasarkan hash dari username.
 * Menghasilkan warna yang konsisten untuk setiap username.
 */
function getAvatarColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * Menghitung inisial dari username.
 * - Jika nama terdiri dari 2+ kata, ambil huruf pertama dari 2 kata pertama.
 * - Jika nama hanya 1 kata, ambil 2 huruf pertama.
 */
function getInitials(username: string): string {
  const words = username.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return username.slice(0, 2).toUpperCase();
}

interface UserDropdownMenuProps {
  user: UserData;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onShowHowToPlay: () => void;
  onLogout: () => void;
}

export default function UserDropdownMenu({
  user,
  isFullscreen,
  onToggleFullscreen,
  onShowHowToPlay,
  onLogout,
}: UserDropdownMenuProps) {
  const { t } = useTranslation();
  const i18n = getI18nInstance();

  // ── State untuk visibilitas dropdown ──
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /**
   * Menutup dropdown saat pengguna mengklik di luar area dropdown.
   * Menggunakan event "mousedown" untuk menangkap klik sebelum elemen lain memproses.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /** Handler untuk toggle fullscreen lalu tutup dropdown */
  const handleToggleFullscreen = () => {
    onToggleFullscreen();
    setIsDropdownOpen(false);
  };

  /** Handler untuk membuka modal "Cara Bermain" lalu tutup dropdown */
  const handleShowHowToPlay = () => {
    onShowHowToPlay();
    setIsDropdownOpen(false);
  };

  /** Handler untuk logout lalu tutup dropdown */
  const handleLogout = () => {
    onLogout();
    setIsDropdownOpen(false);
  };

  /** Handler untuk mengganti bahasa, lalu tutup semua dropdown */
  const handleChangeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsLanguageOpen(false);
    setIsDropdownOpen(false);
  };

  return (
    <div
      className="fixed top-5 right-4 md:right-8 z-[100]"
      ref={dropdownRef}
    >
      {/* ── Tombol hamburger / tutup ── */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 border ${isDropdownOpen
          ? "bg-[#7C3AED] border-[#7C3AED] text-white shadow-[0_0_20px_rgba(124,58,237,0.4)]"
          : "bg-white/[0.04] backdrop-blur-md border-white/[0.08] text-white/50 hover:text-white hover:border-white/20 hover:bg-white/[0.08]"
          }`}
      >
        {isDropdownOpen ? (
          <X className="w-4 h-4" />
        ) : (
          <Menu className="w-4 h-4" />
        )}
      </button>

      {/* ── Panel dropdown dengan animasi ── */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-14 right-0 w-72 bg-[#0c1020]/97 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col font-body z-[101]"
          >
            {/* ── Header: Info pengguna ── */}
            <div className="p-5 bg-gradient-to-br from-white/[0.03] to-transparent border-b border-white/[0.05]">
              <div className="flex items-center gap-3">
                {/* Avatar pengguna */}
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={user.username}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-xs font-bold text-white select-none"
                      style={{ backgroundColor: getAvatarColor(user.username) }}
                    >
                      {getInitials(user.username)}
                    </div>
                  )}
                </div>
                {/* Nama pengguna */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-base font-bold truncate">
                    {user.username}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Daftar menu aksi ── */}
            <div className="p-2 flex flex-col gap-0.5">
              {/* Tombol fullscreen */}
              <button
                onClick={handleToggleFullscreen}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-white/[0.04] text-white/50 hover:text-white transition-all group"
              >
                <div className="p-1.5 rounded-lg bg-white/[0.04] group-hover:bg-white/[0.08] transition-colors">
                  {isFullscreen ? (
                    <Minimize className="w-3.5 h-3.5 text-white/70" />
                  ) : (
                    <Maximize className="w-3.5 h-3.5 text-white/70" />
                  )}
                </div>

                <span className="text-sm font-medium">
                  {isFullscreen ? t('homepage.menu.exit_fullscreen') : t('homepage.menu.fullscreen')}
                </span>
              </button>

              {/* Tombol cara bermain */}
              <button
                onClick={handleShowHowToPlay}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-white/[0.04] text-white/50 hover:text-white transition-all group"
              >
                <div className="p-1.5 rounded-lg bg-white/[0.04] group-hover:bg-white/[0.08] transition-colors">
                  <PlayCircle className="w-3.5 h-3.5 text-white/70" />
                </div>
                <span className="text-sm font-medium">
                  {t('homepage.menu.how_to_play')}
                </span>
              </button>

              {/* Tombol instal aplikasi (dinonaktifkan) */}
              <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-white/[0.04] text-white/50 hover:text-white transition-all group opacity-40 cursor-not-allowed">
                <div className="p-1.5 rounded-lg bg-white/[0.04] transition-colors">
                  <DownloadIcon className="w-3.5 h-3.5 text-white/70" />
                </div>
                <span className="text-sm font-medium">
                  {t('homepage.menu.install_app')}
                </span>
              </button>

              {/* ── Sub-menu pilihan bahasa ── */}
              <div className="relative">
                <button
                  onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-white/[0.04] text-white/50 hover:text-white transition-all group"
                >
                  <div className="p-1.5 rounded-lg bg-white/[0.04] group-hover:bg-white/[0.08] transition-colors">
                    <Globe className="w-3.5 h-3.5 text-white/70" />
                  </div>
                  <span className="text-sm font-medium flex-1 text-start">
                    {t('homepage.menu.language')}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform rtl:scale-x-[-1] ${isLanguageOpen ? 'rotate-90' : ''}`} />
                </button>

                {/* Daftar bahasa yang tersedia */}
                <AnimatePresence>
                  {isLanguageOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-2 pb-2 space-y-0.5 overflow-hidden"
                    >
                      {AVAILABLE_LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleChangeLanguage(lang.code)}
                          className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all ${i18n.language.startsWith(lang.code)
                            ? "bg-[#7C3AED]/10 text-[#a78bfa] border border-[#7C3AED]/20"
                            : "hover:bg-white/[0.03] text-white/40 hover:text-white/60"
                            }`}
                        >
                          <div className="flex flex-col items-start translate-x-1 rtl:-translate-x-1">
                            <span className="text-xs font-bold uppercase tracking-widest">{lang.label}</span>
                          </div>
                          {/* Indikator bahasa aktif */}
                          {i18n.language.startsWith(lang.code) && (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── Footer: Tombol logout ── */}
            <div className="p-2 pt-0 border-t border-white/[0.05]">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full mt-2 px-3 py-3 rounded-xl bg-red-500/[0.06] hover:bg-red-500/[0.15] text-red-400/80 hover:text-red-400 transition-all group"
              >
                <div className="p-1.5 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                  <LogOut className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-semibold tracking-wide uppercase">
                  {t('homepage.menu.logout')}
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
