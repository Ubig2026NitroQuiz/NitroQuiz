"use client";

/**
 * LogoutDialog.tsx
 * ────────────────
 * Dialog konfirmasi logout yang muncul saat pengguna memilih logout.
 * Menampilkan dua opsi:
 * - Batal: menutup dialog tanpa melakukan logout
 * - Konfirmasi: menjalankan proses logout
 *
 * Props:
 * - isOpen: mengontrol visibilitas dialog
 * - onClose: fungsi untuk menutup dialog (tombol batal)
 * - onConfirm: fungsi untuk mengeksekusi logout
 */

import { LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

interface LogoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LogoutDialog({ isOpen, onClose, onConfirm }: LogoutDialogProps) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-[#0c1020] border border-white/[0.08] rounded-2xl p-7 max-w-sm w-full shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden relative"
          >
            {/* Garis aksen gradien di atas dialog */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#7C3AED] to-transparent" />

            <div className="flex flex-col items-center text-center">
              {/* Ikon logout */}
              <div className="w-14 h-14 rounded-xl bg-[#7C3AED]/[0.08] flex items-center justify-center mb-5 border border-[#7C3AED]/15">
                <LogOut className="w-6 h-6 text-red-400" />
              </div>

              {/* Judul dialog */}
              <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-2">
                {t("homepage.logout_confirm.title")}
              </h3>

              {/* Deskripsi / pesan konfirmasi */}
              <p className="text-white/40 text-sm mb-7 leading-relaxed">
                {t("homepage.logout_confirm.description")}
              </p>

              {/* ── Tombol aksi: Batal & Konfirmasi ── */}
              <div className="flex gap-3 w-full">
                {/* Tombol batal */}
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest bg-white/[0.04] text-white/60 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition-all outline-none"
                >
                  {t("homepage.logout_confirm.cancel")}
                </button>

                {/* Tombol konfirmasi logout */}
                <button
                  onClick={onConfirm}
                  className="flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest bg-[#E10600] text-white hover:bg-red-500 transition-all shadow-[0_0_20px_rgba(225,6,0,0.2)] outline-none"
                >
                  {t("homepage.logout_confirm.confirm")}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
