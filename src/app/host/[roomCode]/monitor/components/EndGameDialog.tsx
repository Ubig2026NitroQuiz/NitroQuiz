/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KOMPONEN: EndGameDialog
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Dialog konfirmasi untuk mengakhiri game (End Race).
 * Menampilkan ikon bendera, judul, deskripsi, dan 2 tombol (batal/konfirmasi).
 *
 * Styling: Cyberpunk dengan border merah, clip-path, dan efek laser.
 */

import { Flag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// ═══════════════════════════════════════════════════════════════════════════
// TIPE PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface EndGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmEnd: () => void;
  t: (key: string) => string;
}

// ═══════════════════════════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════════════════

export function EndGameDialog({
  open,
  onOpenChange,
  onConfirmEnd,
  t,
}: EndGameDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/90 backdrop-blur-md" />
      <DialogContent
        className="bg-[#0a0e1a]/95 backdrop-blur-2xl border border-red-500/30 text-white p-0 max-w-sm shadow-[0_0_80px_rgba(239,68,68,0.15)] rounded-none overflow-hidden"
        style={{
          clipPath:
            "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)",
        }}
      >
        {/* Garis laser merah di atas */}
        <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-red-500 to-transparent" />

        <div className="flex flex-col items-center p-8">
          {/* Ikon bendera */}
          <div className="w-14 h-14 bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/25 transform -skew-x-[10deg]">
            <Flag
              size={28}
              className="text-red-500 transform skew-x-[10deg]"
            />
          </div>

          {/* Judul */}
          <DialogTitle className="text-xl font-display font-black uppercase tracking-[0.15em] text-center mb-2">
            {t("host_monitor.end_game_title")}
          </DialogTitle>

          {/* Deskripsi */}
          <p className="text-white/50 text-sm text-center font-display tracking-wider mb-8">
            {t("host_monitor.end_game_desc")}
          </p>

          {/* Tombol Aksi */}
          <div className="flex gap-4 w-full">
            {/* Tombol Batal */}
            <Button
              onClick={() => onOpenChange(false)}
              variant="ghost"
              className="flex-1 border border-white/10 h-11 font-display font-bold uppercase text-xs tracking-widest text-gray-400 hover:bg-white/5 hover:text-white transform -skew-x-[8deg] rounded-none"
            >
              <span className="transform skew-x-[8deg]">
                {t("host_lobby.cancel")}
              </span>
            </Button>

            {/* Tombol Konfirmasi End */}
            <Button
              onClick={() => {
                onOpenChange(false);
                onConfirmEnd();
              }}
              className="flex-1 h-11 font-display font-bold uppercase text-xs tracking-widest text-white transition-all active:scale-95 transform -skew-x-[8deg] rounded-none"
              style={{
                background: "linear-gradient(135deg, #ef4444, #b91c1c)",
                boxShadow: "0 5px 20px rgba(239,68,68,0.35)",
              }}
            >
              <span className="transform skew-x-[8deg]">
                {t("host_monitor.confirm_end")}
              </span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
