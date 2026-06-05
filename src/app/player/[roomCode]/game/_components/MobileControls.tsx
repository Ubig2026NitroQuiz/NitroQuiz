/**
 * =====================================================
 * KOMPONEN KONTROL MOBILE - NitroQuiz Racing Game
 * =====================================================
 * Kontrol sentuh untuk mode mobile portrait:
 * - Tombol NOS (kiri)
 * - Tombol BRAKE (kanan)
 * Kemudi dilakukan melalui swipe layar (bukan tombol).
 * =====================================================
 */

'use client';

import React from 'react';
import type { GameLoopState, GameStats } from '../_types';

interface MobileControlsProps {
    /** State game loop (ref) */
    state: React.MutableRefObject<GameLoopState>;
    /** Statistik game untuk menampilkan status NOS */
    stats: GameStats;
    /** Apakah tombol brake sedang ditekan */
    isBraking: boolean;
    /** Callback saat status brake berubah */
    setIsBraking: (v: boolean) => void;
    /** Apakah tombol NOS sedang ditekan */
    isBoosting: boolean;
    /** Callback saat status NOS berubah */
    setIsBoosting: (v: boolean) => void;
}

/**
 * Kontrol mobile portrait — tombol NOS di kiri, BRAKE di kanan.
 * Kemudi menggunakan swipe layar (ditangani di hook terpisah).
 */
export function MobileControls({
    state, stats, isBraking, setIsBraking, isBoosting, setIsBoosting
}: MobileControlsProps): React.ReactElement {
    return (
        <>
            {/* Sisi Kiri — Tombol NOS */}
            <div style={{ display: 'flex', gap: '0.75rem', pointerEvents: 'auto' }}>
                <button
                    style={{
                        width: '4.5rem', height: '4.5rem',
                        background: stats.nos > 0
                            ? 'radial-gradient(circle at center, #3b82f6 0%, #1e40af 100%)'
                            : 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '50%',
                        border: stats.nos > 0 ? '3px solid #60a5fa' : '2px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', opacity: stats.nos > 0 ? 1 : 0.5, color: 'white',
                        fontWeight: 900,
                        boxShadow: stats.nos > 0 ? '0 0 25px rgba(59, 130, 246, 0.6), inset 0 0 15px rgba(255, 255, 255, 0.3)' : 'none',
                        transition: 'all 0.1s ease',
                        transform: isBoosting ? 'scale(0.92)' : 'scale(1)',
                        fontFamily: 'var(--font-rajdhani)',
                        touchAction: 'none'
                    }}
                    onPointerDown={(e) => { e.preventDefault(); state.current.keyBoost = true; setIsBoosting(true); }}
                    onPointerUp={(e) => { e.preventDefault(); state.current.keyBoost = false; setIsBoosting(false); }}
                    onPointerCancel={(e) => { e.preventDefault(); state.current.keyBoost = false; setIsBoosting(false); }}
                    onPointerLeave={() => { state.current.keyBoost = false; setIsBoosting(false); }}
                >
                    <span style={{ fontSize: '1.2rem', fontStyle: 'italic', letterSpacing: '-0.05em' }}>NITRO</span>
                    <div style={{ width: '60%', height: '2px', backgroundColor: 'rgba(255,255,255,0.4)', marginTop: '2px' }} />
                </button>
            </div>

            {/* Sisi Kanan — Tombol BRAKE */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', pointerEvents: 'auto' }}>
                <button
                    style={{
                        width: '4.5rem', height: '4.5rem',
                        background: isBraking
                            ? 'radial-gradient(circle at center, #ef4444 0%, #991b1b 100%)'
                            : 'rgba(239, 68, 68, 0.1)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '50%',
                        border: '3px solid #ef4444',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: isBraking ? 'white' : '#ef4444',
                        fontWeight: 900,
                        textShadow: isBraking ? '0 0 10px white' : '0 0 8px rgba(239, 68, 68, 0.8)',
                        boxShadow: isBraking
                            ? '0 0 30px rgba(239, 68, 68, 0.8), inset 0 0 15px rgba(255, 255, 255, 0.3)'
                            : '0 0 10px rgba(239, 68, 68, 0.2)',
                        transition: 'all 0.1s ease',
                        transform: isBraking ? 'scale(0.92)' : 'scale(1)',
                        fontFamily: 'var(--font-rajdhani)',
                        touchAction: 'none'
                    }}
                    onPointerDown={(e) => { e.preventDefault(); state.current.keySlower = true; setIsBraking(true); }}
                    onPointerUp={(e) => { e.preventDefault(); state.current.keySlower = false; setIsBraking(false); }}
                    onPointerCancel={(e) => { e.preventDefault(); state.current.keySlower = false; setIsBraking(false); }}
                    onPointerLeave={() => { state.current.keySlower = false; setIsBraking(false); }}
                >
                    <span style={{ fontSize: '1.2rem', fontStyle: 'italic', letterSpacing: '0.05em' }}>BRAKE</span>
                    <div style={{ width: '60%', height: '2px', backgroundColor: isBraking ? 'rgba(255,255,255,0.4)' : 'rgba(239,68,68,0.4)', marginTop: '2px' }} />
                </button>
            </div>
        </>
    );
}
