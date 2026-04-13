/**
 * constants.ts — Konstanta Select Quiz
 * ═════════════════════════════════════
 *
 * Berisi peta warna kategori kuis dan fungsi untuk mendapatkan
 * warna berdasarkan nama kategori.
 *
 * Mendukung kategori dalam Bahasa Inggris dan Bahasa Indonesia.
 * Jika kategori tidak diketahui, warna ditentukan secara konsisten
 * menggunakan hash dari nama kategori.
 */

import { CategoryColors } from "./types";

// ════════════════════════════════════════════════════════════════
// PETA WARNA KATEGORI
// ════════════════════════════════════════════════════════════════

/**
 * Peta warna untuk setiap kategori kuis yang diketahui.
 * Mendukung key dalam Bahasa Inggris dan Indonesia.
 */
const CATEGORY_COLOR_MAP: Record<string, CategoryColors> = {
  // ── Kategori Bahasa Inggris ──
  general:    { bar: '#1a5f5f', badge: 'rgba(26,95,95,0.22)',    badgeBorder: 'rgba(38,166,154,0.4)',  badgeText: '#4db6ac', hoverBorder: 'rgba(26,95,95,0.7)' },
  math:       { bar: '#00c853', badge: 'rgba(0,200,83,0.15)',    badgeBorder: 'rgba(0,230,118,0.35)',  badgeText: '#00e676', hoverBorder: 'rgba(0,200,83,0.6)' },
  history:    { bar: '#e91e8c', badge: 'rgba(233,30,140,0.15)',  badgeBorder: 'rgba(240,98,146,0.35)', badgeText: '#f06292', hoverBorder: 'rgba(233,30,140,0.6)' },
  science:    { bar: '#7c3aed', badge: 'rgba(124,58,237,0.18)',  badgeBorder: 'rgba(167,139,250,0.35)', badgeText: '#a78bfa', hoverBorder: 'rgba(124,58,237,0.6)' },
  geography:  { bar: '#1a9e6e', badge: 'rgba(26,158,110,0.18)', badgeBorder: 'rgba(52,211,153,0.35)', badgeText: '#34d399', hoverBorder: 'rgba(26,158,110,0.6)' },
  language:   { bar: '#f59e0b', badge: 'rgba(245,158,11,0.15)', badgeBorder: 'rgba(251,191,36,0.35)', badgeText: '#fbbf24', hoverBorder: 'rgba(245,158,11,0.6)' },
  sport:      { bar: '#ef4444', badge: 'rgba(239,68,68,0.15)',  badgeBorder: 'rgba(252,165,165,0.35)', badgeText: '#fca5a5', hoverBorder: 'rgba(239,68,68,0.6)' },
  technology: { bar: '#2d6af2', badge: 'rgba(45,106,242,0.18)', badgeBorder: 'rgba(100,181,246,0.35)', badgeText: '#64b5f6', hoverBorder: 'rgba(45,106,242,0.6)' },
  art:        { bar: '#d946ef', badge: 'rgba(217,70,239,0.15)', badgeBorder: 'rgba(240,171,252,0.35)', badgeText: '#f0abfc', hoverBorder: 'rgba(217,70,239,0.6)' },
  music:      { bar: '#ec4899', badge: 'rgba(236,72,153,0.15)', badgeBorder: 'rgba(249,168,212,0.35)', badgeText: '#f9a8d4', hoverBorder: 'rgba(236,72,153,0.6)' },

  // ── Kategori Bahasa Indonesia ──
  umum:       { bar: '#1a5f5f', badge: 'rgba(26,95,95,0.22)',    badgeBorder: 'rgba(38,166,154,0.4)',  badgeText: '#4db6ac', hoverBorder: 'rgba(26,95,95,0.7)' },
  matematika: { bar: '#00c853', badge: 'rgba(0,200,83,0.15)',    badgeBorder: 'rgba(0,230,118,0.35)',  badgeText: '#00e676', hoverBorder: 'rgba(0,200,83,0.6)' },
  sejarah:    { bar: '#e91e8c', badge: 'rgba(233,30,140,0.15)',  badgeBorder: 'rgba(240,98,146,0.35)', badgeText: '#f06292', hoverBorder: 'rgba(233,30,140,0.6)' },
  ipa:        { bar: '#7c3aed', badge: 'rgba(124,58,237,0.18)',  badgeBorder: 'rgba(167,139,250,0.35)', badgeText: '#a78bfa', hoverBorder: 'rgba(124,58,237,0.6)' },
  ips:        { bar: '#1a9e6e', badge: 'rgba(26,158,110,0.18)', badgeBorder: 'rgba(52,211,153,0.35)', badgeText: '#34d399', hoverBorder: 'rgba(26,158,110,0.6)' },
  bahasa:     { bar: '#f59e0b', badge: 'rgba(245,158,11,0.15)', badgeBorder: 'rgba(251,191,36,0.35)', badgeText: '#fbbf24', hoverBorder: 'rgba(245,158,11,0.6)' },
  olahraga:   { bar: '#ef4444', badge: 'rgba(239,68,68,0.15)',  badgeBorder: 'rgba(252,165,165,0.35)', badgeText: '#fca5a5', hoverBorder: 'rgba(239,68,68,0.6)' },
  teknologi:  { bar: '#2d6af2', badge: 'rgba(45,106,242,0.18)', badgeBorder: 'rgba(100,181,246,0.35)', badgeText: '#64b5f6', hoverBorder: 'rgba(45,106,242,0.6)' },
};

