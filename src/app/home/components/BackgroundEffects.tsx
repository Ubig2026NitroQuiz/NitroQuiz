/**
 * ============================================================================
 *  KOMPONEN: BACKGROUND EFFECTS
 * ============================================================================
 *
 *  Komponen ini menampilkan semua efek visual latar belakang halaman beranda:
 *  - Gambar background utama
 *  - Overlay gradient untuk keterbacaan teks
 *  - Animasi garis kecepatan (speed lines)
 *  - Efek scanlines
 *  - Racing stripe di bagian atas
 * ============================================================================
 */

import React from "react";

interface BackgroundEffectsProps {
    /** Data animasi garis kecepatan yang sudah digenerate */
    speedLines: Array<{
        id: number;
        top: string;
        width: string;
        delay: string;
        duration: string;
    }>;
}

export const BackgroundEffects: React.FC<BackgroundEffectsProps> = ({ speedLines }) => {
    return (
        <>
            {/* Garis dekoratif racing di bagian atas layar */}
            <div className="racing-stripe"></div>

            {/* Gambar background utama (fixed, full-screen) */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
                style={{
                    backgroundImage: 'url("/assets/backgorund/homepage_bg.webp")',
                    backgroundAttachment: 'fixed'
                }}
            ></div>

            {/* Overlay gradient agar teks di atasnya mudah dibaca */}
            <div className="fixed inset-0 z-0 bg-gradient-to-t from-[#04060f] via-[#04060f]/60 to-[#7C3AED]/10 pointer-events-none"></div>

            {/* Animasi garis kecepatan yang bergerak horizontal */}
            <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden">
                {speedLines.map((line) => (
                    <div
                        key={line.id}
                        className="speed-line"
                        style={{
                            top: line.top,
                            width: line.width,
                            animationDelay: line.delay,
                            animationDuration: line.duration,
                        }}
                    />
                ))}
            </div>

            {/* Efek scanlines halus untuk estetika retro */}
            <div className="scanlines"></div>
        </>
    );
};
