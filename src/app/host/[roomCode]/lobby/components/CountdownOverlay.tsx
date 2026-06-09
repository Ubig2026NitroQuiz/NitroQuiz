/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KOMPONEN: CountdownOverlay
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Overlay layar penuh yang menampilkan hitung mundur sebelum game dimulai.
 *
 * Fitur:
 * - Lampu traffic light (merah → kuning → hijau)
 * - Angka countdown besar dengan animasi pop
 * - Label status: READY → STEADY → GO RACE!
 * - Efek pulse ring di belakang angka
 * - Animasi CSS inline (keyframes)
 *
 * Komponen ini hanya dirender saat countdown !== null.
 */

import type { TrafficLight } from "../types";

// ═══════════════════════════════════════════════════════════════════════════
// KONSTANTA: Konfigurasi Lampu Traffic Light
// ═══════════════════════════════════════════════════════════════════════════

const TRAFFIC_LIGHTS: TrafficLight[] = [
  { color: "#ef4444", activeAt: 3 }, // Merah — aktif di hitungan 3
  { color: "#facc15", activeAt: 2 }, // Kuning — aktif di hitungan 2
  { color: "#00ff9d", activeAt: 1 }, // Hijau — aktif di hitungan 1
];

// ═══════════════════════════════════════════════════════════════════════════
// TIPE PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface CountdownOverlayProps {
  countdown: number;
  t: (key: string) => string;
}

// ═══════════════════════════════════════════════════════════════════════════
// KOMPONEN UTAMA
// ═══════════════════════════════════════════════════════════════════════════

export function CountdownOverlay({ countdown, t }: CountdownOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center"
      style={{ animation: "fadeIn 0.3s ease-out" }}
    >
      {/* ── Lampu Traffic Light ── */}
      <TrafficLights countdown={countdown} />

      {/* ── Angka Countdown ── */}
      <CountdownNumber countdown={countdown} t={t} />

      {/* ── Label Status ── */}
      <CountdownLabel countdown={countdown} t={t} />

      {/* ── Efek Pulse Ring ── */}
      <div
        className="absolute w-72 h-72 rounded-full border border-[#2d6af2]/30"
        style={{ animation: "pulseRing 2s ease-in-out infinite" }}
      />

      {/* ── Definisi Keyframes CSS ── */}
      <CountdownKeyframes />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: Lampu Traffic Light
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Tiga lampu lingkaran yang menyala berurutan sesuai hitungan.
 * Saat countdown ≤ 0 (GO!), semua lampu menyala hijau.
 */
function TrafficLights({ countdown }: { countdown: number }) {
  return (
    <div className="flex gap-4 mb-8">
      {TRAFFIC_LIGHTS.map((light, i) => {
        const isGo = countdown <= 0;
        const isLit = isGo || countdown <= light.activeAt;
        const displayColor = isGo ? "#00ff9d" : light.color;

        return (
          <div
            key={i}
            className="w-10 h-10 md:w-14 md:h-14 rounded-full border-2"
            style={{
              borderColor: isLit ? displayColor : "#374151",
              backgroundColor: isLit ? displayColor : "rgba(55,65,81,0.3)",
              boxShadow: isLit
                ? `0 0 30px ${displayColor}, 0 0 60px ${displayColor}55`
                : "none",
              transform: isLit ? "scale(1.15)" : "scale(1)",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: Angka Countdown
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Angka besar di tengah layar dengan warna berubah sesuai hitungan.
 * - 3 → Merah
 * - 2 → Kuning
 * - 1 atau kurang → Hijau
 */
function CountdownNumber({
  countdown,
  t,
}: {
  countdown: number;
  t: (key: string) => string;
}) {
  // Tentukan warna berdasarkan hitungan
  const colorClass =
    countdown === 3
      ? "text-red-500"
      : countdown === 2
        ? "text-yellow-400"
        : "text-[#00ff9d]";

  return (
    <span
      key={countdown}
      className={`font-display font-black py-2 drop-shadow-[0_0_40px_currentColor] ${colorClass}`}
      style={{
        fontSize: "clamp(120px, 22vw, 220px)",
        lineHeight: "1.1",
        display: "block",
        animation: "countdown-pop 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)",
      }}
    >
      {countdown > 0 ? countdown : t("host_lobby.go") ?? "GO!"}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: Label Status
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Teks label di bawah angka countdown.
 * - 3 → READY
 * - 2 → STEADY
 * - 1 atau kurang → GO RACE!
 */
function CountdownLabel({
  countdown,
  t,
}: {
  countdown: number;
  t: (key: string) => string;
}) {
  const label =
    countdown === 3
      ? t("player_waiting.ready") ?? "READY"
      : countdown === 2
        ? t("player_waiting.steady") ?? "STEADY"
        : t("player_waiting.go_race") ?? "GO RACE!";

  return (
    <p
      className="font-display text-xl text-gray-400 mt-4 tracking-[0.3em] uppercase"
      style={{ animation: "fadeInUp 0.3s ease-out" }}
    >
      {label}
    </p>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: Definisi Keyframes CSS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Keyframes animasi yang digunakan oleh overlay countdown.
 * Dirender sebagai <style> inline agar self-contained.
 */
function CountdownKeyframes() {
  return (
    <style>{`
      @keyframes fadeIn {
        from { opacity: 0 }
        to { opacity: 1 }
      }
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(12px) }
        to { opacity: 1; transform: translateY(0) }
      }
      @keyframes countdown-pop {
        0% { transform: scale(1.6) translateY(-20px); opacity: 0 }
        60% { transform: scale(0.95) translateY(4px); opacity: 1 }
        100% { transform: scale(1) translateY(0); opacity: 1 }
      }
      @keyframes pulseRing {
        0% { transform: scale(1); opacity: 0.3 }
        50% { transform: scale(1.8); opacity: 0 }
        100% { transform: scale(1); opacity: 0.3 }
      }
    `}</style>
  );
}
