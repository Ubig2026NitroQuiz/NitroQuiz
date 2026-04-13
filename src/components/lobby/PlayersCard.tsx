"use client";

/**
 * PlayersCard.tsx
 * ───────────────
 * Kartu daftar pemain di sisi kanan lobby.
 * Menampilkan grid avatar dan nama pemain yang sudah bergabung.
 * Termasuk header dengan jumlah pemain dan tombol aksi (invite, add bot, sound).
 *
 * Props:
 * - participants: daftar peserta
 * - isMuted: status mute audio
 * - onMuteToggle: fungsi toggle mute
 * - onInviteFriend: buka dialog undang teman
 * - onInviteGroup: buka dialog undang grup
 * - onAddBot: tambah bot ke lobby
 * - onKickPlayer: fungsi kick pemain
 */

import { Users, Volume2, VolumeX, X, UserPlus, Users2, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import InitialsAvatar from "./InitialsAvatar";

interface PlayersCardProps {
  participants: any[];
  isMuted: boolean;
  onMuteToggle: () => void;
  onInviteFriend: () => void;
  onInviteGroup: () => void;
  onAddBot: () => void;
  onKickPlayer: (player: any) => void;
}

export default function PlayersCard({
  participants,
  isMuted,
  onMuteToggle,
  onInviteFriend,
  onInviteGroup,
  onAddBot,
  onKickPlayer,
}: PlayersCardProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex-1 flex flex-col bg-black/60 backdrop-blur-3xl rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden min-h-[300px] lg:min-h-0 relative"
    >
      {/* Efek gradien dekoratif */}
      <div className="absolute top-0 end-0 w-80 h-80 bg-gradient-to-bl from-[#00ff9d]/5 to-transparent rounded-bl-full pointer-events-none z-0"></div>

      {/* ── Header: jumlah pemain & tombol aksi ── */}
      <div className="px-4 sm:px-5 py-4 flex items-center justify-between border-b border-white/5 shrink-0 relative z-10">
        {/* Jumlah pemain */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#00ff9d]/10 rounded-xl">
            <Users size={20} className="text-[#00ff9d]" />
          </div>
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">{participants.length}</h2>
            <p className="text-[#00ff9d] text-[9px] uppercase font-display tracking-[0.3em] opacity-80">{t('host_lobby.players')}</p>
          </div>
        </div>

        {/* Tombol aksi */}
        <div className="flex items-center gap-2">
          {/* Undang teman */}
          <button
            onClick={onInviteFriend}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl border bg-[#2d6af2]/10 border-[#2d6af2]/30 text-[#2d6af2] hover:bg-[#2d6af2]/20 transition-all font-display text-[10px] uppercase tracking-wider"
          >
            <UserPlus size={14} />
            <span className="hidden sm:inline">{t('host_lobby.invite_friends') ?? 'Invite Friends'}</span>
          </button>

          {/* Undang grup */}
          <button
            onClick={onInviteGroup}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl border bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20 transition-all font-display text-[10px] uppercase tracking-wider"
          >
            <Users2 size={14} />
            <span className="hidden sm:inline">{t('host_lobby.invite_groups') ?? 'Invite Groups'}</span>
          </button>

          {/* Tambah bot */}
          <button
            onClick={onAddBot}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl border bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 transition-all font-display text-[10px] uppercase tracking-wider"
          >
            <Bot size={14} />
            <span className="hidden sm:inline">Add Bot</span>
          </button>

          {/* Toggle suara */}
          <button
            onClick={onMuteToggle}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all ${isMuted ? "bg-red-500/10 border-red-500/30 text-red-500" : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10"}`}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </div>

      {/* ── Grid pemain ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 relative z-10">
        {participants.length === 0 ? (
          /* Tampilan kosong: menunggu pemain */
          <div className="h-full flex flex-col items-center justify-center opacity-30 py-10">
            <Users size={80} className="text-white mb-6 animate-pulse" />
            <p className="font-display tracking-[0.4em] text-sm uppercase text-white">{t('host_lobby.waiting')}</p>
          </div>
        ) : (
          /* Grid kartu pemain */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            <AnimatePresence>
              {participants.map((player) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="group relative bg-[#11111a] border border-white/10 rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center transition-all hover:border-[#2d6af2]/50 hover:bg-[#1a1c2e] hover:shadow-[0_10px_30px_rgba(45,106,242,0.15)] hover:-translate-y-1 overflow-hidden"
                >
                  {/* Avatar pemain */}
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-[#2d6af2]/30 bg-black/40 overflow-hidden mb-3 flex items-center justify-center shadow-inner relative group/avatar">
                    {player.avatar_url ? (
                      <img src={player.avatar_url} alt="Ava" className="w-full h-full object-cover" />
                    ) : (
                      <InitialsAvatar name={player.nickname} size="md" />
                    )}
                  </div>

                  {/* Nama pemain */}
                  <div className="bg-white/5 rounded-lg px-2 py-1 w-full text-center">
                    <p className="font-display text-white text-[10px] sm:text-xs font-bold truncate tracking-widest">{player.nickname}</p>
                  </div>

                  {/* Tombol kick (muncul saat hover) */}
                  <button
                    onClick={(e) => { e.stopPropagation(); onKickPlayer(player); }}
                    className="absolute top-2 end-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/20 text-red-500 p-2 rounded-full hover:bg-red-500 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
