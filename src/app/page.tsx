'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/storage';

export default function Home() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');

  const handleHost = () => {
    router.push('/host/select-quiz');
  };

  const handleJoin = () => {
    if (roomCode.trim()) {
      router.push(`/player/${roomCode.trim()}/login`);
    }
  };

  return (
    <div className="bg-background-dark text-white min-h-screen relative overflow-hidden font-body selection:bg-neon-blue selection:text-white flex flex-col">
      <div className="fixed inset-0 z-0 city-silhouette pointer-events-none"></div>
      <div className="fixed inset-0 z-0 bg-gradient-to-t from-background-dark via-transparent to-blue-900/10 pointer-events-none"></div>
      <div className="fixed bottom-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-background-dark/50 to-background-dark pointer-events-none z-0"></div>
      <div className="fixed bottom-0 w-full h-1/2 bg-[linear-gradient(transparent_0%,rgba(45,106,242,0.1)_1px,transparent_1px),linear-gradient(90deg,transparent_0%,rgba(45,106,242,0.1)_1px,transparent_1px)] bg-[length:60px_60px] [transform:perspective(500px)_rotateX(60deg)] origin-bottom z-0 pointer-events-none opacity-20"></div>
      <div className="scanlines"></div>

      <main className="relative z-20 flex flex-col items-center justify-center min-h-screen w-full max-w-7xl mx-auto p-4 md:p-8">
        <header className="text-center mb-12 relative z-30 w-full">
          <h1 className="font-display text-3xl md:text-7xl text-white mb-2 uppercase tracking-tight transform -skew-x-6 drop-shadow-[0_0_10px_rgba(45,106,242,0.8)]">
            <span className="text-white">NITRO</span><span className="text-neon-blue text-blue-600">QUIZ</span>
          </h1>
          <p className="font-display text-[10px] md:text-xs text-blue-400/80 tracking-[0.2em] mt-4">
            Learn it. Nail it. Nitro it!
          </p>
        </header>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-16 w-full justify-center items-stretch max-w-5xl">
          {/* Host Card */}
          <div className="host-card rounded-[2rem] p-8 md:p-10 flex-1 flex flex-col items-center justify-between shadow-[0_0_25px_rgba(0,255,157,0.25)_inset,0_0_25px_rgba(0,255,157,0.1)] relative overflow-hidden group hover:shadow-[0_0_40px_rgba(0,255,157,0.3)] transition-all duration-300 bg-[linear-gradient(160deg,rgba(0,255,157,0.05)_0%,rgba(10,16,31,0.9)_100%)] border border-[#00ff9d]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#00ff9d]/10 to-transparent rounded-bl-full pointer-events-none"></div>
            <div className="w-full text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#00ff9d]/10 border border-[#00ff9d]/30 mb-6 shadow-[0_0_15px_rgba(0,255,157,0.2)]">
                <span className="material-icons-outlined text-3xl text-[#00ff9d]">videogame_asset</span>
              </div>
              <h2 className="font-body font-bold text-4xl text-white mb-2 tracking-wide glow-text uppercase">
                HOST
              </h2>
              <p className="text-gray-400 text-sm font-light tracking-wider">
                Create a new room and invite players.
              </p>
            </div>
            <div className="w-full mt-auto">
              <button
                onClick={handleHost}
                className="w-full bg-[#00ff9d] hover:bg-[#33ffb0] text-black font-display text-sm py-4 px-6 rounded-xl shadow-[0_0_20px_rgba(0,255,157,0.4)] hover:shadow-[0_0_30px_rgba(0,255,157,0.6)] transition-all duration-300 uppercase tracking-wider transform active:scale-[0.98] border border-white/20"
              >
                Create Room
              </button>
            </div>
          </div>

          {/* Join Card */}
          <div className="join-card rounded-[2rem] p-8 md:p-10 flex-1 flex flex-col items-center justify-between shadow-[0_0_25px_rgba(45,106,242,0.25)_inset,0_0_25px_rgba(45,106,242,0.1)] relative overflow-hidden group hover:shadow-[0_0_40px_rgba(45,106,242,0.3)] transition-all duration-300 bg-[linear-gradient(160deg,rgba(45,106,242,0.05)_0%,rgba(10,16,31,0.9)_100%)] border border-[#2d6af2]">
            <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-[#2d6af2]/10 to-transparent rounded-br-full pointer-events-none"></div>
            <div className="w-full text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2d6af2]/10 border border-[#2d6af2]/30 mb-6 shadow-[0_0_15px_rgba(45,106,242,0.2)]">
                <span className="material-icons-outlined text-3xl text-[#2d6af2]">login</span>
              </div>
              <h2 className="font-body font-bold text-4xl text-white mb-2 tracking-wide glow-text uppercase">
                JOIN
              </h2>
              <p className="text-gray-400 text-sm font-light tracking-wider">
                Enter a code to join game.
              </p>
            </div>
            <div className="w-full mt-auto space-y-4">
              <div className="relative group/input space-y-1">
				<input
                  className="w-full bg-black/40 border border-[#2d6af2]/30 text-white font-display text-center text-sm py-4 px-4 rounded-xl focus:outline-none focus:border-[#2d6af2] focus:ring-1 focus:ring-[#2d6af2] transition-all placeholder:font-display placeholder:text-xs tracking-widest shadow-inner placeholder:text-[#2d6af2]/50"
                  maxLength={6}
                  placeholder="NICKNAME"
                  type="text"
                  value="Huda"
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
                <input
                  className="w-full bg-black/40 border border-[#2d6af2]/30 text-white font-display text-center text-sm py-4 px-4 rounded-xl focus:outline-none focus:border-[#2d6af2] focus:ring-1 focus:ring-[#2d6af2] transition-all placeholder:font-display placeholder:text-xs uppercase tracking-widest shadow-inner placeholder:text-[#2d6af2]/50"
                  maxLength={6}
                  placeholder="ROOM CODE"
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
                <div className="absolute inset-0 rounded-xl bg-[#2d6af2]/5 opacity-0 group-focus-within/input:opacity-100 pointer-events-none transition-opacity duration-300"></div>
              </div>
              <button
                onClick={handleJoin}
                className="w-full bg-[#2d6af2] hover:bg-[#3b7bf5] text-white font-display text-sm py-4 px-6 rounded-xl shadow-[0_0_20px_rgba(45,106,242,0.4)] hover:shadow-[0_0_30px_rgba(45,106,242,0.6)] transition-all duration-300 uppercase tracking-wider transform active:scale-[0.98] border border-blue-400/30"
              >
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="absolute top-1/4 left-10 w-1 h-24 bg-gradient-to-b from-transparent via-blue-500/20 to-transparent blur-sm hidden lg:block"></div>
        <div className="absolute bottom-1/3 right-10 w-1 h-32 bg-gradient-to-b from-transparent via-green-500/20 to-transparent blur-sm hidden lg:block"></div>
      </main>
    </div>
  );
}
