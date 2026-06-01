import { NextResponse } from 'next/server';
import { supabaseGame } from '@/lib/supabase/game-client';
import { generateXID } from '@/lib/id-generator';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { sessionId, participantId, questionId, optionIndex } = body;

        if (!sessionId || !participantId || !questionId || typeof optionIndex !== 'number') {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // 1. Fetch current questions from session
        const { data: sessionData, error: sessionError } = await supabaseGame
            .from('sessions')
            .select('current_questions')
            .eq('id', sessionId)
            .single();

        if (sessionError || !sessionData) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        let rawQuestions = sessionData.current_questions;
        if (typeof rawQuestions === 'string') {
            try { rawQuestions = JSON.parse(rawQuestions); } catch (e) { }
        }

        if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
            return NextResponse.json({ error: 'No questions found in session' }, { status: 404 });
        }

        // 2. Find the question by ID
        const questionIndex = rawQuestions.findIndex(q => (q.id || `q-${rawQuestions.indexOf(q)}`) === questionId);
        
        if (questionIndex === -1) {
            return NextResponse.json({ error: 'Question not found' }, { status: 404 });
        }

        const q = rawQuestions[questionIndex];

        // 3. Determine if the optionIndex is correct
        let correctAnswer = 0;
        let answer_id = "";

        if (Array.isArray(q.answers)) {
            const correctId = String(q.correct);
            const correctIdx = q.answers.findIndex((a: any) => String(a.id) === correctId);
            correctAnswer = correctIdx >= 0 ? correctIdx : 0;
            if (q.answers[optionIndex]?.id) {
                answer_id = q.answers[optionIndex].id;
            }
        } else if (Array.isArray(q.options)) {
            correctAnswer = q.correctAnswer ?? 0;
        }

        const isCorrect = optionIndex === correctAnswer;
        const earnedPoints = isCorrect ? Math.ceil(100 / rawQuestions.length) : 0;

        // 4. Update the participant
        const { data: currentData } = await supabaseGame
            .from('participants')
            .select('answers, correct, score, current_question')
            .eq('id', participantId)
            .single();

        let newScore = earnedPoints;
        let nextQuestion = questionIndex + 1;

        if (currentData) {
            let currentAnswers: any[] = [];
            if (currentData.answers) {
                try {
                    currentAnswers = typeof currentData.answers === 'string'
                        ? JSON.parse(currentData.answers)
                        : currentData.answers;
                } catch (e) { }
            }

            const newEntry = {
                id: generateXID(),
                correct: isCorrect,
                answer_id: answer_id,
                question_id: questionId
            };

            const updatedAnswers = [...currentAnswers, newEntry];
            const updatedCorrect = (currentData.correct || 0) + (isCorrect ? 1 : 0);
            newScore = Math.min(100, (currentData.score || 0) + earnedPoints);
            nextQuestion = (currentData.current_question || questionIndex) + 1;

            await supabaseGame
                .from('participants')
                .update({
                    answers: updatedAnswers,
                    correct: updatedCorrect,
                    score: newScore,
                    current_question: nextQuestion
                })
                .eq('id', participantId);
        }

        return NextResponse.json({
            correct: isCorrect,
            newScore,
            nextQuestion
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
