/**
 * Hook untuk sinkronisasi timer global dengan server.
 */
'use client';
import { useState, useEffect, useCallback } from 'react';
import { getSyncedServerTime, syncServerTime } from '@/lib/serverTime';
import { supabaseGame } from '@/lib/supabase/game-client';
import type { GameState } from '../_types';

export function useGameTimer(
    endGame: () => Promise<void>,
    setGameState: (s: GameState) => void
) {
    const [globalTimeLeft, setGlobalTimeLeft] = useState<number | null>(null);
    const [isTimerReady, setIsTimerReady] = useState(false);

    useEffect(() => {
        const sessId = typeof window !== 'undefined' ? localStorage.getItem('nitroquiz_game_sessionId') : null;
        if (!sessId) return;

        const handleForceEndGame = async () => {
            setGameState('finished');
            endGame();
        };

        const fetchAndStartTimer = async () => {
            await syncServerTime();
            const { data } = await supabaseGame.from('sessions').select('started_at, total_time_minutes').eq('id', sessId).single();
            if (!data?.started_at) { setIsTimerReady(true); return; }

            const start = new Date(data.started_at).getTime();
            const totalSeconds = (data.total_time_minutes || 5) * 60;

            // Hitung langsung untuk menghilangkan flicker
            const nowFirst = getSyncedServerTime();
            const elapsedFirst = Math.floor((nowFirst - start) / 1000);
            const initialRemaining = Math.max(0, Math.min(totalSeconds, totalSeconds - elapsedFirst));
            setGlobalTimeLeft(initialRemaining);
            setIsTimerReady(true);

            const interval = setInterval(() => {
                const now = getSyncedServerTime();
                const elapsedSeconds = Math.floor((now - start) / 1000);
                const remaining = Math.max(0, Math.min(totalSeconds, totalSeconds - elapsedSeconds));
                setGlobalTimeLeft(remaining);
                if (remaining <= 0) { clearInterval(interval); handleForceEndGame(); }
            }, 1000);
            return interval;
        };

        let intervalId: NodeJS.Timeout | undefined;
        fetchAndStartTimer().then(id => { intervalId = id; });
        return () => { if (intervalId) clearInterval(intervalId); };
    }, []);

    return { globalTimeLeft, isTimerReady };
}
