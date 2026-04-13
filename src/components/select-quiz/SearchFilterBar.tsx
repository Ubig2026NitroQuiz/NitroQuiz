"use client";

/**
 * SearchFilterBar.tsx
 * ───────────────────
 * Bar pencarian dan filter yang berisi:
 * 1. Input pencarian kuis
 * 2. Dropdown pilihan kategori
 * 3. Tab navigasi: Semua Kuis, Favorit, Kuis Saya
 *
 * Props:
 * - searchInput: nilai input pencarian saat ini
 * - onSearchChange: fungsi saat input pencarian berubah
 * - selectedCategory: kategori yang dipilih saat ini
 * - onCategoryChange: fungsi saat kategori berubah
 * - categories: daftar kategori yang tersedia
 * - activeTab: tab aktif saat ini ('all' | 'favorites' | 'myquiz')
 * - onTabChange: fungsi saat tab berubah
 * - getCategoryDisplayName: fungsi untuk mendapatkan nama tampilan kategori
 */

import { Search, Heart, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { QuizTab } from "./types";

interface SearchFilterBarProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
  activeTab: QuizTab;
  onTabChange: (tab: QuizTab) => void;
  getCategoryDisplayName: (cat: string) => string;
}

export default function SearchFilterBar({
  searchInput,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  activeTab,
  onTabChange,
  getCategoryDisplayName,
}: SearchFilterBarProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="max-w-4xl mx-auto w-full bg-[#080d1a]/80 border border-[#2d6af2]/30 rounded-2xl overflow-hidden mb-3 backdrop-blur-2xl shadow-[0_0_50px_rgba(45,106,242,0.12),inset_0_1px_0_rgba(255,255,255,0.06)] flex-shrink-0"
    >
      {/* ── Garis aksen gradien di atas ── */}
      <div
        className="h-[2px] w-full"
        style={{ background: 'linear-gradient(90deg,#1a45c4,#2d6af2,#00ff9d,#2d6af2,#1a45c4)' }}
      />

      <div className="p-2 sm:p-3">
        {/* ── Baris atas: Input pencarian & dropdown kategori ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-3 relative">
          {/* Input pencarian */}
          <div className="flex-1">
            <div className="relative group/search">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 group-focus-within/search:text-[#00ff9d] transition-colors" />
              <Input
                type="text"
                placeholder={t('select_quiz.search_placeholder')}
                value={searchInput}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.07] pl-9 h-10 sm:h-9 text-white font-display text-left text-[9px] sm:text-[10px] uppercase tracking-widest placeholder:text-[8px] sm:placeholder:text-gray-600 rounded-lg focus-visible:ring-1 focus-visible:ring-[#00ff9d]/50 focus-visible:border-[#00ff9d]/50 focus-visible:bg-white/[0.05] transition-all !py-0 leading-normal"
              />
            </div>
          </div>

          {/* Dropdown pilihan kategori */}
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-full sm:w-52 h-10 bg-white/[0.03] border border-white/[0.07] text-white focus:border-[#00ff9d]/50 focus:ring-1 focus:ring-[#00ff9d]/50 rounded-xl font-display text-xs tracking-wider uppercase">
              <SelectValue placeholder={t('select_quiz.category_placeholder')} />
            </SelectTrigger>
            <SelectContent className="bg-[#04060f] border border-[#2d6af2]/30 text-white font-display text-[10px] uppercase tracking-wider backdrop-blur-3xl">
              {categories.map((cat) => (
                <SelectItem
                  key={cat}
                  value={cat}
                  className="focus:bg-[#4a3d8f]/20 focus:text-white cursor-pointer py-1.5"
                >
                  {getCategoryDisplayName(cat)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── Baris bawah: Tab navigasi ── */}
        <div className="flex items-center sm:justify-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 w-full relative">
          {/* Tab: Semua Kuis */}
          <button
            onClick={() => onTabChange('all')}
            className={`flex items-center justify-center flex-1 sm:flex-none min-w-max gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-xl font-display text-[8px] sm:text-xs tracking-wider uppercase transition-all duration-200 ${
              activeTab === 'all'
                ? 'bg-[#2d6af2] text-white'
                : 'bg-white/[0.03] border border-white/[0.07] text-gray-400 hover:text-white hover:border-[#00ff9d]/50'
            }`}
          >
            <Search size={12} className="sm:w-3.5 sm:h-3.5" />
            {t('select_quiz.tabs.quizzes')}
          </button>

          {/* Tab: Favorit */}
          <button
            onClick={() => onTabChange('favorites')}
            className={`flex items-center justify-center flex-1 sm:flex-none min-w-max gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-xl font-display text-[8px] sm:text-xs tracking-wider uppercase transition-all duration-200 ${
              activeTab === 'favorites'
                ? 'bg-gradient-to-r from-pink-600 to-red-500 text-white'
                : 'bg-black/40 border border-pink-500/20 text-gray-400 hover:text-pink-400 hover:border-pink-500/50'
            }`}
          >
            <Heart size={12} className={`sm:w-3.5 sm:h-3.5 ${activeTab === 'favorites' ? 'fill-white' : ''}`} />
            {t('select_quiz.tabs.favorites')}
          </button>

          {/* Tab: Kuis Saya */}
          <button
            onClick={() => onTabChange('myquiz')}
            className={`flex items-center justify-center flex-1 sm:flex-none min-w-max gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 rounded-xl font-display text-[8px] sm:text-xs tracking-wider uppercase transition-all duration-200 ${
              activeTab === 'myquiz'
                ? 'bg-[#00ff9d] text-[#04060f] font-bold'
                : 'bg-white/[0.03] border border-white/[0.07] text-gray-400 hover:text-[#00ff9d] hover:border-[#00ff9d]/50'
            }`}
          >
            <FileText size={12} className="sm:w-3.5 sm:h-3.5" />
            {t('select_quiz.tabs.my_quiz')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
