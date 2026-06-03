'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HALAMAN: Waiting (Player - Lobby & Character Selection)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * File ini menangani halaman tunggu pemain sebelum permainan dimulai.
 * Logika state dan subscription dipisahkan ke dalam useWaitingData hook.
 * UI dipisahkan ke komponen masing-masing agar mudah dibaca dan dikelola.
 */

import { useRouter, useParams } from 'next/navigation';
import { Loader2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from "react-i18next";

import { useWaitingData, PLAYER_CHARACTERS } from './hooks/useWaitingData';
import {
    LogoutConfirmDialog,
    MobileWaitingView,
    DesktopWaitingView,
    MobileCharacterSelector,
    CountdownOverlay
} from './components';

export default function PlayerWaitingPage() {
    const router = useRouter();
    const params = useParams();
    const { t } = useTranslation();
    const roomCode = (params.roomCode as string)?.toUpperCase() || '';

    const {
        status,
        errorMessage,
        assignedCarId,
        isSelectingCharacter,
        pendingCharacterId,
        countdownValue,
        participantCount,
        username,
        userAvatar,
        allParticipants,
        isExiting,
        activeTooltip,
        setPendingCharacterId,
        setIsSelectingCharacter,
        setIsExiting,
        setActiveTooltip,
        handleConfirmExit,
        handleSelectCharacter,
    } = useWaitingData(roomCode);

    const assignedChar = PLAYER_CHARACTERS.find((c: any) => c.id === assignedCarId) || PLAYER_CHARACTERS[0];
    const displayVisual = assignedChar.gifSrc || assignedChar.imageSrc;

    return (
        <div className="bg-[#04060f] text-white min-h-screen relative overflow-hidden font-body flex flex-col items-center justify-center p-4" onClick={() => setActiveTooltip(null)}>
            {/* Background Image */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
                style={{
                    backgroundImage: 'url("/assets/backgorund/homepage_bg.webp")',
                    backgroundAttachment: 'fixed'
                }}
            />
            {/* Gradient Overlay */}
            <div className="fixed inset-0 z-0 bg-gradient-to-t from-[#04060f] via-[#04060f]/60 to-[#7C3AED]/10 pointer-events-none" />

            <div className="relative z-20 w-full max-w-sm text-center">
                {/* ── STATUS: LOADING ── */}
                {status === "loading" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                        <Loader2 className="w-16 h-16 text-[#00ff9d] animate-spin mb-6" />
                        <h2 className="font-display text-2xl tracking-widest text-[#00ff9d] uppercase glow-text">
                            {t("player_waiting.connecting")}
                        </h2>
                    </motion.div>
                )}

                {/* ── STATUS: ERROR ── */}
                {status === "error" && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-500/10 border border-red-500/50 p-6 rounded-2xl backdrop-blur-md">
                        <Zap className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h2 className="font-display text-xl text-red-400 mb-2 uppercase tracking-widest">
                            {t("player_waiting.connection_lost")}
                        </h2>
                        <p className="text-gray-400 text-sm font-mono">{errorMessage}</p>
                        <button onClick={() => router.push('/')} className="mt-6 px-6 py-2 bg-red-500/20 hover:bg-red-500 text-white rounded-xl transition-colors font-display text-xs uppercase tracking-wider">
                            {t("player_waiting.back_home")}
                        </button>
                    </motion.div>
                )}

                {/* ── STATUS: WAITING ── */}
                {status === "waiting" && (
                    <>
                        <MobileWaitingView
                            participantCount={participantCount}
                            username={username}
                            userAvatar={userAvatar}
                            allParticipants={allParticipants}
                            assignedChar={assignedChar}
                            activeTooltip={activeTooltip}
                            setActiveTooltip={setActiveTooltip}
                            setIsExiting={setIsExiting}
                            setIsSelectingCharacter={setIsSelectingCharacter}
                            t={t}
                            PLAYER_CHARACTERS={PLAYER_CHARACTERS}
                        />

                        <DesktopWaitingView
                            participantCount={participantCount}
                            username={username}
                            userAvatar={userAvatar}
                            allParticipants={allParticipants}
                            assignedChar={assignedChar}
                            activeTooltip={activeTooltip}
                            setActiveTooltip={setActiveTooltip}
                            setIsExiting={setIsExiting}
                            setIsSelectingCharacter={setIsSelectingCharacter}
                            t={t}
                            PLAYER_CHARACTERS={PLAYER_CHARACTERS}
                            isSelectingCharacter={isSelectingCharacter}
                            setPendingCharacterId={setPendingCharacterId}
                            assignedCarId={assignedCarId}
                            handleSelectCharacter={handleSelectCharacter}
                            pendingCharacterId={pendingCharacterId}
                            displayVisual={displayVisual}
                        />
                    </>
                )}

                {/* ── MOBILE CHARACTER SELECTOR OVERLAY ── */}
                {isSelectingCharacter && status === "waiting" && (
                    <MobileCharacterSelector
                        PLAYER_CHARACTERS={PLAYER_CHARACTERS}
                        pendingCharacterId={pendingCharacterId}
                        setPendingCharacterId={setPendingCharacterId}
                        assignedCarId={assignedCarId}
                        setIsSelectingCharacter={setIsSelectingCharacter}
                        handleSelectCharacter={handleSelectCharacter}
                        t={t}
                    />
                )}

                {/* ── STATUS: COUNTDOWN ── */}
                {status === "countdown" && (
                    <CountdownOverlay
                        countdownValue={countdownValue}
                        t={t}
                    />
                )}

                {/* ── STATUS: GO ── */}
                {status === "go" && (
                    <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
                        <motion.h1 animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 0.5 }}
                            className="font-display text-transparent bg-clip-text bg-gradient-to-b from-[#00ff9d] to-[#2d6af2] font-black drop-shadow-[0_0_50px_rgba(0,255,157,0.6)] py-4 px-2"
                            style={{ fontSize: 'clamp(60px, 14vw, 120px)' }}>
                            {t("player_waiting.go")}
                        </motion.h1>
                        <p className="font-display text-[#00ff9d] text-sm mt-4 animate-pulse">
                            {t("player_waiting.launching")}
                        </p>
                    </motion.div>
                )}
            </div>

            {/* ── EXIT CONFIRMATION DIALOG ── */}
            <AnimatePresence>
                {isExiting && (
                    <LogoutConfirmDialog
                        onConfirm={handleConfirmExit}
                        onCancel={() => setIsExiting(false)}
                        t={t}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}