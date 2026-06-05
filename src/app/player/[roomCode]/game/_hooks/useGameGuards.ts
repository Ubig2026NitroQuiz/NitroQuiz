/**
 * Hook real-time guards: memantau status sesi dan peserta via Supabase.
 */
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseGame } from '@/lib/supabase/game-client';

export function useGameGuards(roomCode: string, setLapRace: (n: number) => void) {
    const router = useRouter();

    useEffect(() => {
        const sessId = typeof window !== 'undefined' ? localStorage.getItem('nitroquiz_game_sessionId') : null;
        const participantId = typeof window !== 'undefined' ? localStorage.getItem('nitroquiz_game_participantId') : null;
        if (!sessId || !participantId) return;

        const channel = supabaseGame
            .channel(`player_game_guards_${participantId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessId}` },
                (payload) => {
                    const status = payload.new.status;
                    if (status === 'finished' || status === 'completed') router.push(`/player/${roomCode}/result`);
                    else if (status === 'waiting' || status === 'lobby') router.push(`/player/${roomCode}/waiting`);
                })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'participants', filter: `id=eq.${participantId}` },
                (payload) => {
                    if (payload.new.minigame === false && !payload.new.finished_at) router.push(`/player/${roomCode}/quiz`);
                    if (payload.new.lap_race !== undefined) {
                        console.log('[GameSpeed] Lap updated from DB:', payload.new.lap_race);
                        setLapRace(payload.new.lap_race);
                    }
                })
            .subscribe();

        return () => { supabaseGame.removeChannel(channel); };
    }, [router, roomCode]);
}
