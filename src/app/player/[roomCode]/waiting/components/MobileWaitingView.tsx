import React from 'react';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { InitialsAvatar } from './InitialsAvatar';

export const MobileWaitingView = ({
    participantCount,
    username,
    userAvatar,
    allParticipants,
    assignedChar,
    activeTooltip,
    setActiveTooltip,
    setIsExiting,
    setIsSelectingCharacter,
    t,
    PLAYER_CHARACTERS
}: any) => {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="md:hidden fixed inset-0 z-30 bg-[#04060f]/85 backdrop-blur-sm flex flex-col">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 pt-6 pb-3 flex-shrink-0">
                <img src="/assets/logo/logo1.png" alt="Logo" className="h-9 object-contain" />
            </div>

            {/* Players header */}
            <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(80,110,180,0.15)' }}>
                <div className="grid grid-cols-3 gap-0.5 flex-shrink-0">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="w-1 h-1 rounded-full bg-[#4a7cdc]" />
                    ))}
                </div>
                <span className="font-display text-white text-xs font-bold tracking-widest">
                    {t("player_waiting.player", { count: participantCount })}
                </span>
            </div>

            {/* Scrollable player cards grid */}
            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-3 auto-rows-max"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(45,106,242,0.25) transparent' }}>

                <div 
                    onClick={(e) => { e.stopPropagation(); setActiveTooltip(activeTooltip === username ? null : username); }}
                    className="group relative w-full cursor-pointer"
                    style={{ aspectRatio: '1/1.15' }}>
                    
                    <div className="absolute inset-0 bg-[#0a0e1a] border-t border-r border-[#7C3AED]/40 shadow-[inset_0_0_30px_rgba(124,58,237,0.05)]"
                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)' }}>
                        
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#b89aff] via-[#7C3AED] to-[#3a1a7a] z-10 shadow-[0_0_8px_#7C3AED]" />
                        <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(124,58,237,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.3) 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
                        
                        <div className="absolute top-2 left-3 z-20 w-6 h-6 rounded-full overflow-hidden border border-[#7C3AED]/60 shadow-[0_0_8px_rgba(124,58,237,0.4)] backdrop-blur-md bg-black/50">
                            {userAvatar ? (
                                <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <InitialsAvatar name={username} size="sm" />
                            )}
                        </div>

                        <div className="absolute top-2 right-2 z-20">
                            <div className="font-display font-black text-[8px] tracking-[0.15em] px-2 py-0.5 transform -skew-x-[12deg] shadow-[0_0_10px_rgba(124,58,237,0.5)] border border-[#a78bfa]/50"
                                style={{ background: 'linear-gradient(90deg, #7C3AED, #5b21b6)', color: '#fff' }}>
                                <span className="block transform skew-x-[12deg]">{t("player_waiting.you")}</span>
                            </div>
                        </div>

                        <div className="absolute inset-x-0 top-6 bottom-10 flex items-center justify-center p-2 z-10 w-full h-auto">
                            <img src={assignedChar.imageSrc} alt="car"
                                className="w-full h-full object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)] filter contrast-[1.1] brightness-[1.05]" />
                        </div>

                        <div className="absolute bottom-0 inset-x-0 z-20 h-[40px] bg-gradient-to-t from-[#04060f] to-transparent flex flex-col justify-end px-2 pb-1.5 pt-4">
                            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#7C3AED]/0 via-[#7C3AED] to-[#7C3AED]/0" />
                            <p className="font-display text-white text-[10px] font-black tracking-[0.15em] truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-none mb-0.5">
                                {username}
                            </p>
                            <div className="flex justify-between items-center">
                                <p className="font-display text-[#a78bfa] text-[7px] tracking-[0.2em] uppercase opacity-90 leading-none truncate pr-1">
                                    {assignedChar.name}
                                </p>
                                <div className="flex gap-[2px]">
                                    <div className="w-[2px] h-[5px] bg-[#7C3AED]/60 transform -skew-x-[20deg]" />
                                    <div className="w-[2px] h-[5px] bg-[#7C3AED]/80 transform -skew-x-[20deg]" />
                                    <div className="w-[2px] h-[5px] bg-white shadow-[0_0_5px_#fff] transform -skew-x-[20deg]" />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-[999] pointer-events-none bg-[#0c1020]/95 backdrop-blur-xl text-white border border-[#2d6af2]/80 font-display text-sm px-4 py-2 shadow-[0_0_30px_rgba(45,106,242,0.8)] rounded-md whitespace-nowrap scale-95 ${activeTooltip === username ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100 group-hover:scale-100'}`}>
                        {username}
                    </div>
                </div>

                {/* Other players */}
                {allParticipants.filter((p: any) => p.nickname !== username).map((p: any, i: number) => {
                    const charObj = PLAYER_CHARACTERS.find((c: any) => c.id === (p.car_character || "").replace("-bot", "")) || PLAYER_CHARACTERS[0];
                    return (
                        <div key={i} 
                            onClick={(e) => { e.stopPropagation(); setActiveTooltip(activeTooltip === p.nickname ? null : p.nickname); }}
                            className="group relative w-full cursor-pointer"
                            style={{ aspectRatio: '1/1.15' }}>
                            
                            <div className="absolute inset-0 bg-[#0a0e1a]/80 border-t border-r border-[#2d6af2]/30 shadow-[inset_0_0_30px_rgba(45,106,242,0.05)]"
                                style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)' }}>
                                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#5a9cff] via-[#2d6af2] to-[#123075] z-10 shadow-[0_0_8px_#2d6af2] opacity-80" />
                                <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(45,106,242,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(45,106,242,0.3) 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
                                
                                <div className="absolute top-2 left-3 z-20 w-6 h-6 rounded-full overflow-hidden border border-[#2d6af2]/50 shadow-[0_0_6px_rgba(45,106,242,0.3)] backdrop-blur-md bg-black/50">
                                    {p.avatar_url ? (
                                        <img src={p.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <InitialsAvatar name={p.nickname} size="sm" />
                                    )}
                                </div>

                                <div className="absolute inset-x-0 top-6 bottom-10 flex items-center justify-center p-2 z-10 w-full h-auto">
                                    <img src={charObj.imageSrc} alt="car" className="w-full h-full object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.8)] filter brightness-[0.95]" />
                                </div>

                                <div className="absolute bottom-0 inset-x-0 z-20 h-[40px] bg-gradient-to-t from-[#04060f] to-transparent flex flex-col justify-end px-2 pb-1.5 pt-4">
                                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#2d6af2]/0 via-[#2d6af2] to-[#2d6af2]/0 opacity-50" />
                                    <p className="font-display text-white/90 text-[10px] font-black tracking-[0.15em] truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-none mb-0.5">
                                        {p.nickname}
                                    </p>
                                    <div className="flex justify-between items-center">
                                        <p className="font-display text-[#5a9cff]/80 text-[7px] tracking-[0.2em] uppercase leading-none truncate pr-1">
                                            {charObj.name}
                                        </p>
                                        <div className="flex gap-[2px] opacity-60">
                                            <div className="w-[2px] h-[5px] bg-[#2d6af2]/60 transform -skew-x-[20deg]" />
                                            <div className="w-[2px] h-[5px] bg-[#2d6af2]/80 transform -skew-x-[20deg]" />
                                            <div className="w-[2px] h-[5px] bg-[#5a9cff] shadow-[0_0_5px_#5a9cff] transform -skew-x-[20deg]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-[999] pointer-events-none bg-[#0c1020]/95 backdrop-blur-xl text-white border border-[#2d6af2]/80 font-display text-sm px-4 py-2 shadow-[0_0_30px_rgba(45,106,242,0.8)] rounded-md whitespace-nowrap scale-95 ${activeTooltip === p.nickname ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100 group-hover:scale-100'}`}>
                                {p.nickname}
                            </div>
                        </div>
                    );
                })}

                {/* Empty slot */}
                <div className="group relative w-full bg-[#0a0e1a]/40 border-t border-r border-[#7090cc]/20 border-dashed"
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)', aspectRatio: '1/1.15' }}>
                    <div className="absolute inset-0 flex items-center justify-center p-3">
                        <svg viewBox="0 0 180 80" className="w-[100px] h-[45px] opacity-[0.2] transition-opacity" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="8" y="28" width="164" height="34" rx="4" stroke="#7090cc" strokeWidth="2" />
                            <rect x="42" y="12" width="96" height="28" rx="4" stroke="#7090cc" strokeWidth="2" />
                            <circle cx="42" cy="66" r="10" stroke="#7090cc" strokeWidth="2" />
                            <circle cx="138" cy="66" r="10" stroke="#7090cc" strokeWidth="2" />
                            <line x1="8" y1="42" x2="172" y2="42" stroke="#7090cc" strokeWidth="1" strokeDasharray="6 4" />
                        </svg>
                    </div>
                    <div className="absolute bottom-2.5 inset-x-0 text-center">
                        <p className="text-[7.5px] uppercase tracking-[0.2em] font-display text-white/30 bg-black/40 inline-block px-2 py-1 rounded-sm border border-white/5">
                            {t("player_waiting.waiting_player")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom action bar */}
            <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(14,18,30,0.8)' }}>
                <button onClick={() => setIsExiting(true)} className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#1a0a12] border border-red-500/50 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all flex-shrink-0">
                    <LogOut className="w-4 h-4 scale-x-[-1]" />
                </button>
                <button onClick={() => setIsSelectingCharacter(true)} className="flex-1 h-11 flex items-center justify-center rounded-xl border border-[#00ff9d]/60 text-[#00ff9d] font-display text-xs uppercase tracking-widest hover:bg-[#00ff9d]/10 active:scale-95 transition-all">
                    {t("player_waiting.choose_character")}
                </button>
            </div>
        </motion.div>
    );
};
