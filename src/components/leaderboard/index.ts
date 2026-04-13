/**
 * index.ts
 * ────────
 * Barrel export untuk semua komponen halaman leaderboard.
 * Memudahkan import komponen dari satu lokasi terpusat.
 *
 * Contoh penggunaan:
 *   import { Podium, LeaderboardTable } from "@/components/leaderboard";
 */

// Komponen UI
export { default as LeaderboardLoading } from "./LeaderboardLoading";
export { default as BackgroundEffects } from "./BackgroundEffects";
export { default as TopBar } from "./TopBar";
export { default as SideButtons } from "./SideButtons";
export { default as Podium } from "./Podium";
export { default as LeaderboardTable } from "./LeaderboardTable";
export { default as MobileActions } from "./MobileActions";
export { default as InitialsAvatar } from "./InitialsAvatar";

// Tipe, konstanta, utilitas
export * from "./types";
export * from "./constants";
export * from "./utils";
