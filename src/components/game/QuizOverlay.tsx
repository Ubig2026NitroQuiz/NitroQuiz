'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number; // index of the correct option
}

interface QuizOverlayProps {
    questions: QuizQuestion[];
    onComplete: (results: { correct: number; total: number; score: number }) => void;
    roundNumber: number;
}

export default function QuizOverlay({ questions, onComplete, roundNumber }: QuizOverlayProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);
    const [timeLeft, setTimeLeft] = useState(15); // 15 seconds per question
    const [totalScore, setTotalScore] = useState(0);

    const currentQ = questions[currentIndex];
    const total = questions.length;

    // Timer countdown
    useEffect(() => {
        if (isRevealed || !currentQ) return;

        if (timeLeft <= 0) {
            // Time's up - treat as wrong answer
            handleReveal(-1);
            return;
        }

        const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [timeLeft, isRevealed, currentQ]);

    // Reset timer on new question
    useEffect(() => {
        setTimeLeft(15);
        setSelectedAnswer(null);
        setIsRevealed(false);
    }, [currentIndex]);

    const handleReveal = useCallback((answerIdx: number) => {
        if (isRevealed) return;
        setSelectedAnswer(answerIdx);
        setIsRevealed(true);

        const isCorrect = answerIdx === currentQ.correctAnswer;
        if (isCorrect) {
            setCorrectCount(prev => prev + 1);
            // Score: base 100 + time bonus (up to 50)
            const timeBonus = Math.floor(timeLeft * 3.33);
            setTotalScore(prev => prev + 100 + timeBonus);
        }

        // Auto-advance after 2 seconds
        setTimeout(() => {
            if (currentIndex < total - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                // All questions answered
                const finalCorrect = isCorrect ? correctCount + 1 : correctCount;
                const finalScore = isCorrect ? totalScore + 100 + Math.floor(timeLeft * 3.33) : totalScore;
                onComplete({ correct: finalCorrect, total, score: finalScore });
            }
        }, 2000);
    }, [isRevealed, currentQ, currentIndex, total, correctCount, totalScore, timeLeft, onComplete]);

    if (!currentQ) return null;

    const timerColor = timeLeft > 10 ? '#00ff9d' : timeLeft > 5 ? '#fbbf24' : '#ef4444';
    const timerPercent = (timeLeft / 15) * 100;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 3000,
            backgroundColor: 'rgba(2, 6, 23, 0.97)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-rajdhani), sans-serif',
            padding: '1rem',
        }}>
            <div style={{ maxWidth: '40rem', width: '100%' }}>
                {/* Header: Round + Progress */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                        fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase',
                        letterSpacing: '0.2em', color: '#2d6af2',
                        padding: '0.25rem 0.75rem', background: 'rgba(45,106,242,0.15)',
                        borderRadius: '0.5rem', border: '1px solid rgba(45,106,242,0.3)'
                    }}>
                        ROUND {roundNumber}
                    </div>
                    <div style={{
                        fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8',
                        letterSpacing: '0.15em', textTransform: 'uppercase'
                    }}>
                        {currentIndex + 1} / {total}
                    </div>
                </div>

                {/* Timer Bar */}
                <div style={{
                    width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '9999px', marginBottom: '1.5rem', overflow: 'hidden'
                }}>
                    <motion.div
                        style={{ height: '100%', backgroundColor: timerColor, borderRadius: '9999px' }}
                        animate={{ width: `${timerPercent}%` }}
                        transition={{ duration: 0.5, ease: 'linear' }}
                    />
                </div>

                {/* Timer Number */}
                <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                    <span style={{
                        fontSize: '2rem', fontWeight: 900, color: timerColor,
                        textShadow: `0 0 20px ${timerColor}40`
                    }}>
                        {timeLeft}s
                    </span>
                </div>

                {/* Question Card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            border: '1px solid rgba(45, 106, 242, 0.3)',
                            borderRadius: '1.5rem',
                            padding: '2rem',
                            marginBottom: '1.5rem',
                            boxShadow: '0 0 40px rgba(45, 106, 242, 0.1)'
                        }}
                    >
                        <p style={{
                            fontSize: '1.25rem', fontWeight: 700, color: 'white',
                            lineHeight: 1.5, textAlign: 'center'
                        }}>
                            {currentQ.question}
                        </p>
                    </motion.div>
                </AnimatePresence>

                {/* Answer Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                    {currentQ.options.map((option, idx) => {
                        const isSelected = selectedAnswer === idx;
                        const isCorrectAnswer = idx === currentQ.correctAnswer;
                        const isWrongSelected = isRevealed && isSelected && !isCorrectAnswer;
                        const showCorrect = isRevealed && isCorrectAnswer;

                        let bgColor = 'rgba(15, 23, 42, 0.8)';
                        let borderColor = 'rgba(45, 106, 242, 0.2)';
                        let textColor = 'white';
                        let shadow = 'none';

                        // Calculate motion animations
                        let animationProps: any = {};

                        if (showCorrect) {
                            bgColor = 'rgba(0, 255, 157, 0.15)';
                            borderColor = '#00ff9d';
                            shadow = '0 0 20px rgba(0, 255, 157, 0.3)';
                            animationProps = {
                                scale: [1, 1.05, 1],
                                transition: { duration: 0.5, repeat: Infinity }
                            };
                        } else if (isWrongSelected) {
                            bgColor = 'rgba(239, 68, 68, 0.15)';
                            borderColor = '#ef4444';
                            shadow = '0 0 20px rgba(239, 68, 68, 0.3)';
                            animationProps = {
                                x: [0, -10, 10, -10, 10, 0],
                                transition: { duration: 0.4 }
                            };
                        } else if (isSelected) {
                            bgColor = 'rgba(45, 106, 242, 0.2)';
                            borderColor = '#2d6af2';
                            animationProps = { scale: 1.02 };
                        } else if (isRevealed && !showCorrect && !isWrongSelected) {
                            animationProps = { opacity: 0.5 };
                        }

                        const labels = ['A', 'B', 'C', 'D'];

                        return (
                            <motion.button
                                key={idx}
                                whileHover={!isRevealed ? { scale: 1.02 } : {}}
                                whileTap={!isRevealed ? { scale: 0.98 } : {}}
                                animate={animationProps}
                                onClick={() => !isRevealed && handleReveal(idx)}
                                disabled={isRevealed}
                                style={{
                                    background: bgColor,
                                    border: `2px solid ${borderColor}`,
                                    borderRadius: '1rem',
                                    padding: '1rem 1.25rem',
                                    textAlign: 'left',
                                    cursor: isRevealed ? 'default' : 'pointer',
                                    transition: 'background-color 0.2s, border-color 0.2s',
                                    boxShadow: shadow,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    color: textColor,
                                    width: '100%',
                                    minHeight: '4.5rem'
                                }}
                            >
                                <span style={{
                                    width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1rem', fontWeight: 900,
                                    backgroundColor: showCorrect ? '#00ff9d' : isWrongSelected ? '#ef4444' : 'rgba(45,106,242,0.2)',
                                    color: showCorrect || isWrongSelected ? 'black' : '#2d6af2',
                                    flexShrink: 0,
                                }}>
                                    {showCorrect ? '✓' : isWrongSelected ? '✗' : labels[idx]}
                                </span>
                                <span style={{ fontSize: '1rem', fontWeight: 600, wordBreak: 'break-word', display: 'flex', alignItems: 'center', flex: 1 }}>
                                    {option}
                                </span>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Score Display */}
                <div style={{
                    textAlign: 'center', marginTop: '1.5rem',
                    fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8',
                    letterSpacing: '0.2em', textTransform: 'uppercase'
                }}>
                    SCORE: <span style={{ color: '#00ff9d', fontSize: '1rem' }}>{totalScore}</span>
                    <span style={{ margin: '0 0.75rem', color: 'rgba(148,163,184,0.3)' }}>|</span>
                    CORRECT: <span style={{ color: '#2d6af2', fontSize: '1rem' }}>{correctCount}/{currentIndex + (isRevealed ? 1 : 0)}</span>
                </div>
            </div>
        </div>
    );
}
