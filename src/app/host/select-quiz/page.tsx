"use client";

import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowLeft, HelpCircle, Heart, User, Play, FileText, RefreshCw } from "lucide-react";
import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { categoryNames } from "@/lib/questions";
import { QuizCategory } from "@/types";
import { supabaseCentral } from "@/lib/supabase";
import { Logo } from "@/components/ui/logo";
import Image from "next/image";
import { getUser } from "@/lib/storage";

// Helper type for our "Quiz" view derived from categories
interface QuizView {
    id: string;
    title: string;
    category: string;
    questionCount: number;
    description: string;
    imageUrl?: string;
    played?: number;
    creatorId?: string;
    isPublic: boolean;
}

export default function SelectQuizPage() {
    const router = useRouter();
    const [searchInput, setSearchInput] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [visibleCount, setVisibleCount] = useState(9);
    const observer = useRef<IntersectionObserver | null>(null);
    const [quizzes, setQuizzes] = useState<QuizView[]>([]);
    const [allItems, setAllItems] = useState<QuizView[]>([]);
    const [creating, setCreating] = useState(false);
    const [creatingQuizId, setCreatingQuizId] = useState<string | null>(null);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'myquiz'>('all');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Background state
    const [isFetching, setIsFetching] = useState(true);
    const [isReturning, setIsReturning] = useState(false);



    // Get current user ID
    useEffect(() => {
        const user = getUser();
        if (user) {
            setCurrentUserId(user.id);
        }
    }, []);

    // Load favorites from localStorage
    useEffect(() => {
        const savedFavorites = localStorage.getItem('quiz_favorites');
        if (savedFavorites) {
            try {
                setFavorites(JSON.parse(savedFavorites));
            } catch { }
        }
    }, []);

    const toggleFavorite = (quizId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setFavorites(prev => {
            const updated = prev.includes(quizId)
                ? prev.filter(id => id !== quizId)
                : [...prev, quizId];
            localStorage.setItem('quiz_favorites', JSON.stringify(updated));
            return updated;
        });
    };

    // Fetch quizzes from Central Database
    const fetchQuizzes = async () => {
        setIsFetching(true);
        try {
            const user = getUser();
            const userId = user ? user.id : null;
            if (userId && !currentUserId) {
                setCurrentUserId(userId);
            }

            // 1. Fetch public active quizzes
            const { data: publicData, error: publicError } = await supabaseCentral
                .from("quizzes")
                .select("*")
                .eq("is_hidden", false)
                .eq("status", "active")
                .is("deleted_at", null)
                .order("created_at", { ascending: false });

            if (publicError) {
                console.error("Error fetching public quizzes:", publicError);
                return;
            }

            let allData = [...(publicData || [])];

            // 2. Fetch user's own quizzes directly (including drafts/hidden)
            if (userId) {
                const { data: userData, error: userError } = await supabaseCentral
                    .from("quizzes")
                    .select("*")
                    .eq("creator_id", userId)
                    .is("deleted_at", null)
                    .order("created_at", { ascending: false });

                if (!userError && userData) {
                    const existingIds = new Set(allData.map(q => q.id));
                    userData.forEach((q: any) => {
                        if (!existingIds.has(q.id)) {
                            allData.push(q);
                        }
                    });
                }
            }

            if (allData) {
                const fetchedQuizzes: QuizView[] = allData.map((quiz: any) => {
                    let qCount = 0;
                    if (Array.isArray(quiz.questions)) {
                        qCount = quiz.questions.length;
                    } else if (typeof quiz.questions === 'string') {
                        try { qCount = JSON.parse(quiz.questions).length; } catch (e) { }
                    }

                    const rawCat = quiz.category || "umum";

                    return {
                        id: quiz.id,
                        title: quiz.title || "Untitled Quiz",
                        category: rawCat,
                        questionCount: qCount,
                        description: quiz.description || "No description provided.",
                        difficulty: "mixed",
                        imageUrl: quiz.image_url || quiz.cover_image,
                        played: quiz.played || 0,
                        creatorId: quiz.creator_id || quiz.user_id || null,
                        isPublic: quiz.is_public !== false,
                    };
                });

                // Sort again by created_at just in case
                // Not strictly necessary, but keeps newest at top
                fetchedQuizzes.sort((a, b) => {
                    // if we wanted to sort by date, we'd need created_at in QuizView. 
                    // Let's just leave it as is or sorting won't matter much.
                    return 0; 
                });

                setAllItems(fetchedQuizzes);
            }
        } catch (err) {
            console.error("Failed to fetch quizzes", err);
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        fetchQuizzes();
    }, [activeTab]);

    // Filter and Paginate
    useEffect(() => {
        let filtered = allItems;

        // Hide private quizzes unless current user is the creator
        filtered = filtered.filter(q => q.isPublic || (currentUserId && q.creatorId === currentUserId));

        // Apply tab filter
        if (activeTab === 'favorites') {
            filtered = filtered.filter(q => favorites.includes(q.id));
        }
        // My Quiz: filter by current user's quizzes
        if (activeTab === 'myquiz') {
            if (currentUserId) {
                filtered = filtered.filter(q => q.creatorId === currentUserId);
            } else {
                filtered = [];
            }
        }

        if (searchInput) {
            filtered = filtered.filter(q =>
                q.title.toLowerCase().includes(searchInput.toLowerCase()) ||
                q.description.toLowerCase().includes(searchInput.toLowerCase())
            );
        }

        // Category filter: compare case-insensitively
        if (selectedCategory !== "All") {
            filtered = filtered.filter(q =>
                q.category.toLowerCase() === selectedCategory.toLowerCase()
            );
        }

        setQuizzes(filtered);
        setVisibleCount(9); // Reset visible on new filter
    }, [allItems, searchInput, selectedCategory, activeTab, favorites, currentUserId]);

    const displayedQuizzes = useMemo(() => {
        return quizzes.slice(0, visibleCount);
    }, [quizzes, visibleCount]);

    const lastQuizElementRef = (node: HTMLDivElement | null) => {
        if (isFetching || isReturning || creating) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && visibleCount < quizzes.length) {
                setVisibleCount(prev => Math.min(prev + 9, quizzes.length));
            }
        });

        if (node) observer.current.observe(node);
    };

    // Build categories dynamically from fetched data
    const categories = useMemo(() => {
        const uniqueCategories = Array.from(new Set(allItems.map(q => q.category)));
        return ["All", ...uniqueCategories];
    }, [allItems]);

    // Helper to get display name for a category
    const getCategoryDisplayName = (cat: string): string => {
        if (cat === 'All') return 'ALL CATEGORIES';
        // Try exact match from known categoryNames
        const known = categoryNames[cat as QuizCategory];
        if (known) return known;
        // Capitalize first letter of each word for unknown categories
        return cat.split(/[-_\s]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    const handleSelectQuiz = async (quizId: string) => {
        if (creating) return;
        setCreating(true);
        setCreatingQuizId(quizId);

        await new Promise(resolve => setTimeout(resolve, 1500));

        const mockGamePin = Math.floor(100000 + Math.random() * 900000).toString();
        localStorage.setItem("currentQuizId", quizId);
        router.push(`/host/${mockGamePin}/settings`);
    };

    // The early loading screen return was removed so layout stays stable while fetching.

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

                {/* Top Bar: Back + Logo1 left, Logo2 right */}
                <div className="w-full px-4 md:px-6 pt-4 pb-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <motion.button
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            whileHover={{ scale: 1.05 }}
                            className="p-3 bg-black/40 border border-[#2d6af2]/50 hover:bg-[#2d6af2]/20 hover:border-[#2d6af2] text-[#2d6af2] rounded-xl transition-all shadow-[0_0_15px_rgba(45,106,242,0.2)] flex items-center justify-center group"
                            aria-label="Back to Home"
                            onClick={() => {
                                setIsReturning(true);
                                router.push('/');
                            }}
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

                <div className="relative container mx-auto px-6 pb-4 max-w-6xl pt-2">

                    {/* Search & Filter Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-black/40 border border-[#2d6af2]/30 rounded-2xl p-4 sm:p-6 mb-8 backdrop-blur-md shadow-[0_0_25px_rgba(45,106,242,0.1)]"
                    >
                        {/* Search, Refresh & Category Filter */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-6 relative">
                            <div className="flex-1 flex gap-2">
                                <div className="relative flex-1 group/search">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2d6af2] w-5 h-5 group-focus-within/search:text-[#00ff9d] transition-colors" />
                                    <Input
                                        type="text"
                                        placeholder="Search quiz title..."
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        className="w-full bg-black/50 border border-[#2d6af2]/30 pl-11 pr-11 h-12 text-white font-display uppercase tracking-widest placeholder:text-gray-500 rounded-xl focus-visible:ring-1 focus-visible:ring-[#00ff9d]/50 focus-visible:border-[#00ff9d]/50 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                                    />
                                    {searchInput && (
                                        <button
                                            onClick={() => {
                                                setSearchInput("");
                                            }}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white pb-1 text-lg leading-none"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Category Select */}
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="w-full sm:w-52 h-12 bg-black/60 border border-[#2d6af2]/30 text-white focus:border-[#2d6af2] focus:ring-1 focus:ring-[#2d6af2] rounded-xl font-display text-xs tracking-wider uppercase">
                                    <SelectValue placeholder="CATEGORY" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0a0a0f] border border-[#2d6af2]/30 text-white font-display text-xs uppercase tracking-wider">
                                    {categories.map((cat) => (
                                        <SelectItem key={cat} value={cat} className="focus:bg-[#2d6af2]/20 focus:text-white cursor-pointer py-3">
                                            {getCategoryDisplayName(cat)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Bottom Row: Tab Buttons - Centered */}
                        <div className="flex items-center justify-center gap-2">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-display text-xs tracking-wider uppercase transition-all duration-200 ${activeTab === 'all'
                                    ? 'bg-[#2d6af2] text-white shadow-[0_0_15px_rgba(45,106,242,0.4)]'
                                    : 'bg-black/40 border border-[#2d6af2]/20 text-gray-400 hover:text-white hover:border-[#2d6af2]/50'
                                    }`}
                            >
                                <Search size={14} />
                                Quizzes
                            </button>
                            <button
                                onClick={() => setActiveTab('favorites')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-display text-xs tracking-wider uppercase transition-all duration-200 ${activeTab === 'favorites'
                                    ? 'bg-gradient-to-r from-pink-600 to-red-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]'
                                    : 'bg-black/40 border border-pink-500/20 text-gray-400 hover:text-pink-400 hover:border-pink-500/50'
                                    }`}
                            >
                                <Heart size={14} className={activeTab === 'favorites' ? 'fill-white' : ''} />
                                Favorites
                                {favorites.length > 0 && (
                                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'favorites' ? 'bg-white/20' : 'bg-pink-500/20 text-pink-400'}`}>
                                        {favorites.length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('myquiz')}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-display text-xs tracking-wider uppercase transition-all duration-200 ${activeTab === 'myquiz'
                                    ? 'bg-gradient-to-r from-[#00ff9d] to-emerald-500 text-black shadow-[0_0_15px_rgba(0,255,157,0.4)]'
                                    : 'bg-black/40 border border-[#00ff9d]/20 text-gray-400 hover:text-[#00ff9d] hover:border-[#00ff9d]/50'
                                    }`}
                            >
                                <FileText size={14} />
                                My Quiz
                            </button>
                        </div>
                    </motion.div>

                    {/* Grid */}
                    <AnimatePresence mode="wait">
                        {(isFetching || isReturning || creating) ? (
                            <motion.div
                                key="skeleton-loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full"
                            >
                                {Array.from({ length: 6 }).map((_, i) => (
                                        <Card key={i} className="h-64 flex flex-col bg-black/40 border border-[#2d6af2]/10 overflow-hidden relative">
                                            <div className="absolute inset-0 bg-gradient-to-br from-[#2d6af2]/5 to-transparent pointer-events-none z-10 animate-pulse"></div>
                                            
                                            {/* Top right favorite button skeleton */}
                                            <div className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/5 animate-pulse"></div>
                                            
                                            <CardHeader className="pb-4 relative z-20 flex-1 flex flex-col">
                                                <div className="flex items-start mb-3">
                                                    <div className="w-24 h-6 bg-[#2d6af2]/20 rounded animate-pulse"></div>
                                                </div>
                                                <div className="w-3/4 h-7 bg-white/10 rounded mb-2 animate-pulse mt-2"></div>
                                                <div className="w-1/2 h-7 bg-white/10 rounded animate-pulse"></div>
                                                <div className="w-full h-4 bg-white/5 rounded mt-auto animate-pulse"></div>
                                                <div className="w-4/5 h-4 bg-white/5 rounded mt-2 animate-pulse"></div>
                                            </CardHeader>
                                            
                                            <CardFooter className="mt-auto pt-4 border-t border-[#2d6af2]/10 flex justify-between items-center relative z-20 bg-black/40">
                                                <div className="flex gap-4">
                                                    <div className="w-12 h-4 bg-white/10 rounded animate-pulse"></div>
                                                    <div className="w-12 h-4 bg-white/10 rounded animate-pulse"></div>
                                                </div>
                                                <div className="w-20 h-8 bg-[#2d6af2]/20 rounded-lg animate-pulse"></div>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </motion.div>
                        ) : displayedQuizzes.length > 0 ? (
                            <motion.div
                                key={`grid-lazy-${activeTab}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            >
                                {displayedQuizzes.map((quiz, index) => {
                                    const isFavorited = favorites.includes(quiz.id);
                                    const isLast = index === displayedQuizzes.length - 1;

                                    return (
                                        <motion.div
                                            ref={isLast ? lastQuizElementRef : null}
                                            key={quiz.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.2 }}
                                            whileHover={{ scale: 1.01 }}
                                            style={{ willChange: "transform, opacity" }}
                                        >
                                            <Card
                                                className="h-full flex flex-col bg-black/40 border transition-all duration-200 relative overflow-hidden group border-[#2d6af2]/30 hover:border-[#2d6af2] hover:shadow-[0_0_15px_rgba(45,106,242,0.2)]"
                                            >
                                                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-[#2d6af2] to-transparent opacity-50 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"></div>
                                                <div className="absolute inset-0 bg-gradient-to-br from-[#2d6af2]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"></div>

                                                {/* Quiz background image */}
                                                <div className="absolute inset-0 z-0 pointer-events-none">
                                                    {quiz.imageUrl && (
                                                        <div
                                                            className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity"
                                                            style={{ backgroundImage: `url(${quiz.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                                                        />
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-black/80"></div>
                                                </div>

                                                {/* Favorite button - Top Right */}
                                                <button
                                                    onClick={(e) => toggleFavorite(quiz.id, e)}
                                                    className={`absolute top-3 right-3 z-20 p-2 rounded-full transition-all duration-200 backdrop-blur-sm ${isFavorited
                                                        ? 'bg-pink-500/30 border border-pink-500/50 text-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.4)] hover:bg-pink-500/50'
                                                        : 'bg-black/50 border border-white/10 text-gray-500 hover:text-pink-400 hover:border-pink-500/30 hover:bg-pink-500/10'
                                                        }`}
                                                >
                                                    <Heart size={14} className={isFavorited ? 'fill-pink-400' : ''} />
                                                </button>

                                                <CardHeader className="pb-4 relative z-20 flex-1 flex flex-col">
                                                    <div className="flex items-start mb-3 pr-10">
                                                        <div className="px-2 py-1 bg-[#2d6af2]/20 border border-[#2d6af2]/30 rounded text-[10px] text-[#2d6af2] font-display uppercase tracking-wider backdrop-blur-sm shadow-sm">
                                                            {getCategoryDisplayName(quiz.category)}
                                                        </div>
                                                    </div>
                                                    <CardTitle className="text-lg md:text-xl text-white font-display uppercase tracking-wide leading-tight group-hover:text-[#2d6af2] transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] line-clamp-2" title={quiz.title}>
                                                        {quiz.title}
                                                    </CardTitle>
                                                    <div className="text-sm text-gray-400 font-body line-clamp-2 mt-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] flex-1" title={quiz.description}>
                                                        {quiz.description}
                                                    </div>
                                                </CardHeader>

                                                <CardFooter className="mt-auto pt-4 border-t border-[#2d6af2]/10 flex justify-between items-center text-xs text-gray-400 font-display tracking-wider relative z-20 bg-black/40 backdrop-blur-sm">
                                                    <div className="flex items-center gap-4 drop-shadow-md">
                                                        <div className="flex items-center gap-1.5">
                                                            <HelpCircle size={14} className="text-[#2d6af2]" />
                                                            {quiz.questionCount} Qs
                                                        </div>
                                                        {quiz.played !== undefined && (
                                                            <div className="flex items-center gap-1.5 text-[#2d6af2]/80">
                                                                <User size={14} />
                                                                {quiz.played}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleSelectQuiz(quiz.id);
                                                        }}
                                                        disabled={creating}
                                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2d6af2] to-[#4da6ff] hover:from-[#3b7bf5] hover:to-[#5bb8ff] text-white font-display text-[10px] tracking-widest uppercase rounded-lg transition-all duration-200 shadow-[0_0_12px_rgba(45,106,242,0.3)] hover:shadow-[0_0_20px_rgba(45,106,242,0.5)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <Play size={12} className="fill-white" />
                                                        Start
                                                    </button>
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
                                {activeTab === 'favorites' ? (
                                    <>
                                        <Heart className="h-16 w-16 mx-auto text-pink-500/20 mb-4" />
                                        <h3 className="text-xl text-white font-display uppercase tracking-widest mb-2">No Favorites Yet</h3>
                                        <p className="text-pink-400/40 text-sm mb-6">Tap the heart icon on any quiz to save it here</p>
                                        <Button
                                            variant="outline"
                                            onClick={() => setActiveTab('all')}
                                            className="bg-pink-500/10 border border-pink-500/50 text-pink-400 hover:bg-pink-500 hover:text-white transition-all font-display text-xs uppercase tracking-wider"
                                        >
                                            Browse Quizzes
                                        </Button>
                                    </>
                                ) : activeTab === 'myquiz' ? (
                                    <>
                                        <FileText className="h-16 w-16 mx-auto text-[#00ff9d]/20 mb-4" />
                                        <h3 className="text-xl text-white font-display uppercase tracking-widest mb-2">No Quizzes Created</h3>
                                        <p className="text-[#00ff9d]/40 text-sm mb-6">Quizzes you create will appear here.</p>
                                        <div className="flex justify-center gap-4">
                                            <Button
                                                variant="outline"
                                                onClick={() => setActiveTab('all')}
                                                className="bg-[#00ff9d]/10 border border-[#00ff9d]/50 text-[#00ff9d] hover:bg-[#00ff9d] hover:text-black transition-all font-display text-xs uppercase tracking-wider"
                                            >
                                                Browse All
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Search className="h-16 w-16 mx-auto text-[#2d6af2]/20 mb-4" />
                                        <h3 className="text-xl text-white font-display uppercase tracking-widest mb-2">No Quizzes Found</h3>
                                        <p className="text-blue-400/40 text-sm mb-6">Try adjusting your filters or search terms</p>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setSearchInput("");
                                                setSelectedCategory("All");
                                            }}
                                            className="bg-[#2d6af2]/10 border border-[#2d6af2]/50 text-[#2d6af2] hover:bg-[#2d6af2] hover:text-white transition-all font-display text-xs uppercase tracking-wider"
                                        >
                                            Reset Filters
                                        </Button>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Lazy Loading Trigger Spinner */}
                    {visibleCount < quizzes.length && (
                        <div className="flex justify-center mt-12 mb-8">
                            <div className="w-8 h-8 border-4 border-[#2d6af2]/30 border-t-[#2d6af2] rounded-full animate-spin"></div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