/**
 * Warna fallback untuk kategori yang tidak dikenal.
 * Digunakan dengan hash-based selection agar warna konsisten.
 */
const FALLBACK_COLORS: CategoryColors[] = [
  { bar: '#1a5f5f', badge: 'rgba(26,95,95,0.22)',    badgeBorder: 'rgba(38,166,154,0.4)',  badgeText: '#4db6ac', hoverBorder: 'rgba(26,95,95,0.7)' },
  { bar: '#7c3aed', badge: 'rgba(124,58,237,0.18)',  badgeBorder: 'rgba(167,139,250,0.35)', badgeText: '#a78bfa', hoverBorder: 'rgba(124,58,237,0.6)' },
  { bar: '#f59e0b', badge: 'rgba(245,158,11,0.15)',  badgeBorder: 'rgba(251,191,36,0.35)',  badgeText: '#fbbf24', hoverBorder: 'rgba(245,158,11,0.6)' },
  { bar: '#00c853', badge: 'rgba(0,200,83,0.15)',    badgeBorder: 'rgba(0,230,118,0.35)',   badgeText: '#00e676', hoverBorder: 'rgba(0,200,83,0.6)' },
  { bar: '#e91e8c', badge: 'rgba(233,30,140,0.15)',  badgeBorder: 'rgba(240,98,146,0.35)',  badgeText: '#f06292', hoverBorder: 'rgba(233,30,140,0.6)' },
  { bar: '#1a9e6e', badge: 'rgba(26,158,110,0.18)',  badgeBorder: 'rgba(52,211,153,0.35)',  badgeText: '#34d399', hoverBorder: 'rgba(26,158,110,0.6)' },
];

// ════════════════════════════════════════════════════════════════
// FUNGSI PUBLIK
// ════════════════════════════════════════════════════════════════

/**
 * Mendapatkan skema warna berdasarkan nama kategori.
 * Jika kategori tidak ditemukan di peta, gunakan fallback berbasis hash
 * sehingga kategori yang sama selalu mendapat warna yang sama.
 *
 * @param category - Nama kategori kuis
 * @returns Objek CategoryColors dengan semua warna yang diperlukan
 */
export function getCategoryColor(category: string): CategoryColors {
  const key = category.toLowerCase().trim();
  if (CATEGORY_COLOR_MAP[key]) return CATEGORY_COLOR_MAP[key];

  // Hash-based fallback: kategori yang sama selalu mendapat warna yang sama
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) & 0xffff;
  }
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

/** Jumlah item per halaman untuk paginasi */
export const ITEMS_PER_PAGE = 8;
