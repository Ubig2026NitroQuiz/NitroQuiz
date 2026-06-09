/**
 * ============================================================================
 *  FUNGSI UTILITAS — HALAMAN BERANDA (HOME)
 * ============================================================================
 *
 *  File ini berisi fungsi-fungsi pembantu (helper) yang digunakan
 *  oleh komponen-komponen halaman beranda.
 * ============================================================================
 */

import { AVATAR_COLORS } from './constants';

/**
 * Menghasilkan inisial dari nama pengguna.
 * Jika nama terdiri dari 2 kata atau lebih, ambil huruf pertama dari 2 kata pertama.
 * Jika hanya 1 kata, ambil 2 huruf pertama.
 */
export function getInitials(username: string): string {
    const words = username.trim().split(/\s+/);
    if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
    }
    return username.slice(0, 2).toUpperCase();
}

/**
 * Menghasilkan warna avatar berdasarkan hash nama pengguna.
 * Warna selalu konsisten untuk nama yang sama.
 */
export function getAvatarColor(username: string): string {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/**
 * Mengekstrak kode room dari teks hasil scan QR.
 * Mendukung format URL (misalnya https://domain.com/join/ABC123)
 * maupun teks biasa (langsung diambil 6 karakter pertama).
 */
export function extractRoomCodeFromScan(scannedText: string): string {
    try {
        const url = new URL(scannedText);
        const pathParts = url.pathname.split('/');
        if (pathParts.includes('join')) {
            const code = pathParts[pathParts.length - 1];
            return code.toUpperCase().slice(0, 6);
        }
        return scannedText.toUpperCase().slice(0, 6);
    } catch {
        return scannedText.toUpperCase().slice(0, 6);
    }
}
