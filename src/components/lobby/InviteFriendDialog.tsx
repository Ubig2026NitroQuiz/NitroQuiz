"use client";

/**
 * InviteFriendDialog.tsx
 * ──────────────────────
 * Dialog untuk mengundang teman mutual ke room.
 * Menampilkan daftar teman yang saling follow (mutual friends)
 * dengan fitur pencarian dan tombol invite.
 *
 * Props:
 * - isOpen: mengontrol visibilitas dialog
 * - onClose: fungsi menutup dialog
 * - friends: daftar teman mutual
 * - isLoading: sedang memuat data teman
 * - searchQuery: query pencarian saat ini
 * - onSearchChange: fungsi saat pencarian berubah
 * - invitedFriends: daftar ID teman yang sudah diundang
 * - onInvite: fungsi untuk mengundang teman
 */

import { UserPlus, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogOverlay } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import InitialsAvatar from "./InitialsAvatar";

interface InviteFriendDialogProps {
  isOpen: boolean;
  onClose: () => void;
  friends: any[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  invitedFriends: string[];
  onInvite: (friendId: string) => void;
}

export default function InviteFriendDialog({
  isOpen,
  onClose,
  friends,
  isLoading,
  searchQuery,
  onSearchChange,
  invitedFriends,
  onInvite,
}: InviteFriendDialogProps) {
  const { t } = useTranslation();

  // Filter teman berdasarkan query pencarian
  const filteredFriends = friends.filter(f => {
    const q = searchQuery.toLowerCase();
    return (f.username || '').toLowerCase().includes(q) ||
      (f.nickname || '').toLowerCase().includes(q) ||
      (f.fullname || '').toLowerCase().includes(q);
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogOverlay className="bg-black/90 backdrop-blur-md" />
      <DialogContent className="bg-[#06080d] border border-[#2d6af2]/30 text-white p-6 max-w-[500px] rounded-[1.5rem] shadow-[0_0_50px_rgba(45,106,242,0.15)] overflow-hidden">
        {/* Garis aksen biru di atas */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-[60%] bg-gradient-to-r from-transparent via-[#2d6af2] to-transparent shadow-[0_0_15px_#2d6af2]"></div>

        {/* Tombol tutup */}
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors">
          <X size={20} />
        </button>

        <DialogTitle className="sr-only">
          {t('host_lobby.invite_friends') ?? 'Invite Friends'}
        </DialogTitle>

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-5 mt-2">
          <UserPlus className="text-[#2d6af2] w-6 h-6" />
          <h2 className="text-xl font-display font-bold uppercase tracking-[0.10em] text-[#2d6af2]">
            Invite Friends
          </h2>
        </div>

        {/* ── Input pencarian ── */}
        <div className="relative mb-5">
          <input
            type="text"
            placeholder="Find a friend..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-transparent border border-white/20 rounded-xl py-3 px-4 text-sm font-display outline-none focus:border-[#2d6af2]/80 text-white placeholder:text-white/40 transition-all"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
            <Search size={18} />
          </div>
        </div>

        {/* ── Daftar teman ── */}
        <div className="flex flex-col gap-3 max-h-[320px] overflow-y-auto custom-scrollbar pr-2">
          {isLoading ? (
            /* Loading spinner */
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#2d6af2]/30 border-t-[#2d6af2] rounded-full animate-spin mb-4"></div>
              <p className="text-white/40 text-xs font-display tracking-widest uppercase">Loading friends...</p>
            </div>
          ) : filteredFriends.length === 0 ? (
            /* Tidak ada teman ditemukan */
            <div className="flex flex-col items-center justify-center py-12">
              <UserPlus size={40} className="text-white/10 mb-4" />
              <p className="text-white/30 text-xs font-display tracking-widest uppercase">
                {searchQuery ? 'No friends found' : 'No mutual friends yet'}
              </p>
            </div>
          ) : (
            /* List teman */
            filteredFriends.map(friend => {
              const displayName = friend.nickname || friend.fullname || friend.username || '?';
              const isInvited = invitedFriends.includes(friend.id);
              return (
                <div key={friend.id} className="flex items-center justify-between bg-[#11131a] border border-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full border border-[#2d6af2]/30 bg-black/40 overflow-hidden flex items-center justify-center shrink-0">
                      {friend.avatar_url ? (
                        <img src={friend.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <InitialsAvatar name={displayName} size="sm" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-[14px] text-white tracking-wide">{displayName}</h3>
                      <p className="text-white/40 text-[11px] font-mono">@{friend.username}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => !isInvited && onInvite(friend.id)}
                    disabled={isInvited}
                    className={`font-display font-bold uppercase text-xs tracking-widest px-5 h-9 rounded-lg shadow-none transition-all disabled:opacity-100 ${
                      isInvited
                        ? 'bg-[#1a2240] text-[#4f6190]'
                        : 'bg-[#2d6af2] hover:bg-[#2555cc] text-white'
                    }`}
                  >
                    {isInvited ? 'Invited' : 'Invite'}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
