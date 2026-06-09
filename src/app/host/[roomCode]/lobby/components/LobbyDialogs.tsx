/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KOMPONEN: LobbyDialogs
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Kumpulan semua dialog/modal yang digunakan di halaman lobby host.
 *
 * Dialog yang tersedia:
 * 1. KickDialog        → Konfirmasi mengeluarkan pemain dari sesi
 * 2. ExitDialog        → Konfirmasi keluar dari lobby (kembali ke select-quiz)
 * 3. QrFullscreen      → QR code dalam tampilan layar penuh
 * 4. InviteGroupDialog → Dialog undangan grup dengan pencarian
 * 5. InviteFriendDialog→ Dialog undangan teman dengan pencarian
 * 6. InviteToast       → Notifikasi toast saat undangan berhasil dikirim
 *
 * CATATAN: Semua dialog menggunakan komponen Dialog dari Radix UI
 * dengan styling cyberpunk yang konsisten.
 */

import { X, Check, LogOut, UserPlus, Users, Users2, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogOverlay,
} from "@/components/ui/dialog";
import { InitialsAvatar } from "./InitialsAvatar";
import type { Participant, FriendProfile, UserGroup } from "../types";

// ═══════════════════════════════════════════════════════════════════════════
// 1. DIALOG KICK PEMAIN
// ═══════════════════════════════════════════════════════════════════════════

interface KickDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPlayer: Participant | null;
  onConfirmKick: () => void;
  t: (key: string) => string;
}

/**
 * Dialog konfirmasi untuk mengeluarkan (kick) pemain dari sesi.
 * Menampilkan nama pemain yang akan di-kick.
 */
export function KickDialog({
  open,
  onOpenChange,
  selectedPlayer,
  onConfirmKick,
  t,
}: KickDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/80 backdrop-blur-sm" />
      <DialogContent className="bg-[#0a0a0f] border-2 border-red-500/40 text-white p-8 max-w-sm rounded-none shadow-[0_0_50px_rgba(239,68,68,0.2)] transform -skew-x-[2deg]">
        <div className="transform skew-x-[2deg]">
          <DialogTitle className="text-2xl font-display font-black uppercase tracking-[0.10em] text-center mb-8 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
            {t("host_lobby.kick")} {selectedPlayer?.nickname}?
          </DialogTitle>
          <div className="flex gap-4">
            {/* Tombol Batal */}
            <CyberButton
              onClick={() => onOpenChange(false)}
              variant="ghost"
              label={t("host_lobby.cancel") ?? "Cancel"}
            />
            {/* Tombol Konfirmasi Kick */}
            <CyberButton
              onClick={onConfirmKick}
              variant="danger"
              label="KICK"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. DIALOG KELUAR (EXIT)
// ═══════════════════════════════════════════════════════════════════════════

interface ExitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmExit: () => void;
  t: (key: string) => string;
}

/**
 * Dialog konfirmasi untuk keluar dari lobby.
 * Menampilkan ikon, judul, deskripsi, dan tombol konfirmasi.
 */
export function ExitDialog({
  open,
  onOpenChange,
  onConfirmExit,
  t,
}: ExitDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/80 backdrop-blur-sm" />
      <DialogContent className="bg-[#0a0a0f] border-2 border-red-500/40 text-white p-8 max-w-sm rounded-none shadow-[0_0_50px_rgba(239,68,68,0.2)] transform -skew-x-[2deg]">
        <div className="transform skew-x-[2deg] flex flex-col items-center">
          {/* Ikon keluar */}
          <div className="w-16 h-16 bg-red-500/10 rounded-sm flex items-center justify-center mb-6 border border-red-500/20 transform -skew-x-[15deg]">
            <div className="transform skew-x-[15deg]">
              <LogOut size={32} className="text-red-500" />
            </div>
          </div>

          <DialogTitle className="text-2xl font-display font-black uppercase tracking-[0.15em] text-center mb-2 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
            {t("host_lobby.exit_dialog_title")}
          </DialogTitle>

          <p className="text-white/60 text-xs text-center font-display tracking-widest mb-10 uppercase leading-relaxed">
            {t("host_lobby.exit_dialog_desc")}
          </p>

          <div className="flex gap-4 w-full">
            {/* Tombol Batal */}
            <CyberButton
              onClick={() => onOpenChange(false)}
              variant="ghost"
              label={t("host_lobby.cancel")}
            />
            {/* Tombol Konfirmasi Keluar */}
            <CyberButton
              onClick={onConfirmExit}
              variant="danger"
              label={t("host_lobby.confirm_exit")}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. QR CODE FULLSCREEN
// ═══════════════════════════════════════════════════════════════════════════

interface QrFullscreenProps {
  open: boolean;
  joinLink: string;
  onClose: () => void;
}

/**
 * Tampilan QR code layar penuh.
 * Klik area di luar QR untuk menutup.
 */
export function QrFullscreen({ open, joinLink, onClose }: QrFullscreenProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] bg-black flex items-center justify-center cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 shadow-[0_0_80px_rgba(255,255,255,0.15)] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <QRCode
          value={joinLink}
          style={{ width: "min(80vw, 80vh)", height: "auto", maxWidth: 500 }}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. DIALOG UNDANG GRUP
// ═══════════════════════════════════════════════════════════════════════════

interface InviteGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  loading: boolean;
  filteredGroups: UserGroup[];
  invitedGroups: string[];
  onInviteGroup: (groupId: string) => void;
  t: (key: string) => string;
}

