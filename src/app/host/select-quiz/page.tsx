"use client";

import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowLeft, HelpCircle, Heart, User } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { questions, categoryNames } from "@/lib/questions";
import { QuizCategory } from "@/types";

// Helper type for our "Quiz" view derived from categories
interface QuizView {
    id: string;
    title: string;
    category: QuizCategory | "all";
    questionCount: number;
    description: string;
    difficulty: "easy" | "medium" | "hard" | "mixed";
}

export default function SelectQuizPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [quizzes, setQuizzes] = useState<QuizView[]>([]);
    const [allItems, setAllItems] = useState<QuizView[]>([]);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [creating, setCreating] = useState(false);
    const [creatingQuizId, setCreatingQuizId] = useState<string | null>(null);

    // Background state (simplified for NitroQuiz theme)
    const isFetching = false; // Local data is instant

    const itemsPerPage = 9;

    // Transform questions into "Quiz Packs" based on categories
    // In a real app with DB, these would be actual quiz rows.
    // Here we group questions by category to simulate "Quizzes".
    useEffect(() => {
        // Group questions by category
        const grouped = questions.reduce((acc, q) => {
            if (!acc[q.category]) {
                acc[q.category] = [];
            }
            acc[q.category].push(q);
            return acc;
        }, {} as Record<string, typeof questions>);

        const simulatedQuizzes: QuizView[] = Object.entries(grouped).map(([cat, qs]) => ({
            id: `quiz-${cat}`,
            title: `${categoryNames[cat as QuizCategory] || cat} Challenge`,
            category: cat as QuizCategory,
            questionCount: qs.length,
            description: `Test your skills in ${categoryNames[cat as QuizCategory] || cat}!`,
            difficulty: "mixed"
        }));

        // Add a "Mega Mix" quiz containing all questions
        simulatedQuizzes.unshift({
            id: "quiz-all",
            title: "Ultimate Nitro Mix",
            category: "all",
            questionCount: questions.length,
            description: "A mix of all topics for the ultimate racer!",
            difficulty: "hard"
        });

        setAllItems(simulatedQuizzes);
    }, []);

    // Filter and Paginate
    useEffect(() => {
        let filtered = allItems;

        if (searchQuery) {
            filtered = filtered.filter(q =>
                q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                q.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (selectedCategory !== "All") {
            filtered = filtered.filter(q => q.category === selectedCategory);
        }

        setQuizzes(filtered);
        setCurrentPage(1); // Reset to page 1 on filter change
    }, [allItems, searchQuery, selectedCategory]);

    const paginatedQuizzes = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return quizzes.slice(start, start + itemsPerPage);
    }, [quizzes, currentPage]);

    const totalPages = Math.ceil(quizzes.length / itemsPerPage);

    const categories = useMemo(() => {
        return ["All", ...Object.keys(categoryNames)];
    }, []);

    const handleSelectQuiz = async (quizId: string) => {
        if (creating) return;
        setCreating(true);
        setCreatingQuizId(quizId);

        // Simulate creation delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // For now, mockup redirect to settings or lobby
        // Ideally we generate a game PIN here
        const mockGamePin = Math.floor(100000 + Math.random() * 900000).toString();

        // In a real implementation we would save the session to DB/LocalStorage here
        // For this demo:
        // Save quizId to localStorage as requested
        localStorage.setItem("currentQuizId", quizId);
        router.push(`/host/${mockGamePin}/settings`);

        // Reset state cleaning up (though component will unmount)
        setCreating(false);
        setCreatingQuizId(null);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden font-body text-white">

            {/* Background Layers */}
            <div className="fixed inset-0 z-0 city-silhouette pointer-events-none"></div>
            <div className="fixed inset-0 z-0 bg-gradient-to-t from-background-dark via-transparent to-blue-900/10 pointer-events-none"></div>
            <div className="fixed bottom-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-background-dark/50 to-background-dark pointer-events-none z-0"></div>
            <div className="fixed bottom-0 w-full h-1/2 bg-[linear-gradient(transparent_0%,rgba(45,106,242,0.1)_1px,transparent_1px),linear-gradient(90deg,transparent_0%,rgba(45,106,242,0.1)_1px,transparent_1px)] bg-[length:60px_60px] [transform:perspective(500px)_rotateX(60deg)] origin-bottom z-0 pointer-events-none opacity-20"></div>
            <div className="scanlines"></div>

            {/* Scrollable Content Wrapper */}
            <div className="absolute inset-0 overflow-y-auto z-10">

                {/* Header */}
                <div className="w-full px-4 pt-6 flex items-center justify-between">
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ scale: 1.05 }}
                        className="p-3 bg-black/40 border border-[#2d6af2]/50 hover:bg-[#2d6af2]/20 hover:border-[#2d6af2] text-[#2d6af2] rounded-xl transition-all shadow-[0_0_15px_rgba(45,106,242,0.2)] flex items-center justify-center group"
                        aria-label="Back to Home"
                        onClick={() => router.push('/')}
                    >
                        <ArrowLeft size={20} className="group-hover:text-white transition-colors" />
                    </motion.button>
                </div>

                <div className="relative container mx-auto px-6 pb-4 max-w-6xl">

                    {/* Page Title */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h2 className="text-3xl md:text-5xl font-display text-white uppercase tracking-wider drop-shadow-[0_0_15px_rgba(45,106,242,0.8)]">
                                SELECT QUIZ
                            </h2>
                        </motion.div>
                    </div>

                    {/* Search & Filter Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-black/40 border border-[#2d6af2]/30 rounded-2xl p-4 sm:p-6 mb-8 backdrop-blur-md shadow-[0_0_25px_rgba(45,106,242,0.1)]"
                    >
                        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                            {/* Search */}
                            <div className="relative flex-1 group/search">
                                <Input
                                    placeholder="SEARCH QUIZ..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") setSearchQuery(searchInput);
                                    }}
                                    className="w-full h-12 pl-4 pr-12 bg-black/60 border border-[#2d6af2]/30 text-white placeholder:text-[#2d6af2]/40 focus:border-[#2d6af2] focus:ring-1 focus:ring-[#2d6af2] rounded-xl font-display text-xs tracking-wider uppercase transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery(searchInput)}
                                    className="absolute right-0 inset-y-0 flex items-center justify-center px-4 text-[#2d6af2]/60 hover:text-[#2d6af2] transition-colors"
                                >
                                    <Search className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Category Select */}
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="w-full sm:w-48 h-12 bg-black/60 border border-[#2d6af2]/30 text-white focus:border-[#2d6af2] focus:ring-1 focus:ring-[#2d6af2] rounded-xl font-display text-xs tracking-wider uppercase">
                                    <SelectValue placeholder="CATEGORY" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0a0a0f] border border-[#2d6af2]/30 text-white font-display text-xs uppercase tracking-wider">
                                    {categories.map((cat) => (
                                        <SelectItem key={cat} value={cat} className="focus:bg-[#2d6af2]/20 focus:text-white cursor-pointer py-3">
                                            {cat === 'All' ? 'ALL CATEGORIES' : (categoryNames[cat as QuizCategory] || cat)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </motion.div>

                    {/* Grid */}
                    <AnimatePresence mode="wait">
                        {paginatedQuizzes.length > 0 ? (
                            <motion.div
                                key={`grid-${currentPage}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            >
                                {paginatedQuizzes.map((quiz, index) => {
                                    const isThisQuizCreating = creatingQuizId === quiz.id;

                                    return (
                                        <motion.div
                                            key={quiz.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2, delay: index * 0.05 }}
                                            whileHover={!isThisQuizCreating ? { scale: 1.02, translateY: -5 } : {}}
                                            whileTap={!isThisQuizCreating ? { scale: 0.98 } : {}}
                                        >
                                            <Card
                                                className={`h-full bg-black/40 border transition-all duration-300 relative overflow-hidden group cursor-pointer
                                ${isThisQuizCreating
                                                        ? "border-[#2d6af2] shadow-[0_0_30px_rgba(45,106,242,0.4)]"
                                                        : "border-[#2d6af2]/30 hover:border-[#2d6af2] hover:shadow-[0_0_20px_rgba(45,106,242,0.2)]"
                                                    }`}
                                                onClick={() => handleSelectQuiz(quiz.id)}
                                            >
                                                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-[#2d6af2] to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                                <div className="absolute inset-0 bg-gradient-to-br from-[#2d6af2]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                                                {isThisQuizCreating && (
                                                    <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
                                                        <div className="w-10 h-10 border-4 border-[#2d6af2]/30 border-t-[#2d6af2] rounded-full animate-spin mb-3"></div>
                                                        <p className="text-[#2d6af2] font-display text-xs tracking-widest animate-pulse">INITIATING...</p>
                                                    </div>
                                                )}

                                                <CardHeader className="pb-2">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="px-2 py-1 bg-[#2d6af2]/10 border border-[#2d6af2]/30 rounded text-[10px] text-[#2d6af2] font-display uppercase tracking-wider">
                                                            {quiz.category === 'all' ? 'MIXED' : categoryNames[quiz.category as QuizCategory] || quiz.category}
                                                        </div>
                                                        <div className="text-gray-500 hover:text-red-500 transition-colors">
                                                            <Heart size={16} />
                                                        </div>
                                                    </div>
                                                    <CardTitle className="text-lg md:text-xl text-white font-display uppercase tracking-wide leading-tight group-hover:text-neon-blue transition-colors">
                                                        {quiz.title}
                                                    </CardTitle>
                                                </CardHeader>

                                                <CardFooter className="pt-4 border-t border-[#2d6af2]/10 flex justify-between items-center text-xs text-gray-400 font-display tracking-wider">
                                                    <div className="flex items-center gap-2">
                                                        <HelpCircle size={14} className="text-[#2d6af2]" />
                                                        {quiz.questionCount} QUESTIONS
                                                    </div>
                                                </CardFooter>
                                            </Card>
                                        </motion.div>
                                    )
                                })}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="col-span-full py-20 text-center"
                            >
                                <Search className="h-16 w-16 mx-auto text-[#2d6af2]/20 mb-4" />
                                <h3 className="text-xl text-white font-display uppercase tracking-widest mb-2">No Quizzes Found</h3>
                                <p className="text-blue-400/40 text-sm mb-6">Try adjusting your filters or search terms</p>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setSearchInput("");
                                        setSelectedCategory("All");
                                    }}
                                    className="bg-[#2d6af2]/10 border border-[#2d6af2]/50 text-[#2d6af2] hover:bg-[#2d6af2] hover:text-white transition-all font-display text-xs uppercase tracking-wider"
                                >
                                    Reset Filters
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center mt-12 gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-10 px-4 bg-black/40 border border-[#2d6af2]/30 text-white font-display text-xs disabled:opacity-30 hover:bg-[#2d6af2]/20 hover:border-[#2d6af2] transition-all uppercase tracking-wider"
                            >
                                Prev
                            </Button>
                            <div className="flex items-center px-4 bg-[#2d6af2]/10 border border-[#2d6af2]/30 rounded-md text-[#2d6af2] font-display text-xs">
                                PAGE {currentPage} / {totalPages}
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="h-10 px-4 bg-black/40 border border-[#2d6af2]/30 text-white font-display text-xs disabled:opacity-30 hover:bg-[#2d6af2]/20 hover:border-[#2d6af2] transition-all uppercase tracking-wider"
                            >
                                Next
                            </Button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
