import React from 'react';
import { motion } from 'framer-motion';

export const MobileCharacterSelector = ({
    PLAYER_CHARACTERS,
    pendingCharacterId,
    setPendingCharacterId,
    assignedCarId,
    setIsSelectingCharacter,
    handleSelectCharacter,
    t
}: any) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-[100] bg-[#070d1c]/98 backdrop-blur-md flex flex-col items-center justify-center p-4"
        >
            <h2 className="font-display text-lg font-black text-white uppercase tracking-wider mb-6 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                {t("player_waiting.choose_racer")}
            </h2>
            <div className="flex gap-3 w-full max-w-[380px] justify-center">
                {PLAYER_CHARACTERS.map((c: any) => {
                    const isSel = pendingCharacterId === c.id;
                    return (
                        <div key={c.id} onClick={() => setPendingCharacterId(c.id)}
                            className={`relative flex flex-col items-center justify-center p-3 rounded-xl transition-all cursor-pointer flex-1 ${isSel ? 'bg-[#182136] border-2 border-[#e6fdff]' : 'bg-[#111726] border border-[#2d4060]'}`}
                            style={{
                                boxShadow: isSel ? '0 0 20px rgba(120,240,255,0.3), inset 0 0 15px rgba(120,240,255,0.1)' : 'none'
                            }}>
                            <div className="w-full mb-2 relative flex items-center justify-center" style={{ height: '80px' }}>
                                <img src={c.imageSrc} alt={c.name}
                                    className="w-full h-full object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]" />
                            </div>
                            <h3 className="font-display text-[10px] font-bold text-white uppercase tracking-[0.1em] text-center">
                                {c.name}
                            </h3>
                        </div>
                    );
                })}
            </div>
            <div className="flex gap-4 mt-6 w-full max-w-[320px]">
                <button onClick={() => { setIsSelectingCharacter(false); setPendingCharacterId(assignedCarId); }}
                    className="flex-1 py-3 rounded-xl font-display text-xs font-bold uppercase tracking-widest text-white bg-white/10 border border-white/20 hover:bg-white/20 transition-colors">
                    {t("player_waiting.back")}
                </button>
                <button onClick={handleSelectCharacter}
                    className="flex-1 py-3 rounded-xl font-display text-xs font-bold uppercase tracking-widest text-white bg-[#0fa8c4] hover:bg-[#0880b8] transition-colors shadow-[0_0_15px_rgba(15,168,196,0.4)]">
                    {t("player_waiting.select")}
                </button>
            </div>
        </motion.div>
    );
};
