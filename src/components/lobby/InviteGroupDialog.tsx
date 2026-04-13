"use client";

/**
 * InviteGroupDialog.tsx
 * ─────────────────────
 * Dialog untuk mengundang anggota grup ke room.
 * Hanya admin/owner dari grup yang dapat mengirim undangan.
 *
 * Props:
 * - isOpen: mengontrol visibilitas dialog
 * - onClose: fungsi menutup dialog
 * - groups: daftar grup pengguna
 * - isLoading: sedang memuat data grup
 * - searchQuery: query pencarian saat ini
 * - onSearchChange: fungsi saat pencarian berubah
 * - invitedGroups: daftar ID grup yang sudah diundang
 * - onInvite: fungsi untuk mengundang grup
 */

import { Users, Users2, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogOverlay } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";

interface InviteGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groups: any[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  invitedGroups: string[];
  onInvite: (groupId: string) => void;
}

/**
 * Menentukan style badge role berdasarkan peran pengguna di grup.
 */
function getRoleBadgeClass(role: string): string {
  const r = role.toLowerCase();
  if (r === 'owner') return 'border-yellow-500/80 text-yellow-500';
  if (r === 'admin') return 'border-[#00e5ff]/80 text-[#00e5ff]';
  return 'border-white/20 text-white/50';
}

export default function InviteGroupDialog({
  isOpen,
  onClose,
  groups,
  isLoading,
  searchQuery,
  onSearchChange,
  invitedGroups,
  onInvite,
}: InviteGroupDialogProps) {
  const { t } = useTranslation();

  // Filter grup berdasarkan nama
  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogOverlay className="bg-black/90 backdrop-blur-md" />
      <DialogContent className="bg-[#06080d] border border-[#00e5ff]/30 text-white p-6 max-w-[500px] rounded-[1.5rem] shadow-[0_0_50px_rgba(0,229,255,0.15)] overflow-hidden">
        {/* Garis aksen cyan di atas */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-[60%] bg-gradient-to-r from-transparent via-[#00e5ff] to-transparent shadow-[0_0_15px_#00e5ff]"></div>

        {/* Tombol tutup */}
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors">
          <X size={20} />
        </button>

        <DialogTitle className="sr-only">
          {t('host_lobby.invite_groups') ?? 'Invite Groups'}
        </DialogTitle>

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-5 mt-2">
          <Users2 className="text-[#00e5ff] w-6 h-6" />
          <h2 className="text-xl font-display font-bold uppercase tracking-[0.10em] text-[#00e5ff]">
            Invite Group
          </h2>
        </div>

        {/* ── Input pencarian ── */}
        <div className="relative mb-5">
          <input
            type="text"
            placeholder="Find a group..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-transparent border border-white/20 rounded-xl py-3 px-4 text-sm font-display outline-none focus:border-[#00e5ff]/80 text-white placeholder:text-white/40 transition-all"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
            <Search size={18} />
          </div>
        </div>

        {/* ── Daftar grup ── */}
        <div className="flex flex-col gap-3 max-h-[320px] overflow-y-auto custom-scrollbar pr-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#00e5ff]/30 border-t-[#00e5ff] rounded-full animate-spin mb-4"></div>
              <p className="text-white/40 text-xs font-display tracking-widest uppercase">Loading groups...</p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users2 size={40} className="text-white/10 mb-4" />
              <p className="text-white/30 text-xs font-display tracking-widest uppercase">
                {searchQuery ? 'No groups found' : 'No groups joined yet'}
              </p>
            </div>
          ) : (
            filteredGroups.map(group => {
              const isInvited = invitedGroups.includes(group.id);
              const canInvite = group.role.toLowerCase() === 'owner' || group.role.toLowerCase() === 'admin';
              return (
                <div key={group.id} className="flex items-center justify-between bg-[#11131a] border border-white/5 rounded-xl p-4">
                  <div>
                    <h3 className="font-display font-bold text-[15px] text-white mb-2 tracking-wide">{group.name}</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-[#00e5ff] text-xs">
                        <Users size={15} />
                        <span className="font-mono text-white/80 font-semibold">{group.membersCount}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border tracking-wide uppercase ${getRoleBadgeClass(group.role)}`}>
                        {group.role}
                      </span>
                    </div>
                  </div>
                  {canInvite && (
                    <Button
                      onClick={() => !isInvited && onInvite(group.id)}
                      disabled={isInvited}
                      className={`font-display font-bold uppercase text-xs tracking-widest px-5 h-9 rounded-lg shadow-none transition-all disabled:opacity-100 ${
                        isInvited
                          ? 'bg-[#1b323c] text-[#4f8190]'
                          : 'bg-[#00d0ff] hover:bg-[#00b8e6] text-white'
                      }`}
                    >
                      {isInvited ? 'Invited' : 'Invite'}
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
