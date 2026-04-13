/**
 * index.ts
 * ────────
 * Barrel export untuk semua komponen halaman monitor.
 *
 * Contoh penggunaan:
 *   import { MonitorHeader, PlayerCard, PlayersGrid } from "@/components/monitor";
 */

export { default as BackgroundEffects } from "./BackgroundEffects";
export { default as MonitorHeader } from "./MonitorHeader";
export { default as PlayerCard } from "./PlayerCard";
export { default as PlayersGrid } from "./PlayersGrid";
export { default as EndGameDialog } from "./EndGameDialog";

export * from "./types";
export * from "./utils";
