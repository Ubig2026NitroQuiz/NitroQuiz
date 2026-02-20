"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Clock, Hash, Play, Settings, Volume2, VolumeX } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogTitle } from "@/components/ui/dialog"
import { questions, categoryNames, getQuestionsByCategory } from "@/lib/questions"
import { Question, QuizCategory } from "@/types"

const backgroundGif = "/assets/background/2_v2.webp" // Reusing homepage background to ensure it exists

export default function SettingsPage() {
    const router = useRouter()
    const params = useParams()
    const searchParams = useSearchParams()

    // Get roomCode from params (safely handle array or string)
    const roomCode = Array.isArray(params.roomCode) ? params.roomCode[0] : params.roomCode;

    // Quiz ID will be loaded from localStorage in useEffect
    const [quizId, setQuizId] = useState<string | null>(null);

    const [duration, setDuration] = useState("300") // 5 mins default
    const [questionCount, setQuestionCount] = useState("5")
    const [selectedDifficulty, setSelectedDifficulty] = useState("easy")

    // Derived state for quiz details
    const [quizDetail, setQuizDetail] = useState<{
        title: string;
        description: string;
        totalQuestions: number;
    } | null>(null)

    const [saving, setSaving] = useState(false)
    const [showCancelDialog, setShowCancelDialog] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isMuted, setIsMuted] = useState(true) // Default muted
    const audioRef = useRef<HTMLAudioElement>(null)

    // Helper: Shuffle array
    const shuffleArray = <T,>(array: T[]): T[] => {
        const shuffled = [...array]
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled
    }

    // Load Quiz Data
    useEffect(() => {
        // Try to get from localStorage first
        const storedQuizId = localStorage.getItem("currentQuizId");

        if (!storedQuizId) {
            console.error("No quiz ID found in storage");
            router.push('/host/select-quiz');
            return;
        }

        setQuizId(storedQuizId);

        let currentQuestions = [];
        let title = "";
        let description = "";

        if (storedQuizId === 'quiz-all') {
            currentQuestions = questions;
            title = "Ultimate Nitro Mix";
            description = "A mix of all topics for the ultimate racer!";
        } else if (storedQuizId.startsWith('quiz-')) {
            const category = storedQuizId.replace('quiz-', '') as QuizCategory;
            currentQuestions = getQuestionsByCategory(category);
            title = `${categoryNames[category] || category} Challenge`;
            description = `Test your skills in ${categoryNames[category] || category}!`;
        }

        setQuizDetail({
            title,
            description,
            totalQuestions: currentQuestions.length
        });

    }, [router]);


    // Audio control
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.volume = 0.5;

        if (isMuted) {
            audio.pause();
        } else {
            audio.play().catch(() => console.warn("Audio play blocked"));
        }
    }, [isMuted]);


    // Memoize question count options
    const questionCountOptions = useMemo(() => {
        const totalQuestions = quizDetail?.totalQuestions || 0;
        if (totalQuestions === 0) return [5];
        const baseOptions = [5, 10, 20];
        // Only show options that are <= total available questions
        const validOptions = baseOptions.filter((count) => count <= totalQuestions);
        // If no options are valid (e.g. only 3 questions), just show the total
        return validOptions.length > 0 ? validOptions : [totalQuestions];
    }, [quizDetail]);

    // Set default question count
    useEffect(() => {
        if (!quizDetail) return;
        if (quizDetail.totalQuestions > 0) {
            if (questionCountOptions.includes(5)) {
                setQuestionCount("5");
            } else if (questionCountOptions.length > 0) {
                setQuestionCount(questionCountOptions[0].toString());
            } else {
                setQuestionCount(quizDetail.totalQuestions.toString());
            }
        }
    }, [quizDetail, questionCountOptions]);

    const handleCreateRoom = async () => {
        if (saving || !quizDetail || !quizId) return;
        setSaving(true);

        // Get questions based on ID again
        let availableQuestions: Question[] = [];
        if (quizId === 'quiz-all') {
            availableQuestions = questions;
        } else if (quizId.startsWith('quiz-')) {
            const category = quizId.replace('quiz-', '') as QuizCategory;
            availableQuestions = getQuestionsByCategory(category);
        }

        const limit = parseInt(questionCount);
        const selectedQuestions = shuffleArray(availableQuestions).slice(0, limit);

        const settings = {
            gamePin: roomCode,
            quizId: quizId,
            quizTitle: quizDetail.title,
            totalTimeMinutes: parseInt(duration) / 60,
            questionLimit: limit,
            difficulty: selectedDifficulty,
            questions: selectedQuestions,
            status: 'lobby',
            players: []
        };

        // Save to LocalStorage (Simulating DB)
        localStorage.setItem(`session_${roomCode}`, JSON.stringify(settings));
        localStorage.setItem("hostroomCode", roomCode as string);
        localStorage.setItem("settings_muted", isMuted.toString());

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        router.push(`/host/${roomCode}/lobby`);
    };

    const handleCancelSession = async () => {
        setIsDeleting(true);
        try {
            // Remove local storage session data
            localStorage.removeItem(`session_${roomCode}`);
            router.push('/host/select-quiz');
        } catch (err) {
            console.error("Error deleting session:", err);
            router.push('/host/select-quiz'); // Fallback
        } finally {
            setIsDeleting(false);
            setShowCancelDialog(false);
        }
    };

    if (!quizDetail) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0a0a0f]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[#0a0a0f] relative overflow-hidden font-body">
            {/* Background Layers */}
            <div className="fixed inset-0 z-0 city-silhouette pointer-events-none"></div>
            <div className="fixed inset-0 z-0 bg-gradient-to-t from-background-dark via-transparent to-blue-900/10 pointer-events-none"></div>
            <div className="fixed bottom-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-background-dark/50 to-background-dark pointer-events-none z-0"></div>
            <div className="fixed bottom-0 w-full h-1/2 bg-[linear-gradient(transparent_0%,rgba(45,106,242,0.1)_1px,transparent_1px),linear-gradient(90deg,transparent_0%,rgba(45,106,242,0.1)_1px,transparent_1px)] bg-[length:60px_60px] [transform:perspective(500px)_rotateX(60deg)] origin-bottom z-0 pointer-events-none opacity-20"></div>
            <div className="scanlines"></div>

            {/* Background Music Mock */}
            <div className="hidden">
                {/* Placeholder for actual audio element if asset existed */}
                <audio ref={audioRef} loop />
            </div>

            <div className="absolute inset-0 overflow-y-auto z-10">
                <div className="w-full px-4 pt-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <motion.button
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            whileHover={{ scale: 1.05 }}
                            className="p-3 bg-black/40 border border-[#2d6af2]/50 hover:bg-[#2d6af2]/20 hover:border-[#2d6af2] text-[#2d6af2] rounded-xl transition-all shadow-[0_0_15px_rgba(45,106,242,0.2)] flex items-center justify-center group"
                            aria-label="Back to Host"
                            onClick={() => setShowCancelDialog(true)}
                        >
                            <ArrowLeft size={20} className="group-hover:text-white transition-colors" />
                        </motion.button>
                    </div>
                </div>

                <div className="relative container mx-auto px-4 sm:px-6 pb-6 max-w-4xl">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-8">
                        <div>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display uppercase tracking-wider text-white drop-shadow-[0_0_15px_rgba(45,106,242,0.5)]">
                                SETTINGS
                            </h1>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                        <Card className="bg-black/60 border border-[#2d6af2]/50 backdrop-blur-md shadow-[0_0_30px_rgba(45,106,242,0.15)] p-6 sm:p-8 rounded-[2rem] relative overflow-hidden">
                            {/* Card Glow Effect */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#2d6af2]/10 blur-[50px] pointer-events-none"></div>

                            <div className="space-y-6 sm:space-y-8 relative z-10">
                                <div className="p-4 bg-black/40 border border-[#2d6af2]/30 rounded-xl relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-[#2d6af2]/5 group-hover:bg-[#2d6af2]/10 transition-colors"></div>
                                    <div className="flex items-start space-x-3 relative z-10">
                                        <div className="flex-shrink-0 mt-1"><Hash className="h-5 w-5 text-[#2d6af2]" /></div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-base sm:text-lg text-[#2d6af2] font-display uppercase tracking-wider">{quizDetail.title}</p>
                                            <p className="text-cyan-400 font-display text-xs sm:text-sm tracking-wide">{quizDetail.description}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2 sm:space-y-3">
                                        <Label className="text-base sm:text-lg font-display uppercase tracking-wide flex items-center space-x-2 text-[#00ff9d] drop-shadow-[0_0_5px_rgba(0,255,157,0.5)]">
                                            <Clock className="h-4 w-4" /><span>Duration</span>
                                        </Label>
                                        <Select value={duration} onValueChange={setDuration}>
                                            <SelectTrigger className="text-sm sm:text-base p-3 sm:p-5 bg-black/60 border border-[#2d6af2]/30 text-white font-display uppercase tracking-wider focus:border-[#2d6af2] focus:ring-1 focus:ring-[#2d6af2] w-full transition-all rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0a101f] border border-[#2d6af2]/30 text-white font-display uppercase tracking-wider">
                                                {Array.from({ length: 6 }, (_, i) => (i + 1) * 5).map((min) => (
                                                    <SelectItem key={min} value={(min * 60).toString()} className="focus:bg-[#2d6af2]/20 focus:text-white cursor-pointer">
                                                        {min} Minutes
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2 sm:space-y-3">
                                        <Label className="text-base sm:text-lg font-display uppercase tracking-wide flex items-center space-x-2 text-[#00ff9d] drop-shadow-[0_0_5px_rgba(0,255,157,0.5)]">
                                            <Hash className="h-4 w-4" /><span>Questions</span>
                                        </Label>
                                        <Select value={questionCount} onValueChange={setQuestionCount}>
                                            <SelectTrigger className="text-sm sm:text-base p-3 sm:p-5 bg-black/60 border border-[#2d6af2]/30 text-white font-display uppercase tracking-wider focus:border-[#2d6af2] focus:ring-1 focus:ring-[#2d6af2] w-full transition-all rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0a101f] border border-[#2d6af2]/30 text-white font-display uppercase tracking-wider">
                                                {questionCountOptions.map((count) => (
                                                    <SelectItem key={count} value={count.toString()} className="focus:bg-[#2d6af2]/20 focus:text-white cursor-pointer">
                                                        {count}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2 sm:space-y-3">
                                        <Label className="text-base sm:text-lg font-display uppercase tracking-wide flex items-center space-x-2 text-[#00ff9d] drop-shadow-[0_0_5px_rgba(0,255,157,0.5)]">
                                            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                                            <span>Sound</span>
                                        </Label>
                                        <div className="flex items-center justify-center gap-4 w-full text-sm sm:text-base px-5 h-10.5 bg-black/60 border border-[#2d6af2]/30 text-white font-display uppercase tracking-wider rounded-xl transition-all">
                                            <VolumeX className={`h-6 w-6 ${isMuted ? "text-red-500" : "text-gray-600"}`} />
                                            <Switch
                                                checked={!isMuted}
                                                onCheckedChange={(checked: boolean) => setIsMuted(!checked)}
                                                className="data-[state=checked]:bg-[#2d6af2] data-[state=unchecked]:bg-[#333] border border-[#2d6af2]/50"
                                            />
                                            <Volume2 className={`h-6 w-6 ${!isMuted ? "text-[#2d6af2]" : "text-gray-600"}`} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 sm:space-y-6">
                                    <Label className="text-base sm:text-lg font-display uppercase tracking-wide flex items-center justify-center space-x-2 text-[#00ff9d] drop-shadow-[0_0_5px_rgba(0,255,157,0.5)] mb-4">
                                        <Settings className="h-4 w-4" /><span>Difficulty</span>
                                    </Label>
                                    <div className="flex justify-center space-x-3 sm:space-x-6">
                                        {["Easy", "Normal", "Hard"].map((diff) => (
                                            <Button
                                                key={diff}
                                                onClick={() => setSelectedDifficulty(diff.toLowerCase())}
                                                className={`text-sm sm:text-base px-6 sm:px-8 py-6 font-display uppercase tracking-wider w-32 transition-all duration-200 border capitalize rounded-xl
                                                ${selectedDifficulty === diff.toLowerCase()
                                                        ? "bg-[#2d6af2] hover:bg-[#3b7bf5] text-white border-white/50 shadow-[0_0_15px_rgba(45,106,242,0.6)]"
                                                        : "bg-black/60 border-[#2d6af2]/30 text-[#2d6af2] hover:bg-[#2d6af2]/10 hover:border-[#2d6af2] hover:shadow-[0_0_10px_rgba(45,106,242,0.4)]"}`}
                                            >
                                                {diff}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-[#2d6af2]/20">
                                    <Button
                                        onClick={handleCreateRoom}
                                        disabled={saving}
                                        className="w-full text-base sm:text-xl py-6 sm:py-8 bg-gradient-to-r from-[#2d6af2] to-[#00ff9d] hover:from-[#3b7bf5] hover:to-[#33ffb0] text-black font-display uppercase tracking-widest disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed cursor-pointer transition-all shadow-[0_0_20px_rgba(45,106,242,0.4)] hover:shadow-[0_0_30px_rgba(45,106,242,0.6)] rounded-xl border-none"
                                    >
                                        {saving ? (
                                            <span className="flex items-center gap-2">
                                                <div className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                                                Loading...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <Play className="fill-current h-5 w-5 sm:h-6 sm:w-6" />
                                                Continue
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                        <DialogOverlay className="bg-black/80 backdrop-blur-sm fixed inset-0 z-50" />
                        <DialogContent className="bg-[#0a101f] border border-[#2d6af2]/50 p-0 overflow-hidden rounded-2xl max-w-sm shadow-[0_0_30px_rgba(45,106,242,0.15)]">
                            <div className="h-1.5 bg-gradient-to-r from-[#2d6af2] to-[#00ff9d] w-full"></div>
                            <div className="p-6">
                                <DialogHeader>
                                    <DialogTitle className="text-xl text-white font-display uppercase tracking-widest text-center drop-shadow-[0_0_10px_rgba(45,106,242,0.5)]">
                                        Delete Session?
                                    </DialogTitle>
                                    <DialogDescription className="text-center text-gray-400 font-display text-xs tracking-wider mt-4 uppercase">
                                        This will permanently delete this session.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter className="flex gap-3 mt-8">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowCancelDialog(false)}
                                        disabled={isDeleting}
                                        className="flex-1 bg-transparent border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white font-display text-xs uppercase tracking-wider h-12 rounded-xl transition-all"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleCancelSession}
                                        disabled={isDeleting}
                                        className="flex-1 bg-gradient-to-r from-[#2d6af2] to-[#00ff9d] hover:from-[#3b7bf5] hover:to-[#33ffb0] text-black border-none font-display text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(45,106,242,0.4)] h-12 rounded-xl transition-all"
                                    >
                                        {isDeleting ? "DELETING..." : "DELETE"}
                                    </Button>
                                </DialogFooter>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    )
}
