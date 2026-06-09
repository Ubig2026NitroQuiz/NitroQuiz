/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KOMPONEN: PlayersCard
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Kartu daftar pemain di sisi kanan (desktop) / bawah (mobile).
 * Menampilkan grid pemain yang telah bergabung ke lobby.
 *
 * Fitur:
 * - Header dengan jumlah pemain & tombol aksi (invite grup, invite teman, add bot)
 * - Grid responsif (2/3/4/5 kolom sesuai breakpoint)
 * - Animasi masuk/keluar pemain (AnimatePresence)
 * - Tooltip nama pemain saat hover
 * - Tombol kick per pemain (muncul saat hover)
 * - State kosong dengan animasi menunggu
 */

import { Users, X, UserPlus, Users2, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { InitialsAvatar } from "./InitialsAvatar";
import type { Participant } from "../types";

// ═══════════════════════════════════════════════════════════════════════════
// TIPE PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface PlayersCardProps {
  participants: Participant[];
  onKickPlayer: (player: Participant) => void;
  onInviteGroupOpen: () => void;
  onInviteFriendOpen: () => void;
  onAddBot: () => void;
  t: (key: string) => string;
}

// ═══════════════════════════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════════════════

export function PlayersCard({
  participants,
  onKickPlayer,
  onInviteGroupOpen,
  onInviteFriendOpen,
  onAddBot,
  t,
}: PlayersCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex-1 flex flex-col bg-[#111729]/95 backdrop-blur-xl rounded-xl border border-white/[0.08] shadow-[0_15px_40px_rgba(0,0,0,0.6)] relative overflow-hidden"
    >
      {/* ── Tekstur Cyber ── */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
          backgroundSize: "16px 16px",
        }}
      />
      <div className="absolute top-0 end-0 w-80 h-80 bg-gradient-to-bl from-[#00ff9d]/5 to-transparent rounded-bl-full pointer-events-none z-0" />

      {/* ── Header Pemain ── */}
      <PlayersHeader
        count={participants.length}
        onInviteGroupOpen={onInviteGroupOpen}
        onInviteFriendOpen={onInviteFriendOpen}
        onAddBot={onAddBot}
        t={t}
      />

      {/* ── Grid Pemain ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 relative z-10">
        {participants.length === 0 ? (
          <EmptyState t={t} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            <AnimatePresence>
              {participants.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onKick={onKickPlayer}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: Header Daftar Pemain
// ═══════════════════════════════════════════════════════════════════════════

function PlayersHeader({
  count,
  onInviteGroupOpen,
  onInviteFriendOpen,
  onAddBot,
  t,
}: {
  count: number;
  onInviteGroupOpen: () => void;
  onInviteFriendOpen: () => void;
  onAddBot: () => void;
  t: (key: string) => string;
}) {
  return (
    <div className="px-4 sm:px-5 py-4 flex items-center justify-between border-b border-white/5 shrink-0 relative z-10">
      {/* Jumlah pemain */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-2 sm:p-2.5 bg-[#00ff9d]/10 rounded-xl">
          <Users size={18} className="text-[#00ff9d] sm:size-5" />
        </div>
        <div className="flex flex-row items-baseline gap-1.5 sm:gap-3">
          <h2 className="font-display text-xl sm:text-3xl font-bold text-white leading-none">
            {count}
          </h2>
          <p className="text-[#00ff9d] text-[9px] sm:text-[11px] font-bold uppercase font-display tracking-[0.2em]">
            {count === 1 ? "PLAYER" : t("host_lobby.players")}
          </p>
        </div>
      </div>

      {/* Tombol aksi */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Undang Grup */}
        <HeaderActionButton
          onClick={onInviteGroupOpen}
          icon={<Users2 size={14} />}
          label={t("host_lobby.invite_groups") ?? "Invite Groups"}
          colorScheme="purple"
        />

        {/* Undang Teman */}
        <HeaderActionButton
          onClick={onInviteFriendOpen}
          icon={<UserPlus size={14} />}
          label={t("host_lobby.invite_friends") ?? "Invite Friends"}
          colorScheme="blue"
        />

        {/* Tambah Bot */}
        <HeaderActionButton
          onClick={onAddBot}
          icon={<Bot size={14} />}
          label="Add Bot"
          colorScheme="yellow"
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: Tombol Aksi di Header
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Tombol aksi cyberpunk dengan efek skew dan hover shine.
 * Mendukung 3 skema warna: purple, blue, yellow.
 */
function HeaderActionButton({
  onClick,
  icon,
  label,
  colorScheme,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  colorScheme: "purple" | "blue" | "yellow";
}) {
  // Tentukan kelas warna berdasarkan skema
  const colorClasses = {
    purple:
      "bg-purple-500/25 border-purple-500/60 hover:bg-purple-500/40 hover:border-purple-500/80 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)]",
    blue: "bg-[#2d6af2]/25 border-[#2d6af2]/60 hover:bg-[#2d6af2]/40 hover:border-[#2d6af2]/80 hover:shadow-[0_0_15px_rgba(45,106,242,0.5)]",
    yellow:
      "bg-yellow-500/25 border-yellow-500/60 hover:bg-yellow-500/40 hover:border-yellow-500/80 hover:shadow-[0_0_15px_rgba(234,179,8,0.5)]",
  };

  // Gunakan group class yang unik per skema warna
  const groupClass =
    colorScheme === "purple"
      ? "group/hg"
      : colorScheme === "blue"
        ? "group/hb"
        : "group/ht";

  return (
    <button
      onClick={onClick}
      className={`${groupClass} h-9 px-4 rounded-sm border ${colorClasses[colorScheme]} text-white transition-all font-display text-[10px] uppercase tracking-wider transform -skew-x-[15deg] overflow-hidden relative`}
    >
      <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/hg:translate-x-[200%] group-hover/hb:translate-x-[200%] group-hover/ht:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
      <div className="relative z-10 transform skew-x-[15deg] flex items-center gap-1.5">
        {icon}
        <span className="hidden sm:inline">{label}</span>
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: Kartu Individual Pemain
// ═══════════════════════════════════════════════════════════════════════════

function PlayerCard({
  player,
  onKick,
}: {
  player: Participant;
  onKick: (player: Participant) => void;
}) {
  return (
    <motion.div
      key={player.id}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      tabIndex={0}
      onClick={() => {}}
      className="group relative bg-gradient-to-b from-[#111625] to-[#0a0d14] border border-white/5 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center transition-all hover:border-[#2d6af2]/50 hover:shadow-[0_0_20px_rgba(45,106,242,0.2)] hover:-translate-y-1 cursor-pointer"
    >
      {/* Garis laser di sisi kiri */}
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#2d6af2] to-transparent opacity-50 group-hover:opacity-100 transition-opacity rounded-tl-xl rounded-bl-xl" />

      {/* Efek glow cyber di background */}
      <div className="absolute inset-0 bg-[#2d6af2]/[0.02] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Avatar */}
      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border border-[#2d6af2]/30 bg-black/40 overflow-hidden mb-3 flex items-center justify-center shadow-inner relative group/avatar z-10 group-hover:border-[#2d6af2] transition-colors">
        {player.avatar_url ? (
          <img
            src={player.avatar_url}
            alt="Ava"
            className="w-full h-full object-cover"
          />
        ) : (
          <InitialsAvatar name={player.nickname} size="md" />
        )}
      </div>

      {/* Nama Pemain */}
      <div className="bg-black/40 border border-white/5 rounded-md px-2 py-1 w-full text-center relative z-10 shadow-inner group-hover:bg-[#2d6af2]/10 transition-colors">
        <p className="font-display text-white text-[10px] sm:text-xs font-bold truncate tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
          {player.nickname}
        </p>
      </div>

      {/* Tombol Kick (selalu tampil di mobile, hover di desktop) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onKick(player);
        }}
        className="absolute top-1.5 end-1.5 sm:top-2 sm:end-2 opacity-70 md:opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity bg-red-500/20 text-red-500 p-1.5 sm:p-2 rounded-full hover:bg-red-500 hover:text-white z-20 shadow-[0_0_10px_rgba(239,68,68,0.3)] md:shadow-none"
      >
        <X size={14} />
      </button>

      {/* Tooltip Nama (hanya desktop) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 md:group-hover:opacity-100 transition-all duration-300 z-[999] pointer-events-none bg-[#0c1020]/95 backdrop-blur-xl text-white border border-[#2d6af2]/80 font-display text-sm px-4 py-2 shadow-[0_0_30px_rgba(45,106,242,0.8)] rounded-md whitespace-nowrap scale-95 md:group-hover:scale-100 hidden md:block">
        {player.nickname}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: State Kosong (belum ada pemain)
// ═══════════════════════════════════════════════════════════════════════════

function EmptyState({ t }: { t: (key: string) => string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center opacity-30 py-10">
      <Users
        size={60}
        className="text-white mb-4 animate-pulse sm:size-24 sm:mb-6"
      />
      <p className="font-display tracking-[0.2em] sm:tracking-[0.4em] text-[10px] sm:text-sm uppercase text-white">
        {t("host_lobby.waiting")}
      </p>
    </div>
  );
}
