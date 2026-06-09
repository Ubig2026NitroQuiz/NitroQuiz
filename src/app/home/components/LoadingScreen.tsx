/**
 * ============================================================================
 *  KOMPONEN: LOADING SCREEN
 * ============================================================================
 *
 *  Layar loading yang ditampilkan saat:
 *  - Data autentikasi sedang dimuat (authLoading)
 *  - Pengguna sedang diarahkan ke halaman host (isHosting)
 *  - Redirect otomatis sedang berlangsung (isRedirecting)
 *
 *  Menampilkan spinner animasi dengan teks "Loading..." yang diterjemahkan.
 * ============================================================================
 */

import React from "react";

interface LoadingScreenProps {
    /** Fungsi terjemahan i18n */
    t: (key: string) => string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ t }) => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-[#04060f] relative overflow-hidden font-body text-white">
            <div className="racing-stripe"></div>
            <div className="text-center z-10">
                {/* Spinner animasi */}
                <div className="w-14 h-14 border-[3px] border-white/10 border-t-[#7C3AED] rounded-full animate-spin mx-auto mb-6"></div>
                {/* Teks loading */}
                <p className="mt-4 text-white/60 text-sm tracking-[0.3em] uppercase font-body">
                    {/* {t('homepage.loading')} */}
                    Loading...
                </p>
            </div>
        </div>
    );
};