/**
 * Dialog untuk mengundang seluruh anggota grup ke sesi game.
 * Hanya owner/admin grup yang dapat mengirim undangan.
 */
export function InviteGroupDialog({
  open,
  onOpenChange,
  searchQuery,
  onSearchChange,
  loading,
  filteredGroups,
  invitedGroups,
  onInviteGroup,
  t,
}: InviteGroupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/80 backdrop-blur-sm" />
      <DialogContent className="bg-[#0a0a0f] border-2 border-[#00e5ff]/40 text-white p-6 max-w-[480px] rounded-none shadow-[0_0_50px_rgba(0,229,255,0.15)] overflow-hidden transform -skew-x-[2deg]">
        <div className="transform skew-x-[2deg]">
          {/* Tombol Tutup */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>

          {/* Judul (untuk screen reader) */}
          <DialogTitle className="sr-only">
            {t("host_lobby.invite_groups") ?? "Invite Group"}
          </DialogTitle>

          {/* Header */}
          <div className="flex items-center gap-2.5 mb-7 mt-2">
            <div className="p-2 border border-[#00e5ff]/30 rounded-sm transform -skew-x-[12deg] bg-[#00e5ff]/5">
              <Users2 className="text-[#00e5ff] w-6 h-6 transform skew-x-[12deg]" />
            </div>
            <h2 className="text-xl font-display font-black uppercase tracking-widest text-[#00e5ff] drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">
              INVITE GROUP
            </h2>
          </div>

          {/* Kotak Pencarian */}
          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Find a group..."
            accentColor="#00e5ff"
          />

          {/* Daftar Grup */}
          <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto custom-scrollbar pr-1.5 pt-1">
            {loading ? (
              <LoadingState
                label="SYNCING GROUPS..."
                accentColor="#00e5ff"
              />
            ) : filteredGroups.length === 0 ? (
              <EmptyInviteState
                icon={<Users2 size={40} className="text-white/5 mb-4" />}
                label={searchQuery ? "NO RESULTS" : "NO GROUPS"}
              />
            ) : (
              filteredGroups.map((group) => (
                <GroupItem
                  key={group.id}
                  group={group}
                  isInvited={invitedGroups.includes(group.id)}
                  onInvite={onInviteGroup}
                />
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. DIALOG UNDANG TEMAN
// ═══════════════════════════════════════════════════════════════════════════

interface InviteFriendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  loading: boolean;
  filteredFriends: FriendProfile[];
  invitedFriends: string[];
  onInviteFriend: (friendId: string) => void;
  t: (key: string) => string;
}

/**
 * Dialog untuk mengundang teman individual ke sesi game.
 * Menampilkan daftar teman mutual (saling follow).
 */
export function InviteFriendDialog({
  open,
  onOpenChange,
  searchQuery,
  onSearchChange,
  loading,
  filteredFriends,
  invitedFriends,
  onInviteFriend,
  t,
}: InviteFriendDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/80 backdrop-blur-sm" />
      <DialogContent className="bg-[#0a0a0f] border-2 border-[#2d6af2]/40 text-white p-6 max-w-[480px] rounded-none shadow-[0_0_50px_rgba(45,106,242,0.15)] overflow-hidden transform -skew-x-[2deg]">
        <div className="transform skew-x-[2deg]">
          {/* Tombol Tutup */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>

          {/* Judul (untuk screen reader) */}
          <DialogTitle className="sr-only">
            {t("host_lobby.invite_friends") ?? "Invite Friends"}
          </DialogTitle>

          {/* Header */}
          <div className="flex items-center gap-2.5 mb-7 mt-2">
            <div className="p-2 border border-[#2d6af2]/30 rounded-sm transform -skew-x-[12deg] bg-[#2d6af2]/5">
              <UserPlus className="text-[#2d6af2] w-6 h-6 transform skew-x-[12deg]" />
            </div>
            <h2 className="text-xl font-display font-black uppercase tracking-widest text-[#2d6af2] drop-shadow-[0_0_8px_rgba(45,106,242,0.4)]">
              INVITE FRIEND
            </h2>
          </div>

          {/* Kotak Pencarian */}
          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Find a friend..."
            accentColor="#2d6af2"
          />

          {/* Daftar Teman */}
          <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto custom-scrollbar pr-1.5 pt-1">
            {loading ? (
              <LoadingState
                label="ACCESSING NETWORK..."
                accentColor="#2d6af2"
              />
            ) : filteredFriends.length === 0 ? (
              <EmptyInviteState
                icon={<UserPlus size={40} className="text-white/5 mb-4" />}
                label={searchQuery ? "NO RESULTS" : "NO FRIENDS"}
              />
            ) : (
              filteredFriends.map((friend) => {
                const displayName =
                  friend.nickname ||
                  friend.fullname ||
                  friend.username ||
                  "?";
                return (
                  <FriendItem
                    key={friend.id}
                    friend={friend}
                    displayName={displayName}
                    isInvited={invitedFriends.includes(friend.id)}
                    onInvite={onInviteFriend}
                  />
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. TOAST NOTIFIKASI UNDANGAN
// ═══════════════════════════════════════════════════════════════════════════

interface InviteToastProps {
  visible: boolean;
}

/**
 * Toast notifikasi yang muncul di atas layar saat undangan berhasil dikirim.
 * Menggunakan AnimatePresence untuk animasi masuk/keluar.
 */
export function InviteToast({ visible }: InviteToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          className="fixed top-8 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none"
        >
          <div className="flex items-center gap-4 bg-[#0a0f16] border border-[#00ff9d]/40 rounded-2xl px-6 py-4 shadow-[0_0_50px_rgba(0,255,157,0.15)] min-w-[280px]">
            <div className="w-8 h-8 rounded-full border border-[#00ff9d] flex items-center justify-center bg-[#00ff9d]/10 shrink-0">
              <Check size={16} className="text-[#00ff9d]" />
            </div>
            <span className="font-display font-bold uppercase tracking-[0.2em] text-white text-sm mt-0.5">
              Invited
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// KOMPONEN PENDUKUNG INTERNAL
// ═══════════════════════════════════════════════════════════════════════════

// ── Kotak Pencarian dengan styling cyberpunk ──

function SearchInput({
  value,
  onChange,
  placeholder,
  accentColor,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  accentColor: string;
}) {
  return (
    <div className="relative mb-6 transform -skew-x-[8deg]">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#05070a] border border-white/10 rounded-none py-3.5 px-6 pr-12 text-sm font-display outline-none text-white placeholder:text-white/20 transition-all transform skew-x-[8deg]"
        style={{ borderColor: value ? `${accentColor}80` : undefined }}
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 transform skew-x-[8deg]">
        <Search size={18} />
      </div>
    </div>
  );
}

// ── State Loading untuk dialog undangan ──

function LoadingState({
  label,
  accentColor,
}: {
  label: string;
  accentColor: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div
        className="w-8 h-8 border-2 rounded-full animate-spin mb-4"
        style={{
          borderColor: `${accentColor}33`,
          borderTopColor: accentColor,
        }}
      />
      <p className="text-white/30 text-[10px] font-display tracking-[0.2em] uppercase">
        {label}
      </p>
    </div>
  );
}

// ── State Kosong untuk dialog undangan ──

function EmptyInviteState({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      {icon}
      <p className="text-white/20 text-[10px] font-display tracking-[0.2em] uppercase">
        {label}
      </p>
    </div>
  );
}

// ── Item Grup dalam daftar undangan ──

function GroupItem({
  group,
  isInvited,
  onInvite,
}: {
  group: UserGroup;
  isInvited: boolean;
  onInvite: (groupId: string) => void;
}) {
  const roleLower = group.role.toLowerCase();

  // Tentukan styling badge role
  const roleStyles =
    roleLower === "owner"
      ? "bg-yellow-500/10 border-yellow-500 text-yellow-500"
      : roleLower === "admin"
        ? "bg-[#00e5ff]/10 border-[#00e5ff] text-[#00e5ff]"
        : "bg-white/5 border-white/20 text-white/50";

  // Hanya owner & admin yang bisa mengundang
  const canInvite = roleLower === "owner" || roleLower === "admin";

  return (
    <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.04] rounded-sm p-4 hover:bg-[#00e5ff]/5 transition-colors group/gr transform -skew-x-[8deg] mb-1">
      <div className="flex flex-col gap-1.5 transform skew-x-[8deg]">
        <h3 className="font-display font-bold text-[15px] text-white tracking-wide group-hover/gr:text-[#00e5ff] transition-colors">
          {group.name}
        </h3>
        <div className="flex items-center gap-4">
          {/* Jumlah anggota */}
          <div className="flex items-center gap-1.5 text-[#00e5ff]/80 text-[11px] font-bold">
            <Users size={14} />
            <span className="font-mono">{group.membersCount}</span>
          </div>
          {/* Badge role */}
          <div
            className={`text-[10px] font-black px-2.5 py-0.5 rounded-sm border-l-2 tracking-widest uppercase ${roleStyles}`}
          >
            {group.role}
          </div>
        </div>
      </div>

      {/* Tombol undang (hanya untuk owner/admin) */}
      {canInvite && (
        <InviteButton
          isInvited={isInvited}
          onClick={() => !isInvited && onInvite(group.id)}
          accentColor="#00e5ff"
          textColor="black"
        />
      )}
    </div>
  );
}

// ── Item Teman dalam daftar undangan ──

function FriendItem({
  friend,
  displayName,
  isInvited,
  onInvite,
}: {
  friend: FriendProfile;
  displayName: string;
  isInvited: boolean;
  onInvite: (friendId: string) => void;
}) {
  return (
    <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.04] rounded-sm p-4 hover:bg-[#2d6af2]/5 transition-colors group/friend transform -skew-x-[8deg] mb-1">
      <div className="flex items-center gap-3 transform skew-x-[8deg]">
        {/* Avatar teman */}
        <div className="w-12 h-12 rounded-sm border-2 border-[#2d6af2]/30 bg-[#0a0f18] overflow-hidden flex items-center justify-center shrink-0 group-hover/friend:border-[#2d6af2]/60 transition-all transform -skew-x-[12deg]">
          <div className="transform skew-x-[12deg] w-full h-full">
            {friend.avatar_url ? (
              <img
                src={friend.avatar_url}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <InitialsAvatar name={displayName} size="sm" />
            )}
          </div>
        </div>
        {/* Info teman */}
        <div className="flex flex-col">
          <h3 className="font-display font-bold text-[14px] text-white tracking-wide">
            {displayName}
          </h3>
          <p className="text-white/30 text-[11px] font-mono leading-none mt-1">
            @{friend.username}
          </p>
        </div>
      </div>

      {/* Tombol undang */}
      <InviteButton
        isInvited={isInvited}
        onClick={() => !isInvited && onInvite(friend.id)}
        accentColor="#2d6af2"
        textColor="white"
      />
    </div>
  );
}

// ── Tombol Undang (dipakai di grup & teman) ──

function InviteButton({
  isInvited,
  onClick,
  accentColor,
  textColor,
}: {
  isInvited: boolean;
  onClick: () => void;
  accentColor: string;
  textColor: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isInvited}
      className={`group/btn flex items-center justify-center h-10 px-8 relative overflow-hidden transform -skew-x-[12deg] transition-all disabled:opacity-100 ${
        isInvited
          ? "bg-white/5 border border-white/10"
          : `bg-gradient-to-r border shadow-[0_5px_15px_${accentColor}4D]`
      }`}
      style={
        !isInvited
          ? {
              backgroundImage: `linear-gradient(to right, ${accentColor}, ${accentColor}CC)`,
              borderColor: `${accentColor}66`,
            }
          : undefined
      }
    >
      <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
      <span
        className={`relative z-10 font-display font-black uppercase text-[10px] tracking-widest transform skew-x-[12deg] ${
          isInvited ? "text-white/30" : `text-${textColor}`
        }`}
        style={!isInvited ? { color: textColor } : undefined}
      >
        {isInvited ? "INVITED" : "INVITE"}
      </span>
    </button>
  );
}

// ── Tombol Cyber untuk dialog (ghost / danger) ──

function CyberButton({
  onClick,
  variant,
  label,
}: {
  onClick: () => void;
  variant: "ghost" | "danger";
  label: string;
}) {
  const baseClass =
    variant === "danger"
      ? "bg-red-600 border border-red-400/50 shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:bg-red-500"
      : "border border-white/20 hover:bg-white/5";

  const textClass =
    variant === "danger"
      ? "text-white"
      : "text-gray-400 group-hover/btn:text-white";

  return (
    <button
      onClick={onClick}
      className={`group/btn flex-1 flex items-center justify-center h-11 relative overflow-hidden transform -skew-x-[15deg] transition-all ${baseClass}`}
    >
      <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
      <span
        className={`relative z-10 font-display font-black uppercase text-[10px] tracking-widest transform skew-x-[15deg] ${textClass}`}
      >
        {label}
      </span>
    </button>
  );
}
