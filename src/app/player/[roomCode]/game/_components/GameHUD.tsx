/**
 * =====================================================
 * KOMPONEN HUD GAME - NitroQuiz Racing Game
 * =====================================================
 * Head-Up Display yang menampilkan informasi penting
 * selama balapan berlangsung:
 * - Timer global (atas tengah)
 * - Speedometer (kiri atas)
 * - Tombol ganti POV dan Mute
 * - Bar NOS dan penghitung Lap
 * - Mini Map (kanan atas)
 * - Kontrol permainan (bawah)
 * =====================================================
 */

'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, VolumeX } from 'lucide-react';
import type { GameLoopState, GameStats, ViewMode } from '../_types';
import { MobileControls } from './MobileControls';
import { PCControls } from './PCControls';

interface GameHUDProps {
    /** State game loop (ref) */
    stateRef: React.MutableRefObject<GameLoopState>;
    /** Statistik game saat ini */
    stats: GameStats;
    /** Sisa waktu global (detik) */
    globalTimeLeft: number | null;
    /** Mode tampilan kamera saat ini */
    viewMode: ViewMode;
    /** Callback saat mode tampilan berubah */
    setViewMode: (mode: ViewMode) => void;
    /** Apakah suara di-mute */
    isMuted: boolean;
    /** Callback toggle mute */
    toggleMute: () => void;
    /** Apakah perangkat mobile */
    isMobile: boolean;
    /** Apakah menggunakan layout PC (desktop atau mobile landscape) */
    usePCLayout: boolean;
    /** Apakah mode mobile portrait */
    isMobilePortrait: boolean;
    /** Apakah mode mobile landscape */
    isMobileLandscape: boolean;
    /** Ref canvas mini map */
    miniMapRef: React.RefObject<HTMLCanvasElement | null>;
    /** Apakah mini map diminimasi */
    miniMapMinimized: boolean;
    /** Callback toggle mini map */
    setMiniMapMinimized: (v: boolean) => void;
    /** Lap race saat ini */
    lapRace: number;
    /** State brake untuk kontrol mobile */
    isBraking: boolean;
    /** Callback brake */
    setIsBraking: (v: boolean) => void;
    /** State boost untuk kontrol mobile */
    isBoosting: boolean;
    /** Callback boost */
    setIsBoosting: (v: boolean) => void;
}

/**
 * Komponen HUD utama game.
 * Mengorkestrasi semua elemen UI overlay selama balapan.
 */
export function GameHUD({
    stateRef, stats, globalTimeLeft,
    viewMode, setViewMode,
    isMuted, toggleMute,
    isMobile, usePCLayout, isMobilePortrait, isMobileLandscape,
    miniMapRef, miniMapMinimized, setMiniMapMinimized,
    lapRace,
    isBraking, setIsBraking, isBoosting, setIsBoosting
}: GameHUDProps): React.ReactElement {
    const { t } = useTranslation();

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 200,
                padding: isMobilePortrait ? '3.5rem 0.75rem 0.75rem' : (isMobile ? '0.75rem' : '2rem'),
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                fontFamily: 'sans-serif',
                color: 'white',
                touchAction: 'none'
            }}
        >
            {/* ==========================================
                Timer Global (Atas Tengah)
               ========================================== */}
            <TimerDisplay
                globalTimeLeft={globalTimeLeft}
                isMobilePortrait={isMobilePortrait}
                isMobile={isMobile}
                usePCLayout={usePCLayout}
            />

            {/* ==========================================
                Header: Statistik & Mini Map
               ========================================== */}
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'start', width: '100%', gap: isMobilePortrait ? '0.5rem' : '1rem' }}>
                {/* Kolom Kiri: Kecepatan, POV, Mute, NOS, Lap */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: isMobilePortrait ? '0.4rem' : '1rem', width: 'auto' }}>
                    {/* Baris Speedometer + Tombol POV + Mute */}
                    <div style={{ display: 'flex', gap: isMobilePortrait ? '0.4rem' : '1rem', alignItems: 'center', justifyContent: 'flex-start' }}>
                        {/* Speedometer */}
                        <SpeedometerCard
                            stats={stats} t={t}
                            isMobilePortrait={isMobilePortrait}
                            isMobileLandscape={isMobileLandscape}
                            usePCLayout={usePCLayout}
                        />

                        {/* Tombol POV dan Mute */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <POVToggleButton
                                stateRef={stateRef}
                                viewMode={viewMode}
                                setViewMode={setViewMode}
                                isMobilePortrait={isMobilePortrait}
                                isMobileLandscape={isMobileLandscape}
                                usePCLayout={usePCLayout}
                                isMobile={isMobile}
                            />
                            <MuteToggleButton
                                isMuted={isMuted}
                                toggleMute={toggleMute}
                                isMobilePortrait={isMobilePortrait}
                                isMobileLandscape={isMobileLandscape}
                                usePCLayout={usePCLayout}
                                isMobile={isMobile}
                            />
                        </div>
                    </div>

                    {/* Baris NOS Bar + Lap Counter */}
                    <div style={{ display: 'flex', gap: '0.3rem', width: 'auto' }}>
                        <NOSBar stats={stats} t={t} isMobilePortrait={isMobilePortrait} isMobileLandscape={isMobileLandscape} usePCLayout={usePCLayout} />
                        <LapCounter stats={stats} t={t} lapRace={lapRace} isMobilePortrait={isMobilePortrait} isMobileLandscape={isMobileLandscape} usePCLayout={usePCLayout} isMobile={isMobile} />
                    </div>
                </div>

                {/* Kolom Kanan: Mini Map */}
                <MiniMapContainer
                    miniMapRef={miniMapRef}
                    miniMapMinimized={miniMapMinimized}
                    setMiniMapMinimized={setMiniMapMinimized}
                    isMobile={isMobile}
                    isMobilePortrait={isMobilePortrait}
                    isMobileLandscape={isMobileLandscape}
                    usePCLayout={usePCLayout}
                />
            </div>

            {/* ==========================================
                Footer: Kontrol Permainan
               ========================================== */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', pointerEvents: 'none', paddingBottom: usePCLayout ? '1rem' : '2rem' }}>
                {!usePCLayout ? (
                    <MobileControls
                        state={stateRef}
                        stats={stats}
                        isBraking={isBraking}
                        setIsBraking={setIsBraking}
                        isBoosting={isBoosting}
                        setIsBoosting={setIsBoosting}
                    />
                ) : (
                    <PCControls
                        state={stateRef}
                        stats={stats}
                        isMobileLandscape={isMobileLandscape}
                    />
                )}
            </div>
        </div>
    );
}

