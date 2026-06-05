/**
 * =====================================================
 * HOOK: useQuizTimer - Timer Global Quiz
 * =====================================================
 * Bertanggung jawab untuk:
 * - Mengambil waktu mulai sesi dari database
 * - Menghitung sisa waktu secara real-time
 * - Sinkronisasi dengan server time (menghindari manipulasi)
 * - Redirect otomatis saat waktu habis
 * =====================================================
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSyncedServerTime } from '@/lib/serverTime';
import { supabaseGame } from '@/lib/supabase/game-client';

/**
 * Hook untuk mengelola timer global quiz.
 * Timer disinkronisasi dengan waktu server untuk menghindari kecurangan.
 *
 * @param sessionId - ID sesi aktif (null jika belum tersedia)
 * @param roomCode - Kode room aktif
 * @param roomCodeFromParams - Kode room dari URL parameter (fallback)
 * @returns Object berisi globalTimeLeft (detik) dan isTimerReady (boolean)
 */
export function useQuizTimer(
    sessionId: string | null,
    roomCode: string | null,
    roomCodeFromParams: string
) {
    const router = useRouter();

    /** Sisa waktu global dalam detik (null = belum dihitung) */
    const [globalTimeLeft, setGlobalTimeLeft] = useState<number | null>(null);

    /** Flag menandai timer sudah siap (sudah fetch data awal) */
    const [isTimerReady, setIsTimerReady] = useState(false);

    useEffect(() => {
        // Tunggu sampai sessionId tersedia
        if (!sessionId) return;

        /**
         * Fetch data waktu mulai dari database, lalu mulai interval countdown.
         * Menghitung sisa waktu berdasarkan selisih waktu server saat ini
         * dengan waktu mulai sesi + total menit yang dialokasikan.
         */
        const fetchAndStartTimer = async () => {
            const { data } = await supabaseGame
                .from('sessions')
                .select('started_at, total_time_minutes')
                .eq('id', sessionId)
                .single();

            // Jika belum ada started_at, timer belum dimulai
            if (!data?.started_at) {
                setIsTimerReady(true);
                return;
            }

            const start = new Date(data.started_at).getTime();

            // Hitung sekali dulu SEBELUM interval — ini yang menghilangkan flicker
            const now = getSyncedServerTime();
            const elapsedSeconds = Math.floor((now - start) / 1000);
            const initialRemaining = Math.max(0, (data.total_time_minutes || 5) * 60 - elapsedSeconds);
            setGlobalTimeLeft(initialRemaining);
            setIsTimerReady(true);

            // Mulai interval 1 detik untuk update countdown
            const interval = setInterval(() => {
                const start = new Date(data.started_at).getTime();
                const now = getSyncedServerTime();
                const elapsedSeconds = Math.floor((now - start) / 1000);
                const remaining = Math.max(0, (data.total_time_minutes || 5) * 60 - elapsedSeconds);

                setGlobalTimeLeft(remaining);

                // Waktu habis → redirect ke halaman result
                if (remaining <= 0) {
                    clearInterval(interval);
                    router.push(`/player/${roomCode || roomCodeFromParams}/result`);
                }
            }, 1000);

            return interval;
        };

        // Jalankan fetch dan simpan reference interval untuk cleanup
        let intervalId: NodeJS.Timeout | undefined;
        fetchAndStartTimer().then(id => { intervalId = id; });

        // Cleanup: hentikan interval saat unmount atau sessionId berubah
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [sessionId, router, roomCode, roomCodeFromParams]);

    return { globalTimeLeft, isTimerReady };
}
