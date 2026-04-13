"use client";

/**
 * SettingsForm.tsx
 * ────────────────
 * Formulir pengaturan room kuis yang berisi:
 * 1. Judul kuis (read-only)
 * 2. Pengaturan durasi (dropdown)
 * 3. Jumlah pertanyaan (dropdown)
 * 4. Toggle suara (switch on/off)
 * 5. Pilihan tingkat kesulitan (Easy/Normal/Hard)
 * 6. Tombol "Continue" untuk memulai
 *
 * Props:
 * - quizTitle: judul kuis yang dipilih
 * - duration: durasi permainan dalam detik (string)
 * - onDurationChange: fungsi saat durasi berubah
 * - questionCount: jumlah pertanyaan yang dipilih (string)
 * - onQuestionCountChange: fungsi saat jumlah pertanyaan berubah
 * - questionCountOptions: opsi jumlah pertanyaan yang tersedia
 * - selectedDifficulty: tingkat kesulitan yang dipilih
 * - onDifficultyChange: fungsi saat kesulitan berubah
 * - isMuted: status mute audio
 * - onMuteToggle: fungsi toggle mute
 * - isSaving: apakah sedang proses menyimpan
 * - onSubmit: fungsi saat tombol Continue diklik
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Clock, ListOrdered, Play, Settings, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

/** Daftar tingkat kesulitan yang tersedia */
const DIFFICULTIES = ["Easy", "Normal", "Hard"] as const;

interface SettingsFormProps {
  quizTitle: string;
  duration: string;
  onDurationChange: (value: string) => void;
  questionCount: string;
  onQuestionCountChange: (value: string) => void;
  questionCountOptions: number[];
  selectedDifficulty: string;
  onDifficultyChange: (value: string) => void;
  isMuted: boolean;
  onMuteToggle: (muted: boolean) => void;
  isSaving: boolean;
  onSubmit: () => void;
}

/**
 * Menentukan class CSS untuk tombol kesulitan berdasarkan status aktif/tidak.
 * Setiap level kesulitan memiliki skema warna yang berbeda:
 * - Easy: hijau (#00ff9d / emerald)
 * - Normal: kuning (amber)
 * - Hard: merah (red)
 */
function getDifficultyButtonClass(diff: string, isSelected: boolean): string {
  const base = "h-11 text-xs font-display uppercase tracking-wider transition-all duration-200 rounded-xl border";

  if (isSelected) {
    if (diff === "Easy") return `${base} bg-emerald-500/20 text-[#00ff9d] border-[#00ff9d] shadow-[0_0_14px_rgba(0,255,157,0.5)]`;
    if (diff === "Normal") return `${base} bg-amber-500/20 text-amber-400 border-amber-500/60 shadow-[0_0_14px_rgba(245,158,11,0.3)]`;
    return `${base} bg-red-500/20 text-red-400 border-red-500/60 shadow-[0_0_14px_rgba(239,68,68,0.3)]`;
  }

  if (diff === "Easy") return `${base} bg-white/[0.03] border-emerald-500/20 text-emerald-500/50 hover:border-[#00ff9d]/60 hover:text-[#00ff9d]`;
  if (diff === "Normal") return `${base} bg-white/[0.03] border-amber-500/20 text-amber-500/50 hover:border-amber-500/50 hover:text-amber-400`;
  return `${base} bg-white/[0.03] border-red-500/20 text-red-500/50 hover:border-red-500/50 hover:text-red-400`;
}

