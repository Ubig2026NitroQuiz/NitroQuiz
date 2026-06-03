import React from 'react';

export const CountdownOverlay = ({ countdownValue, t }: any) => {
    const getCountdownLabel = (val: number) => {
        if (val === 3) return t("player_waiting.ready");
        if (val === 2) return t("player_waiting.steady");
        if (val === 1) return t("player_waiting.go_race");
        return t("player_waiting.go");
    };
    const getCountdownColor = (val: number) => {
        if (val === 3) return "text-red-500";
        if (val === 2) return "text-yellow-400";
        return "text-[#00ff9d]";
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
            style={{ animation: 'fadeIn 0.3s ease-out' }}>
            {/* 3 traffic light dots */}
            <div className="flex gap-4 mb-8">
                {[
                    { color: "#ef4444", activeAt: 3 },
                    { color: "#facc15", activeAt: 2 },
                    { color: "#00ff9d", activeAt: 1 },
                ].map((light, i) => {
                    const isGo = countdownValue <= 0;
                    const isLit = isGo || countdownValue <= light.activeAt;
                    const displayColor = isGo ? "#00ff9d" : light.color;
                    return (
                        <div key={i} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2" style={{
                            borderColor: isLit ? displayColor : '#374151',
                            backgroundColor: isLit ? displayColor : 'rgba(55,65,81,0.3)',
                            boxShadow: isLit ? `0 0 25px ${displayColor}` : 'none',
                            transform: isLit ? 'scale(1.15)' : 'scale(1)',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        }} />
                    );
                })}
            </div>
            <span key={countdownValue}
                className={`font-display font-black py-4 ${getCountdownColor(countdownValue)} drop-shadow-[0_0_40px_currentColor]`}
                style={{ animation: 'countdown-pop 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)', willChange: 'transform, opacity', display: 'block', fontSize: 'clamp(80px, 16vw, 150px)', lineHeight: '1.2' }}>
                {countdownValue > 0 ? countdownValue : t("player_waiting.go")}
            </span>
            <p className="font-display text-lg text-gray-400 mt-6" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
                {getCountdownLabel(countdownValue)}
            </p>

            {/* Mobile Orientation Picker during countdown */}
            <div className="md:hidden mt-6 flex gap-3 w-full max-w-[320px] px-4">
                <button
                    onClick={() => localStorage.setItem('nitroquiz_orientation', 'portrait')}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${(typeof window !== 'undefined' && localStorage.getItem('nitroquiz_orientation') === 'portrait')
                        ? 'border-[#2d6af2] bg-[#2d6af2]/15'
                        : 'border-white/10 bg-white/5'
                        }`}
                >
                    <span style={{ fontSize: '1.5rem' }}>📱</span>
                    <span className="font-display text-[9px] text-white font-bold uppercase tracking-widest">{t('player_game.portrait')}</span>
                </button>
                <button
                    onClick={() => localStorage.setItem('nitroquiz_orientation', 'landscape')}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${(typeof window !== 'undefined' && localStorage.getItem('nitroquiz_orientation') === 'landscape')
                        ? 'border-[#00ff9d] bg-[#00ff9d]/10'
                        : 'border-white/10 bg-white/5'
                        }`}
                >
                    <span style={{ fontSize: '1.5rem', transform: 'rotate(90deg)', display: 'inline-block' }}>📱</span>
                    <span className="font-display text-[9px] text-white font-bold uppercase tracking-widest">{t('player_game.landscape')}</span>
                </button>
            </div>

            <div className="absolute w-64 h-64 rounded-full border border-[#2d6af2]/20" style={{ animation: 'pulseRing 2s ease-in-out infinite' }} />
            <style>{`
                @keyframes fadeIn{from{opacity:0}to{opacity:1}}
                @keyframes fadeInUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
                @keyframes countdown-pop{0%{transform:scale(1.5) translateY(-30px);opacity:0}60%{transform:scale(0.95) translateY(5px);opacity:1}100%{transform:scale(1) translateY(0);opacity:1}}
                @keyframes pulseRing{0%{transform:scale(1);opacity:0.3}50%{transform:scale(1.5);opacity:0}100%{transform:scale(1);opacity:0.3}}
            `}</style>
        </div>
    );
};
