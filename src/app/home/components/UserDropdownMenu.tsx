/**
 * ============================================================================
 *  KOMPONEN: USER DROPDOWN MENU
 * ============================================================================
 *
 *  Menu dropdown di pojok kanan atas yang berisi:
 *  - Informasi pengguna (avatar + nama)
 *  - Toggle fullscreen
 *  - Tombol "Cara Bermain"
 *  - Instalasi PWA
 *  - Toggle suara (BGM)
 *  - Pemilih bahasa (ID, EN, AR)
 *  - Tombol logout
 *
 *  Hanya ditampilkan jika pengguna sudah login.
 * ============================================================================
 */

import React from "react";
import {
    Menu, Maximize, Minimize, PlayCircle, Globe,
    LogOut, X, ChevronRight, DownloadIcon, Volume2, VolumeX,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { getInitials, getAvatarColor } from "../helpers";
import { AVAILABLE_LANGUAGES } from "../constants";
import type { HomeUser } from "../hooks/useHomePage";

interface UserDropdownMenuProps {
    /** Data pengguna yang sedang login */
    user: HomeUser;
    /** Fungsi terjemahan i18n */
    t: (key: string) => string;
    /** Instance i18n untuk cek bahasa aktif */
    i18n: any;
    /** Status dropdown terbuka atau tertutup */
    isDropdownOpen: boolean;
    /** Setter untuk membuka/menutup dropdown */
    setIsDropdownOpen: (val: boolean) => void;
    /** Ref untuk mendeteksi klik di luar dropdown */
    dropdownRef: React.RefObject<HTMLDivElement | null>;
    /** Status fullscreen */
    isFullscreen: boolean;
    /** Handler toggle fullscreen */
    toggleFullscreen: () => void;
    /** Handler buka modal "Cara Bermain" */
    onShowHowToPlay: () => void;
    /** Status apakah PWA sudah terinstall */
    isInstalled: boolean;
    /** Objek install prompt PWA (null jika tidak tersedia) */
    installPrompt: any;
    /** Handler install PWA */
    handlePWAInstall: () => void;
    /** Status mute BGM */
    isMuted: boolean;
    /** Handler toggle mute */
    toggleMute: () => void;
    /** Status submenu bahasa terbuka */
    isLanguageOpen: boolean;
    /** Setter submenu bahasa */
    setIsLanguageOpen: (val: boolean) => void;
    /** Handler ganti bahasa */
    changeLanguage: (code: string) => void;
    /** Handler buka dialog logout */
    handleLogout: () => void;
}

export const UserDropdownMenu: React.FC<UserDropdownMenuProps> = ({
    user, t, i18n, isDropdownOpen, setIsDropdownOpen, dropdownRef,
    isFullscreen, toggleFullscreen, onShowHowToPlay,
    isInstalled, installPrompt, handlePWAInstall,
    isMuted, toggleMute, isLanguageOpen, setIsLanguageOpen,
    changeLanguage, handleLogout,
}) => {
    return (
        <div
            className="fixed top-5 right-4 md:right-8 z-[100]"
            ref={dropdownRef}
        >
            {/* Tombol Hamburger / Close */}
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

            {/* Panel Dropdown */}
            <AnimatePresence>
                {isDropdownOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-14 right-0 w-72 bg-[#0c1020]/97 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-y-auto flex flex-col font-body z-[101] max-h-[75dvh]"
                    >
                        {/* Header Profil Pengguna */}
                        <div className="p-5 bg-gradient-to-br from-white/[0.03] to-transparent border-b border-white/[0.05]">
                            <div className="flex items-center gap-3">
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
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-base font-bold truncate">
                                        {user.username}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Daftar Aksi Menu */}
                        <div className="p-2 flex flex-col gap-0.5">
                            {/* Toggle Fullscreen */}
                            <button
                                onClick={toggleFullscreen}
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

                            {/* Cara Bermain */}
                            <button
                                onClick={onShowHowToPlay}
                                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-white/[0.04] text-white/50 hover:text-white transition-all group"
                            >
                                <div className="p-1.5 rounded-lg bg-white/[0.04] group-hover:bg-white/[0.08] transition-colors">
                                    <PlayCircle className="w-3.5 h-3.5 text-white/70" />
                                </div>
                                <span className="text-sm font-medium">
                                    {t('homepage.menu.how_to_play')}
                                </span>
                            </button>

                            {/* Install PWA */}
                            <button
                                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all group ${(isInstalled || !installPrompt)
                                    ? "opacity-40 cursor-not-allowed text-white/30"
                                    : "hover:bg-white/[0.04] text-white/50 hover:text-white"
                                    }`}
                                disabled={isInstalled || !installPrompt}
                                onClick={() => {
                                    handlePWAInstall();
                                    setIsDropdownOpen(false);
                                }}
                            >
                                <div className={`p-1.5 rounded-lg bg-white/[0.04] transition-colors ${!(isInstalled || !installPrompt) && "group-hover:bg-white/[0.08]"}`}>
                                    <DownloadIcon className="w-3.5 h-3.5 text-white/70" />
                                </div>
                                <span className="text-sm font-medium">
                                    {isInstalled
                                        ? t("pwa.appInstalled")
                                        : t("pwa.installApp")}
                                </span>
                            </button>

                            {/* Toggle Suara */}
                            <button
                                onClick={toggleMute}
                                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-white/[0.04] text-white/50 hover:text-white transition-all group"
                            >
                                <div className="p-1.5 rounded-lg bg-white/[0.04] group-hover:bg-white/[0.08] transition-colors">
                                    {isMuted ? (
                                        <VolumeX className="w-3.5 h-3.5 text-red-400" />
                                    ) : (
                                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                                    )}
                                </div>
                                <span className="text-sm font-medium flex-1 text-left rtl:text-right">
                                    {t('room_settings.sound')}
                                </span>
                                <div className={`text-[10px] font-bold px-2 py-0.5 rounded ${isMuted ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                    {isMuted ? 'OFF' : 'ON'}
                                </div>
                            </button>

                            {/* Pemilih Bahasa */}
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

                                {/* Submenu Daftar Bahasa */}
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
                                                    onClick={() => changeLanguage(lang.code)}
                                                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-all ${i18n.language.startsWith(lang.code)
                                                        ? "bg-[#7C3AED]/10 text-[#a78bfa] border border-[#7C3AED]/20"
                                                        : "hover:bg-white/[0.03] text-white/40 hover:text-white/60"
                                                        }`}
                                                >
                                                    <div className="flex flex-col items-start translate-x-1 rtl:-translate-x-1">
                                                        <span className="text-xs font-bold uppercase tracking-widest">{lang.label}</span>
                                                    </div>
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

                        {/* Tombol Logout di Footer */}
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
};