export default function SettingsForm({
  quizTitle,
  duration,
  onDurationChange,
  questionCount,
  onQuestionCountChange,
  questionCountOptions,
  selectedDifficulty,
  onDifficultyChange,
  isMuted,
  onMuteToggle,
  isSaving,
  onSubmit,
}: SettingsFormProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1, type: "spring", stiffness: 100, damping: 12 }}
    >
      <Card className="bg-[#080d1a]/80 border border-[#2d6af2]/40 backdrop-blur-2xl shadow-[0_0_30px_rgba(45,106,242,0.15),inset_0_1px_0_rgba(255,255,255,0.06)] rounded-[2rem] relative overflow-hidden p-0">
        {/* Garis aksen gradien di atas kartu */}
        <div className="h-[4px] w-full" style={{ background: 'linear-gradient(90deg,#1a45c4,#2d6af2,#00ff9d,#2d6af2,#1a45c4)' }} />

        <div className="p-6 sm:p-8 flex flex-col gap-7 relative z-10">
          {/* Efek cahaya ambient di pojok kanan atas */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#2d6af2]/10 blur-[60px] pointer-events-none" />

          {/* ── Judul kuis (read-only) ── */}
          <div className="p-4 bg-white/[0.03] border border-[#2d6af2]/30 rounded-xl">
            <h2 className="text-lg sm:text-xl text-white font-display font-bold uppercase tracking-widest text-center drop-shadow-[0_0_10px_rgba(45,106,242,0.5)]">
              {quizTitle}
            </h2>
          </div>

          {/* ══════════════════════════════════════════ */}
          {/* BARIS 1: Durasi, Jumlah Soal, Suara       */}
          {/* ══════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* ── Pengaturan durasi ── */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-display uppercase tracking-[0.2em] flex items-center gap-1.5 pl-0.5" style={{ color: '#2d6af2' }}>
                <Clock className="h-3 w-3" /><span>{t('room_settings.duration')}</span>
              </Label>
              <Select value={duration} onValueChange={onDurationChange}>
                <SelectTrigger className="h-10 bg-white/[0.03] border border-[#2d6af2]/30 text-white font-display text-xs uppercase tracking-wider focus:border-[#00ff9d] focus:ring-1 focus:ring-[#00ff9d]/50 rounded-xl transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#04060f] border border-[#2d6af2]/30 text-white font-display uppercase tracking-wider">
                  {/* Opsi durasi: 5, 10, 15, 20, 25, 30 menit */}
                  {Array.from({ length: 6 }, (_, i) => (i + 1) * 5).map((min) => (
                    <SelectItem key={min} value={(min * 60).toString()} className="focus:bg-[#2d6af2]/20 focus:text-white cursor-pointer">
                      {min} {t('room_settings.min')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ── Pengaturan jumlah pertanyaan ── */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-display uppercase tracking-[0.2em] flex items-center gap-1.5 pl-0.5" style={{ color: '#2d6af2' }}>
                <ListOrdered className="h-3 w-3" /><span>{t('room_settings.questions')}</span>
              </Label>
              <Select value={questionCount} onValueChange={onQuestionCountChange}>
                <SelectTrigger className="h-10 bg-white/[0.03] border border-[#2d6af2]/30 text-white font-display text-xs uppercase tracking-wider focus:border-[#00ff9d] focus:ring-1 focus:ring-[#00ff9d]/50 rounded-xl transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#04060f] border border-[#2d6af2]/30 text-white font-display uppercase tracking-wider">
                  {questionCountOptions.map((count) => (
                    <SelectItem key={count} value={count.toString()} className="focus:bg-[#2d6af2]/20 focus:text-white cursor-pointer">
                      {count}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ── Pengaturan suara (on/off) ── */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-display uppercase tracking-[0.2em] flex items-center gap-1.5 pl-0.5" style={{ color: '#2d6af2' }}>
                {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                <span>{t('room_settings.sound')}</span>
              </Label>
              <div className="flex items-center justify-center gap-3 h-10 bg-white/[0.03] border border-[#2d6af2]/30 rounded-xl">
                <VolumeX className={`h-3.5 w-3.5 ${isMuted ? "text-red-500" : "text-gray-600"}`} />
                <Switch
                  checked={!isMuted}
                  onCheckedChange={(checked: boolean) => onMuteToggle(!checked)}
                  className="data-[state=checked]:bg-[#00ff9d] data-[state=unchecked]:bg-[#333] border border-white/10"
                />
                <Volume2 className={`h-3.5 w-3.5 ${!isMuted ? "text-[#00ff9d]" : "text-gray-600"}`} />
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════ */}
          {/* BARIS 2: Tingkat Kesulitan                 */}
          {/* ══════════════════════════════════════════ */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-display uppercase tracking-[0.2em] flex items-center gap-1.5 pl-0.5" style={{ color: '#2d6af2' }}>
              <Settings className="h-3 w-3" /><span>{t('room_settings.difficulty.title')}</span>
            </Label>
            <div className="grid grid-cols-3 gap-4">
              {DIFFICULTIES.map((diff) => (
                <button
                  key={diff}
                  onClick={() => onDifficultyChange(diff.toLowerCase())}
                  className={getDifficultyButtonClass(diff, selectedDifficulty === diff.toLowerCase())}
                >
                  {t(`room_settings.difficulty.${diff.toLowerCase()}`)}
                </button>
              ))}
            </div>
          </div>

          {/* ══════════════════════════════════════════ */}
          {/* TOMBOL LANJUTKAN                           */}
          {/* ══════════════════════════════════════════ */}
          <Button
            onClick={onSubmit}
            disabled={isSaving}
            className="w-full text-sm py-6 font-display uppercase tracking-widest disabled:cursor-not-allowed cursor-pointer transition-all rounded-xl border-none"
            style={{
              background: isSaving ? 'rgba(30,40,60,0.8)' : 'linear-gradient(135deg,#1a45c4,#2d6af2,#1a45c4)',
              boxShadow: isSaving ? 'none' : '0 0 28px rgba(45,106,242,0.4), 0 0 10px rgba(0,255,157,0.35)',
            }}
          >
            {isSaving ? (
              <span className="flex items-center gap-2 text-gray-500">
                <div className="h-4 w-4 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin" />
                {t('room_settings.button.loading')}
              </span>
            ) : (
              <span className="flex items-center gap-2 text-white font-bold">
                <Play className="fill-white h-4 w-4" />
                {t('room_settings.button.continue')}
              </span>
            )}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
