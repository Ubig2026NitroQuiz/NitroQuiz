"use client";

/**
 * LogoutConfirmDialog.tsx
 * ───────────────────────
 * Dialog konfirmasi keluar dari waiting room.
 */

import { LogOut } from "lucide-react";
import { motion } from "framer-motion";

interface LogoutConfirmDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
  t: (key: string) => string;
}

export default function LogoutConfirmDialog({ onConfirm, onCancel, t }: LogoutConfirmDialogProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-[#0c1225] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl overflow-hidden relative"
      >
        {/* Garis aksen merah di atas */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />

        <div className="flex flex-col items-center text-center">
          {/* Ikon */}
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
            <LogOut className="w-8 h-8 text-red-500" />
          </div>

          {/* Judul & deskripsi */}
          <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">
            {t("player_waiting.exit_title")}
          </h3>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            {t("player_waiting.exit_description")}
          </p>

          {/* Tombol aksi */}
          <div className="flex gap-4 w-full">
            <button
              onClick={onCancel}
              className="flex-1 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all outline-none"
            >
              {t("player_waiting.exit_cancel")}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest bg-red-600 text-white hover:bg-red-500 transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] outline-none"
            >
              {t("player_waiting.exit_confirm")}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
