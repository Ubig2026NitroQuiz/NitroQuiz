/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KOMPONEN: CancelSessionDialog
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Dialog konfirmasi untuk membatalkan sesi game.
 * Muncul saat user menekan tombol back atau logo kembali.
 */

"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogTitle,
} from "@/components/ui/dialog";

interface CancelSessionDialogProps {
    /** Apakah dialog terbuka */
    open: boolean;
    /** Callback untuk mengubah status buka/tutup dialog */
    onOpenChange: (open: boolean) => void;
    /** Callback saat user mengkonfirmasi pembatalan */
    onConfirmCancel: () => void;
    /** Sedang dalam proses penghapusan */
    isDeleting: boolean;
    /** Fungsi terjemahan */
    t: (key: string) => string;
}

export function CancelSessionDialog({
    open,
    onOpenChange,
    onConfirmCancel,
    isDeleting,
    t,
}: CancelSessionDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogOverlay className="bg-black/80 backdrop-blur-sm fixed inset-0 z-50" />
            <DialogContent className="bg-[#0b0811]/95 border border-red-500/20 border-t-4 border-t-red-600 p-0 overflow-hidden rounded-sm max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_40px_rgba(220,38,38,0.2)] backdrop-blur-2xl">
                <div className="p-8">
                    <DialogHeader>
                        {/* Judul dialog */}
                        <DialogTitle className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-white to-red-200 font-display font-black italic uppercase tracking-wider text-center drop-shadow-[0_0_10px_rgba(220,38,38,0.6)]">
                            {t('room_settings.delete_dialog.title')}
                        </DialogTitle>

                        {/* Deskripsi peringatan */}
                        <DialogDescription className="text-center text-red-500/70 font-display font-bold text-[10px] tracking-[0.2em] mt-5 uppercase border border-red-500/20 bg-[#1a0a10] p-4 rounded-sm shadow-inner">
                            {t('room_settings.delete_dialog.description')}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Tombol aksi */}
                    <DialogFooter className="flex gap-4 mt-8">
                        {/* Tombol Tetap di Halaman */}
                        <button
                            onClick={() => onOpenChange(false)}
                            disabled={isDeleting}
                            className="flex-1 bg-[#0f142b] border border-white/5 text-white/40 hover:bg-white/10 hover:border-white/20 hover:text-white font-display font-black text-[11px] uppercase tracking-widest h-12 transform -skew-x-[15deg] transition-all"
                        >
                            <div className="transform skew-x-[15deg]">
                                {t('room_settings.delete_dialog.cancel')}
                            </div>
                        </button>

                        {/* Tombol Hapus & Keluar */}
                        <button
                            onClick={onConfirmCancel}
                            disabled={isDeleting}
                            className="flex-1 bg-red-600/20 border border-red-500 text-red-500 hover:bg-red-600 hover:text-white font-display font-black text-[11px] uppercase tracking-widest h-12 transform -skew-x-[15deg] transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                        >
                            <div className="transform skew-x-[15deg]">
                                {isDeleting
                                    ? t('room_settings.delete_dialog.deleting')
                                    : t('room_settings.delete_dialog.delete')
                                }
                            </div>
                        </button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
