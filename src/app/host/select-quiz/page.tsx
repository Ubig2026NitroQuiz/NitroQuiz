/**
 * =============================================================
 * SELECT QUIZ PAGE — SERVER COMPONENT
 * =============================================================
 * Halaman ini adalah Server Component murni (tanpa "use client").
 * 
 * KEUNTUNGAN:
 * - Data quiz & kategori di-fetch DI SERVER sebelum HTML dikirim
 * - Tidak ada loading flash / skeleton pada render pertama
 * - HTML yang diterima browser sudah berisi konten → SEO perfect
 * - Pengguna dari negara mana pun melihat konten secara instan
 * 
 * YANG DI SERVER:
 * - Fetch initial quizzes (page 1, public, tanpa filter)
 * - Fetch daftar kategori
 * - Baca profile ID dari cookie (via supabase-server)
 * 
 * YANG DI CLIENT (SelectQuizClient.tsx):
 * - Search, filter, pagination interaktif
 * - Favorit (toggle)
 * - Session creation (host game)
 * - Dialog detail quiz
 * =============================================================
 */

import { Metadata } from "next";
import { createSupabaseCentralServer } from "@/lib/supabase-server";
import SelectQuizClient, { type QuizView } from "./SelectQuizClient";

export const metadata: Metadata = {
    title: "Select Quiz",
    description: "Choose from hundreds of racing-themed quiz packs. Host a live game session for your class or friends.",
};

// Revalidate data setiap 60 detik (ISR — Incremental Static Regeneration)
// Daftar kuis tidak berubah setiap detik, jadi cache 60s cukup optimal
export const revalidate = 60;

const ITEMS_PER_PAGE = 8;

export default async function SelectQuizPage() {
    const supabase = await createSupabaseCentralServer();

    // ── Ambil profile user yang sedang login (via cookie) ──
    let serverProfileId: string | null = null;
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('auth_user_id', user.id)
                .single();
            serverProfileId = profile?.id ?? null;
        }
    } catch {
        // Tidak login = tampilkan kuis publik saja
    }

    // ── Fetch initial quizzes (page 1, kuis publik) di server ──
    let initialQuizzes: QuizView[] = [];
    let initialTotalCount = 0;

    try {
        const { data, error } = await supabase.rpc('get_quizzes_paginated', {
            p_user_id: serverProfileId,
            p_search_query: null,
            p_category_filter: null,
            p_favorites_filter: null,
            p_creator_filter: null,
            p_limit: ITEMS_PER_PAGE,
            p_offset: 0,
        });

        if (!error && data) {
            initialQuizzes = data.map((quiz: any) => ({
                id: quiz.id,
                title: quiz.title || "Untitled Quiz",
                category: quiz.category || "umum",
                questionCount: quiz.question_count || 0,
                description: quiz.description || "No description provided.",
                imageUrl: quiz.image_url || quiz.cover_image,
                played: quiz.played || 0,
                creatorId: quiz.creator_id,
                isPublic: quiz.is_public !== false,
            }));
            initialTotalCount = data.length > 0 ? Number(data[0].total_count) : 0;
        }
    } catch (err) {
        console.error('[SelectQuizPage] Failed to fetch initial quizzes:', err);
    }

    // ── Fetch daftar kategori di server ──
    let initialCategories: string[] = ['All'];

    try {
        const orQuery = serverProfileId
            ? `is_public.eq.true,creator_id.eq.${serverProfileId}`
            : `is_public.eq.true`;

        const { data: catData } = await supabase
            .from("quizzes")
            .select("category")
            .eq("is_hidden", false)
            .eq("status", "active")
            .is("deleted_at", null)
            .or(orQuery);

        if (catData) {
            const uniqueCats = ['All', ...new Set(catData.map((q: any) => q.category).filter(Boolean))];
            initialCategories = uniqueCats;
        }
    } catch (err) {
        console.error('[SelectQuizPage] Failed to fetch categories:', err);
    }

    // ── Render Client Component dengan data yang sudah siap ──
    return (
        <SelectQuizClient
            initialQuizzes={initialQuizzes}
            initialTotalCount={initialTotalCount}
            initialCategories={initialCategories}
            serverProfileId={serverProfileId}
        />
    );
}