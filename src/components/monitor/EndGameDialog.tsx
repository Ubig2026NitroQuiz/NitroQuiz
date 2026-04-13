"use client";

/**
 * EndGameDialog.tsx
 * ─────────────────
 * Dialog konfirmasi untuk mengakhiri permainan.
 * Menampilkan ikon bendera, peringatan, dan tombol batal/konfirmasi.
 *
 * Props:
 * - isOpen: mengontrol visibilitas dialog
 * - onClose: fungsi menutup dialog
 * - onConfirm: fungsi saat konfirmasi end race
 */

import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogOverlay } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";

interface EndGameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function EndGameDialog({ isOpen, onClose, onConfirm }: EndGameDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="bg-black/90 backdrop-blur-md" />
      <DialogContent className="bg-[#11111a] border border-red-500/30 text-white p-8 max-w-sm rounded-[2rem] shadow-[0_0_100px_rgba(239,68,68,0.2)]">
        <div className="flex flex-col items-center">
          {/* Ikon bendera */}
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
            <Flag size={32} className="text-red-500" />
          </div>

          {/* Judul */}
          <DialogTitle className="text-2xl font-body font-bold uppercase tracking-[0.15em] text-center mb-2">
            {t('host_monitor.end_game_title')}
          </DialogTitle>

          {/* Deskripsi */}
          <p className="text-white/60 text-sm text-center font-body tracking-wider mb-8">
            {t('host_monitor.end_game_desc')}
          </p>

          {/* Tombol aksi */}
          <div className="flex gap-4 w-full">
            <Button
              onClick={onClose}
              variant="ghost"
              className="flex-1 border border-white/10 h-12 rounded-xl font-body font-bold uppercase text-xs tracking-widest text-gray-400 hover:bg-white/5 hover:text-white"
            >
              {t('host_lobby.cancel')}
            </Button>
            <Button
              onClick={() => { onClose(); onConfirm(); }}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white h-12 rounded-xl font-body font-bold uppercase text-xs tracking-widest shadow-[0_5px_15px_rgba(239,68,68,0.3)] transition-all hover:scale-105 active:scale-95"
            >
              {t('host_monitor.confirm_end')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
