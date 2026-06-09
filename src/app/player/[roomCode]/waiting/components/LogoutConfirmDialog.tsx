import React from 'react';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';

export const LogoutConfirmDialog = ({ onConfirm, onCancel, t }: { onConfirm: () => void, onCancel: () => void, t: any }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
        <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-[#0b0811]/95 border border-red-500/20 border-t-4 border-t-red-600 p-0 overflow-hidden rounded-sm max-w-sm w-full shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_40px_rgba(220,38,38,0.2)] backdrop-blur-2xl"
        >
            <div className="p-8">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 flex items-center justify-center rounded-sm transform -skew-x-[10deg] shadow-[inset_0_0_15px_rgba(220,38,38,0.2)] mb-4">
                        <LogOut className="w-6 h-6 text-red-500 scale-x-[-1] transform skew-x-[10deg]" />
                    </div>
                    <h3 className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-white to-red-200 font-display font-black italic uppercase tracking-wider text-center drop-shadow-[0_0_10px_rgba(220,38,38,0.6)]">
                        {t("player_waiting.exit_title")}
                    </h3>
                </div>
                
                <p className="text-center text-red-500/70 font-display font-bold text-[10px] tracking-[0.2em] mb-8 uppercase border border-red-500/20 bg-[#1a0a10] p-4 rounded-sm shadow-inner">
                    {t("player_waiting.exit_description")}
                </p>
                
                <div className="flex gap-4 w-full">
                    <button
                        onClick={onCancel}
                        className="group/btn relative flex-1 flex items-center justify-center bg-[#0f142b] border border-white/5 text-white/40 hover:bg-white/10 hover:border-white/20 hover:text-white font-display font-black text-[11px] uppercase tracking-widest h-12 transform -skew-x-[15deg] transition-all overflow-hidden outline-none"
                    >
                        <div className="absolute inset-0 bg-white/5 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                        <div className="transform skew-x-[15deg] relative z-10">{t("player_waiting.exit_cancel")}</div>
                    </button>
                    <button
                        onClick={onConfirm}
                        className="group/btn relative flex-1 flex items-center justify-center bg-red-600/20 border border-red-500 text-red-500 hover:bg-red-600 hover:text-white font-display font-black text-[11px] uppercase tracking-widest h-12 transform -skew-x-[15deg] transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] outline-none overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                        <div className="transform skew-x-[15deg] relative z-10">{t("player_waiting.exit_confirm")}</div>
                    </button>
                </div>
            </div>
        </motion.div>
    </motion.div>
);
