"use client";

/**
 * PlayerCard.tsx
 * ──────────────
 * Kartu individu pemain di halaman monitor.
 * Menampilkan:
 * - Avatar (foto/inisial/tengkorak jika eliminated)
 * - Nama pemain & lap indicator
 * - Skor & status badge (Racing/Quiz/Finish/Crashed)
 * - Posisi/rank (#1, #2, dst.)
 *
 * Status pemain:
 * - finish: hijau (sudah selesai semua soal)
 * - crashed: merah (eliminated)
 * - quiz: biru pulsing (sedang menjawab soal)
 * - racing: hijau samar (sedang balap/minigame)
 *
 * Props:
 * - player: data peserta
 * - rank: posisi (0-indexed)
 * - totalQuestions: total jumlah pertanyaan
 */

import { Skull } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getInitials, getAvatarColor, RANK_COLORS, DEFAULT_RANK_COLOR } from "./utils";
import type { MonitorParticipant } from "./types";

// ── Komponen Avatar Inisial (inline, dengan inline styles sesuai aslinya) ──
function InitialsAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const fontSize = size === 'lg' ? 'text-[20px]' : size === 'md' ? 'text-[16px]' : 'text-[10px]';
  return (
    <div
      style={{
        width: '100%', height: '100%', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize, fontWeight: 900, color: 'white',
        backgroundColor: getAvatarColor(name)
      }}
    >
      {getInitials(name)}
    </div>
  );
}

interface PlayerCardProps {
  player: MonitorParticipant;
  rank: number;
  totalQuestions: number;
}

/**
 * Menentukan status visual pemain berdasarkan state saat ini.
 * Mengembalikan label, warna background, border, teks, dan animasi pulse.
 */
function getPlayerStatus(
  player: MonitorParticipant,
  isFinished: boolean,
  t: (key: string) => string,
) {
  let label = t("host_monitor.racing");
  let bg = "rgba(255,255,255,0.05)";
  let border = "rgba(255,255,255,0.12)";
  let text = "rgba(255,255,255,0.45)";
  let pulse = false;

  if (isFinished) {
    label = t("host_monitor.finish");
    bg = "rgba(16,185,129,0.12)";
    border = "rgba(16,185,129,0.5)";
    text = "#34d399";
  } else if (player.eliminated) {
    label = t("host_monitor.crashed");
    bg = "rgba(239,68,68,0.12)";
    border = "rgba(239,68,68,0.5)";
    text = "#f87171";
  } else if (!player.minigame) {
    label = t("host_monitor.quiz");
    bg = "rgba(59,130,246,0.12)";
    border = "rgba(59,130,246,0.5)";
    text = "#93c5fd";
    pulse = true;
  } else {
    label = t("host_monitor.racing");
    bg = "rgba(16,185,129,0.05)";
    border = "rgba(16,185,129,0.15)";
    text = "#10b981";
  }

  return { label, bg, border, text, pulse };
}

export default function PlayerCard({ player, rank, totalQuestions }: PlayerCardProps) {
  const { t } = useTranslation();
  const rankColor = RANK_COLORS[rank] ?? DEFAULT_RANK_COLOR;
  const isFinished = player.finished_at !== null || player.current_question >= totalQuestions;
  const status = getPlayerStatus(player, isFinished, t);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "stretch",
        borderRadius: "12px",
        overflow: "hidden",
        background: "linear-gradient(135deg, rgba(16,26,52,0.97) 0%, rgba(11,16,32,0.97) 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.45)",
        transition: "all 0.3s ease",
      }}
    >
      {/* ── Garis rank di kiri ── */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: rankColor, boxShadow: `0 0 8px ${rankColor}` }} />

      {/* ── Avatar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "10px", marginLeft: "3px" }}>
        <div style={{ position: "relative", width: "64px", height: "64px", borderRadius: "50%", flexShrink: 0, overflow: "hidden", border: `2px solid ${rankColor}`, boxShadow: `0 0 10px ${rankColor}40`, background: "rgba(0,0,0,0.2)" }}>
          {player.eliminated ? (
            /* Ikon tengkorak jika eliminated */
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(239,68,68,0.15)" }}>
              <Skull size={28} color="#f87171" />
            </div>
          ) : player.avatar_url ? (
            /* Foto avatar */
            <img src={player.avatar_url} alt={player.nickname} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} />
          ) : (
            /* Avatar inisial */
            <InitialsAvatar name={player.nickname} size="lg" />
          )}
        </div>
      </div>

      {/* ── Info: nama, lap, skor, status ── */}
      <div style={{ flex: 1, padding: "10px 12px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "5px", minWidth: 0 }}>
        {/* Baris 1: Nama + Lap */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontFamily: "Orbitron, monospace", fontSize: "13px", fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.92)", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={player.nickname}>
            {player.nickname}
          </span>
          <span style={{ fontFamily: "Orbitron, monospace", fontSize: "9px", fontWeight: 700, letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", flexShrink: 0, background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: "6px" }}>
            {t("host_monitor.lap")} {player.current_question}/{totalQuestions}
          </span>
        </div>

        {/* Baris 2: Skor + Status badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Skor */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "2px 8px", borderRadius: "6px", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)" }}>
            <span style={{ fontFamily: "Orbitron, monospace", fontSize: "7px", fontWeight: 700, letterSpacing: "0.15em", color: "rgba(147,197,253,0.6)", textTransform: "uppercase" }}>
              {t("host_monitor.score")}
            </span>
            <span style={{ fontFamily: "Orbitron, monospace", fontSize: "12px", fontWeight: 900, color: "#93c5fd", lineHeight: 1 }}>
              {player.score.toLocaleString()}
            </span>
          </div>

          {/* Badge status */}
          <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "2px 8px", borderRadius: "6px", background: status.bg, border: `1px solid ${status.border}`, color: status.text, fontFamily: "Orbitron, monospace", fontSize: "8.5px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {status.pulse && (
              <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: status.text, animation: "pulse 1.5s infinite", flexShrink: 0 }} />
            )}
            {status.label}
          </div>
        </div>
      </div>

      {/* ── Indikator posisi (kanan) ── */}
      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px 14px", borderLeft: "1px solid rgba(255,255,255,0.06)", minWidth: "80px", gap: "4px" }}>
        <span style={{ fontFamily: "Orbitron, monospace", fontSize: "24px", fontWeight: 900, fontStyle: "italic", color: rankColor, textShadow: `0 0 12px ${rankColor}80`, lineHeight: 1 }}>
          #{rank + 1}
        </span>
      </div>
    </div>
  );
}
