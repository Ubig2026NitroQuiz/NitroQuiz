"use client";

import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Download, X } from "lucide-react";

interface PWAInstallBannerProps {
  onInstall: () => void;
  onDismiss: () => void;
}

export default function PWAInstallBanner({ onInstall, onDismiss }: PWAInstallBannerProps) {
  const { t } = useTranslation();

  return (
    <motion.div 
      initial={{ opacity: 0, x: -300, skewX: "20deg" }}
      animate={{ opacity: 1, x: 0, skewX: "0deg" }}
      exit={{ opacity: 0, x: -300, skewX: "-20deg" }}
      transition={{ 
        type: "spring", 
        stiffness: 350, 
        damping: 25,
        mass: 1 
      }}
      className="fixed bottom-6 left-6 z-[200]"
    >
      <div className="group p-4 w-[280px] sm:w-[300px] bg-gradient-to-br from-[#1a0f35] to-[#080512] border-l-4 border-l-[#7C3AED] border-y border-r border-y-[#7C3AED]/30 border-r-[#7C3AED]/30 shadow-[0_20px_50px_rgba(0,0,0,0.9),_0_0_40px_rgba(124,58,237,0.3)] overflow-hidden relative transform -skew-x-[8deg] rounded-none">
        
        {/* Glow effect in background */}
        <div className="absolute -top-10 -left-10 w-24 h-24 bg-[#7C3AED]/20 blur-[40px] rounded-full pointer-events-none"></div>

        <div className="motion-texture opacity-20"></div>
        <div className="checkered-tag opacity-50 scale-75 origin-bottom-right"></div>
        
        <div className="transform skew-x-[8deg] flex flex-col relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#7C3AED]/20 rounded-sm flex items-center justify-center border border-[#7C3AED]/40 transform -skew-x-[15deg] shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                <Download className="w-5 h-5 text-white transform skew-x-[15deg]" />
              </div>
              <div className="flex flex-col justify-center">
                 <p className="text-sm font-black italic text-white uppercase tracking-[0.05em] drop-shadow-[0_0_10px_rgba(124,58,237,0.8)] leading-none">
                   {t("pwa.installTitle")}
                 </p>
              </div>
            </div>
            <button 
              onClick={onDismiss}
              className="text-white/50 hover:text-white transition-colors p-1 bg-white/5 rounded-full hover:bg-white/10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="flex gap-3 w-full">
            <button
              onClick={onInstall}
              className="group/btn flex-[1.5] flex items-center justify-center bg-gradient-to-r from-[#7C3AED] to-[#5b21b6] border border-[#a78bfa]/60 h-9 relative overflow-hidden transform -skew-x-[15deg] transition-all hover:brightness-125 shadow-[0_0_25px_rgba(124,58,237,0.5)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
              <span className="relative z-10 font-black italic uppercase text-[10px] tracking-[0.1em] text-white transform skew-x-[15deg] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                {t("pwa.install")}
              </span>
            </button>

            <button
              onClick={onDismiss}
              className="group/btn flex-1 flex items-center justify-center bg-black/40 border border-[#7C3AED]/30 h-9 relative overflow-hidden transform -skew-x-[15deg] transition-all hover:bg-[#7C3AED]/20"
            >
              <div className="absolute inset-0 bg-white/5 -translate-x-full group-hover/btn:translate-x-[200%] transition-transform duration-700 ease-in-out" />
              <span className="relative z-10 font-black italic uppercase text-[9px] tracking-widest text-white/80 group-hover/btn:text-white transform skew-x-[15deg]">
                {t("pwa.later")}
              </span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
