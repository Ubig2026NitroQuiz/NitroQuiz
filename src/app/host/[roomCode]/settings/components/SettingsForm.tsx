/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KOMPONEN: SettingsForm
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Formulir pengaturan game yang berisi:
 * - Judul quiz yang dipilih
 * - Pengaturan durasi, jumlah soal, dan suara
 * - Pemilihan tingkat kesulitan
 * - Tombol lanjutkan
 */

"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Clock, ListOrdered, Play, Settings, Volume2, VolumeX } from "lucide-react";
import type { CategoryColorScheme } from "@/app/host/select-quiz/constants";
import { DIFFICULTY_CONFIG } from "../types";

// ═══════════════════════════════════════════════════════════════════════════
// KOMPONEN UTAMA: SettingsForm
// ═══════════════════════════════════════════════════════════════════════════

interface SettingsFormProps {
    /** Skema warna berdasarkan kategori quiz */
    theme: CategoryColorScheme;
    /** Judul quiz yang dipilih */
    quizTitle: string;

    // Pengaturan durasi
    duration: string;
    setDuration: (val: string) => void;

    // Pengaturan jumlah soal
    questionCount: string;
    setQuestionCount: (val: string) => void;
    questionCountOptions: number[];

    // Pengaturan suara
    isMuted: boolean;
    setIsMuted: (val: boolean) => void;

    // Pengaturan kesulitan
    selectedDifficulty: string;
    setSelectedDifficulty: (val: string) => void;

    // Status & aksi
    saving: boolean;
    onSubmit: () => void;

    // Terjemahan
    t: (key: string) => string;
}

