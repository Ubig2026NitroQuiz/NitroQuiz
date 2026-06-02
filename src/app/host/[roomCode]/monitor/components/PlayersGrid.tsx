/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KOMPONEN: PlayersGrid
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Grid daftar pemain dengan animasi yang menampilkan:
 * - Jumlah pemain aktif (badge di kiri atas)
 * - Grid responsif kartu pemain (1/2/4 kolom)
 * - State kosong saat belum ada pemain
 *
 * Layout grid:
 * - Mobile: 1 kolom
 * - Tablet (md): 2 kolom
 * - Desktop (lg+): 4 kolom
 */

import { Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayerCard } from "./PlayerCard";
import type { Participant } from "../types";

// ═══════════════════════════════════════════════════════════════════════════
// TIPE PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface PlayersGridProps {
  participants: Participant[];
  rankedParticipants: Participant[];
  totalQuestions: number;
  t: (key: string) => string;
}

// ═══════════════════════════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════════════════

export function PlayersGrid({
  participants,
  rankedParticipants,
  totalQuestions,
  t,
}: PlayersGridProps) {
  return (
    <div
      style={{
        position: "relative",
        zIndex: 20,
        flex: 1,
        padding: "14px 16px",
        overflowY: "auto",
      }}
    >
      {/* ── Label: Jumlah Pemain ── */}
      <div className="flex flex-row items-center justify-between mb-4 md:mb-6 px-2">
        <div className="flex items-center gap-3 px-4 py-2 bg-blue-500/10 border border-blue-500/25 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.15)] transform -skew-x-[10deg]">
          <Users
            size={18}
            className="text-blue-400 transform skew-x-[10deg]"
          />
          <span className="font-display font-bold text-lg md:text-2xl text-blue-400 tracking-wider transform skew-x-[10deg]">
            {participants.length}
          </span>
        </div>
      </div>

      {/* ── Grid Kartu Pemain ── */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        style={{ maxWidth: "1600px", margin: "0 auto", width: "100%" }}
      >
        <AnimatePresence>
          {rankedParticipants.map((player, index) => (
            <motion.div
              key={player.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 25,
                mass: 0.8,
              }}
              style={{ height: "100%" }}
            >
              <PlayerCard
                player={player}
                rank={index}
                totalQuestions={totalQuestions}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* State Kosong: Belum ada pemain */}
        {participants.length === 0 && (
          <div
            className="empty-grid-msg"
            style={{
              height: "240px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "16px",
              background: "rgba(0,0,0,0.2)",
              border: "1px dashed rgba(255,255,255,0.07)",
            }}
          >
            <Users
              size={36}
              style={{ opacity: 0.2, marginBottom: "12px" }}
            />
            <p
              style={{
                fontFamily: "Orbitron, monospace",
                fontSize: "11px",
                letterSpacing: "0.4em",
                textTransform: "uppercase",
                opacity: 0.25,
              }}
            >
              {t("host_monitor.waiting")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
