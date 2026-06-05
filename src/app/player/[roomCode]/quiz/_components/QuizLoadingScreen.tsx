/**
 * =====================================================
 * KOMPONEN: QuizLoadingScreen - Layar Loading Quiz
 * =====================================================
 * Menampilkan layar loading saat quiz sedang diinisialisasi.
 * Ditampilkan ketika:
 * - Komponen belum di-mount
 * - Soal belum di-fetch
 * - Timer belum siap
 * =====================================================
 */
'use client';

import { Trophy } from 'lucide-react';
import { BG_COLOR, ACCENT_BLUE } from '../_constants';

/**
 * Layar loading dengan animasi spinner dan ikon trophy.
 * Menggunakan desain konsisten dengan tema NitroQuiz (warna biru, font rajdhani).
 */
export function QuizLoadingScreen() {
    return (
        <div
            className="min-h-screen flex items-center justify-center text-white font-rajdhani"
            style={{ backgroundColor: BG_COLOR }}
        >
            <div className="flex flex-col items-center gap-6">
                {/* Spinner dengan ikon Trophy di tengah */}
                <div className="relative">
                    <div
                        className="w-16 h-16 border-4 rounded-full animate-spin"
                        style={{
                            borderColor: `${ACCENT_BLUE}1A`, // 10% opacity
                            borderTopColor: ACCENT_BLUE,
                        }}
                    />
                    <Trophy
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6"
                        style={{ color: `${ACCENT_BLUE}66` }} // 40% opacity
                    />
                </div>

                {/* Teks loading dengan animasi pulse */}
                <p
                    className="text-base font-bold uppercase tracking-[0.4em] animate-pulse"
                    style={{ color: ACCENT_BLUE }}
                >
                    {/* Teks asli: t("player_quiz.establishing_signal") */}
                    Loading...
                </p>
            </div>
        </div>
    );
}

/**
 * Layar kosong minimalis (tanpa konten).
 * Ditampilkan saat kondisi awal sebelum data siap.
 */
export function QuizEmptyScreen() {
    return (
        <div
            className="min-h-screen"
            style={{ backgroundColor: BG_COLOR }}
        />
    );
}
