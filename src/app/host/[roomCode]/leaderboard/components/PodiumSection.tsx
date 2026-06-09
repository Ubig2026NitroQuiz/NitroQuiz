/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KOMPONEN: PodiumSection
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Menampilkan podium 3 besar dengan animasi yang dramatis:
 * - Posisi ke-3 muncul pertama (kanan), lalu ke-2 (kiri), lalu ke-1 (tengah)
 * - Setiap stand "meluncur naik" seperti mobil balap dari garis start
 * - RPM gauge melingkar di sekitar avatar pemain
 * - Efek api/exhaust di dasar setiap podium
 * - Flash speed line saat stand muncul
 *
 * Tata letak: [2nd] [1st] [3rd] — podium ke-1 paling tinggi di tengah
 */

"use client";

import { motion } from "framer-motion";
import { Participant, standVariants, nameplateVariants, rpmGaugeVariants } from "../types";
import { InitialsAvatar } from "./InitialsAvatar";
import { Odometer } from "./Odometer";

// ═══════════════════════════════════════════════════════════════════════════
// TIPE PROPS
// ═══════════════════════════════════════════════════════════════════════════

interface PodiumSectionProps {
  firstPlace: Participant | null;
  secondPlace: Participant | null;
  thirdPlace: Participant | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// KOMPONEN UTAMA: PodiumSection
// ═══════════════════════════════════════════════════════════════════════════

export function PodiumSection({ firstPlace, secondPlace, thirdPlace }: PodiumSectionProps) {
  return (
    <div className="relative w-full max-w-3xl mx-auto mt-4 mb-6 px-2">
      {/* ── PODIUM STANDS ── */}
      <div className="relative flex items-end justify-center h-[230px] sm:h-[320px]">

        {/* Efek cahaya hijau di dasar podium */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-8 bg-[#00ff9d]/10 blur-2xl rounded-full pointer-events-none" />

        {/* ── POSISI KE-2 (Kiri) ── */}
        {secondPlace && <SecondPlaceStand player={secondPlace} />}

        {/* ── POSISI KE-1 (Tengah) ── */}
        {firstPlace && <FirstPlaceStand player={firstPlace} />}

        {/* ── POSISI KE-3 (Kanan) ── */}
        {thirdPlace && <ThirdPlaceStand player={thirdPlace} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: Stand Posisi ke-2 (Perak)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Podium posisi ke-2 dengan tema warna slate/perak.
 * Tinggi stand lebih rendah dari posisi ke-1 tapi lebih tinggi dari ke-3.
 */
function SecondPlaceStand({ player }: { player: Participant }) {
  // Custom delay order = 2 (muncul kedua setelah posisi ke-3)
  const customOrder = 2;

  return (
    <div className="flex flex-col items-center relative z-10 mx-1 sm:mx-2">
      {/* Plat nama — slide dari kiri */}
      <PodiumNameplate
        player={player}
        customOrder={customOrder}
        borderColorClass="border-slate-400"
        bgClass="bg-[#0d1526]/90"
        shadowStyle="4px 4px 0px rgba(148,163,184,0.2)"
        gradientClass="from-slate-400/10"
        textSizeClass="text-xs sm:text-base"
        maxWidthClass="max-w-[100px] sm:max-w-[130px]"
        tooltipBgClass="bg-slate-800"
        tooltipBorderClass="border-slate-400"
        tooltipTextClass="text-slate-100"
        tooltipShadowStyle="0 0 10px rgba(148,163,184,0.5)"
        tooltipTextSize="text-[10px] sm:text-xs"
      />

      {/* Stand podium — naik dari bawah */}
      <motion.div
        custom={customOrder}
        variants={standVariants}
        initial="hidden"
        animate="visible"
        className="w-[88px] sm:w-[130px] h-[120px] sm:h-[185px] relative overflow-hidden rounded-t-md"
        style={{
          background: "linear-gradient(to bottom, #1e2d45 0%, #0d1526 60%, #04060f 100%)",
          borderTop: "3px solid #94a3b8",
        }}
      >
        {/* Efek flash garis kecepatan saat masuk */}
        <SpeedLineFlash customOrder={customOrder} colorClass="via-white/30" />

        {/* Api exhaust di dasar podium */}
        <ExhaustFlame
          customOrder={customOrder}
          bgStyle="linear-gradient(to top, rgba(148,163,184,0.3), transparent)"
          heightClass="h-6"
        />

        {/* Gauge RPM + Avatar */}
        <div className="flex flex-col items-center justify-start pt-4 h-full relative z-10">
          <RpmGaugeAvatar
            player={player}
            customOrder={customOrder}
            svgSizeClass="w-[60px] h-[60px] sm:w-[80px] sm:h-[80px]"
            strokeColor="#94a3b8"
            strokeBgColor="rgba(148,163,184,0.08)"
            strokeWidth={6}
            avatarBorderClass="border border-slate-600/50"
            avatarBgClass="bg-slate-900/80"
            avatarSize="md"
          />

          {/* Skor pemain */}
          <div className={`mt-auto mb-3 font-mono text-lg sm:text-2xl font-black tracking-tighter ${player.score >= 75 ? 'text-green-400 drop-shadow-[0_0_12px_rgba(34,197,94,0.5)]' : 'text-red-400 drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]'}`}>
            <Odometer value={player.score} delay={customOrder * 0.55 + 0.8} />
          </div>
        </div>

        {/* Angka posisi besar transparan di background */}
        <div className="absolute -bottom-1 right-1 font-display text-[60px] sm:text-[80px] font-black leading-none text-white opacity-[0.04] select-none pointer-events-none">2</div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: Stand Posisi ke-1 (Emas)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Podium posisi ke-1 dengan tema warna emas/kuning.
 * Stand paling tinggi, avatar paling besar, efek paling megah.
 * Dilengkapi rotating nitro ring dan double exhaust flame.
 */
function FirstPlaceStand({ player }: { player: Participant }) {
  // Custom delay order = 3 (muncul terakhir — paling dramatis)
  const customOrder = 3;

  return (
    <div className="flex flex-col items-center relative z-20 mx-2 sm:mx-3">
      {/* Plat nama — emas dengan shadow glow */}
      <motion.div
        custom={customOrder}
        variants={nameplateVariants}
        initial="hidden"
        animate="visible"
        className="mb-2 z-30 relative group cursor-pointer"
      >
        <div className="bg-yellow-500 border-l-4 border-yellow-200 pl-4 pr-5 py-1.5 transform -skew-x-[10deg] shadow-[4px_4px_0px_rgba(234,179,8,0.4),0_0_20px_rgba(234,179,8,0.3)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-300/20 to-transparent" />
          <p className="font-display text-white text-sm sm:text-2xl font-black tracking-widest uppercase truncate max-w-[160px] sm:max-w-[200px] skew-x-[10deg] drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
            {player.nickname}
          </p>
        </div>

        {/* Tooltip nama pemain */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 flex flex-col items-center drop-shadow-xl translate-y-2 group-hover:translate-y-0">
          <div className="bg-yellow-900 border-2 border-yellow-400 text-yellow-300 text-xs sm:text-sm font-display tracking-widest py-1.5 px-4 transform -skew-x-[15deg] shadow-[0_0_15px_rgba(250,204,21,0.6)]">
            <span className="transform skew-x-[15deg] block whitespace-nowrap font-black">
              {player.nickname}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Stand podium — paling tinggi */}
      <motion.div
        custom={customOrder}
        variants={standVariants}
        initial="hidden"
        animate="visible"
        className="w-[105px] sm:w-[160px] h-[165px] sm:h-[260px] relative overflow-hidden rounded-t-xl"
        style={{
          background: "linear-gradient(to bottom, #78350f 0%, #451a03 50%, #04060f 100%)",
          borderTop: "4px solid #facc15",
          boxShadow: "0 0 40px rgba(234,179,8,0.15), 0 0 80px rgba(234,179,8,0.06)",
        }}
      >
        {/* Efek flash garis kecepatan */}
        <SpeedLineFlash customOrder={customOrder} colorClass="via-yellow-300/40" duration={0.6} initialOpacity={0.9} />

        {/* NITRO EXHAUST — api ganda di dasar podium */}
        <motion.div
          animate={{ scaleY: [1, 1.8, 0.7, 1.5, 1], opacity: [0.7, 1, 0.4, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut", delay: customOrder * 0.55 + 0.6 }}
          className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none z-10"
          style={{
            background: "linear-gradient(to top, rgba(251,191,36,0.4), rgba(251,191,36,0.1), transparent)",
            filter: "blur(6px)",
          }}
        />
        {/* Api bagian dalam — lebih intens */}
        <motion.div
          animate={{ scaleY: [1, 1.3, 0.8, 1.2, 1], opacity: [0.4, 0.7, 0.2, 0.6, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut", delay: customOrder * 0.55 + 0.65 }}
          className="absolute bottom-0 left-1/4 right-1/4 h-14 pointer-events-none z-10"
          style={{
            background: "linear-gradient(to top, rgba(250,204,21,0.6), rgba(251,146,60,0.3), transparent)",
            filter: "blur(8px)",
          }}
        />

        {/* Gauge RPM + Avatar + Rotating Ring */}
        <div className="flex flex-col items-center justify-start pt-5 sm:pt-7 h-full relative z-10">
          <div className="relative">
            <svg className="w-[72px] h-[72px] sm:w-[96px] sm:h-[96px]" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="50%" cy="50%" r="44%" fill="none" stroke="rgba(250,204,21,0.08)" strokeWidth="7" />
              <motion.circle
                custom={customOrder}
                variants={rpmGaugeVariants}
                cx="50%" cy="50%" r="44%" fill="none" stroke="#facc15" strokeWidth="7"
                strokeLinecap="round"
              />
            </svg>

            {/* Cincin nitro yang berputar */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="absolute inset-0 rounded-full"
              style={{ border: "2px dashed rgba(250,204,21,0.2)" }}
            />

            {/* Avatar di tengah gauge */}
            <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-3">
              <div className="w-full h-full rounded-full overflow-hidden bg-yellow-950/60 border-2 border-yellow-500/60 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                {player.avatar_url ? (
                  <img src={player.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <InitialsAvatar name={player.nickname} size="lg" />
                )}
              </div>
            </div>
          </div>

          {/* Skor pemain — paling besar */}
          <div className={`mt-auto mb-5 sm:mb-7 font-mono text-3xl sm:text-5xl font-black tracking-tighter italic ${player.score >= 75 ? 'text-green-400 drop-shadow-[0_0_20px_rgba(34,197,94,0.5)]' : 'text-red-400 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]'}`}>
            <Odometer value={player.score} delay={customOrder * 0.55 + 0.8} />
          </div>
        </div>

        {/* Angka posisi besar transparan */}
        <div className="absolute -bottom-3 right-1 font-display text-[90px] sm:text-[130px] font-black leading-none text-yellow-400 opacity-[0.05] select-none pointer-events-none">1</div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN: Stand Posisi ke-3 (Perunggu)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Podium posisi ke-3 dengan tema warna oranye/perunggu.
 * Stand paling pendek, muncul pertama kali untuk membangun suspense.
 */
function ThirdPlaceStand({ player }: { player: Participant }) {
  // Custom delay order = 1 (muncul pertama)
  const customOrder = 1;

  return (
    <div className="flex flex-col items-center relative z-10 mx-1 sm:mx-2">
      {/* Plat nama */}
      <PodiumNameplate
        player={player}
        customOrder={customOrder}
        borderColorClass="border-orange-700"
        bgClass="bg-[#0d1526]/90"
        shadowStyle="4px 4px 0px rgba(194,65,12,0.2)"
        gradientClass="from-orange-700/10"
        textSizeClass="text-xs sm:text-sm"
        maxWidthClass="max-w-[90px] sm:max-w-[110px]"
        tooltipBgClass="bg-[#1a0a05]"
        tooltipBorderClass="border-orange-600"
        tooltipTextClass="text-orange-400"
        tooltipShadowStyle="0 0 10px rgba(194,65,12,0.5)"
        tooltipTextSize="text-[10px] sm:text-xs"
      />

      {/* Stand podium */}
      <motion.div
        custom={customOrder}
        variants={standVariants}
        initial="hidden"
        animate="visible"
        className="w-[78px] sm:w-[115px] h-[95px] sm:h-[155px] relative overflow-hidden rounded-t-md"
        style={{
          background: "linear-gradient(to bottom, #2a1309 0%, #1a0a05 60%, #04060f 100%)",
          borderTop: "3px solid #c2410c",
        }}
      >
        {/* Flash garis kecepatan */}
        <SpeedLineFlash customOrder={customOrder} colorClass="via-orange-400/25" />

        {/* Api exhaust */}
        <ExhaustFlame
          customOrder={customOrder}
          bgStyle="linear-gradient(to top, rgba(194,65,12,0.3), transparent)"
          heightClass="h-5"
          animConfig={{ scaleY: [1, 1.4, 0.8, 1.3, 1], opacity: [0.5, 0.9, 0.3, 0.8, 0.5] }}
          duration={2.0}
        />

        {/* Gauge RPM + Avatar */}
        <div className="flex flex-col items-center justify-start pt-3 sm:pt-4 h-full relative z-10">
          <RpmGaugeAvatar
            player={player}
            customOrder={customOrder}
            svgSizeClass="w-[52px] h-[52px] sm:w-[64px] sm:h-[64px]"
            strokeColor="#ea580c"
            strokeBgColor="rgba(194,65,12,0.08)"
            strokeWidth={5}
            avatarBorderClass="border border-orange-700/40"
            avatarBgClass="bg-orange-950/40"
            avatarSize="sm"
            avatarPaddingClass="p-1.5 sm:p-2"
          />

          {/* Skor pemain */}
          <div className={`mt-auto mb-2 sm:mb-3 font-mono text-base sm:text-xl font-bold tracking-tighter ${player.score >= 75 ? 'text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.4)]'}`}>
            <Odometer value={player.score} delay={customOrder * 0.55 + 0.8} />
          </div>
        </div>

        {/* Angka posisi besar transparan */}
        <div className="absolute -bottom-1 right-1 font-display text-[50px] sm:text-[70px] font-black leading-none text-orange-700 opacity-[0.05] select-none pointer-events-none">3</div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-KOMPONEN PENDUKUNG (Reusable di ketiga stand)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Plat nama pemain dengan tooltip hover.
 * Digunakan oleh posisi ke-2 dan ke-3. Posisi ke-1 punya style khusus.
 */
function PodiumNameplate({
  player,
  customOrder,
  borderColorClass,
  bgClass,
  shadowStyle,
  gradientClass,
  textSizeClass,
  maxWidthClass,
  tooltipBgClass,
  tooltipBorderClass,
  tooltipTextClass,
  tooltipShadowStyle,
  tooltipTextSize,
}: {
  player: Participant;
  customOrder: number;
  borderColorClass: string;
  bgClass: string;
  shadowStyle: string;
  gradientClass: string;
  textSizeClass: string;
  maxWidthClass: string;
  tooltipBgClass: string;
  tooltipBorderClass: string;
  tooltipTextClass: string;
  tooltipShadowStyle: string;
  tooltipTextSize: string;
}) {
  return (
    <motion.div
      custom={customOrder}
      variants={nameplateVariants}
      initial="hidden"
      animate="visible"
      className="mb-2 z-30 relative group cursor-pointer"
    >
      {/* Plat nama utama */}
      <div
        className={`${bgClass} border-l-4 ${borderColorClass} backdrop-blur-xl pl-3 pr-4 py-1 transform -skew-x-[10deg] relative overflow-hidden`}
        style={{ boxShadow: shadowStyle }}
      >
        <div className={`absolute inset-0 bg-gradient-to-r ${gradientClass} to-transparent`} />
        <p className={`font-display text-white ${textSizeClass} font-black tracking-widest truncate ${maxWidthClass} skew-x-[10deg]`}>
          {player.nickname}
        </p>
      </div>

      {/* Tooltip hover — menampilkan nama lengkap */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 flex flex-col items-center drop-shadow-xl translate-y-2 group-hover:translate-y-0">
        <div
          className={`${tooltipBgClass} border-2 ${tooltipBorderClass} ${tooltipTextClass} ${tooltipTextSize} font-display tracking-widest py-1 px-3 transform -skew-x-[15deg]`}
          style={{ boxShadow: tooltipShadowStyle }}
        >
          <span className="transform skew-x-[15deg] block whitespace-nowrap">
            {player.nickname}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Efek flash garis kecepatan yang menyapu horizontal saat stand muncul.
 * Memberikan kesan gerakan cepat saat podium naik.
 */
function SpeedLineFlash({
  customOrder,
  colorClass,
  duration = 0.5,
  initialOpacity = 0.7,
}: {
  customOrder: number;
  colorClass: string;
  duration?: number;
  initialOpacity?: number;
}) {
  return (
    <motion.div
      initial={{ x: "-100%", opacity: initialOpacity }}
      animate={{ x: "200%", opacity: 0 }}
      transition={{ delay: customOrder * 0.55 + 0.1, duration, ease: "easeOut" }}
      className={`absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent ${colorClass} to-transparent skew-x-[-20deg] pointer-events-none z-20`}
    />
  );
}

/**
 * Efek api exhaust berkedip di dasar podium.
 * Memberikan kesan mesin mobil balap yang menyala.
 */
function ExhaustFlame({
  customOrder,
  bgStyle,
  heightClass,
  animConfig,
  duration = 1.8,
}: {
  customOrder: number;
  bgStyle: string;
  heightClass: string;
  animConfig?: { scaleY: number[]; opacity: number[] };
  duration?: number;
}) {
  const defaultAnim = { scaleY: [1, 1.4, 0.9, 1.2, 1], opacity: [0.6, 1, 0.5, 0.9, 0.6] };
  const anim = animConfig || defaultAnim;

  return (
    <motion.div
      animate={anim}
      transition={{ repeat: Infinity, duration, ease: "easeInOut", delay: customOrder * 0.55 + 0.6 }}
      className={`absolute bottom-0 left-0 right-0 ${heightClass} pointer-events-none z-10`}
      style={{ background: bgStyle, filter: "blur(4px)" }}
    />
  );
}

/**
 * Gauge RPM melingkar dengan avatar pemain di tengahnya.
 * Lingkaran SVG beranimasi pathLength dari 0→1 untuk efek pengisian.
 */
function RpmGaugeAvatar({
  player,
  customOrder,
  svgSizeClass,
  strokeColor,
  strokeBgColor,
  strokeWidth,
  avatarBorderClass,
  avatarBgClass,
  avatarSize,
  avatarPaddingClass = "p-2",
}: {
  player: Participant;
  customOrder: number;
  svgSizeClass: string;
  strokeColor: string;
  strokeBgColor: string;
  strokeWidth: number;
  avatarBorderClass: string;
  avatarBgClass: string;
  avatarSize: "sm" | "md" | "lg";
  avatarPaddingClass?: string;
}) {
  return (
    <div className="relative">
      <svg className={svgSizeClass} style={{ transform: "rotate(-90deg)" }}>
        <circle cx="50%" cy="50%" r="44%" fill="none" stroke={strokeBgColor} strokeWidth={strokeWidth} />
        <motion.circle
          custom={customOrder}
          variants={rpmGaugeVariants}
          cx="50%" cy="50%" r="44%" fill="none" stroke={strokeColor} strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center ${avatarPaddingClass}`}>
        <div className={`w-full h-full rounded-full overflow-hidden ${avatarBgClass} ${avatarBorderClass}`}>
          {player.avatar_url ? (
            <img src={player.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <InitialsAvatar name={player.nickname} size={avatarSize} />
          )}
        </div>
      </div>
    </div>
  );
}
