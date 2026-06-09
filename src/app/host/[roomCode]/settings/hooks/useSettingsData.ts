/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CUSTOM HOOK: useSettingsData
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Hook ini mengelola seluruh state dan logika data untuk halaman pengaturan:
 * - Memuat detail quiz dari database
 * - Mengelola pengaturan durasi, jumlah soal, dan kesulitan
 * - Membuat/memperbarui sesi game
 * - Membatalkan sesi dan navigasi kembali
 * - Proteksi navigasi (browser back & tab close)
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useBgm } from "@/contexts/BgmContext";
import { createGFSClient } from "@/lib/supabase/gfs-client";
import { supabaseGame } from "@/lib/supabase/game-client";
import type { QuizDetail } from "../types";

export function useSettingsData() {
    const supabaseCentral = createGFSClient();
    const router = useRouter();
    const { t } = useTranslation();
    const params = useParams();
    const { isMuted, setIsMuted } = useBgm();

    // ── Ambil kode ruangan dari URL ──
    const roomCode = Array.isArray(params.roomCode)
        ? params.roomCode[0]
        : params.roomCode;

    // ═══════════════════════════════════════════════════════════════════
    // STATE: Data Quiz & Pengaturan
    // ═══════════════════════════════════════════════════════════════════
    const [quizId, setQuizId] = useState<string | null>(null);
    const [duration, setDuration] = useState("300");               // Durasi dalam detik
    const [questionCount, setQuestionCount] = useState("5");       // Jumlah soal yang dipilih
    const [selectedDifficulty, setSelectedDifficulty] = useState("easy");
    const [quizDetail, setQuizDetail] = useState<QuizDetail | null>(null);

    // ═══════════════════════════════════════════════════════════════════
    // STATE: Status UI
    // ═══════════════════════════════════════════════════════════════════
    const [saving, setSaving] = useState(false);                   // Sedang menyimpan sesi
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);           // Sedang menghapus sesi

    // ═══════════════════════════════════════════════════════════════════
    // UTILITAS: Acak urutan array (Fisher-Yates shuffle)
    // ═══════════════════════════════════════════════════════════════════
    const shuffleArray = <T,>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    // ═══════════════════════════════════════════════════════════════════
    // EFFECT: Muat detail quiz dari database pusat (GFS)
    // ═══════════════════════════════════════════════════════════════════
    useEffect(() => {
        const fetchQuizFromCentral = async () => {
            // Ambil ID quiz dari localStorage (disimpan saat memilih quiz)
            const storedQuizId = localStorage.getItem("currentQuizId");
            if (!storedQuizId) {
                console.error("Tidak ada quiz ID di storage");
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
                    console.error("Gagal memuat metadata quiz", error);
                    return;
                }

                if (data) {
                    // Parse pertanyaan (bisa berupa string JSON atau array)
                    let qs = data.questions || [];
                    if (typeof qs === 'string') {
                        try { qs = JSON.parse(qs); } catch (e) { }
                    }

                    setQuizDetail({
                        title: data.title || "Untitled Quiz",
                        description: data.description || "No description provided.",
                        totalQuestions: qs.length,
                        questions: qs,
                        category: data.category,
                    });
                }
            } catch (err) {
                console.error("Error mengambil quiz dari central:", err);
            }
        };

        fetchQuizFromCentral();
    }, [router]);

    // ═══════════════════════════════════════════════════════════════════
    // MEMO: Opsi jumlah soal berdasarkan total soal yang tersedia
    // ═══════════════════════════════════════════════════════════════════
    const questionCountOptions = useMemo(() => {
        const totalQuestions = quizDetail?.totalQuestions || 0;
        if (totalQuestions === 0) return [5];

        // Opsi standar, filter hanya yang <= total soal
        const baseOptions = [5, 10, 15, 20];
        const validOptions = baseOptions.filter((count) => count <= totalQuestions);
        return validOptions.length > 0 ? validOptions : [totalQuestions];
    }, [quizDetail]);

    // ═══════════════════════════════════════════════════════════════════
    // EFFECT: Set jumlah soal default saat quiz dimuat
    // ═══════════════════════════════════════════════════════════════════
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

    // ═══════════════════════════════════════════════════════════════════
    // FUNGSI: Simpan pengaturan dan lanjutkan ke lobby
    // ═══════════════════════════════════════════════════════════════════
    const handleCreateRoom = async () => {
        if (saving || !quizDetail || !quizId) return;
        setSaving(true);

        try {
            const limit = parseInt(questionCount);
            // Acak urutan soal dan ambil sesuai batas
            const selectedQuestions = shuffleArray(quizDetail.questions).slice(0, limit);

            const sessionPayload = {
                status: 'waiting',
                question_limit: limit,
                total_time_minutes: parseInt(duration) / 60,
                difficulty: selectedDifficulty,
                current_questions: selectedQuestions,
            };

            console.log("[handleCreateRoom] Memperbarui sesi untuk pin:", roomCode);

            // Update di database game lokal
            const { data: sessionData, error } = await supabaseGame
                .from('sessions')
                .update(sessionPayload)
                .eq('game_pin', roomCode)
                .select()
                .single();

            // Update di database platform pusat secara paralel
            const { error: mainError } = await supabaseCentral
                .from('game_sessions')
                .update(sessionPayload)
                .eq('game_pin', roomCode);

            if (error || mainError) {
                console.error("Error memperbarui sesi:", { error, mainError });
                setSaving(false);
                return;
            }

            if (!sessionData) {
                console.error("Sesi diperbarui tapi tidak ada data yang dikembalikan.");
                setSaving(false);
                return;
            }

            console.log("[handleCreateRoom] Sesi berhasil diperbarui:", sessionData.id);

            // Simpan pengaturan sesi ke localStorage untuk akses cepat
            const settings = {
                sessionId: sessionData.id,
                gamePin: roomCode,
                quizId: quizId,
                quizTitle: quizDetail.title,
                totalTimeMinutes: parseInt(duration) / 60,
                questionLimit: limit,
                difficulty: selectedDifficulty,
                questions: selectedQuestions,
                status: 'waiting',
                players: [],
            };
            localStorage.setItem(`session_${roomCode}`, JSON.stringify(settings));
            localStorage.setItem("hostroomCode", roomCode as string);

            // Navigasi ke halaman lobby
            router.push(`/host/${roomCode}/lobby`);
        } catch (err) {
            console.error("Error tidak terduga saat memperbarui sesi:", err);
            setSaving(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════════
    // FUNGSI: Batalkan sesi dan kembali ke halaman pilih quiz
    // ═══════════════════════════════════════════════════════════════════
    const handleCancelSession = async () => {
        setIsDeleting(true);
        try {
            // Hapus sesi dari kedua database secara paralel
            await Promise.allSettled([
                supabaseCentral.from('game_sessions').delete().eq('game_pin', roomCode),
                supabaseGame.from('sessions').delete().eq('game_pin', roomCode),
            ]);
            localStorage.removeItem(`session_${roomCode}`);

            // Hapus listener popstate sebelum navigasi agar dialog tidak muncul lagi
            window.onpopstate = null;
            router.push('/host/select-quiz');
        } catch (err) {
            console.error("Error menghapus sesi:", err);
            window.onpopstate = null;
            router.push('/host/select-quiz');
        }
    };

    // ═══════════════════════════════════════════════════════════════════
    // EFFECT: Proteksi navigasi (tombol back & tutup tab)
    // ═══════════════════════════════════════════════════════════════════
    useEffect(() => {
        // Tangani tombol back browser dan gesture
        const blockNavigation = () => {
            setShowCancelDialog(true);
            // Push state kembali untuk mencegah navigasi
            window.history.pushState(null, "", window.location.pathname);
        };

        // Inisialisasi history state
        window.history.pushState(null, "", window.location.pathname);
        window.onpopstate = blockNavigation;

        // Tangani tutup tab / refresh
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = ""; // Cara standar untuk menampilkan konfirmasi keluar
            return "";
        };
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.onpopstate = null;
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, []);

    // ═══════════════════════════════════════════════════════════════════
    // RETURN: Semua state dan fungsi yang dibutuhkan komponen
    // ═══════════════════════════════════════════════════════════════════
    return {
        // Data quiz
        quizDetail,
        quizId,

        // Pengaturan
        duration, setDuration,
        questionCount, setQuestionCount,
        selectedDifficulty, setSelectedDifficulty,
        questionCountOptions,

        // Audio
        isMuted, setIsMuted,

        // Status UI
        saving,
        showCancelDialog, setShowCancelDialog,
        isDeleting,

        // Aksi
        handleCreateRoom,
        handleCancelSession,

        // Navigasi & terjemahan
        router, t,
        roomCode,
    };
}
