/**
 * ============================================================================
 *  KOMPONEN: MAIN CONTENT (KONTEN UTAMA)
 * ============================================================================
 *
 *  Area konten utama halaman beranda yang berisi:
 *  - Logo NitroQuiz + tagline (RACE · LEARN · DOMINATE)
 *  - Kartu HOST untuk membuat permainan baru
 *  - Kartu JOIN untuk bergabung ke room yang sudah ada
 *    (termasuk input kode room, tombol scan QR, dan tombol join)
 * ============================================================================
 */

import React from "react";
import { Flag, PlayCircle, QrCode } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { TAGLINE_WORDS } from "../constants";

interface MainContentProps {
    /** Fungsi terjemahan i18n */
    t: (key: string) => string;
    /** Kode room yang diketik pengguna */
    roomCode: string;
    /** Setter untuk mengubah kode room */
    setRoomCode: (val: string) => void;
    /** Handler tombol HOST */
    handleHost: () => void;
    /** Handler tombol JOIN */
    handleJoin: () => void;
    /** Handler buka modal scan QR */
    onOpenScan: () => void;
}

export const MainContent: React.FC<MainContentProps> = ({
    t, roomCode, setRoomCode, handleHost, handleJoin, onOpenScan,
}) => {
    return (
        <main className="relative z-20 flex flex-col items-center justify-center flex-1 w-full max-w-5xl mx-auto p-4 md:p-6">
            <header className="text-center mb-6 md:mb-10 relative z-30 w-full flex flex-col items-center">
                {/* Logo utama NitroQuiz */}
                <motion.div
                    initial={{ opacity: 0, y: -15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative"
                >
                    <Image
                        src="/assets/logo/logo1.png"
                        alt="NitroQuiz Logo"
                        width={500}
                        height={150}
                        className="object-contain w-[65vw] max-w-[280px] md:w-[320px] md:max-w-none drop-shadow-[0_0_30px_rgba(124,58,237,0.4)] group-hover:drop-shadow-[0_0_40px_rgba(124,58,237,0.6)] transition-all duration-500 scale-95 group-hover:scale-100"
                        priority
                    />
                </motion.div>

                {/* Tagline: RACE · LEARN · DOMINATE */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="mt-3 md:mt-4 flex items-center justify-center gap-3 md:gap-4"
                >
                    {TAGLINE_WORDS.map((item, idx) => (
                        <div key={item.word} className="flex items-center gap-3 md:gap-4">
                            <span
                                className="font-body text-[10px] sm:text-xs md:text-sm font-bold tracking-[0.25em] uppercase transition-all duration-300 cursor-default hover:tracking-[0.35em]"
                                style={{ color: item.color }}
                            >
                                {item.word}
                            </span>
                            {idx < 2 && (
                                <div className="w-[3px] h-[3px] rounded-full bg-white/20" />
                            )}
                        </div>
                    ))}
                </motion.div>
            </header>

            {/* ── Kartu HOST & JOIN ──────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="flex flex-col landscape:flex-row md:flex-row gap-4 lg:gap-6 w-full justify-center items-stretch max-w-5xl px-4 md:px-0"
            >
                {/* ── KARTU HOST ─────────────────────────────────────── */}
                <div className="host-card race-card flex-1 flex flex-col p-6 md:p-8 relative group">
                    <div className="motion-texture"></div>
                    <div className="laser-edge text-[#7C3AED]"></div>
                    <div className="checkered-tag"></div>

                    <div className="relative z-10 flex flex-col">
                        {/* Header kartu: ikon + judul */}
                        <div className="mb-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 flex items-center justify-center bg-[#7C3AED]/10 text-[#a78bfa] border border-[#7C3AED]/20">
                                    <Flag className="w-5 h-5" />
                                </div>
                                <div className="flex items-baseline gap-4">
                                    <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter text-white uppercase leading-none whitespace-nowrap">
                                        {t('homepage.host.title')}
                                    </h2>
                                    <p className="text-white/40 text-[10px] font-bold tracking-[0.1em] leading-none uppercase hidden sm:block">
                                        {t('homepage.host.subtitle')}
                                    </p>
                                </div>
                            </div>
                            {/* Garis dekoratif di bawah judul */}
                            <div className="flex items-center gap-6 mt-1">
                                <div className="h-0.5 w-12 bg-[#7C3AED] group-hover:w-20 transition-all duration-500"></div>
                                <div className="flex gap-1">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className={`h-1 w-4 ${i < 3 ? 'bg-[#7C3AED]' : 'bg-white/10'}`}></div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Tombol HOST */}
                        <div className="mb-4">
                            <motion.button
                                animate={{
                                    boxShadow: ["0 0 10px rgba(124,58,237,0.3)", "0 0 25px rgba(124,58,237,0.6)", "0 0 10px rgba(124,58,237,0.3)"],
                                }}
                                transition={{
                                    boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                                }}
                                onClick={handleHost}
                                className="w-full xl:w-auto px-6 py-3.5 bg-gradient-to-r from-[#7C3AED] to-[#5b21b6] border border-white/20 rounded-sm transform -skew-x-[15deg] transition-all duration-300 relative group/btn overflow-hidden whitespace-nowrap"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-1000 ease-in-out"></div>
                                <div className="relative z-10 flex items-center justify-center transform skew-x-[15deg] transition-transform duration-300">
                                    <span className="text-lg font-black text-white uppercase tracking-[0.15em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                                        {t('homepage.host.button')}
                                    </span>
                                </div>
                            </motion.button>
                        </div>
                    </div>
                </div>

                {/* ── KARTU JOIN ──────────────────────────────────────── */}
                <div className="join-card race-card flex-1 flex flex-col p-6 md:p-8 relative group">
                    <div className="motion-texture"></div>
                    <div className="laser-edge text-[#2d6af2]"></div>
                    <div className="checkered-tag"></div>

                    <div className="relative z-10 flex flex-col">
                        {/* Header kartu: ikon + judul + tombol QR (mobile) */}
                        <div className="mb-2 sm:mb-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 flex items-center justify-center bg-[#2d6af2]/10 text-[#5a9cff] border border-[#2d6af2]/20">
                                    <PlayCircle className="w-5 h-5" />
                                </div>
                                <div className="flex items-baseline gap-4 flex-1">
                                    <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter text-white uppercase leading-none whitespace-nowrap">
                                        {t('homepage.join.title')}
                                    </h2>
                                    <p className="text-white/40 text-[10px] font-bold tracking-[0.1em] leading-none uppercase hidden sm:block">
                                        {t('homepage.join.subtitle')}
                                    </p>
                                </div>
                            </div>
                            {/* Garis dekoratif di bawah judul */}
                            <div className="mt-1 h-0.5 w-12 bg-[#2d6af2] group-hover:w-20 transition-all duration-500"></div>
                        </div>

                        {/* Input Kode Room + Tombol Join */}
                        <div className="flex flex-row items-end gap-2 sm:gap-4">
                            {/* Field input kode room */}
                            <div className="flex-1 relative h-[58px] transform -skew-x-[15deg] bg-white/[0.03] border border-white/20 focus-within:border-[#2d6af2] focus-within:bg-[#2d6af2]/10 transition-all duration-300 flex items-center mb-0.5 rounded-sm">
                                <input
                                    className="w-full h-full bg-transparent text-white font-bold text-lg pl-4 pr-12 sm:pr-16 focus:outline-none placeholder:text-[9px] sm:placeholder:text-[10px] placeholder:font-bold uppercase tracking-[0.3em] placeholder:text-white/20 text-center transform skew-x-[15deg]"
                                    maxLength={6}
                                    placeholder={t('homepage.join.placeholder')}
                                    type="text"
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                                />
                                {/* Tombol scan QR di dalam input */}
                                <div className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 transform skew-x-[15deg] block">
                                    <button
                                        onClick={onOpenScan}
                                        className="p-1.5 px-3 bg-[#2d6af2]/15 border border-[#2d6af2]/30 text-[#5a9cff] hover:bg-[#2d6af2]/30 hover:border-[#2d6af2]/60 hover:text-white rounded-sm transition-all duration-300 group flex items-center justify-center transform -skew-x-[15deg] shadow-[0_0_10px_rgba(45,106,242,0.15)] hover:shadow-[0_0_15px_rgba(45,106,242,0.3)]"
                                        title="Scan QR Code"
                                    >
                                        <div className="transform skew-x-[15deg]">
                                            <QrCode className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Tombol JOIN */}
                            <motion.button
                                animate={{
                                    boxShadow: ["0 0 10px rgba(45,106,242,0.3)", "0 0 25px rgba(45,106,242,0.6)", "0 0 10px rgba(45,106,242,0.3)"],
                                }}
                                transition={{
                                    boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                                }}
                                onClick={handleJoin}
                                className="w-auto px-5 sm:px-8 py-3 bg-gradient-to-r from-[#2d6af2] to-[#1e40af] border border-white/20 rounded-sm transform -skew-x-[15deg] transition-all duration-300 relative group/btn overflow-hidden whitespace-nowrap h-[58px] mb-0.5"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-1000 ease-in-out"></div>
                                <div className="relative z-10 flex items-center justify-center transform skew-x-[15deg] transition-transform duration-300">
                                    <span className="text-base font-black text-white uppercase tracking-[0.15em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                                        {t('homepage.join.button')}
                                    </span>
                                </div>
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </main>
    );
};
