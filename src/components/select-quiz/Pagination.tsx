"use client";

/**
 * Pagination.tsx
 * ──────────────
 * Komponen paginasi untuk navigasi antar halaman kuis.
 * Menampilkan tombol Previous, indikator halaman, dan tombol Next.
 * Hanya ditampilkan jika total halaman lebih dari 1.
 *
 * Props:
 * - currentPage: halaman saat ini
 * - totalPages: total jumlah halaman
 * - isDisabled: apakah navigasi halaman dinonaktifkan
 * - onPageChange: fungsi saat halaman berubah
 */

import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  isDisabled: boolean;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  isDisabled,
  onPageChange,
}: PaginationProps) {
  const { t } = useTranslation();

  // Jangan tampilkan jika hanya 1 halaman
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center mt-6 mb-2 gap-2 flex-shrink-0">
      {/* Tombol halaman sebelumnya */}
      <Button
        variant="outline"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1 || isDisabled}
        className="h-8 px-3 bg-white/[0.03] border border-[#2d6af2]/30 text-white font-display text-[9px] disabled:opacity-30 hover:bg-[#2d6af2]/20 hover:border-[#00ff9d] transition-all uppercase tracking-wider"
      >
        {t('select_quiz.pagination.prev')}
      </Button>

      {/* Indikator halaman saat ini */}
      <div className="flex items-center px-4 bg-[#2d6af2]/15 border border-[#2d6af2]/30 rounded-md text-[#00ff9d] font-display text-[9px]">
        {t('select_quiz.pagination.page')} {currentPage} / {totalPages}
      </div>

      {/* Tombol halaman berikutnya */}
      <Button
        variant="outline"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages || isDisabled}
        className="h-8 px-3 bg-white/[0.03] border border-[#2d6af2]/30 text-white font-display text-[9px] disabled:opacity-30 hover:bg-[#2d6af2]/20 hover:border-[#00ff9d] transition-all uppercase tracking-wider"
      >
        {t('select_quiz.pagination.next')}
      </Button>
    </div>
  );
}
