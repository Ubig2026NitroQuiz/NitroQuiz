"use client";

/**
 * CancelDialog.tsx
 * ────────────────
 * Dialog konfirmasi pembatalan session.
 * Muncul saat host menekan tombol kembali.
 * Menghapus session dari kedua database jika dikonfirmasi.
 *
 * Props:
 * - isOpen: mengontrol visibilitas dialog
 * - onClose: fungsi untuk menutup dialog
 * - onConfirm: fungsi untuk mengeksekusi pembatalan
 * - isDeleting: apakah sedang proses menghapus
 */

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";

interface CancelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export default function CancelDialog({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: CancelDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* Overlay gelap dengan blur */}
      <DialogOverlay className="bg-black/80 backdrop-blur-sm fixed inset-0 z-50" />

      <DialogContent className="bg-[#04060f] border border-[#2d6af2]/50 p-0 overflow-hidden rounded-2xl max-w-sm shadow-[0_0_30px_rgba(45,106,242,0.2)]">
        {/* Garis aksen gradien di atas dialog */}
        <div className="h-1.5 bg-gradient-to-r from-[#1a45c4] to-[#00ff9d] w-full" />

        <div className="p-6">
          <DialogHeader>
            {/* Judul dialog */}
            <DialogTitle className="text-xl text-white font-display uppercase tracking-widest text-center drop-shadow-[0_0_10px_rgba(45,106,242,0.5)]">
              {t('room_settings.delete_dialog.title')}
            </DialogTitle>

            {/* Deskripsi/peringatan */}
            <DialogDescription className="text-center text-gray-400 font-display text-xs tracking-wider mt-4 uppercase">
              {t('room_settings.delete_dialog.description')}
            </DialogDescription>
          </DialogHeader>

          {/* ── Tombol aksi: Batal & Hapus ── */}
          <DialogFooter className="flex gap-3 mt-8">
            {/* Tombol batal */}
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 bg-transparent border border-white/10 text-gray-400 hover:bg-white/5 hover:text-white font-display text-xs uppercase tracking-wider h-12 rounded-xl transition-all"
            >
              {t('room_settings.delete_dialog.cancel')}
            </Button>

            {/* Tombol hapus session */}
            <Button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-400 hover:from-red-700 hover:to-red-500 text-white border-none font-display text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(239,68,68,0.4)] h-12 rounded-xl transition-all"
            >
              {isDeleting
                ? t('room_settings.delete_dialog.deleting')
                : t('room_settings.delete_dialog.delete')
              }
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
