/**
 * =====================================================
 * KOMPONEN OVERLAY SELESAI - NitroQuiz Racing Game
 * =====================================================
 * Overlay yang muncul saat pemain menyelesaikan balapan
 * atau waktu habis. Menampilkan pesan dan spinner redirect.
 * =====================================================
 */

'use client';

import React from 'react';
import type { GameState } from '../_types';

interface FinishOverlayProps {
    /** State permainan saat ini */
    gameState: GameState;
    /** Apakah perangkat mobile */
    isMobile: boolean;
}

/**
 * Overlay akhir permainan.
 * Menampilkan "TIME UP" atau "Loading..." dengan animasi glow hijau.
 */
export function FinishOverlay({ gameState, isMobile }: FinishOverlayProps): React.ReactElement {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: 'rgba(2, 6, 23, 0.95)',
            backdropFilter: 'blur(12px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-rajdhani)', textAlign: 'center'
        }}>
            {/* Teks utama dengan animasi glow */}
            <div style={{
                fontSize: isMobile ? '2.5rem' : '3.5rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.25em',
                color: '#00ff9d',
                textShadow: '0 0 30px rgba(0,255,157,0.6), 0 0 60px rgba(0,255,157,0.3)',
                marginBottom: '1.5rem',
                animation: 'finish-glow 0.6s ease-in-out infinite alternate'
            }}>
                {/* {gameState === 'gameover' ? '⏱ TIME UP' : t('player_game.race_finished')} */}
                {gameState === 'gameover' ? '⏱ TIME UP' : 'Loading...'}
            </div>

            {/* Spinner dan teks redirect */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                    width: '20px', height: '20px',
                    border: '3px solid rgba(0,255,157,0.2)',
                    borderTopColor: '#00ff9d',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                }} />
                <span style={{
                    fontSize: '0.9rem',
                    color: '#64748b',
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase'
                }}>
                    {/* {t('player_game.redirecting')}... */}
                    Loading...
                </span>
            </div>

            <style>{`
                @keyframes finish-glow {
                    from { opacity: 1; text-shadow: 0 0 30px rgba(0,255,157,0.6); }
                    to   { opacity: 0.75; text-shadow: 0 0 60px rgba(0,255,157,0.9); }
                }
            `}</style>
        </div>
    );
}
