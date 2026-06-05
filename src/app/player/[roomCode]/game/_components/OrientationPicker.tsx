/**
 * =====================================================
 * KOMPONEN PEMILIHAN ORIENTASI - NitroQuiz Racing Game
 * =====================================================
 * Overlay untuk pemain mobile memilih mode tampilan:
 * Portrait (swipe untuk kemudi) atau Landscape (tombol).
 * =====================================================
 */

'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

interface OrientationPickerProps {
    /** Callback saat memilih orientasi */
    onSelect: (orientation: 'portrait' | 'landscape') => void;
}

/**
 * Overlay pemilihan orientasi mobile.
 * Menampilkan dua kartu: Portrait dan Landscape dengan ikon dan deskripsi.
 */
export function OrientationPicker({ onSelect }: OrientationPickerProps): React.ReactElement {
    const { t } = useTranslation();

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: '#020617',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2500,
            color: 'white',
            fontFamily: 'var(--font-rajdhani)',
            padding: '1.5rem',
        }}>
            {/* Garis-garis grid latar belakang */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
                background: 'linear-gradient(transparent 0%, rgba(45,106,242,0.05) 1px, transparent 1px), linear-gradient(90deg, transparent 0%, rgba(45,106,242,0.05) 1px, transparent 1px)',
                backgroundSize: '50px 50px',
                transform: 'perspective(500px) rotateX(60deg)',
                transformOrigin: 'bottom',
                opacity: 0.4, pointerEvents: 'none',
            }} />

            {/* Judul */}
            <div style={{ textAlign: 'center', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.3))' }}>🏎️</div>
                <h2 style={{
                    fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase',
                    letterSpacing: '0.3em', color: 'white', margin: 0,
                    textShadow: '0 0 20px rgba(45,106,242,0.5)',
                }}>{t('player_game.select_view')}</h2>
                <p style={{ fontSize: '0.7rem', color: '#64748b', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '0.5rem' }}>
                    {t('player_game.choose_perspective')}
                </p>
            </div>

            {/* Kartu Pilihan */}
            <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '340px', position: 'relative', zIndex: 1 }}>
                {/* Kartu Portrait */}
                <button
                    onClick={() => onSelect('portrait')}
                    style={{
                        flex: 1, padding: '1.5rem 1rem',
                        background: 'linear-gradient(135deg, rgba(45,106,242,0.15) 0%, rgba(45,106,242,0.05) 100%)',
                        border: '2px solid rgba(45,106,242,0.4)',
                        borderRadius: '1.25rem', color: 'white',
                        cursor: 'pointer', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: '0.75rem',
                        transition: 'all 0.2s',
                    }}
                >
                    <div style={{
                        width: '3rem', height: '4.5rem', borderRadius: '0.5rem',
                        border: '2px solid #2d6af2', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(45,106,242,0.1)',
                        boxShadow: '0 0 20px rgba(45,106,242,0.2)',
                    }}>
                        <span style={{ fontSize: '1.25rem' }}>📱</span>
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{t('player_game.portrait')}</span>
                    <span style={{ fontSize: '0.6rem', color: '#64748b', letterSpacing: '0.1em' }}>{t('player_game.swipe_to_steer')}</span>
                </button>

                {/* Kartu Landscape */}
                <button
                    onClick={() => {
                        onSelect('landscape');
                        // Coba masuk fullscreen dan kunci orientasi
                        if (document.documentElement.requestFullscreen) {
                            document.documentElement.requestFullscreen().catch(() => { });
                        }
                        if (screen.orientation && (screen.orientation as any).lock) {
                            (screen.orientation as any).lock('landscape').catch(() => { });
                        }
                    }}
                    style={{
                        flex: 1, padding: '1.5rem 1rem',
                        background: 'linear-gradient(135deg, rgba(0,255,157,0.1) 0%, rgba(0,255,157,0.03) 100%)',
                        border: '2px solid rgba(0,255,157,0.4)',
                        borderRadius: '1.25rem', color: 'white',
                        cursor: 'pointer', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: '0.75rem',
                        transition: 'all 0.2s',
                    }}
                >
                    <div style={{
                        width: '4.5rem', height: '3rem', borderRadius: '0.5rem',
                        border: '2px solid #00ff9d', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,255,157,0.08)',
                        boxShadow: '0 0 20px rgba(0,255,157,0.15)',
                    }}>
                        <span style={{ fontSize: '1.25rem', transform: 'rotate(90deg)' }}>📱</span>
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{t('player_game.landscape')}</span>
                    <span style={{ fontSize: '0.6rem', color: '#64748b', letterSpacing: '0.1em' }}>{t('player_game.button_controls')}</span>
                </button>
            </div>
        </div>
    );
}