export function SettingsForm({
    theme, quizTitle,
    duration, setDuration,
    questionCount, setQuestionCount, questionCountOptions,
    isMuted, setIsMuted,
    selectedDifficulty, setSelectedDifficulty,
    saving, onSubmit,
    t,
}: SettingsFormProps) {
    return (
        <div className="p-6 sm:p-8 flex flex-col gap-8 relative z-10">

            {/* ── Judul Quiz ── */}
            <QuizTitleBanner title={quizTitle} barColor={theme.bar} />

            {/* ── Baris 1: Durasi + Jumlah Soal + Suara ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <DurationSelect
                    value={duration}
                    onChange={setDuration}
                    theme={theme}
                    t={t}
                />
                <QuestionCountSelect
                    value={questionCount}
                    onChange={setQuestionCount}
                    options={questionCountOptions}
                    theme={theme}
                    t={t}
                />
                <SoundToggle
                    isMuted={isMuted}
                    setIsMuted={setIsMuted}
                    theme={theme}
                    t={t}
                />
            </div>

            {/* ── Baris 2: Tingkat Kesulitan ── */}
            <DifficultySelector
                selectedDifficulty={selectedDifficulty}
                setSelectedDifficulty={setSelectedDifficulty}
                t={t}
            />

            {/* ── Tombol Lanjutkan ── */}
            <ContinueButton
                saving={saving}
                onSubmit={onSubmit}
                theme={theme}
                t={t}
            />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: Banner Judul Quiz
// ═══════════════════════════════════════════════════════════════════════════

function QuizTitleBanner({ title, barColor }: { title: string; barColor: string }) {
    return (
        <div
            className="py-5 bg-gradient-to-r from-[#17254d] to-transparent border-l-2 pl-6 relative -mx-6 sm:-mx-8 shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)] transition-colors"
            style={{ borderLeftColor: barColor }}
        >
            <h2 className="text-xl sm:text-2xl pr-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 font-display font-black italic uppercase tracking-wider drop-shadow-md">
                {title}
            </h2>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: Dropdown Durasi
// ═══════════════════════════════════════════════════════════════════════════

function DurationSelect({
    value, onChange, theme, t,
}: {
    value: string;
    onChange: (val: string) => void;
    theme: CategoryColorScheme;
    t: (key: string) => string;
}) {
    return (
        <div className="space-y-1.5 group/dur">
            <Label className="text-[10px] font-display font-bold uppercase tracking-[0.2em] flex items-center gap-1.5 pl-0.5 text-white/40 mb-2 transition-colors group-hover/dur:text-white">
                <Clock className="h-3 w-3" style={{ color: theme.bar }} />
                <span>{t('room_settings.duration')}</span>
            </Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger
                    className="h-11 bg-[#0f142b] border border-white/5 border-l-2 text-white shadow-inner font-display font-bold text-[12px] uppercase tracking-widest focus:ring-0 rounded-sm transition-all"
                    style={{ borderLeftColor: theme.bar }}
                >
                    <SelectValue />
                </SelectTrigger>
                <SelectContent
                    className="bg-[#0a0f20] border text-white font-display uppercase tracking-wider rounded-sm"
                    style={{ borderColor: theme.badgeBorder, boxShadow: `0 0 20px ${theme.badge}` }}
                >
                    {/* Opsi durasi: 5, 10, 15, 20, 25, 30 menit */}
                    {Array.from({ length: 6 }, (_, i) => (i + 1) * 5).map((min) => (
                        <SelectItem
                            key={min}
                            value={(min * 60).toString()}
                            className="focus:bg-white/10 focus:text-white cursor-pointer hover:pl-4 transition-all"
                        >
                            {min} {t('room_settings.min')}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: Dropdown Jumlah Soal
// ═══════════════════════════════════════════════════════════════════════════

function QuestionCountSelect({
    value, onChange, options, theme, t,
}: {
    value: string;
    onChange: (val: string) => void;
    options: number[];
    theme: CategoryColorScheme;
    t: (key: string) => string;
}) {
    return (
        <div className="space-y-1.5 group/qst">
            <Label className="text-[10px] font-display font-bold uppercase tracking-[0.2em] flex items-center gap-1.5 pl-0.5 text-white/40 mb-2 transition-colors group-hover/qst:text-white">
                <ListOrdered className="h-3 w-3" style={{ color: theme.bar }} />
                <span>{t('room_settings.questions')}</span>
            </Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger
                    className="h-11 bg-[#0f142b] border border-white/5 border-l-2 text-white shadow-inner font-display font-bold text-[12px] uppercase tracking-widest focus:ring-0 rounded-sm transition-all"
                    style={{ borderLeftColor: theme.bar }}
                >
                    <SelectValue />
                </SelectTrigger>
                <SelectContent
                    className="bg-[#0a0f20] border text-white font-display uppercase tracking-wider rounded-sm"
                    style={{ borderColor: theme.badgeBorder, boxShadow: `0 0 20px ${theme.badge}` }}
                >
                    {options.map((count: number) => (
                        <SelectItem
                            key={count}
                            value={count.toString()}
                            className="focus:bg-white/10 focus:text-white cursor-pointer hover:pl-4 transition-all"
                        >
                            {count}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: Toggle Suara (BGM)
// ═══════════════════════════════════════════════════════════════════════════

function SoundToggle({
    isMuted, setIsMuted, theme, t,
}: {
    isMuted: boolean;
    setIsMuted: (val: boolean) => void;
    theme: CategoryColorScheme;
    t: (key: string) => string;
}) {
    return (
        <div className="space-y-1.5 group/snd">
            <Label className="text-[10px] font-display font-bold uppercase tracking-[0.2em] flex items-center gap-1.5 pl-0.5 text-white/40 mb-2 transition-colors group-hover/snd:text-white">
                {isMuted
                    ? <VolumeX className="h-3 w-3 text-red-500" />
                    : <Volume2 className="h-3 w-3" style={{ color: theme.bar }} />
                }
                <span>{t('room_settings.sound')}</span>
            </Label>
            <div
                className="flex items-center justify-center gap-3 h-11 bg-[#0f142b] border border-white/5 border-l-2 shadow-inner rounded-sm font-display font-bold transition-all"
                style={{ borderLeftColor: theme.bar }}
            >
                {/* Ikon volume mati */}
                <VolumeX className={`h-4 w-4 transition-colors ${isMuted ? "text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" : "text-white/20"}`} />

                {/* Switch toggle */}
                <div className="flex scale-90 origin-center justify-center -mx-2">
                    <Switch
                        checked={!isMuted}
                        onCheckedChange={(checked: boolean) => setIsMuted(!checked)}
                        className="data-[state=unchecked]:bg-[#333] border border-white/10"
                        style={{
                            backgroundColor: !isMuted ? theme.bar : undefined,
                            boxShadow: !isMuted ? `0 0 10px ${theme.badge}` : undefined,
                        }}
                    />
                </div>

                {/* Ikon volume aktif */}
                <Volume2
                    className="h-4 w-4 transition-colors text-white/20"
                    style={{
                        color: !isMuted ? theme.bar : undefined,
                        filter: !isMuted ? `drop-shadow(0 0 5px ${theme.badge})` : undefined,
                    }}
                />
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: Pemilih Tingkat Kesulitan
// ═══════════════════════════════════════════════════════════════════════════

function DifficultySelector({
    selectedDifficulty, setSelectedDifficulty, t,
}: {
    selectedDifficulty: string;
    setSelectedDifficulty: (val: string) => void;
    t: (key: string) => string;
}) {
    const difficulties = ["Easy", "Normal", "Hard"] as const;

    return (
        <div className="space-y-1.5 border-t border-white/5 pt-6 sm:mt-2">
            <Label className="text-[10px] font-display font-bold uppercase tracking-[0.2em] flex items-center gap-1.5 pl-0.5 text-white/40 mb-4 transition-colors">
                <Settings className="h-3 w-3 text-amber-500" />
                <span>{t('room_settings.difficulty.title')}</span>
            </Label>
            <div className="grid grid-cols-3 gap-3 sm:gap-4 px-2">
                {difficulties.map((diff) => {
                    const isActive = selectedDifficulty === diff.toLowerCase();
                    const colors = DIFFICULTY_CONFIG[diff];

                    return (
                        <button
                            key={diff}
                            onClick={() => setSelectedDifficulty(diff.toLowerCase())}
                            className={`h-11 sm:h-12 text-[10px] sm:text-[11px] font-display font-black uppercase tracking-[0.2em] transition-all duration-300 transform -skew-x-[15deg] border ${
                                isActive
                                    ? `${colors.bg} ${colors.border} text-[${colors.main}] ${colors.glow}`
                                    : `bg-[#0f142b] border-white/5 text-white/40 hover:bg-white/10 hover:border-white/20 hover:text-white`
                            }`}
                        >
                            <div className="transform skew-x-[15deg]">
                                {t(`room_settings.difficulty.${diff.toLowerCase()}`)}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: Tombol Lanjutkan (dengan efek glow)
// ═══════════════════════════════════════════════════════════════════════════

function ContinueButton({
    saving, onSubmit, theme, t,
}: {
    saving: boolean;
    onSubmit: () => void;
    theme: CategoryColorScheme;
    t: (key: string) => string;
}) {
    return (
        <div className="mt-4 pb-2">
            <button
                onClick={onSubmit}
                disabled={saving}
                className="w-full h-14 group/btnstart overflow-hidden text-white font-display text-[14px] font-black tracking-[0.3em] uppercase transition-all duration-300 relative transform -skew-x-[15deg] disabled:opacity-50 border"
                style={{
                    borderColor: theme.badgeBorder,
                    boxShadow: saving ? 'none' : `0 0 30px ${theme.badge}`,
                    background: saving
                        ? '#1e293b'
                        : `linear-gradient(135deg, ${theme.bar}, ${theme.badgeBorder}, ${theme.bar})`,
                }}
            >
                {/* Efek cahaya slide saat hover */}
                <div className="absolute inset-0 bg-white/20 transform -translate-x-[150%] group-hover/btnstart:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
                <div className="absolute inset-0 border border-white/20 pointer-events-none" />

                {/* Konten tombol */}
                <div className="transform skew-x-[15deg] absolute inset-0 flex items-center justify-center gap-3">
                    {saving ? (
                        <>
                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {t('room_settings.button.loading')}
                        </>
                    ) : (
                        <>
                            {t('room_settings.button.continue')} <Play size={14} className="fill-white" />
                        </>
                    )}
                </div>
            </button>
        </div>
    );
}
