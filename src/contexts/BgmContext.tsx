"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "nitroquiz_bgm_muted";

// Determine which track to play (or none) based on the current pathname
type TrackType = "bgm" | "game" | "none";

function getTrackForPath(pathname: string): TrackType {
  // Monitor & quiz pages => no music
  if (pathname.includes("/monitor")) return "none";
  if (pathname.includes("/quiz")) return "none";
  // Player game page => game.ogg
  if (pathname.includes("/player/") && pathname.includes("/game")) return "game";
  // Everything else (homepage, lobby, settings, select-quiz, leaderboard, join, result, etc.) => bgm.ogg
  return "bgm";
}

interface BgmContextType {
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  toggleMute: () => void;
}

const BgmContext = createContext<BgmContextType>({
  isMuted: true,
  setIsMuted: () => {},
  toggleMute: () => {},
});

export function BgmProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isMuted, setIsMutedState] = useState(true);

  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const gameRef = useRef<HTMLAudioElement | null>(null);
  const currentTrackRef = useRef<TrackType>("none");

  // Initialize muted state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    // Default is muted (true). Only unmute if explicitly set to "false"
    if (stored === "false") {
      setIsMutedState(false);
    }
  }, []);

  // Persist muted state to localStorage (both keys for backward compat)
  const setIsMuted = useCallback((muted: boolean) => {
    setIsMutedState(muted);
    localStorage.setItem(STORAGE_KEY, muted.toString());
    // Sync with the old settings_muted key so room settings stays in sync
    localStorage.setItem("settings_muted", muted.toString());
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted, setIsMuted]);

  // Create audio elements once
  useEffect(() => {
    if (!bgmRef.current) {
      const audio = new Audio("/assets/musics/bgm.ogg");
      audio.loop = true;
      audio.volume = 0.4;
      audio.preload = "auto";
      bgmRef.current = audio;
    }
    if (!gameRef.current) {
      const audio = new Audio("/assets/musics/game.ogg");
      audio.loop = true;
      audio.volume = 0.4;
      audio.preload = "auto";
      gameRef.current = audio;
    }

    return () => {
      bgmRef.current?.pause();
      gameRef.current?.pause();
      bgmRef.current = null;
      gameRef.current = null;
    };
  }, []);

  // Handle track switching and play/pause based on route + muted state
  useEffect(() => {
    const track = getTrackForPath(pathname);
    const bgm = bgmRef.current;
    const game = gameRef.current;

    if (!bgm || !game) return;

    // If muted or no track, pause everything
    if (isMuted || track === "none") {
      bgm.pause();
      game.pause();
      currentTrackRef.current = "none";
      return;
    }

    // Switch tracks if needed
    if (track === "bgm") {
      if (currentTrackRef.current !== "bgm") {
        game.pause();
        game.currentTime = 0;
        bgm.play().catch(() => {});
        currentTrackRef.current = "bgm";
      }
    } else if (track === "game") {
      if (currentTrackRef.current !== "game") {
        bgm.pause();
        bgm.currentTime = 0;
        game.play().catch(() => {});
        currentTrackRef.current = "game";
      }
    }
  }, [pathname, isMuted]);

  // Handle user interaction to unlock audio (browsers block autoplay)
  useEffect(() => {
    if (isMuted) return;

    const tryPlay = () => {
      const track = getTrackForPath(pathname);
      if (track === "bgm" && bgmRef.current?.paused) {
        bgmRef.current.play().catch(() => {});
        currentTrackRef.current = "bgm";
      } else if (track === "game" && gameRef.current?.paused) {
        gameRef.current.play().catch(() => {});
        currentTrackRef.current = "game";
      }
      // Clean up after first interaction
      document.removeEventListener("click", tryPlay);
      document.removeEventListener("touchstart", tryPlay);
      document.removeEventListener("keydown", tryPlay);
    };

    document.addEventListener("click", tryPlay, { once: true });
    document.addEventListener("touchstart", tryPlay, { once: true });
    document.addEventListener("keydown", tryPlay, { once: true });

    return () => {
      document.removeEventListener("click", tryPlay);
      document.removeEventListener("touchstart", tryPlay);
      document.removeEventListener("keydown", tryPlay);
    };
  }, [isMuted, pathname]);

  return (
    <BgmContext.Provider value={{ isMuted, setIsMuted, toggleMute }}>
      {children}
    </BgmContext.Provider>
  );
}

export function useBgm() {
  return useContext(BgmContext);
}
