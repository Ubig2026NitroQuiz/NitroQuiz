import { NextResponse } from 'next/server';
import { supabaseGame } from '@/lib/supabase/game-client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');
        const roomCode = searchParams.get('roomCode');

        if (!sessionId && !roomCode) {
            return NextResponse.json({ error: 'Session ID or Room Code is required' }, { status: 400 });
        }

        let query = supabaseGame.from('sessions').select('id, current_questions, difficulty');
        
        if (sessionId) {
            query = query.eq('id', sessionId);
        } else if (roomCode) {
            query = query.eq('game_pin', roomCode);
        }

        const { data: sessionData, error } = await query.single();

        if (error || !sessionData) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        let rawQuestions = sessionData.current_questions;
        if (typeof rawQuestions === 'string') {
            try { rawQuestions = JSON.parse(rawQuestions); } catch (e) { }
        }

        let sanitizedQuestions: any[] = [];
        if (Array.isArray(rawQuestions)) {
            sanitizedQuestions = rawQuestions.map((q: any, idx: number) => {
                let options: { text: string; image?: string }[] = [];

                if (Array.isArray(q.answers)) {
                    options = q.answers.map((a: any) => ({
                        text: a.answer || a.text || '',
                        image: a.image || a.image_url || a.imageUrl || undefined
                    }));
                } else if (Array.isArray(q.options)) {
                    options = q.options.map((opt: any) => {
                        if (typeof opt === 'string') return { text: opt };
                        return {
                            text: opt.text || opt.answer || '',
                            image: opt.image || opt.image_url || opt.imageUrl || undefined
                        };
                    });
                }

                return {
                    id: q.id || `q-${idx}`,
                    question: q.question || q.text || '',
                    options,
                    imageUrl: q.image || q.image_url || q.imageUrl || undefined,
                };
            });
        }

        return NextResponse.json({
            difficulty: sessionData.difficulty,
            questions: sanitizedQuestions
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
