/**
 * =====================================================
 * KOMPONEN: QuizQuestionCard - Kartu Soal & Jawaban
 * =====================================================
 * Menampilkan teks pertanyaan, gambar soal (opsional),
 * dan grid opsi jawaban dengan desain HUD miring (skewed).
 * =====================================================
 */
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { OPTION_COLORS } from '../_constants';
import type { QuizQuestion } from '../_types';

interface QuizQuestionCardProps {
    currentQuestion: QuizQuestion;
    currentIndex: number;
    selectedOption: number | null;
    isAnswered: boolean;
    onAnswer: (optionIndex: number) => void;
    onImageZoom: (imageUrl: string | null) => void;
}

export function QuizQuestionCard({
    currentQuestion, currentIndex, selectedOption,
    isAnswered, onAnswer, onImageZoom,
}: QuizQuestionCardProps) {
    return (
        <div className="px-5 md:px-10 py-6 md:py-10">
            {/* Konten Pertanyaan dengan Animasi Transisi */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -15, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-6 md:mb-10 flex flex-col items-center"
                >
                    {/* Gambar Soal (opsional, klik untuk zoom) */}
                    {currentQuestion.imageUrl && (
                        <div className="mb-6 flex justify-center">
                            <div
                                className="bg-white/95 p-2 rounded-md shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:scale-105 transition-transform duration-300 cursor-zoom-in"
                                onClick={() => onImageZoom(currentQuestion.imageUrl || null)}
                            >
                                <img src={currentQuestion.imageUrl} alt="Quiz visual"
                                    className="max-h-[120px] md:max-h-[180px] object-contain" />
                            </div>
                        </div>
                    )}
                    {/* Teks Pertanyaan */}
                    <h3 className="text-base md:text-2xl font-black leading-tight text-white text-center text-balance max-w-3xl tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                        {currentQuestion.question}
                    </h3>
                </motion.div>
            </AnimatePresence>

            {/* Grid Opsi Jawaban */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {currentQuestion.options.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    const optionColor = OPTION_COLORS[idx] || OPTION_COLORS[0];
                    const letter = String.fromCharCode(65 + idx);
                    const hasImage = !!option.image;

                    return (
                        <motion.button
                            key={`${currentIndex}-${idx}`}
                            whileTap={!isAnswered ? { scale: 0.97 } : {}}
                            onClick={() => onAnswer(idx)}
                            disabled={isAnswered}
                            className={`group/opt w-full relative text-left overflow-hidden transition-all duration-300 transform -skew-x-[6deg] outline-none ${isSelected
                                ? 'shadow-[0_0_25px_rgba(255,255,255,0.1)]'
                                : 'hover:shadow-[0_0_20px_rgba(45,106,242,0.15)]'
                                }`}
                            style={{
                                background: isSelected
                                    ? `linear-gradient(135deg, ${optionColor}30, ${optionColor}10)`
                                    : 'rgba(10,14,26,0.8)',
                                border: isSelected
                                    ? `1.5px solid ${optionColor}`
                                    : '1px solid rgba(255,255,255,0.06)',
                                boxShadow: isSelected ? `0 0 20px ${optionColor}30, inset 0 0 30px ${optionColor}08` : undefined,
                            }}
                        >
                            {/* Garis aksen kiri */}
                            <div className="absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-300"
                                style={{
                                    background: isSelected
                                        ? `linear-gradient(to bottom, ${optionColor}, ${optionColor}80)`
                                        : `linear-gradient(to bottom, ${optionColor}60, transparent)`,
                                    boxShadow: isSelected ? `0 0 8px ${optionColor}` : 'none',
                                    opacity: isSelected ? 1 : 0.5,
                                }} />

                            {/* Efek shine hover */}
                            <div className="absolute inset-0 bg-white/5 -translate-x-full group-hover/opt:translate-x-[200%] transition-transform duration-700 ease-in-out pointer-events-none" />

                            {/* Gambar Opsi (opsional) */}
                            {hasImage && (
                                <div className="w-full h-28 sm:h-36 md:h-40 flex items-center justify-center overflow-hidden bg-black/20 border-b border-white/5 cursor-zoom-in transform skew-x-[6deg] p-3"
                                    onClick={(e) => { e.stopPropagation(); onImageZoom(option.image || null); }}>
                                    <div className="w-20 h-20 sm:w-28 sm:h-28 bg-white/95 rounded-md p-2 shadow-[0_4px_12px_rgba(0,0,0,0.5)] flex items-center justify-center transition-transform group-hover/opt:scale-105">
                                        <img src={option.image} alt={`Option ${letter}`} className="w-full h-full object-contain" />
                                    </div>
                                </div>
                            )}

                            {/* Badge huruf + Teks jawaban */}
                            <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 flex-1 w-full transform skew-x-[6deg]">
                                <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center font-black text-sm md:text-base flex-shrink-0 text-white transform -skew-x-[8deg] transition-all duration-300"
                                    style={{
                                        backgroundColor: isSelected ? optionColor : `${optionColor}25`,
                                        border: `1px solid ${optionColor}${isSelected ? '' : '50'}`,
                                        boxShadow: isSelected ? `0 0 12px ${optionColor}60` : 'none',
                                    }}>
                                    <span className="transform skew-x-[8deg]">{letter}</span>
                                </div>
                                <span className={`text-xs md:text-base font-bold flex-1 tracking-tight leading-snug transition-colors duration-300 ${isSelected ? 'text-white' : 'text-gray-300 group-hover/opt:text-white'}`}>
                                    {option.text}
                                </span>
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
