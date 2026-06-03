import React from 'react';
import { motion } from 'framer-motion';
import { Users, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { InitialsAvatar } from './InitialsAvatar';

export const DesktopWaitingView = ({
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
    PLAYER_CHARACTERS,
    isSelectingCharacter,
    setPendingCharacterId,
    assignedCarId,
    handleSelectCharacter,
    pendingCharacterId,
    displayVisual
}: any) => {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="hidden md:block fixed inset-0 z-30"
            style={{
                background: 'rgba(4,6,15,0.55)',
                backdropFilter: 'blur(2px)',
            }}>

            {/* Ambient light effects */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Subtle purple ambient glow top-right */}
                <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-gradient-to-bl from-[#7C3AED]/8 to-transparent rounded-bl-full" />
                {/* Floor fade */}
                <div className="absolute bottom-0 inset-x-0 h-[40%] bg-gradient-to-t from-[#04060f]/80 to-transparent" />
                {/* Car glow on floor */}
                <div className="absolute bottom-[18%] left-[62%] w-[400px] h-[60px] -translate-x-1/2 bg-[#7C3AED]/8 blur-3xl rounded-full" />
            </div>

            {/* ── Top bar ── */}
            <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-6 py-3">
                <div className="flex flex-col leading-none">
                    <img src="/assets/logo/logo1.png" alt="Logo" className="h-10 object-contain opacity-80 hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex flex-col leading-none">
                    <img src="/assets/logo/logo2.png" alt="NitroQuiz" className="h-10 object-contain opacity-70 hover:opacity-100 transition-opacity" />
                </div>
            </div>

            {/* ── Left panel — floats over the showroom ── */}
            <div className="absolute top-[85px] left-6 bottom-6 z-10 flex flex-col min-h-0 w-[320px] lg:w-[480px] xl:w-[680px]">
                {/* Outer panel */}
                <div className="flex-1 flex flex-col min-h-0 rounded-xl overflow-hidden shadow-2xl"
                    style={{
                        background: 'rgba(17,23,41,0.92)',
                        border: '1px solid rgba(124,58,237,0.15)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 15px 40px rgba(0,0,0,0.6)',
                    }}>
                    {/* Subtle dot texture */}
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                    {/* Corner accent glow */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#7C3AED]/8 to-transparent rounded-bl-full pointer-events-none z-0" />

                    {/* Header row */}
                    <div className="flex items-center justify-between px-5 py-3.5 flex-shrink-0 relative z-10"
                        style={{ borderBottom: '1px solid rgba(124,58,237,0.12)' }}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#7C3AED]/10 rounded-lg">
                                <Users className="w-4 h-4 text-[#a78bfa]" />
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="font-display text-xl font-black text-white leading-none">
                                    {participantCount}
                                </span>
                                <span className="font-display text-[#a78bfa] text-[10px] font-bold tracking-[0.2em] uppercase">
                                    {t("player_waiting.player", { count: participantCount }).replace(/[\d()]+/g, '').trim()}
                                </span>
                            </div>
                        </div>
                        <button onClick={() => setIsExiting(true)}
                            className="group/btn h-9 px-4 flex items-center justify-center rounded-sm active:scale-95 transition-all flex-shrink-0 transform -skew-x-[15deg] overflow-hidden relative hover:bg-red-500/25 hover:border-red-500/60 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                            style={{
                                background: 'rgba(239,68,68,0.12)',
                                border: '1px solid rgba(239,68,68,0.35)',
                                color: '#f87171',
                            }}>
                            <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                            <div className="relative z-10 transform skew-x-[15deg]">
                                <LogOut className="w-4 h-4 scale-x-[-1]" />
                            </div>
                        </button>
                    </div>

                    {/* Scrollable cards */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-5 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-max relative z-10"
                        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(124,58,237,0.25) transparent' }}>

                        {/* YOU card */}
                        <div 
                            onClick={(e) => { e.stopPropagation(); setActiveTooltip(activeTooltip === username ? null : username); }}
                            className="group relative h-[190px] w-full cursor-pointer"
                        >
                            <div className="absolute inset-0 bg-[#0a0e1a] border-t border-r border-[#7C3AED]/40 group-hover:border-[#a78bfa] transition-all group-hover:shadow-[0_0_30px_rgba(124,58,237,0.3)] shadow-[inset_0_0_40px_rgba(124,58,237,0.05)]"
                                style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}>
                                {/* Tech styling bases */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#b89aff] via-[#7C3AED] to-[#3a1a7a] z-10 shadow-[0_0_10px_#7C3AED]" />
                                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(124,58,237,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.2) 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
                                
                                {/* Profile avatar */}
                                <div className="absolute top-3 left-4 z-20 w-8 h-8 rounded-full overflow-hidden border border-[#7C3AED]/60 shadow-[0_0_10px_rgba(124,58,237,0.4)] backdrop-blur-md bg-black/50">
                                    {userAvatar ? (
                                        <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <InitialsAvatar name={username} size="sm" />
                                    )}
                                </div>

                                {/* YOU badge */}
                                <div className="absolute top-3 right-3 z-20">
                                    <div className="font-display font-black text-[9px] tracking-[0.2em] px-3 py-1 transform -skew-x-[15deg] shadow-[0_0_15px_rgba(124,58,237,0.5)] border border-[#a78bfa]/50"
                                        style={{ background: 'linear-gradient(90deg, #7C3AED, #5b21b6)', color: '#fff' }}>
                                        <span className="block transform skew-x-[15deg]">{t("player_waiting.you")}</span>
                                    </div>
                                </div>

                                {/* Car image */}
                                <div className="absolute inset-x-0 top-6 bottom-12 flex items-center justify-center p-2 z-10 w-full h-auto">
                                    <img src={assignedChar.imageSrc} alt="car"
                                        className="w-full h-full object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)] filter contrast-[1.1] brightness-[1.05] group-hover:scale-105 transition-transform duration-500 will-change-transform" />
                                </div>

                                {/* Name plate */}
                                <div className="absolute bottom-0 inset-x-0 z-20 h-[48px] bg-gradient-to-t from-[#04060f] to-transparent flex flex-col justify-end px-3 pb-2 pt-4">
                                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#7C3AED]/0 via-[#7C3AED] to-[#7C3AED]/0" />
                                    <p className="font-display text-white text-[12px] font-black tracking-[0.15em] truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-none mb-1">
                                        {username}
                                    </p>
                                    <div className="flex justify-between items-center">
                                        <p className="font-display text-[#a78bfa] text-[8px] tracking-[0.3em] uppercase opacity-90 leading-none truncate pr-2">
                                            {assignedChar.name}
                                        </p>
                                        <div className="flex gap-[2px]">
                                            <div className="w-[3px] h-[6px] bg-[#7C3AED]/60 transform -skew-x-[20deg]" />
                                            <div className="w-[3px] h-[6px] bg-[#7C3AED]/80 transform -skew-x-[20deg]" />
                                            <div className="w-[3px] h-[6px] bg-white shadow-[0_0_5px_#fff] transform -skew-x-[20deg]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-[999] pointer-events-none bg-[#0c1020]/95 backdrop-blur-xl text-white border border-[#7C3AED]/80 font-display text-sm px-4 py-2 shadow-[0_0_30px_rgba(124,58,237,0.8)] rounded-md whitespace-nowrap scale-95 ${activeTooltip === username ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100 group-hover:scale-100'}`}>
                                {username}
                            </div>
                        </div>

                        {/* Other players */}
                        {allParticipants.filter((p: any) => p.nickname !== username).map((p: any, i: number) => {
                            const charObj = PLAYER_CHARACTERS.find((c: any) => c.id === (p.car_character || "").replace("-bot", "")) || PLAYER_CHARACTERS[0];
                            const pCarName = charObj.name;
                            const carSrc = charObj.imageSrc;
                            return (
                                <div key={i} 
                                    onClick={(e) => { e.stopPropagation(); setActiveTooltip(activeTooltip === p.nickname ? null : p.nickname); }}
                                    className="group relative h-[190px] w-full cursor-pointer"
                                >
                                    <div className="absolute inset-0 bg-[#0a0e1a]/80 border-t border-r border-[#2d6af2]/30 group-hover:border-[#5a9cff] transition-all group-hover:shadow-[0_0_30px_rgba(45,106,242,0.2)] shadow-[inset_0_0_40px_rgba(45,106,242,0.05)]"
                                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}>
                                        {/* Tech styling bases */}
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#5a9cff] via-[#2d6af2] to-[#123075] z-10 shadow-[0_0_10px_#2d6af2] opacity-80 group-hover:opacity-100" />
                                        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(45,106,242,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(45,106,242,0.2) 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
                                        
                                        {/* Profile avatar */}
                                        <div className="absolute top-3 left-4 z-20 w-8 h-8 rounded-full overflow-hidden border border-[#2d6af2]/50 shadow-[0_0_8px_rgba(45,106,242,0.3)] backdrop-blur-md bg-black/50 group-hover:border-[#5a9cff] transition-colors">
                                            {p.avatar_url ? (
                                                <img src={p.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <InitialsAvatar name={p.nickname} size="sm" />
                                            )}
                                        </div>

                                        {/* Car image */}
                                        <div className="absolute inset-x-0 top-6 bottom-12 flex items-center justify-center p-2 z-10 w-full h-auto">
                                            <img src={carSrc} alt="car"
                                                className="w-full h-full object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)] filter brightness-[0.95] group-hover:brightness-[1.1] group-hover:scale-105 transition-transform duration-500 will-change-transform" />
                                        </div>

                                        {/* Name plate */}
                                        <div className="absolute bottom-0 inset-x-0 z-20 h-[48px] bg-gradient-to-t from-[#04060f] to-transparent flex flex-col justify-end px-3 pb-2 pt-4">
                                            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#2d6af2]/0 via-[#2d6af2] to-[#2d6af2]/0 opacity-50 group-hover:opacity-100 transition-opacity" />
                                            <p className="font-display text-white/90 group-hover:text-white text-[12px] font-black tracking-[0.15em] truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] leading-none mb-1 transition-colors">
                                                {p.nickname}
                                            </p>
                                            <div className="flex justify-between items-center">
                                                <p className="font-display text-[#5a9cff]/80 group-hover:text-[#5a9cff] text-[8px] tracking-[0.3em] uppercase leading-none truncate pr-2 transition-colors">
                                                    {pCarName}
                                                </p>
                                                <div className="flex gap-[2px] opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <div className="w-[3px] h-[6px] bg-[#2d6af2]/60 transform -skew-x-[20deg]" />
                                                    <div className="w-[3px] h-[6px] bg-[#2d6af2]/80 transform -skew-x-[20deg]" />
                                                    <div className="w-[3px] h-[6px] bg-[#5a9cff] shadow-[0_0_5px_#5a9cff] transform -skew-x-[20deg]" />
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
                        <div className="group relative h-[190px] w-full bg-[#0a0e1a]/40 border-t border-r border-[#7090cc]/20 border-dashed"
                            style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}>
                            <div className="absolute inset-0 flex items-center justify-center p-4">
                                <svg viewBox="0 0 180 80" className="w-[140px] h-[60px] opacity-[0.15] group-hover:opacity-30 transition-opacity" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="8" y="28" width="164" height="34" rx="4" stroke="#7090cc" strokeWidth="2" />
                                    <rect x="42" y="12" width="96" height="28" rx="4" stroke="#7090cc" strokeWidth="2" />
                                    <circle cx="42" cy="66" r="10" stroke="#7090cc" strokeWidth="2" />
                                    <circle cx="138" cy="66" r="10" stroke="#7090cc" strokeWidth="2" />
                                    <line x1="8" y1="42" x2="172" y2="42" stroke="#7090cc" strokeWidth="1" strokeDasharray="6 4" />
                                </svg>
                            </div>
                            <div className="absolute bottom-3 inset-x-0 text-center">
                                <p className="text-[9px] uppercase tracking-[0.25em] font-display text-white/30 group-hover:text-white/50 transition-colors bg-black/40 inline-block px-3 py-1.5 rounded-sm border border-white/5">
                                    {t("player_waiting.waiting_player")}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Right Panel Area ── */}
            {isSelectingCharacter ? (
                <div className="absolute z-10 flex flex-col items-center justify-center right-0 md:left-[340px] lg:left-[500px] xl:left-[700px]" style={{ top: '60px', bottom: '64px', right: '20px' }}>
                    <h2 className="font-display text-2xl font-black text-white uppercase tracking-[0.15em] mb-8 drop-shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                        {t("player_waiting.choose_racer")}
                    </h2>
                    <div className="flex items-center gap-6 w-full justify-center px-4 overflow-hidden relative">
                        {/* Left Arrow */}
                        <button className="z-20 w-10 h-10 flex items-center justify-center bg-white/[0.04] backdrop-blur-md border border-white/[0.08] rounded-xl hover:bg-white/[0.08] hover:border-[#7C3AED]/30 transition-all shadow-lg flex-shrink-0">
                            <ChevronLeft className="w-5 h-5 text-white/60" />
                        </button>

                        {/* Cards Container */}
                        <div className="flex justify-center gap-5 items-center overflow-x-auto no-scrollbar py-6 px-4">
                            {PLAYER_CHARACTERS.map((c: any) => {
                                const isSel = pendingCharacterId === c.id;
                                return (
                                    <div key={c.id} onClick={() => setPendingCharacterId(c.id)}
                                        className={`relative flex flex-col items-center justify-center p-4 rounded-xl transition-all cursor-pointer ${isSel ? 'bg-[#111729]/95 border-2 border-[#7C3AED]' : 'bg-[#111729]/70 border border-white/[0.08]'}`}
                                        style={{
                                            width: '240px',
                                            height: '240px',
                                            boxShadow: isSel ? '0 0 30px rgba(124,58,237,0.4), inset 0 0 20px rgba(124,58,237,0.1)' : '0 4px 20px rgba(0,0,0,0.3)',
                                            backdropFilter: 'blur(12px)',
                                        }}>
                                        {isSel && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#7C3AED] via-[#a78bfa] to-transparent" />}

                                        {/* Car Image */}
                                        <div className="w-full mb-3 relative flex items-center justify-center" style={{ height: '120px' }}>
                                            <img src={c.imageSrc} alt={c.name}
                                                className="w-full h-full object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.8)]" />
                                        </div>

                                        {/* Name */}
                                        <h3 className={`font-display text-[14px] font-bold uppercase tracking-[0.15em] text-center mt-auto mb-2 ${isSel ? 'text-[#a78bfa]' : 'text-white/70'}`}>
                                            {c.name}
                                        </h3>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Right Arrow */}
                        <button className="z-20 w-10 h-10 flex items-center justify-center bg-white/[0.04] backdrop-blur-md border border-white/[0.08] rounded-xl hover:bg-white/[0.08] hover:border-[#7C3AED]/30 transition-all shadow-lg flex-shrink-0">
                            <ChevronRight className="w-5 h-5 text-white/60" />
                        </button>
                    </div>

                    {/* Action Buttons — motorsport skewed */}
                    <div className="flex gap-4 mt-8">
                        <button onClick={() => { setIsSelectingCharacter(false); setPendingCharacterId(assignedCarId); }}
                            className="group/btn px-8 py-3 bg-white/[0.04] border border-white/[0.15] rounded-sm transform -skew-x-[15deg] transition-all hover:bg-white/[0.08] hover:border-white/[0.25] overflow-hidden relative">
                            <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                            <span className="relative z-10 font-display text-[12px] font-bold uppercase tracking-[0.15em] text-white/60 group-hover/btn:text-white transform skew-x-[15deg]">
                                {t("player_waiting.back")}
                            </span>
                        </button>
                        <button onClick={handleSelectCharacter}
                            className="group/btn px-8 py-3 bg-gradient-to-r from-[#7C3AED] to-[#5b21b6] border border-white/20 rounded-sm transform -skew-x-[15deg] transition-all hover:shadow-[0_0_25px_rgba(124,58,237,0.5)] overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
                            <span className="relative z-10 font-display text-[12px] font-bold uppercase tracking-[0.15em] text-white transform skew-x-[15deg] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                                {t("player_waiting.select")}
                            </span>
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="absolute z-10 flex flex-col gap-6 items-center justify-center right-0 md:left-[340px] lg:left-[500px] xl:left-[700px]"
                        style={{ top: '60px', bottom: '64px' }}>
                        <motion.div className="relative flex items-center justify-center"
                            style={{ width: 'clamp(300px, 45vw, 560px)', height: '52vh' }}
                            animate={{ y: [0, -14, 0] }}
                            transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}>
                            <img src={displayVisual} alt="Your Car"
                                className="object-contain drop-shadow-[0_28px_60px_rgba(124,58,237,0.15)] relative z-10"
                                style={{ width: '100%', maxHeight: '100%' }}
                            />
                            {/* Ground glow */}
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-[#7C3AED]/15 blur-2xl rounded-full" />
                        </motion.div>

                        {/* Character name label (moved below character) */}
                        <div className="flex flex-col items-center justify-center text-center -mt-2 mb-2">
                            <h2 className="font-display text-3xl font-black text-white uppercase tracking-[0.1em] leading-none drop-shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                                {assignedChar.name}
                            </h2>
                            <div className="h-[2px] w-16 mt-3 bg-gradient-to-r from-transparent via-[#7C3AED] to-transparent" />
                        </div>

                        {/* Choose Character — motorsport skewed button */}
                        <motion.button
                            onClick={() => { setPendingCharacterId(assignedCarId); setIsSelectingCharacter(true); }}
                            animate={{
                                boxShadow: ['0 0 10px rgba(124,58,237,0.3)', '0 0 25px rgba(124,58,237,0.6)', '0 0 10px rgba(124,58,237,0.3)'],
                            }}
                            transition={{
                                boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                            }}
                            className="group/btn px-10 py-3.5 bg-gradient-to-r from-[#7C3AED] to-[#5b21b6] border border-white/20 rounded-sm transform -skew-x-[15deg] transition-all active:scale-[0.98] overflow-hidden relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
                            <span className="relative z-10 font-display text-[13px] font-black uppercase tracking-[0.2em] text-white transform skew-x-[15deg] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                                {t("player_waiting.choose_character")}
                            </span>
                        </motion.button>
                    </div>
                </>
            )}

        </motion.div>
    );
};