// ==========================================
// Sub-Komponen Internal HUD
// ==========================================

/** Tampilan timer global di atas tengah layar */
function TimerDisplay({ globalTimeLeft, isMobilePortrait, isMobile, usePCLayout }: {
    globalTimeLeft: number | null;
    isMobilePortrait: boolean;
    isMobile: boolean;
    usePCLayout: boolean;
}): React.ReactElement {
    return (
        <div style={{
            position: 'absolute',
            left: '50%',
            top: isMobilePortrait ? '0.5rem' : (isMobile ? '0.75rem' : '1.25rem'),
            transform: 'translateX(-50%)',
            zIndex: 1000,
            backgroundColor: (globalTimeLeft !== null && globalTimeLeft <= 30) ? 'rgba(239, 68, 68, 0.35)' : 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(15px)',
            padding: isMobilePortrait ? '0.2rem 0.6rem' : (isMobile ? '0.4rem 0.75rem' : '0.6rem 1.25rem'),
            borderRadius: usePCLayout ? '0.75rem' : '0.5rem',
            border: (globalTimeLeft !== null && globalTimeLeft <= 30) ? '2px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: (globalTimeLeft !== null && globalTimeLeft <= 30) ? '0 0 20px rgba(239, 68, 68, 0.4)' : '0 10px 30px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            pointerEvents: 'none',
            animation: (globalTimeLeft !== null && globalTimeLeft <= 30) ? 'timerPulse 1s infinite alternate' : 'none'
        }}>
            <span style={{
                fontSize: isMobilePortrait ? '0.9rem' : (isMobile ? '1.1rem' : '1.5rem'),
                fontWeight: 900,
                color: '#fff',
                fontFamily: 'Orbitron, sans-serif',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '0.05em'
            }}>
                {globalTimeLeft !== null
                    ? `${Math.floor(globalTimeLeft / 60).toString().padStart(2, '0')}:${(globalTimeLeft % 60).toString().padStart(2, '0')}`
                    : "--:--"
                }
            </span>
        </div>
    );
}

