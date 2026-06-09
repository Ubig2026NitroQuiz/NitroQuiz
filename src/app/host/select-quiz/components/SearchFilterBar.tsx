/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KOMPONEN: SearchFilterBar
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Bar pencarian dan filter yang berisi:
 * - Input pencarian dengan tombol search
 * - Tab navigasi (Semua Quiz, Favorit, Quiz Saya)
 * - Dropdown pemilihan kategori
 */

"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Heart, FileText } from "lucide-react";
import { motion } from "framer-motion";
import type { QuizTab } from "../types";

interface SearchFilterBarProps {
    // Pencarian
    searchInput: string;
    setSearchInput: (value: string) => void;
    onSearch: () => void;

    // Tab
    activeTab: QuizTab;
    setActiveTab: (tab: QuizTab) => void;

    // Kategori
    selectedCategory: string;
    setSelectedCategory: (cat: string) => void;
    categories: string[];
    getCategoryDisplayName: (cat: string) => string;

    // Terjemahan
    t: (key: string) => string;
}

export function SearchFilterBar({
    searchInput, setSearchInput, onSearch,
    activeTab, setActiveTab,
    selectedCategory, setSelectedCategory,
    categories, getCategoryDisplayName,
    t,
}: SearchFilterBarProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full bg-[#0c1020]/80 border border-white/[0.08] rounded-xl overflow-hidden mb-6 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex-shrink-0"
        >
            {/* Garis aksen atas */}
            <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg,transparent,#7C3AED,transparent)' }} />

            <div className="p-3 sm:p-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 w-full">

                {/* ── Input Pencarian ── */}
                <div className="flex-1 w-full md:w-auto relative group/search min-w-[200px] transform -skew-x-[8deg]">
                    <Input
                        type="text"
                        placeholder={t('select_quiz.search_placeholder')}
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                onSearch();
                            }
                        }}
                        className="w-full bg-white/[0.03] border border-white/10 pl-6 pr-14 h-10 text-white font-display text-[10px] uppercase tracking-widest placeholder:text-white/30 rounded-none focus-visible:ring-1 focus-visible:ring-[#7C3AED]/50 focus-visible:border-[#7C3AED] transition-all hover:bg-white/[0.06] transform skew-x-[8deg] !rounded-sm"
                    />
                    {/* Tombol cari */}
                    <button
                        onClick={onSearch}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 bg-[#7C3AED]/30 text-[#a78bfa] hover:bg-[#7C3AED] hover:text-white border border-[#7C3AED]/50 transition-all z-10 flex items-center justify-center group/btn overflow-hidden transform skew-x-[8deg] -translate-x-1 rounded-sm"
                        title="Search"
                    >
                        <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                        <Search className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* ── Tab Navigasi ── */}
                <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} t={t} />

                {/* ── Dropdown Kategori ── */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full md:w-56 h-10 bg-white/[0.03] border border-white/10 text-white hover:bg-white/[0.06] focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/50 rounded-sm font-display text-[10px] tracking-widest uppercase transition-all flex-shrink-0 transform -skew-x-[8deg]">
                        <SelectValue placeholder={t('select_quiz.category_placeholder')} className="transform skew-x-[8deg]" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0c1020]/95 border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.5)] text-white font-display text-[10px] uppercase tracking-wide backdrop-blur-2xl">
                        {categories.map((cat) => (
                            <SelectItem key={cat} value={cat} className="focus:bg-[#2d6af2]/30 focus:text-white cursor-pointer py-2">
                                {getCategoryDisplayName(cat)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: Tab Navigasi (Semua, Favorit, Quiz Saya)
// ═══════════════════════════════════════════════════════════════════════════

interface NavigationTabsProps {
    activeTab: QuizTab;
    setActiveTab: (tab: QuizTab) => void;
    t: (key: string) => string;
}

/** Konfigurasi visual untuk setiap tab */
const TAB_CONFIG: Record<QuizTab, {
    icon: typeof Search;
    labelKey: string;
    activeClass: string;
    inactiveHover: string;
    shadowColor: string;
}> = {
    all: {
        icon: Search,
        labelKey: 'select_quiz.tabs.quizzes',
        activeClass: 'bg-[#2d6af2] text-white border border-white/20',
        inactiveHover: 'hover:text-white hover:bg-white/[0.08]',
        shadowColor: 'rgba(45,106,242,0.3)',
    },
    favorites: {
        icon: Heart,
        labelKey: 'select_quiz.tabs.favorites',
        activeClass: 'bg-gradient-to-r from-[#ec4899] to-[#ef4444] text-white border border-white/20',
        inactiveHover: 'hover:text-pink-400 hover:bg-pink-500/10',
        shadowColor: 'rgba(236,72,153,0.3)',
    },
    myquiz: {
        icon: FileText,
        labelKey: 'select_quiz.tabs.my_quiz',
        activeClass: 'bg-[#7c3aed] text-white border border-white/20',
        inactiveHover: 'hover:text-[#a78bfa] hover:bg-[#7c3aed]/10',
        shadowColor: 'rgba(124,58,237,0.3)',
    },
};

function NavigationTabs({ activeTab, setActiveTab, t }: NavigationTabsProps) {
    return (
        <div className="flex items-center justify-center sm:justify-start flex-nowrap gap-1.5 sm:gap-2 flex-shrink-0 w-full md:w-auto">
            {(Object.entries(TAB_CONFIG) as [QuizTab, typeof TAB_CONFIG[QuizTab]][]).map(([tab, config]) => {
                const isActive = activeTab === tab;
                const Icon = config.icon;

                return (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 sm:flex-none group/tb flex items-center justify-center h-9 px-1.5 sm:px-4 relative overflow-hidden transform -skew-x-[12deg] transition-all duration-300 rounded-sm hover:shadow-[0_0_15px_${config.shadowColor}] ${isActive ? config.activeClass : `bg-white/[0.03] border border-white/5 text-gray-400 ${config.inactiveHover}`}`}
                    >
                        <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/tb:translate-x-[200%] transition-transform duration-700" />
                        <div className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2 transform skew-x-[12deg] min-w-0">
                            <Icon size={12} className={`w-3.5 h-3.5 flex-shrink-0 ${tab === 'favorites' && isActive ? 'fill-white' : ''}`} />
                            <span className="font-display text-[9px] sm:text-[10px] tracking-widest uppercase font-black truncate">{t(config.labelKey)}</span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
