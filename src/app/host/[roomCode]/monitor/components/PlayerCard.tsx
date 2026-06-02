/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KOMPONEN: PlayerCard
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Kartu individual pemain yang menampilkan:
 * - Avatar (foto profil atau inisial)
 * - Nama pemain dengan progress soal (current/total)
 * - Badge status: Quiz (sedang menjawab), Game (bermain minigame), Finish
 * - Tooltip nama saat hover
 *
 * Komponen pendukung:
 * - InitialsAvatar: Avatar fallback dengan inisial nama
 * - LapIndicator: Indikator lap (saat ini belum aktif digunakan)
 */

import { useTranslation } from "react-i18next";
import { AVATAR_COLORS } from "../types";
import type { Participant } from "../types";

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Menghasilkan inisial dari nama
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Menghasilkan inisial 2 karakter dari nama.
 * - 2+ kata: huruf pertama dari kata pertama & kedua
 * - 1 kata: 2 huruf pertama
 * - Kosong: "?"
 */
const getInitials = (name: string): string => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Warna avatar berdasarkan hash nama
// ═══════════════════════════════════════════════════════════════════════════

const getAvatarColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// ═══════════════════════════════════════════════════════════════════════════
// KOMPONEN: InitialsAvatar
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Avatar lingkaran dengan inisial nama sebagai fallback.
 * Menggunakan inline style (sesuai pola asli monitor page).
 */
const InitialsAvatar = ({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) => {
  const fontSize =
    size === "lg"
      ? "text-[20px]"
      : size === "md"
        ? "text-[16px]"
        : "text-[10px]";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize,
        fontWeight: 900,
        color: "white",
        backgroundColor: getAvatarColor(name),
      }}
    >
      {getInitials(name)}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// KOMPONEN: LapIndicator (Indikator Lap — untuk penggunaan masa depan)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Menampilkan nomor lap saat ini dan total lap.
 * Saat ini belum aktif digunakan di PlayerCard,
 * tetapi tersedia untuk fitur lap tracking di masa depan.
 */
export function LapIndicator({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "2px",
      }}
    >
      <span
        style={{
          fontFamily: "Orbitron, monospace",
          fontSize: "26px",
          fontWeight: 900,
          color: "#ffffff",
          lineHeight: 1,
          textShadow: "0 0 10px rgba(147,197,253,0.8)",
        }}
      >
        {current}
      </span>
      <span
        style={{
          fontFamily: "Orbitron, monospace",
          fontSize: "10px",
          letterSpacing: "0.2em",
          color: "rgba(255,255,255,0.5)",
        }}
      >
        / {total}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TIPE PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface PlayerCardProps {
  player: Participant;
  rank: number;
  totalQuestions: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// KOMPONEN UTAMA: PlayerCard
// ═══════════════════════════════════════════════════════════════════════════

export function PlayerCard({ player, rank, totalQuestions }: PlayerCardProps) {
  const { t } = useTranslation();

  // ── Cek apakah pemain sudah selesai ──
  const isFinished =
    player.finished_at !== null || player.current_question >= totalQuestions;

  // ── Warna garis rank di sisi kiri ──
  const rankColor = "rgba(255,255,255,0.15)";

  // ── Tentukan status dan styling berdasarkan kondisi pemain ──
  let statusLabel = t("host_monitor.game", "Game");
  let statusBg = "rgba(255,255,255,0.05)";
  let statusBorder = "rgba(255,255,255,0.12)";
  let statusText = "rgba(255,255,255,0.45)";
  let statusPulse = false;

  let cardBg =
    "linear-gradient(135deg, rgba(16,26,52,0.97) 0%, rgba(11,16,32,0.97) 100%)";
  let cardBorder = "1px solid rgba(255,255,255,0.07)";
  let cardShadow = "0 4px 20px rgba(0,0,0,0.45)";

  if (isFinished) {
    // ── Status: SELESAI (hijau) ──
    statusLabel = t("host_monitor.finish");
    statusBg = "rgba(16,185,129,0.12)";
    statusBorder = "rgba(16,185,129,0.5)";
    statusText = "#34d399";
    cardBg =
      "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(6,78,59,0.8) 100%)";
    cardBorder = "1px solid rgba(16,185,129,0.4)";
    cardShadow = "0 4px 20px rgba(16,185,129,0.25)";
  } else if (!player.minigame) {
    // ── Status: QUIZ (biru, dengan pulse) ──
    statusLabel = t("host_monitor.quiz");
    statusBg = "rgba(59,130,246,0.12)";
    statusBorder = "rgba(59,130,246,0.5)";
    statusText = "#93c5fd";
    statusPulse = true;
  } else {
    // ── Status: GAME / minigame aktif (hijau gelap) ──
    statusLabel = t("host_monitor.game", "Game");
    statusBg = "rgba(16,185,129,0.05)";
    statusBorder = "rgba(16,185,129,0.15)";
    statusText = "#10b981";
  }

  return (
    <div
      className="group"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "stretch",
        borderRadius: "12px",
        background: cardBg,
        border: cardBorder,
        boxShadow: cardShadow,
        transition: "all 0.3s ease",
      }}
    >
      {/* ── Garis rank di sisi kiri ── */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "3px",
          borderTopLeftRadius: "12px",
          borderBottomLeftRadius: "12px",
          background: rankColor,
          boxShadow: `0 0 8px ${rankColor}`,
        }}
      />

      {/* ── Avatar Pemain ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "10px",
          marginLeft: "3px",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            flexShrink: 0,
            overflow: "hidden",
            border: `2px solid ${rankColor}`,
            boxShadow: `0 0 10px ${rankColor}40`,
            background: "rgba(0,0,0,0.2)",
          }}
        >
          {player.avatar_url ? (
            <img
              src={player.avatar_url}
              alt={player.nickname}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "top center",
              }}
            />
          ) : (
            <InitialsAvatar name={player.nickname} size="lg" />
          )}
        </div>
      </div>

      {/* ── Informasi Pemain ── */}
      <div
        style={{
          flex: 1,
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "5px",
          minWidth: 0,
        }}
      >
        {/* Baris nama + progress soal */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontFamily: "Orbitron, monospace",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.92)",
              textTransform: "uppercase",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              cursor: "default",
            }}
          >
            {player.nickname}
          </span>
          {/* Badge progress soal */}
          <span
            style={{
              fontFamily: "Orbitron, monospace",
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              color: "rgba(255,255,255,0.35)",
              textTransform: "uppercase",
              flexShrink: 0,
              background: "rgba(255,255,255,0.06)",
              padding: "2px 8px",
              borderRadius: "6px",
            }}
          >
            {player.current_question}/{totalQuestions}
          </span>
        </div>

        {/* Badge status */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "2px 8px",
              borderRadius: "6px",
              background: statusBg,
              border: `1px solid ${statusBorder}`,
              color: statusText,
              fontFamily: "Orbitron, monospace",
              fontSize: "8.5px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {/* Indikator pulse untuk status aktif */}
            {statusPulse && (
              <span
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: statusText,
                  animation: "pulse 1.5s infinite",
                  flexShrink: 0,
                }}
              />
            )}
            {statusLabel}
          </div>
        </div>
      </div>

      {/* ── Tooltip Nama (muncul saat hover) ── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-[999] pointer-events-none bg-[#0c1020]/95 backdrop-blur-xl text-white border border-[#2d6af2]/80 font-display text-sm px-4 py-2 shadow-[0_0_30px_rgba(45,106,242,0.8)] rounded-md whitespace-nowrap scale-95 group-hover:scale-100">
        {player.nickname}
      </div>
    </div>
  );
}
