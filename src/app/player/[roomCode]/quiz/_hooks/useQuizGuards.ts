/**
 * =====================================================
 * HOOK: useQuizGuards - Real-time Guard Quiz
 * =====================================================
 * Bertanggung jawab untuk:
 * - Memantau perubahan status sesi via Supabase Realtime
 * - Memantau perubahan status peserta (minigame flag)
 * - Redirect otomatis jika status berubah dari luar
 *   (misal: host mengakhiri sesi, atau minigame diaktifkan)
 * =====================================================
 */
'use client';

import { useEffect, MutableRefObject } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseGame } from '@/lib/supabase/game-client';

/**
 * Hook untuk memantau perubahan real-time pada sesi dan peserta.
 * Menggunakan Supabase Realtime (postgres_changes) untuk mendeteksi
 * perubahan status yang memerlukan navigasi halaman.
 *
 * @param roomCode - Kode room aktif (dari state)
 * @param roomCodeFromParams - Kode room dari URL parameter (fallback)
 * @param isTransitioningRef - Ref flag untuk mencegah redirect ganda saat transisi
 */
export function useQuizGuards(
    roomCode: string | null,
    roomCodeFromParams: string,
    isTransitioningRef: MutableRefObject<boolean>
) {
    const router = useRouter();

    useEffect(() => {
        // Ambil data dari localStorage (hanya di client-side)
        const sessId = typeof window !== 'undefined'
            ? localStorage.getItem('nitroquiz_game_sessionId')
            : null;
        const participantId = typeof window !== 'undefined'
            ? localStorage.getItem('nitroquiz_game_participantId')
            : null;

        // Guard: Tidak ada data sesi/peserta → skip
        if (!sessId || !participantId) return;

        // Buat channel Supabase Realtime untuk memantau perubahan
        const channel = supabaseGame
            .channel(`player_quiz_guards_${participantId}`)

            // Pantau perubahan status sesi (sessions table)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessId}` },
                (payload) => {
                    const status = payload.new.status;

                    // Sesi selesai → redirect ke result
                    if (status === 'finished' || status === 'completed') {
                        router.push(`/player/${roomCode || roomCodeFromParams}/result`);
                    }
                    // Sesi kembali ke lobby → redirect ke waiting
                    else if (status === 'waiting' || status === 'lobby') {
                        router.push(`/player/${roomCode || roomCodeFromParams}/waiting`);
                    }
                }
            )

            // Pantau perubahan status peserta (participants table)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'participants', filter: `id=eq.${participantId}` },
                (payload) => {
                    // Cegah redirect ganda saat sedang dalam proses transisi
                    if (isTransitioningRef.current) return;

                    // Jika minigame diaktifkan dan belum selesai → redirect ke game (balapan)
                    if (payload.new.minigame === true && !payload.new.finished_at) {
                        router.push(`/player/${roomCode || roomCodeFromParams}/game`);
                    }
                }
            )
            .subscribe();

        // Cleanup: hapus channel saat unmount
        return () => {
            supabaseGame.removeChannel(channel);
        };
    }, [router, roomCode, roomCodeFromParams]);
}