/** Kartu Speedometer */
function SpeedometerCard({ stats, t, isMobilePortrait, isMobileLandscape, usePCLayout }: {
    stats: GameStats; t: any;
    isMobilePortrait: boolean; isMobileLandscape: boolean; usePCLayout: boolean;
}): React.ReactElement {
    return (
        <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(15px)',
            padding: isMobilePortrait ? '0.6rem 0.8rem' : (isMobileLandscape ? '0.5rem 1rem' : (usePCLayout ? '1.5rem 2.5rem' : '0.8rem 1.2rem')),
            borderRadius: usePCLayout ? '0.75rem' : '0.5rem',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            flex: 'none',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
        }}>
            <div style={{ 
                fontSize: isMobilePortrait ? '0.55rem' : (isMobileLandscape ? '0.5rem' : (usePCLayout ? '10px' : '0.6rem')), 
                color: 'rgba(255, 255, 255, 0.5)', 
                textTransform: 'uppercase', 
                letterSpacing: '0.15em', 
                fontWeight: 900, 
                marginBottom: isMobilePortrait ? '0.2rem' : '0.1rem' 
            }}>
                {t('player_game.speedometer')}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem', justifyContent: 'flex-start' }}>
                <span style={{
                    fontSize: isMobilePortrait ? '2.5rem' : (isMobileLandscape ? '2rem' : (usePCLayout ? '4.5rem' : '2.5rem')),
                    fontWeight: 900,
                    fontFamily: 'var(--font-rajdhani)',
                    color: '#fff',
                    fontStyle: 'italic',
                    textShadow: '0 0 10px rgba(255,255,255,0.7)',
                    lineHeight: '1'
                }}>
                    {stats.speed}
                </span>
                <span style={{ 
                    fontSize: isMobilePortrait ? '0.8rem' : (isMobileLandscape ? '0.7rem' : (usePCLayout ? '1rem' : '0.8rem')), 
                    color: '#60a5fa', 
                    fontWeight: 800,
                    marginLeft: '0.2rem'
                }}>
                    KPH
                </span>
            </div>
        </div>
    );
}

/** Tombol Toggle POV (Sudut Pandang) */
function POVToggleButton({ stateRef, viewMode, setViewMode, isMobilePortrait, isMobileLandscape, usePCLayout, isMobile }: {
    stateRef: React.MutableRefObject<GameLoopState>; viewMode: ViewMode; setViewMode: (m: ViewMode) => void;
    isMobilePortrait: boolean; isMobileLandscape: boolean; usePCLayout: boolean; isMobile: boolean;
}): React.ReactElement {
    return (
        <button
            onClick={() => {
                const next = stateRef.current.viewMode === 'first' ? 'third' : 'first';
                stateRef.current.viewMode = next;
                setViewMode(next);
            }}
            style={{
                pointerEvents: 'auto',
                backgroundColor: 'rgba(59, 130, 246, 0.25)',
                backdropFilter: 'blur(15px)',
                width: isMobilePortrait ? '2rem' : (isMobileLandscape ? '1.8rem' : (usePCLayout ? '5rem' : '2.5rem')),
                height: isMobilePortrait ? '2rem' : (isMobileLandscape ? '1.8rem' : (usePCLayout ? '5rem' : '2.5rem')),
                borderRadius: usePCLayout ? '1.25rem' : '0.5rem',
                border: '2px solid rgba(59, 130, 246, 0.5)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
                gap: '2px'
            }}
        >
            <span style={{ fontSize: isMobilePortrait ? '0.8rem' : (isMobileLandscape ? '0.75rem' : (usePCLayout ? '1.8rem' : '1rem')), filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.5))' }}>
                {viewMode === 'first' ? '🎥' : '👤'}
            </span>
        </button>
    );
}

/** Tombol Toggle Mute */
function MuteToggleButton({ isMuted, toggleMute, isMobilePortrait, isMobileLandscape, usePCLayout, isMobile }: {
    isMuted: boolean; toggleMute: () => void;
    isMobilePortrait: boolean; isMobileLandscape: boolean; usePCLayout: boolean; isMobile: boolean;
}): React.ReactElement {
    return (
        <button
            onClick={toggleMute}
            style={{
                pointerEvents: 'auto',
                backgroundColor: isMuted ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)',
                backdropFilter: 'blur(15px)',
                width: isMobilePortrait ? '2rem' : (isMobileLandscape ? '1.8rem' : (usePCLayout ? '5rem' : '2.5rem')),
                height: isMobilePortrait ? '2rem' : (isMobileLandscape ? '1.8rem' : (usePCLayout ? '5rem' : '2.5rem')),
                borderRadius: usePCLayout ? '1.25rem' : '0.5rem',
                border: isMuted ? '2px solid rgba(239, 68, 68, 0.5)' : '2px solid rgba(16, 185, 129, 0.5)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
            }}
        >
            <span style={{ fontSize: isMobilePortrait ? '0.8rem' : (isMobileLandscape ? '0.75rem' : (usePCLayout ? '1.8rem' : '1.1rem')) }}>
                {isMuted ? <VolumeX size={isMobile ? 16 : 24} /> : <Volume2 size={isMobile ? 16 : 24} />}
            </span>
        </button>
    );
}

