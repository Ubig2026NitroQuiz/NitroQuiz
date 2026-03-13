"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Clock, ListOrdered, Play, Settings, Volume2, VolumeX } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { supabase, supabaseCentral } from "@/lib/supabase"
import { Question } from "@/types"
import { Logo } from "@/components/ui/logo"

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
        questions: any[];
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

    // Load Quiz Data from Central Database
    useEffect(() => {
        const fetchQuizFromCentral = async () => {
            const storedQuizId = localStorage.getItem("currentQuizId");

            if (!storedQuizId) {
                console.error("No quiz ID found in storage");
                router.push('/host/select-quiz');
                return;
            }

            setQuizId(storedQuizId);

            try {
                const { data, error } = await supabaseCentral
                    .from('quizzes')
                    .select('*')
                    .eq('id', storedQuizId)
                    .single();

                if (error) {
                    console.error("Failed to load quiz metadata", error);
                    return;
                }

                if (data) {
                    let qs = data.questions || [];
                    if (typeof qs === 'string') {
                        try { qs = JSON.parse(qs); } catch (e) { }
                    }

                    setQuizDetail({
                        title: data.title || "Untitled Quiz",
                        description: data.description || "No description provided.",
                        totalQuestions: qs.length,
                        questions: qs
                    });
                }
            } catch (err) {
                console.error("Error fetching quiz from central:", err);
            }
        };

        fetchQuizFromCentral();
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

        try {
            const limit = parseInt(questionCount);
            // Shuffle and slice questions from the central DB payload
            const selectedQuestions = shuffleArray(quizDetail.questions).slice(0, limit);

            // Create session in Primary DB
            const { data: sessionData, error } = await supabase
                .from('sessions')
                .insert({
                    game_pin: roomCode,
                    quiz_id: quizId,
                    status: 'waiting',
                    question_limit: limit,
                    total_time_minutes: parseInt(duration) / 60,
                    difficulty: selectedDifficulty,
                    current_questions: selectedQuestions,
                    // Note: host_id would ideally be set here if authentication is present
                })
                .select()
                .single();

            if (error) {
                console.error("Error creating session in Supabase:", error);

                // For bulletproofing during migrations, let's allow it to fallback to localStorage
                // If it fails because of schema mismatches, we'll know from console.
            }

            // Still save to localStorage for immediate client-side logic in Lobby (can be removed if deeply integrated)
            const settings = {
                sessionId: sessionData?.id,
                gamePin: roomCode,
                quizId: quizId,
                quizTitle: quizDetail.title,
                totalTimeMinutes: parseInt(duration) / 60,
                questionLimit: limit,
                difficulty: selectedDifficulty,
                questions: selectedQuestions,
                status: 'waiting',
                players: []
            };

            localStorage.setItem(`session_${roomCode}`, JSON.stringify(settings));
            localStorage.setItem("hostroomCode", roomCode as string);
            localStorage.setItem("settings_muted", isMuted.toString());

            router.push(`/host/${roomCode}/lobby`);
        } catch (err) {
            console.error("Unexpected error creating session:", err);
            setSaving(false);
        }
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
        }
    };

    if (!quizDetail) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f] relative overflow-hidden font-display text-white">
                <div className="text-center z-10">
                    <div className="w-16 h-16 border-4 border-[#2d6af2]/30 border-t-[#2d6af2] rounded-full animate-spin mx-auto mb-6"></div>
                    <p className="mt-4 text-[#2d6af2] text-xl tracking-[0.2em] uppercase animate-pulse">Establishing Signal...</p>
                </div>
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
                {/* Top Bar: Back + Logo1 left, Logo2 right */}
                <div className="w-full px-4 md:px-6 pt-4 pb-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
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
                        <Logo width={140} height={40} withText={false} animated={false} />
                    </div>
                    <Image
                        src="/assets/logo/logo2.png"
                        alt="GameForSmart.com"
                        width={240}
                        height={60}
                        className="object-contain opacity-70 hover:opacity-100 transition-opacity duration-300 drop-shadow-[0_0_10px_rgba(45,106,242,0.3)]"
                    />
                </div>

                <div className="relative container mx-auto px-4 sm:px-6 pb-6 max-w-4xl">

                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1, type: "spring", stiffness: 100, damping: 12 }}>
                        <Card className="bg-black/60 border border-[#2d6af2]/50 backdrop-blur-md shadow-[0_0_30px_rgba(45,106,242,0.15)] p-4 sm:p-6 rounded-[2rem] relative overflow-hidden">
                            {/* Card Glow Effect */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#2d6af2]/10 blur-[50px] pointer-events-none"></div>

                            <div className="space-y-5 relative z-10">
                                {/* Quiz Title - centered, bold, no icon, no description */}
                                <div className="p-4 bg-black/40 border border-[#2d6af2]/30 rounded-xl">
                                    <h2 className="text-lg sm:text-xl text-white font-display font-bold uppercase tracking-widest text-center drop-shadow-[0_0_10px_rgba(45,106,242,0.4)]">
                                        {quizDetail.title}
                                    </h2>
                                </div>

                                {/* Settings Grid - 4 columns, all aligned */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {/* Duration */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-display uppercase tracking-wide flex items-center space-x-1.5 text-[#00ff9d] drop-shadow-[0_0_5px_rgba(0,255,157,0.5)]">
                                            <Clock className="h-3.5 w-3.5" /><span>Duration</span>
                                        </Label>
                                        <Select value={duration} onValueChange={setDuration}>
                                            <SelectTrigger className="text-sm h-11 bg-black/60 border border-[#2d6af2]/30 text-white font-display uppercase tracking-wider focus:border-[#2d6af2] focus:ring-1 focus:ring-[#2d6af2] w-full transition-all rounded-xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#0a101f] border border-[#2d6af2]/30 text-white font-display uppercase tracking-wider">
                                                {Array.from({ length: 6 }, (_, i) => (i + 1) * 5).map((min) => (
                                                    <SelectItem key={min} value={(min * 60).toString()} className="focus:bg-[#2d6af2]/20 focus:text-white cursor-pointer">
                                                        {min} Min
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Questions */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-display uppercase tracking-wide flex items-center space-x-1.5 text-[#00ff9d] drop-shadow-[0_0_5px_rgba(0,255,157,0.5)]">
                                            <ListOrdered className="h-3.5 w-3.5" /><span>Questions</span>
                                        </Label>
                                        <Select value={questionCount} onValueChange={setQuestionCount}>
                                            <SelectTrigger className="text-sm h-11 bg-black/60 border border-[#2d6af2]/30 text-white font-display uppercase tracking-wider focus:border-[#2d6af2] focus:ring-1 focus:ring-[#2d6af2] w-full transition-all rounded-xl">
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

                                    {/* Sound */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-display uppercase tracking-wide flex items-center space-x-1.5 text-[#00ff9d] drop-shadow-[0_0_5px_rgba(0,255,157,0.5)]">
                                            {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                                            <span>Sound</span>
                                        </Label>
                                        <div className="flex items-center justify-center gap-3 w-full h-11 bg-black/60 border border-[#2d6af2]/30 text-white rounded-xl">
                                            <VolumeX className={`h-4 w-4 ${isMuted ? "text-red-500" : "text-gray-600"}`} />
                                            <Switch
                                                checked={!isMuted}
                                                onCheckedChange={(checked: boolean) => setIsMuted(!checked)}
                                                className="data-[state=checked]:bg-[#2d6af2] data-[state=unchecked]:bg-[#333] border border-[#2d6af2]/50"
                                            />
                                            <Volume2 className={`h-4 w-4 ${!isMuted ? "text-[#2d6af2]" : "text-gray-600"}`} />
                                        </div>
                                    </div>

                                    {/* Difficulty */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-display uppercase tracking-wide flex items-center space-x-1.5 text-[#00ff9d] drop-shadow-[0_0_5px_rgba(0,255,157,0.5)]">
                                            <Settings className="h-3.5 w-3.5" /><span>Difficulty</span>
                                        </Label>
                                        <div className="flex h-11 rounded-xl overflow-hidden border border-[#2d6af2]/30">
                                            {["Easy", "Normal", "Hard"].map((diff, i) => (
                                                <button
                                                    key={diff}
                                                    onClick={() => setSelectedDifficulty(diff.toLowerCase())}
                                                    className={`flex-1 text-xs font-display uppercase tracking-wider transition-all duration-200 ${i > 0 ? 'border-l border-[#2d6af2]/30' : ''}
                                                    ${selectedDifficulty === diff.toLowerCase()
                                                            ? "bg-[#2d6af2] text-white shadow-[inset_0_0_15px_rgba(45,106,242,0.4)]"
                                                            : "bg-black/60 text-[#2d6af2] hover:bg-[#2d6af2]/10"}`}
                                                >
                                                    {diff}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleCreateRoom}
                                    disabled={saving}
                                    className="w-full text-base py-5 bg-gradient-to-r from-[#2d6af2] to-[#00ff9d] hover:from-[#3b7bf5] hover:to-[#33ffb0] text-black font-display uppercase tracking-widest disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed cursor-pointer transition-all shadow-[0_0_20px_rgba(45,106,242,0.4)] hover:shadow-[0_0_30px_rgba(45,106,242,0.6)] rounded-xl border-none"
                                >
                                    {saving ? (
                                        <span className="flex items-center gap-2">
                                            <div className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                                            Loading...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Play className="fill-current h-5 w-5" />
                                            Continue
                                        </span>
                                    )}
                                </Button>
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
