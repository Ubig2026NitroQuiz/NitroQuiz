import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function useParticipantRecovery(roomCode: string | undefined) {
    const { profile, loading: authLoading } = useAuth();
    const [participantId, setParticipantId] = useState<string | null>(null);
    const [isRecovering, setIsRecovering] = useState(true);

    useEffect(() => {
        if (authLoading || !roomCode) return;

        const checkAndRecover = async () => {
            const storedId = localStorage.getItem('nitroquiz_game_participantId');
            const storedRoom = localStorage.getItem('nitroquiz_game_roomCode');

            // If we have valid localStorage, use it
            if (storedId && storedRoom === roomCode) {
                setParticipantId(storedId);
                setIsRecovering(false);
                return;
            }

            // If ID is missing but user is logged in, attempt recovery
            if (profile?.id) {
                console.log(`[Recovery] Attempting to recover participant for room ${roomCode}...`);
                try {
                    // Get session ID first
                    const { data: sessionData } = await supabase
                        .from('sessions')
                        .select('id')
                        .eq('game_pin', roomCode.toUpperCase())
                        .single();

                    if (sessionData) {
                        // Find participant entry for this user in this session
                        const { data: recoveredP } = await supabase
                            .from("participants")
                            .select("*")
                            .eq("session_id", sessionData.id)
                            .eq("user_id", profile.id)
                            .single();
                        
                        if (recoveredP) {
                            console.log("[Recovery] Found existing participant record. Restoring session...");
                            localStorage.setItem("nitroquiz_game_playerName", recoveredP.nickname);
                            localStorage.setItem("nitroquiz_game_participantId", recoveredP.id);
                            localStorage.setItem("nitroquiz_game_roomCode", roomCode.toUpperCase());
                            localStorage.setItem('nitroquiz_game_sessionId', sessionData.id);
                            localStorage.setItem('nitroquiz_game_carCharacter', recoveredP.car_character || 'rico');
                            
                            setParticipantId(recoveredP.id);
                            setIsRecovering(false);
                            return;
                        }
                    }
                } catch (err) {
                    console.error("[Recovery] Error during participant recovery:", err);
                }
            }

            // If we reach here, recovery failed or no login available
            setParticipantId(null);
            setIsRecovering(false);
        };

        checkAndRecover();
    }, [profile, roomCode, authLoading]);

    return { participantId, isRecovering, profile };
}