/** Bar NOS (Nitrous Oxide) */
function NOSBar({ stats, t, isMobilePortrait, isMobileLandscape, usePCLayout }: {
    stats: GameStats; t: any;
    isMobilePortrait: boolean; isMobileLandscape: boolean; usePCLayout: boolean;
}): React.ReactElement {
    return (
        <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(15px)',
            padding: isMobilePortrait ? '0.2rem 0.5rem' : (isMobileLandscape ? '0.2rem 0.5rem' : (usePCLayout ? '0.6rem 1rem' : '0.4rem 0.75rem')),
            borderRadius: usePCLayout ? '0.75rem' : '0.5rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: usePCLayout ? '0.75rem' : '0.5rem',
            flex: isMobilePortrait ? 'none' : (usePCLayout ? 'none' : 1)
        }}>
            <span style={{ color: '#60a5fa', fontWeight: 900, fontSize: isMobilePortrait ? '0.5rem' : (isMobileLandscape ? '0.5rem' : (usePCLayout ? '0.7rem' : '0.6rem')), textShadow: '0 0 10px rgba(59, 130, 246, 0.8)' }}>{t('player_game.nos')}</span>
            <div style={{ flex: 1, minWidth: isMobilePortrait ? '40px' : (isMobileLandscape ? '40px' : (usePCLayout ? '80px' : '30px')), height: '4px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${stats.nos}%`, height: '100%', backgroundColor: '#3b82f6', boxShadow: '0 0 10px #3b82f6' }} />
            </div>
        </div>
    );
}

/** Penghitung Lap */
function LapCounter({ stats, t, lapRace, isMobilePortrait, isMobileLandscape, usePCLayout, isMobile }: {
    stats: GameStats; t: any; lapRace: number;
    isMobilePortrait: boolean; isMobileLandscape: boolean; usePCLayout: boolean; isMobile: boolean;
}): React.ReactElement {
    return (
        <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(15px)',
            padding: isMobilePortrait ? '0.2rem 0.5rem' : (isMobileLandscape ? '0.2rem 0.5rem' : (isMobile ? '0.4rem 0.75rem' : '0.6rem 1rem')),
            borderRadius: usePCLayout ? '0.75rem' : '0.5rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            flex: 'none'
        }}>
            <span style={{ color: '#4ade80', fontWeight: 900, fontSize: isMobilePortrait ? '0.5rem' : (isMobileLandscape ? '0.5rem' : (usePCLayout ? '0.7rem' : '0.6rem')), textShadow: '0 0 10px rgba(74, 222, 128, 0.8)' }}>{t('player_game.lap')}</span>
            <span style={{ fontSize: isMobilePortrait ? '0.7rem' : (isMobileLandscape ? '0.7rem' : (usePCLayout ? '1.25rem' : '0.8rem')), fontWeight: 900, color: '#fff' }}>{Math.min(stats.totalLaps, lapRace + 1)}/{stats.totalLaps}</span>
        </div>
    );
}

/** Kontainer Mini Map */
function MiniMapContainer({ miniMapRef, miniMapMinimized, setMiniMapMinimized, isMobile, isMobilePortrait, isMobileLandscape, usePCLayout }: {
    miniMapRef: React.RefObject<HTMLCanvasElement | null>;
    miniMapMinimized: boolean; setMiniMapMinimized: (v: boolean) => void;
    isMobile: boolean; isMobilePortrait: boolean; isMobileLandscape: boolean; usePCLayout: boolean;
}): React.ReactElement {
    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                right: 0,
                zIndex: 300
            }}
        >
            <div
                onClick={() => isMobile && setMiniMapMinimized(!miniMapMinimized)}
                style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(10px)',
                padding: isMobile ? '0.25rem' : '0.4rem',
                borderRadius: isMobile ? '0.6rem' : '1rem',
                transform: (isMobile && miniMapMinimized) ? 'scale(0.35)' : (isMobileLandscape ? 'scale(0.35)' : (isMobilePortrait ? 'scale(0.55)' : (isMobile ? 'scale(0.85)' : 'none'))),
                transformOrigin: 'top right',
                position: 'relative',
                border: isMobile ? '2px solid rgba(255,255,255,0.2)' : 'none',
                pointerEvents: 'auto',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28)'
            }}>
                <canvas
                    ref={miniMapRef}
                    style={{ borderRadius: usePCLayout ? '0.75rem' : '0.4rem', display: 'block' }}
                />
                {/* Ikon toggle mini map (hanya mobile) */}
                {isMobile && (
                    <div style={{
                        position: 'absolute',
                        bottom: '-8px',
                        left: '-8px',
                        width: '24px',
                        height: '24px',
                        backgroundColor: '#3b82f6',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        border: '2px solid white',
                        transform: miniMapMinimized ? 'scale(2.5)' : 'none',
                        transition: 'transform 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
                    }}>
                        {miniMapMinimized ? '🗺️' : '➖'}
                    </div>
                )}
            </div>
        </div>
    );
}
