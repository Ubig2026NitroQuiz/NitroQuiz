/**
 * =====================================================
 * KOMPONEN KONTROL PC/LANDSCAPE - NitroQuiz Racing Game
 * =====================================================
 * Kontrol untuk mode PC dan mobile landscape:
 * - Tombol arah kiri/kanan (kemudi)
 * - Tombol GAS (hijau besar)
 * - Tombol BRAKE/STOP (merah kecil)
 * - Tombol NOS (biru kecil)
 * =====================================================
 */

'use client';

import React from 'react';
import type { GameLoopState, GameStats } from '../_types';

interface PCControlsProps {
    /** State game loop (ref) */
    state: React.MutableRefObject<GameLoopState>;
    /** Statistik game untuk menampilkan status NOS */
    stats: GameStats;
    /** Apakah mode mobile landscape */
    isMobileLandscape: boolean;
}

/**
 * Kontrol PC/Landscape — kemudi, gas, brake, dan NOS.
 * Layout: kemudi di kiri, aksi di kanan.
 */
export function PCControls({ state, stats, isMobileLandscape }: PCControlsProps): React.ReactElement {
    return (
        <>
            {/* Kontrol Kemudi — Tombol Bulat Kompak */}
            <div style={{ display: 'flex', gap: '0.6rem', pointerEvents: 'auto' }}>
                {/* Tombol Kiri */}
                <button
                    style={{
                        width: isMobileLandscape ? '3.5rem' : '5rem',
                        height: isMobileLandscape ? '3.5rem' : '5rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '50%',
                        border: isMobileLandscape ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', outline: 'none'
                    }}
                    onPointerDown={(e) => { e.preventDefault(); state.current.keyLeft = true; }}
                    onPointerUp={(e) => { e.preventDefault(); state.current.keyLeft = false; }}
                    onPointerCancel={(e) => { e.preventDefault(); state.current.keyLeft = false; }}
                    onPointerLeave={(e) => { state.current.keyLeft = false; }}
                >
                    <span style={{ fontSize: isMobileLandscape ? '1rem' : '1.25rem', color: 'white', filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.8))' }}>◀</span>
                </button>
                {/* Tombol Kanan */}
                <button
                    style={{
                        width: isMobileLandscape ? '3.5rem' : '5rem',
                        height: isMobileLandscape ? '3.5rem' : '5rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '50%',
                        border: isMobileLandscape ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', outline: 'none'
                    }}
                    onPointerDown={(e) => { e.preventDefault(); state.current.keyRight = true; }}
                    onPointerUp={(e) => { e.preventDefault(); state.current.keyRight = false; }}
                    onPointerCancel={(e) => { e.preventDefault(); state.current.keyRight = false; }}
                    onPointerLeave={(e) => { state.current.keyRight = false; }}
                >
                    <span style={{ fontSize: isMobileLandscape ? '1rem' : '1.25rem', color: 'white', filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.8))' }}>▶</span>
                </button>
            </div>

            {/* Kontrol Aksi Kanan (Brake, Gas, NOS) */}
            <div style={{ display: 'flex', gap: isMobileLandscape ? '0.5rem' : '0.75rem', alignItems: 'flex-end', pointerEvents: 'auto' }}>
                {/* Tombol Brake — Kompak */}
                <button
                    style={{
                        width: isMobileLandscape ? '3.2rem' : '4.5rem',
                        height: isMobileLandscape ? '3.2rem' : '4.5rem',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '50%',
                        border: isMobileLandscape ? '1px solid #ef4444' : '1px solid rgba(239, 68, 68, 0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#ef4444', fontWeight: 900,
                        fontSize: isMobileLandscape ? '0.5rem' : '0.6rem',
                        textShadow: '0 0 8px rgba(239, 68, 68, 0.8)'
                    }}
                    onPointerDown={(e) => { e.preventDefault(); state.current.keySlower = true; }}
                    onPointerUp={(e) => { e.preventDefault(); state.current.keySlower = false; }}
                    onPointerCancel={(e) => { e.preventDefault(); state.current.keySlower = false; }}
                    onPointerLeave={(e) => { state.current.keySlower = false; }}
                >
                    STOP
                </button>

                {/* Tombol Gas — Lingkaran Besar Hijau */}
                <button
                    style={{
                        width: isMobileLandscape ? '5.5rem' : '7.5rem',
                        height: isMobileLandscape ? '5.5rem' : '7.5rem',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        borderRadius: '50%',
                        border: isMobileLandscape ? '2px solid rgba(255, 255, 255, 0.3)' : '3px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'white', fontWeight: 900,
                        fontSize: isMobileLandscape ? '1.1rem' : '1.25rem',
                        boxShadow: isMobileLandscape ? '0 0 15px rgba(16, 185, 129, 0.4)' : 'none'
                    }}
                    onPointerDown={(e) => { e.preventDefault(); state.current.keyFaster = true; }}
                    onPointerUp={(e) => { e.preventDefault(); state.current.keyFaster = false; }}
                    onPointerCancel={(e) => { e.preventDefault(); state.current.keyFaster = false; }}
                    onPointerLeave={(e) => { state.current.keyFaster = false; }}
                >
                    <span style={{ filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.8))' }}>GO</span>
                </button>

                {/* Tombol NOS — Kompak */}
                <button
                    style={{
                        width: isMobileLandscape ? '3.8rem' : '5rem',
                        height: isMobileLandscape ? '3.8rem' : '5rem',
                        background: stats.nos > 0 ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '50%',
                        border: isMobileLandscape ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', opacity: stats.nos > 0 ? 1 : 0.5, color: 'white', fontWeight: 900,
                        fontSize: isMobileLandscape ? '0.7rem' : '0.8rem',
                        boxShadow: stats.nos > 0 && isMobileLandscape ? '0 0 15px rgba(59, 130, 246, 0.4)' : 'none'
                    }}
                    onPointerDown={(e) => { e.preventDefault(); state.current.keyBoost = true; }}
                    onPointerUp={(e) => { e.preventDefault(); state.current.keyBoost = false; }}
                    onPointerCancel={(e) => { e.preventDefault(); state.current.keyBoost = false; }}
                    onPointerLeave={(e) => { state.current.keyBoost = false; }}
                >
                    <span style={{ filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.8))' }}>NOS</span>
                </button>
            </div>
        </>
    );
}
