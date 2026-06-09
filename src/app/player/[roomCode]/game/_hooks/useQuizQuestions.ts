/**
 * Hook untuk memuat pertanyaan kuis dari API/localStorage.
 */
'use client';
import { useState, useEffect } from 'react';
import { supabaseGame } from '@/lib/supabase/game-client';
import type { QuizQuestion, GameLoopState } from '../_types';

export function useQuizQuestions(
    roomCode: string,
    stateRef: React.MutableRefObject<GameLoopState>,
    setLapRace: (n: number) => void
) {
    const [allQuizQuestions, setAllQuizQuestions] = useState<QuizQuestion[]>([]);
    const [quizQuestionIndex, setQuizQuestionIndex] = useState(0);
    const [totalQuizScore, setTotalQuizScore] = useState(0);

    useEffect(() => {
        (async () => {
            if (!roomCode) return;
            try {
                let questionsData: any[] = [];
                console.log(`[GameSpeed] Fetching session data for room: ${roomCode}`);
                const response = await fetch(`/api/quiz/questions?roomCode=${roomCode}`);

                if (response.ok) {
                    const apiData = await response.json();
                    if (apiData.questions && Array.isArray(apiData.questions)) {
                        questionsData = apiData.questions;
                        console.log(`[GameSpeed] Loaded ${questionsData.length} questions from API.`);
                        localStorage.setItem('nitroquiz_game_questions', JSON.stringify(questionsData));
                        if (apiData.difficulty) localStorage.setItem('nitroquiz_game_difficulty', apiData.difficulty);
                    }
                } else {
                    const stored = localStorage.getItem('nitroquiz_game_questions');
                    if (stored) { questionsData = JSON.parse(stored); console.log('[GameSpeed] Using fallback from localStorage.'); }
                }

                if (Array.isArray(questionsData) && questionsData.length > 0) {
                    const normalized: QuizQuestion[] = questionsData.map((q: any, idx: number) => {
                        let options: any[] = [];
                        let correctAnswer = 0;
                        if (Array.isArray(q.answers) && q.answers.length > 0 && typeof q.answers[0] === 'object' && (q.answers[0].answer || q.answers[0].text)) {
                            options = q.answers.map((a: any) => ({ text: a.answer || a.text || '', image: a.image || a.image_url || a.imageUrl || undefined }));
                            if (q.correct !== undefined) { const cId = String(q.correct); const cIdx = q.answers.findIndex((a: any) => String(a.id) === cId); correctAnswer = cIdx >= 0 ? cIdx : 0; }
                        } else if (Array.isArray(q.options)) {
                            options = q.options.map((opt: any) => typeof opt === 'string' ? { text: opt } : opt);
                            correctAnswer = typeof q.correctAnswer === 'number' ? q.correctAnswer : typeof q.correct_answer === 'number' ? q.correct_answer : typeof q.answer === 'number' ? q.answer : 0;
                        } else if (Array.isArray(q.choices)) {
                            options = q.choices.map((opt: any) => typeof opt === 'string' ? { text: opt } : opt);
                            correctAnswer = typeof q.correctAnswer === 'number' ? q.correctAnswer : 0;
                        }
                        const qImage = q.image || q.image_url || q.imageUrl || undefined;
                        return { id: q.id || `q-${idx}`, question: q.question || q.text || q.pertanyaan || '', options, correctAnswer, image: qImage };
                    });

                    console.log('[GameSpeed] Initialized questions:', normalized.length);
                    setAllQuizQuestions(normalized);
                    stateRef.current.allQuizQuestions = normalized;

                    const storedIndex = localStorage.getItem('nitroquiz_game_questionIndex');
                    const storedScore = localStorage.getItem('nitroquiz_game_score');
                    if (storedIndex) { const idx = parseInt(storedIndex, 10); setQuizQuestionIndex(idx); stateRef.current.quizQuestionIndex = idx; }
                    if (storedScore) { const sc = parseInt(storedScore, 10); setTotalQuizScore(sc); stateRef.current.totalQuizScore = sc; }

                    const participantId = localStorage.getItem('nitroquiz_game_participantId');
                    if (participantId) {
                        try {
                            const { data: pData } = await supabaseGame.from('participants').select('lap_race').eq('id', participantId).single();
                            if (pData) { const dbLap = pData.lap_race || 0; setLapRace(dbLap); localStorage.setItem('nitroquiz_game_lapRace', String(dbLap)); }
                        } catch (e) { console.error('Failed to fetch lap_race:', e); }
                    }
                }
            } catch (e) { console.error('Failed to load quiz questions:', e); }
        })();
    }, []);

    return { allQuizQuestions, quizQuestionIndex, totalQuizScore };
}
