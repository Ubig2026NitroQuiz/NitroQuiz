/**
 * ============================================================================
 *  HALAMAN BERANDA (HOME CLIENT)
 * ============================================================================
 *
 *  Komponen utama halaman beranda NitroQuiz yang menggabungkan
 *  semua sub-komponen menjadi satu halaman lengkap.
 *
 *  Arsitektur:
 *  ├── hooks/useHomePage.ts  → Semua state & logika bisnis
 *  ├── constants.ts          → Data statis (bahasa, langkah, warna)
 *  ├── helpers.ts            → Fungsi utilitas (inisial, avatar, QR parsing)
 *  └── components/           → Komponen UI
 *      ├── BackgroundEffects  → Efek visual latar belakang
 *      ├── TopBar             → Logo di pojok kiri atas
 *      ├── UserDropdownMenu   → Menu dropdown pengguna (kanan atas)
 *      ├── HowToPlayModal     → Modal panduan bermain
 *      ├── MainContent        → Kartu HOST & JOIN + logo
 *      ├── LogoutDialog       → Dialog konfirmasi logout
 *      ├── QrScannerModal     → Modal pemindai QR Code
 *      └── LoadingScreen      → Layar loading / spinner
 *
 *  Catatan: Refaktor ini TIDAK mengubah fungsi, logika, maupun tampilan.
 *           Hanya memecah file monolitik menjadi modul-modul terpisah
 *           untuk memudahkan pengembangan ke depannya.
 * ============================================================================
 */

"use client";

import { AnimatePresence } from "framer-motion";
import PWAInstallBanner from "@/components/PWAInstallBanner";
import { FloatingHostActions } from "@/components/FloatingHostActions";
import { useHomePage } from "./hooks/useHomePage";
import {
    BackgroundEffects,
    TopBar,
    UserDropdownMenu,
    HowToPlayModal,
    MainContent,
    LogoutDialog,
    QrScannerModal,
    LoadingScreen,
} from "./components";

export default function HomeClient() {
    // ── Ambil semua state & handler dari custom hook ─────────────────────
    const {
        t, i18n, user, authLoading,
        isHosting, isRedirecting,
        roomCode, setRoomCode,
        isDropdownOpen, setIsDropdownOpen,
        isLanguageOpen, setIsLanguageOpen,
        isFullscreen,
        showHowToPlay, setShowHowToPlay,
        isLogoutDialogOpen, setIsLogoutDialogOpen,
        isScanOpen, setIsScanOpen,
        isBannerVisible, setBannerVisible,
        dropdownRef,
        installPrompt, isInstalled, handlePWAInstall,
        isMuted, toggleMute,
        speedLines,
        toggleFullscreen, handleLogout, performLogout,
        handleHost, handleJoin, handleDismissBanner,
        handleQrScan, changeLanguage,
    } = useHomePage();

    // ── Tampilan Loading ─────────────────────────────────────────────────
    // Tampilkan loading screen saat autentikasi, hosting, atau redirect
    if (authLoading || isHosting || isRedirecting) {
        return <LoadingScreen t={t} />;
    }

    // ── Tampilan Utama ───────────────────────────────────────────────────
    return (
        <div className="bg-[#04060f] text-white h-[100dvh] relative overflow-hidden font-body selection:bg-[#7C3AED]/30 selection:text-white flex flex-col">

            {/* Efek Visual Latar Belakang */}
            <BackgroundEffects speedLines={speedLines} />

            {/* Logo di Pojok Kiri Atas */}
            <TopBar />

            {/* Banner Instalasi PWA */}
            <AnimatePresence>
                {isBannerVisible && (
                    <PWAInstallBanner
                        onInstall={() => {
                            handlePWAInstall();
                            setBannerVisible(false);
                        }}
                        onDismiss={handleDismissBanner}
                    />
                )}
            </AnimatePresence>

            {/* Menu Dropdown Pengguna (Pojok Kanan Atas) */}
            {user && (
                <UserDropdownMenu
                    user={user}
                    t={t}
                    i18n={i18n}
                    isDropdownOpen={isDropdownOpen}
                    setIsDropdownOpen={setIsDropdownOpen}
                    dropdownRef={dropdownRef}
                    isFullscreen={isFullscreen}
                    toggleFullscreen={toggleFullscreen}
                    onShowHowToPlay={() => {
                        setShowHowToPlay(true);
                        setIsDropdownOpen(false);
                    }}
                    isInstalled={isInstalled}
                    installPrompt={installPrompt}
                    handlePWAInstall={handlePWAInstall}
                    isMuted={isMuted}
                    toggleMute={toggleMute}
                    isLanguageOpen={isLanguageOpen}
                    setIsLanguageOpen={setIsLanguageOpen}
                    changeLanguage={changeLanguage}
                    handleLogout={handleLogout}
                />
            )}

            {/* Modal Cara Bermain */}
            <HowToPlayModal
                isOpen={showHowToPlay}
                onClose={() => setShowHowToPlay(false)}
                t={t}
                i18n={i18n}
            />

            {/* Konten Utama: Logo + Kartu HOST & JOIN */}
            <MainContent
                t={t}
                roomCode={roomCode}
                setRoomCode={setRoomCode}
                handleHost={handleHost}
                handleJoin={handleJoin}
                onOpenScan={() => setIsScanOpen(true)}
            />

            {/* Dialog Konfirmasi Logout */}
            <LogoutDialog
                isOpen={isLogoutDialogOpen}
                onClose={() => setIsLogoutDialogOpen(false)}
                onConfirm={performLogout}
                t={t}
            />

            {/* Modal Pemindai QR Code */}
            <QrScannerModal
                isOpen={isScanOpen}
                onClose={() => setIsScanOpen(false)}
                onScan={handleQrScan}
                t={t as any}
            />

            {/* Tombol Aksi Cepat Host (Floating) */}
            <FloatingHostActions />
        </div>
    );
}
