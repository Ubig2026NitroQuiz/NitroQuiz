/**
 * ============================================================================
 *  KONSTANTA — HALAMAN BERANDA (HOME)
 * ============================================================================
 *
 *  File ini menyimpan semua data statis dan konfigurasi yang digunakan
 *  oleh komponen-komponen halaman beranda, seperti daftar bahasa,
 *  langkah-langkah "Cara Bermain", dan daftar tagline.
 * ============================================================================
 */

import { Zap, Users, Trophy, Target } from "lucide-react";
import React from "react";

// ── Daftar Bahasa yang Tersedia ─────────────────────────────────────────
export const AVAILABLE_LANGUAGES = [
    { code: "en", label: "English", sub: "Global" },
    { code: "id", label: "Indonesia", sub: "Bahasa" },
    { code: "ar", label: "العربية", sub: "Arabic" },
] as const;

// ── Tagline Logo (RACE · LEARN · DOMINATE) ──────────────────────────────
export const TAGLINE_WORDS = [
    { word: "RACE", color: "#a78bfa" },
    { word: "LEARN", color: "#00ff9d" },
    { word: "DOMINATE", color: "#a78bfa" },
] as const;

// ── Warna Avatar Default ────────────────────────────────────────────────
export const AVATAR_COLORS = [
    '#7C3AED', '#2d6af2', '#f59e0b', '#8b5cf6',
    '#10b981', '#ec4899', '#06b6d4', '#f97316'
] as const;

// ── Konfigurasi Langkah "Cara Bermain" ──────────────────────────────────
export interface HowToPlayStep {
    icon: React.ReactElement;
    titleKey: string;
    descKey: string;
    color: string;
    bg: string;
}

export const HOW_TO_PLAY_STEPS: HowToPlayStep[] = [
    {
        icon: React.createElement(Zap, { className: "w-4 h-4" }),
        titleKey: 'homepage.how_to_play.step1.title',
        descKey: 'homepage.how_to_play.step1.desc',
        color: "text-[#a78bfa]",
        bg: "bg-[#7C3AED]/[0.08] border-[#7C3AED]/[0.15]",
    },
    {
        icon: React.createElement(Target, { className: "w-4 h-4" }),
        titleKey: 'homepage.how_to_play.step2.title',
        descKey: 'homepage.how_to_play.step2.desc',
        color: "text-[#2d6af2]",
        bg: "bg-[#2d6af2]/[0.06] border-[#2d6af2]/[0.12]",
    },
    {
        icon: React.createElement(Users, { className: "w-4 h-4" }),
        titleKey: 'homepage.how_to_play.step3.title',
        descKey: 'homepage.how_to_play.step3.desc',
        color: "text-amber-400",
        bg: "bg-amber-400/[0.06] border-amber-400/[0.12]",
    },
    {
        icon: React.createElement(Trophy, { className: "w-4 h-4" }),
        titleKey: 'homepage.how_to_play.step4.title',
        descKey: 'homepage.how_to_play.step4.desc',
        color: "text-emerald-400",
        bg: "bg-emerald-400/[0.06] border-emerald-400/[0.12]",
    },
];
