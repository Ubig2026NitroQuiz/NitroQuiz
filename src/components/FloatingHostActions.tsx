"use client";

import { useState, useEffect } from "react";
import { Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBgm } from "@/contexts/BgmContext";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";

export function FloatingHostActions() {
  const pathname = usePathname();
  const { isMuted, toggleMute } = useBgm();
  const { t } = useTranslation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const isLeaderboard = pathname?.includes("/leaderboard");

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable full-screen mode: ${e.message} (${e.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className={`fixed ${isLeaderboard ? 'bottom-24' : 'bottom-6'} md:bottom-6 end-4 md:end-6 z-[250] flex flex-col md:flex-row gap-2`}>
        {/* Sound Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleMute}
              className={`w-9 h-9 md:w-11 md:h-11 transform -skew-x-[15deg] transition-all duration-300 shadow-2xl group relative overflow-hidden flex items-center justify-center border-2 rounded-sm ${
                isMuted 
                  ? "bg-red-500/20 border-red-500/40 text-red-500 hover:bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]" 
                  : "bg-[#0a0a0f]/80 backdrop-blur-xl border-[#2d6af2]/30 text-[#2d6af2] hover:border-[#2d6af2] hover:bg-[#2d6af2]/10 shadow-[0_0_20px_rgba(45,106,242,0.2)]"
              }`}
            >
              {/* Shine Animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
              
              <div className="relative z-10 transform skew-x-[15deg]">
                {isMuted ? (
                  <VolumeX size={16} className="md:size-5" />
                ) : (
                  <Volume2 size={16} className="md:size-5" />
                )}
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-[#0a0a0f] border-2 border-white/10 text-white font-display text-[10px] uppercase tracking-widest backdrop-blur-xl rounded-none transform -skew-x-[15deg]">
            <span className="block transform skew-x-[15deg]">
               {isMuted ? (t('room_settings.sound_unmute') || "Unmute") : (t('room_settings.sound_mute') || "Mute")}
            </span>
          </TooltipContent>
        </Tooltip>

        {/* Fullscreen Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleFullscreen}
              className="w-9 h-9 md:w-11 md:h-11 bg-[#0a0a0f]/80 backdrop-blur-xl border-2 border-[#2d6af2]/30 text-[#2d6af2] hover:border-[#2d6af2] hover:bg-[#2d6af2]/10 transition-all duration-300 shadow-2xl group relative overflow-hidden flex items-center justify-center transform -skew-x-[15deg] rounded-sm"
            >
              {/* Shine Animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />

              <div className="relative z-10 transform skew-x-[15deg]">
                {isFullscreen ? (
                  <Minimize2 size={16} className="md:size-5 group-hover:scale-110 transition-transform" />
                ) : (
                  <Maximize2 size={16} className="md:size-5 group-hover:scale-110 transition-transform" />
                )}
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-[#0a0a0f] border-2 border-white/10 text-white font-display text-[10px] uppercase tracking-widest backdrop-blur-xl rounded-none transform -skew-x-[15deg]">
            <span className="block transform skew-x-[15deg]">
              {isFullscreen ? (t('host_lobby.exit_fullscreen') || "Exit Fullscreen") : (t('host_lobby.enter_fullscreen') || "Enter Fullscreen")}
            </span>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
