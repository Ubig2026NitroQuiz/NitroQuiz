/**
 * =====================================================
 * KOMPONEN OVERLAY LOADING - NitroQuiz Racing Game
 * =====================================================
 * Overlay yang ditampilkan saat aset game sedang dimuat
 * atau timer belum siap. Menampilkan spinner dan teks.
 * =====================================================
 */

'use client';

import React from 'react';

// ==========================================
// Overlay Loading Awal (Establishing Signal)
// ==========================================

/**
 * Overlay loading saat aset pertama kali dimuat.
 * Menampilkan spinner biru dan teks "Loading..."
 */
export function AssetLoadingOverlay(): React.ReactElement {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 3000,
            backgroundColor: '#0a0a0f', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', color: 'white',
            fontFamily: 'var(--font-rajdhani)'
        }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    width: '64px', height: '64px',
                    border: '4px solid rgba(45, 106, 242, 0.3)',
                    borderTopColor: '#2d6af2',
                    borderRadius: '50%',
                    margin: '0 auto 1.5rem auto',
                    animation: 'spin 1s linear infinite'
                }} />
                <p style={{
                    marginTop: '1rem',
                    color: '#2d6af2',
                    fontSize: '1.25rem',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}>
                    {/* {t('player_game.establishing_signal')} */}
                    Loading...
                </p>
            </div>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
            `}</style>
        </div>
    );
}

// ==========================================
// Overlay Loading Utama (Aset + Timer)
// ==========================================

/**
 * Overlay loading utama yang ditampilkan sampai aset dan timer siap.
 * Lebih besar dan lebih menonjol dari AssetLoadingOverlay.
 */
export function MainLoadingOverlay(): React.ReactElement {
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617', color: 'white', fontFamily: 'var(--font-rajdhani)' }}>
            <div style={{ width: '64px', height: '64px', border: '4px solid rgba(59,130,246,0.1)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', boxShadow: '0 0 20px rgba(59,130,246,0.2)' }} />
            <p style={{ marginTop: '2rem', fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4em', color: '#3b82f6', animation: 'pulse 2s ease-in-out infinite' }}>
                {/* {t('player_game.establishing_signal')} */}
                Loading...
            </p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
        </div>
    );
}
