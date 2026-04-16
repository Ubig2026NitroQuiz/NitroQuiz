"use client";

import { useState, useEffect } from "react";
import { Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBgm } from "@/contexts/BgmContext";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

export function FloatingHostActions() {
  const { isMuted, toggleMute } = useBgm();
  const { t } = useTranslation();
  const [isFullscreen, setIsFullscreen] = useState(false);

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
      <div className="fixed bottom-6 end-6 z-[250] flex flex-col gap-3">
        {/* Sound Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={toggleMute}
              variant="outline"
              className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl backdrop-blur-xl border transition-all shadow-2xl group flex items-center justify-center p-0 ${
                isMuted 
                  ? "bg-red-500/20 border-red-500/40 text-red-500 hover:bg-red-500/30" 
                  : "bg-black/60 border-white/10 text-white/50 hover:text-white hover:border-[#2d6af2]/50 hover:bg-[#2d6af2]/10"
              }`}
            >
              {isMuted ? (
                <VolumeX size={20} className="md:size-6" />
              ) : (
                <Volume2 size={20} className="md:size-6" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-[#0c1020]/95 border border-white/10 text-white font-display text-[10px] uppercase tracking-widest backdrop-blur-xl">
            {isMuted ? (t('room_settings.sound_unmute') || "Unmute") : (t('room_settings.sound_mute') || "Mute")}
          </TooltipContent>
        </Tooltip>

        {/* Fullscreen Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={toggleFullscreen}
              variant="outline"
              className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-black/60 backdrop-blur-xl border-white/10 hover:border-[#2d6af2]/50 hover:bg-[#2d6af2]/10 text-white/50 hover:text-white transition-all shadow-2xl group flex items-center justify-center p-0"
            >
              {isFullscreen ? (
                <Minimize2 size={20} className="md:size-6 group-hover:scale-110 transition-transform" />
              ) : (
                <Maximize2 size={20} className="md:size-6 group-hover:scale-110 transition-transform" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-[#0c1020]/95 border border-white/10 text-white font-display text-[10px] uppercase tracking-widest backdrop-blur-xl">
            {isFullscreen ? (t('host_lobby.exit_fullscreen') || "Exit Fullscreen") : (t('host_lobby.enter_fullscreen') || "Enter Fullscreen")}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
