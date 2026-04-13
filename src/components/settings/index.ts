/**
 * index.ts
 * ────────
 * Barrel export untuk semua komponen halaman pengaturan.
 *
 * Contoh penggunaan:
 *   import { SettingsForm, CancelDialog } from "@/components/settings";
 */

export { default as BackgroundEffects } from "./BackgroundEffects";
export { default as SettingsLoading } from "./SettingsLoading";
export { default as TopBar } from "./TopBar";
export { default as SettingsForm } from "./SettingsForm";
export { default as CancelDialog } from "./CancelDialog";

export * from "./types";
