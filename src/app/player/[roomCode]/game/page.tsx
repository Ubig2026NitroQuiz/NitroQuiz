'use client';

/**
 * page.tsx — Halaman Game Balap (Racing Canvas)
 * ═════════════════════════════════════════════
 *
 * Engine balap pseudo-3D yang dirender menggunakan HTML Canvas.
 * Pemain mengendalikan kendaraan di lintasan, menjawab kuis setiap lap.
 *
 * Fitur utama:
 * 1. Rendering pseudo-3D road (Mode7-style) via Canvas 2D
 * 2. NPC kendaraan animasi (truk, JNE, odong-odong, taksi)
 * 3. Sistem NOS (Nitro Oxide) dengan animasi sprite
 * 4. Dual POV: first-person & third-person (toggle via T / tombol)
 * 5. Kontrol: keyboard (PC) / touch swipe (mobile portrait) / tombol (mobile landscape)
 * 6. Timer global berbasis server time (sync via Supabase)
 * 7. Mini-map track dengan posisi pemain & rival
 * 8. Preload aset dari waiting room (global store)
 * 9. Transisi ke halaman kuis setelah finish line
 * 10. Guard Realtime: redirect otomatis jika session berubah status
 *
 * Arsitektur:
 * ├── components/game/types.ts      → Tipe data (Point, Segment, Car, dll)
 * ├── components/game/constants.ts  → Konstanta (FPS, ROAD_WIDTH, COLORS, dll)
 * ├── components/game/utils.ts      → Fungsi utilitas (Util.project, Util.overlap, dll)
 * └── page.tsx (file ini)           → Logika game loop, rendering, & UI overlay
 *
 * Alur permainan:
 * 1. Load aset (dari global store atau fetch baru)
 * 2. Pilih orientasi (mobile) atau langsung mulai (PC)
 * 3. Game loop: update physics → render canvas → update mini-map
 * 4. Saat mencapai finish line → simpan progress → redirect ke /quiz
 * 5. Setelah semua soal habis → endGame → redirect ke /result
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ASSET_LIST, TRACK_ASSETS, getAssetOffset } from '@/lib/gameAssets';
import { useTranslation } from 'react-i18next';
import { getI18nInstance } from '@/lib/i18n';
getI18nInstance(); // Inisialisasi i18n

import { supabase } from '@/lib/supabase';
import { getSyncedServerTime, syncServerTime } from '@/lib/serverTime';

// ── Modul game engine (types, constants, utils) ──
import {
  Util,
  COLORS, ROAD_CONF,
  FPS, STEP, ROAD_WIDTH, SEGMENT_LENGTH, RUMBLE_LENGTH, LANES, DRAW_DISTANCE,
  MAX_SPEED, ACCEL, BREAKING, DECEL, OFF_ROAD_DECEL, OFF_ROAD_LIMIT,
  QUESTIONS_PER_ROUND,
  getDifficultyConfig,
} from '@/components/game';
import type {
  QuizQuestion, Point, Sprite, Car, Segment,
  GameState, MobileOrientation, ViewMode,
} from '@/components/game';

// ════════════════════════════════════════════════════════════════
//  KOMPONEN UTAMA: GameSpeedPage
// ════════════════════════════════════════════════════════════════
export default function GameSpeedPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const roomCode = (params?.roomCode as string)?.toUpperCase();

  // ── Ref canvas utama ──
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ════════════════════════════════════════════════════════════════
  // STATE: GAME
  // ════════════════════════════════════════════════════════════════

  const [gameState, setGameState] = useState<GameState>('preparation');
  const [stats, setStats] = useState({ speed: 0, nos: 100, lap: 1, totalLaps: 1 });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [globalTimeLeft, setGlobalTimeLeft] = useState<number | null>(null);
  const [isTimerReady, setIsTimerReady] = useState(false);
  const [lapRace, setLapRace] = useState(0);

  // ════════════════════════════════════════════════════════════════
  // STATE: UI / DISPLAY
  // ════════════════════════════════════════════════════════════════

  const [viewMode, setViewMode] = useState<ViewMode>('third');
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [miniMapMinimized, setMiniMapMinimized] = useState(false);
  const [isBraking, setIsBraking] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);
  const [mobileOrientationChoice, setMobileOrientationChoice] = useState<MobileOrientation>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nitroquiz_orientation');
      if (saved === 'portrait' || saved === 'landscape') return saved;
    }
    return null;
  });

  // ════════════════════════════════════════════════════════════════
  // STATE: KUIS
  // ════════════════════════════════════════════════════════════════

  const [allQuizQuestions, setAllQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizQuestionIndex, setQuizQuestionIndex] = useState(0);
  const [totalQuizScore, setTotalQuizScore] = useState(0);

  // ════════════════════════════════════════════════════════════════
  // DATA TURUNAN (derived states)
  // ════════════════════════════════════════════════════════════════

  /** Gunakan layout PC (desktop atau mobile landscape) */
  const usePCLayout = !isMobile || mobileOrientationChoice === 'landscape';
  /** Mobile dalam mode landscape */
  const isMobileLandscape = isMobile && mobileOrientationChoice === 'landscape';
  /** Mobile dalam mode portrait */
  const isMobilePortrait = isMobile && mobileOrientationChoice === 'portrait';

  // ════════════════════════════════════════════════════════════════
  // REFS: KONTROL SENTUH / SWIPE
  // ════════════════════════════════════════════════════════════════

  const touchStartX = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);
  const steeringTouchId = useRef<number | null>(null);

  // ════════════════════════════════════════════════════════════════
  // REFS: STATE GAME LOOP (mutable, tidak trigger re-render)
  // ════════════════════════════════════════════════════════════════

  /**
   * State internal game loop.
   * Disimpan di useRef agar bisa diakses langsung
   * tanpa stale closure di requestAnimationFrame.
   */
  const state = useRef({
    // ── Track & posisi ──
    segments: [] as Segment[],
    cars: [] as Car[],
    position: 0,
    playerX: 0,
    playerZ: 0,
    speed: 0,
    trackLength: 0,

    // ── Aset gambar ──
    sprites: { car: null, bg: null, obstacle: null } as any,

    // ── Input keyboard ──
    keyLeft: false,
    keyRight: false,
    keyFaster: false,
    keySlower: false,
    keyBoost: false,

    // ── Mekanik permainan ──
    nos: 100,
    currentLap: 1,
    totalLaps: 1,
    countdown: 5,

    // ── Kamera ──
    cameraDepth: 1 / Math.tan((100 / 2) * Math.PI / 180),
    viewMode: 'third' as ViewMode,
    bgOffset: 0,

    // ── Analog steering (mobile portrait) ──
    analogSteer: 0,

    // ── State animasi NOS ──
    nosPhase: 'idle' as 'idle' | 'startup' | 'loop' | 'ending',
    nosFrame: 0,
    nosFrameTimer: 0,
    nosWasPressed: false,

    // ── State animasi revving (start / rem) ──
    revvingFrame: 0,
    revvingTimer: 0,

    // ── State animasi MC (forward driving) ──
    mcFrame: 0,
    mcTimer: 0,

    // ── Duplikat state kuis untuk akses di game loop (hindari stale closure) ──
    allQuizQuestions: [] as QuizQuestion[],
    quizQuestionIndex: 0,
    totalQuizScore: 0,
  });

  const animationFrameRef = useRef<number>(0);
  const miniMapRef = useRef<HTMLCanvasElement>(null);

  // ── Inisialisasi flag finish line ──
  useEffect(() => {
    if (state.current) (state.current as any).hasFinishedLine = false;
  }, []);

  // ════════════════════════════════════════════════════════════════
  // HELPER: Sinkronisasi status peserta ke Supabase
  // ════════════════════════════════════════════════════════════════

  /** Update data peserta di database (untuk monitor host) */
  const updateParticipantStatus = useCallback(async (updates: Record<string, any>) => {
    const participantId = typeof window !== 'undefined' ? localStorage.getItem('nitroquiz_game_participantId') : null;
    if (participantId) {
      try {
        await supabase.from('participants').update(updates).eq('id', participantId);
      } catch (error) {
        console.error('Failed to sync participant status:', error);
      }
    }
  }, []);

  // ════════════════════════════════════════════════════════════════
  // HELPER: Deteksi ukuran layar & perangkat mobile
  // ════════════════════════════════════════════════════════════════

  const setSize = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
    }
    const w = window.innerWidth;
    const h = window.innerHeight;
    const ratio = w / h;
    setAspectRatio(ratio);

    // Deteksi mobile: layar kecil ATAU portrait dengan dukungan touch
    const hasTouchSupport = (typeof window !== 'undefined') && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    const isPortrait = ratio < 1;
    const isSmallScreen = w < 768;
    const detectedMobile = (isSmallScreen || isPortrait) && hasTouchSupport;
    setIsMobile(detectedMobile);
  }, [mobileOrientationChoice]);

  // ════════════════════════════════════════════════════════════════
  // SECTION: ROAD BUILDER — Fungsi untuk membangun track
  // ════════════════════════════════════════════════════════════════

  /**
   * Cari segmen berdasarkan posisi Z.
   * Mengembalikan dummy segment jika track belum diinisialisasi.
   */
  const findSegment = (z: number): Segment => {
    if (!state.current.segments || state.current.segments.length === 0) {
      return {
        index: 0,
        p1: { world: { x: 0, y: 0, z: 0 }, camera: { x: 0, y: 0, z: 0 }, screen: { scale: 0, x: 0, y: 0, w: 0 } },
        p2: { world: { x: 0, y: 0, z: 0 }, camera: { x: 0, y: 0, z: 0 }, screen: { scale: 0, x: 0, y: 0, w: 0 } },
        curve: 0, color: COLORS.LIGHT, sprites: [], cars: [], clip: 0, fog: 0, looped: false,
      } as Segment;
    }
    return state.current.segments[Math.floor(z / SEGMENT_LENGTH) % state.current.segments.length];
  };

  /** Tambah satu segmen jalan ke track */
  const addSegment = (curve: number, y: number) => {
    const n = state.current.segments.length;
    const lastY = n === 0 ? 0 : state.current.segments[n - 1].p2.world.y;
    state.current.segments.push({
      index: n,
      p1: { world: { x: 0, y: lastY, z: n * SEGMENT_LENGTH }, camera: { x: 0, y: 0, z: 0 }, screen: { scale: 0, x: 0, y: 0, w: 0 } },
      p2: { world: { x: 0, y: y, z: (n + 1) * SEGMENT_LENGTH }, camera: { x: 0, y: 0, z: 0 }, screen: { scale: 0, x: 0, y: 0, w: 0 } },
      curve: curve, sprites: [], cars: [],
      color: Math.floor(n / RUMBLE_LENGTH) % 2 ? COLORS.DARK : COLORS.LIGHT,
      fog: 0, clip: 0, looped: false,
    });
  };

  /** Tambah seksi jalan (enter → hold → leave) dengan kurva dan ketinggian */
  const addRoad = (enter: number, hold: number, leave: number, curve: number, y: number) => {
    const startY = state.current.segments.length === 0 ? 0 : state.current.segments[state.current.segments.length - 1].p2.world.y;
    const endY = startY + (Util.toInt(y, 0) * SEGMENT_LENGTH);
    const total = enter + hold + leave;
    for (let n = 0; n < enter; n++) addSegment(Util.easeIn(0, curve, n / enter), Util.easeInOut(startY, endY, n / total));
    for (let n = 0; n < hold; n++) addSegment(curve, Util.easeInOut(startY, endY, (enter + n) / total));
    for (let n = 0; n < leave; n++) addSegment(Util.easeInOut(curve, 0, n / leave), Util.easeInOut(startY, endY, (enter + hold + n) / total));
  };

  /** Tambah jalan lurus */
  const addStraight = (num?: number) => {
    num = num || ROAD_CONF.LENGTH.MEDIUM;
    addRoad(num, num, num, 0, 0);
  };

  /** Tambah tikungan */
  const addCurve = (num?: number, curve?: number, height?: number) => {
    num = num || ROAD_CONF.LENGTH.MEDIUM;
    curve = curve || ROAD_CONF.CURVE.MEDIUM;
    height = height || ROAD_CONF.HILL.NONE;
    addRoad(num, num, num, curve, height);
  };

  /** Tambah rangkaian tikungan S-curve */
  const addSCurves = () => {
    addRoad(ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.LENGTH.MEDIUM, -ROAD_CONF.CURVE.EASY, ROAD_CONF.HILL.NONE);
    addRoad(ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.CURVE.MEDIUM, ROAD_CONF.HILL.MEDIUM);
    addRoad(ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.CURVE.EASY, -ROAD_CONF.HILL.LOW);
    addRoad(ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.LENGTH.MEDIUM, -ROAD_CONF.CURVE.EASY, ROAD_CONF.HILL.MEDIUM);
    addRoad(ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.LENGTH.MEDIUM, -ROAD_CONF.CURVE.MEDIUM, -ROAD_CONF.HILL.MEDIUM);
  };

  /** Tambah gundukan jalan */
  const addBumps = () => {
    addRoad(10, 10, 10, 0, 5); addRoad(10, 10, 10, 0, -2);
    addRoad(10, 10, 10, 0, -5); addRoad(10, 10, 10, 0, 8);
    addRoad(10, 10, 10, 0, 5); addRoad(10, 10, 10, 0, -7);
    addRoad(10, 10, 10, 0, 5); addRoad(10, 10, 10, 0, -2);
  };

  /** Tambah turunan ke akhir track */
  const addDownhillToEnd = (num: number) => {
    num = num || 200;
    const lastY = state.current.segments.length === 0 ? 0 : state.current.segments[state.current.segments.length - 1].p2.world.y;
    addRoad(num, num, num, -ROAD_CONF.CURVE.EASY, -lastY / SEGMENT_LENGTH);
  };

  // ════════════════════════════════════════════════════════════════
  // SECTION: RESET ROAD — Bangun ulang track & spawn NPC
  // ════════════════════════════════════════════════════════════════

  /**
   * Reset dan bangun ulang seluruh track berdasarkan difficulty.
   * Juga spawn NPC, obstacle, rival, dan tempatkan aset di sisi jalan.
   */
  const resetRoad = () => {
    const difficulty = localStorage.getItem('nitroquiz_game_difficulty') || 'easy';
    const diffConfig = getDifficultyConfig(difficulty);

    state.current.segments = [];
    (state.current as any).hasFinishedLine = false;

    // ── Bangun track berdasarkan tipe ──
    if (diffConfig.trackType === 'complex') {
      // MEDIUM / HARD: Tikungan S-curve + gundukan
      addStraight(ROAD_CONF.LENGTH.SHORT);
      addCurve(ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.CURVE.EASY, ROAD_CONF.HILL.NONE);
      addStraight(ROAD_CONF.LENGTH.SHORT);
      addSCurves(); addBumps();
      addCurve(ROAD_CONF.LENGTH.LONG, -ROAD_CONF.CURVE.MEDIUM, ROAD_CONF.HILL.MEDIUM);
      addStraight(ROAD_CONF.LENGTH.MEDIUM);
      addSCurves();
      addCurve(ROAD_CONF.LENGTH.LONG, ROAD_CONF.CURVE.HARD, -ROAD_CONF.HILL.MEDIUM);
      addCurve(ROAD_CONF.LENGTH.LONG, -ROAD_CONF.CURVE.HARD, ROAD_CONF.HILL.HIGH);
      addBumps();
      addStraight(ROAD_CONF.LENGTH.MEDIUM);
      addDownhillToEnd(250);
    } else {
      // EASY: Track sederhana
      addStraight(ROAD_CONF.LENGTH.SHORT);
      addCurve(ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.CURVE.MEDIUM, ROAD_CONF.HILL.LOW);
      addStraight(ROAD_CONF.LENGTH.LONG);
      addCurve(ROAD_CONF.LENGTH.MEDIUM, -ROAD_CONF.CURVE.MEDIUM, ROAD_CONF.HILL.NONE);
      addStraight(ROAD_CONF.LENGTH.MEDIUM);
      addCurve(ROAD_CONF.LENGTH.LONG, ROAD_CONF.CURVE.EASY, ROAD_CONF.HILL.MEDIUM);
      addStraight(ROAD_CONF.LENGTH.LONG);
      addCurve(ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.CURVE.MEDIUM, -ROAD_CONF.HILL.LOW);
      addStraight(ROAD_CONF.LENGTH.SHORT);
      addDownhillToEnd(200);
    }

    const len = state.current.segments.length;

    // ── Penempatan aset di sisi jalan ──
    const occupied: { [key: string]: boolean } = {};
    TRACK_ASSETS.forEach(item => {
      const segIdx = item.z;
      if (segIdx < len) {
        if (item.src) {
          let sprite = state.current.sprites[item.src];
          if (sprite) {
            const offset = item.offset !== undefined ? item.offset : getAssetOffset(item.side, item.src);
            state.current.segments[segIdx].sprites.push({ source: sprite, offset: offset, offsetY: -1 });
            occupied[`${segIdx}_${item.side}`] = true;
            occupied[`${segIdx + 1}_${item.side}`] = true;
            occupied[`${segIdx + 2}_${item.side}`] = true;
            // Tambah zebra cross jika aset adalah lampu lalu lintas
            if (item.src.includes('lampulalulintas')) {
              for (let z = 0; z < 10; z++) {
                if (state.current.segments[segIdx + z]) {
                  state.current.segments[segIdx + z].zebra = true;
                }
              }
            }
          }
        }
      }
    });

    state.current.trackLength = len * SEGMENT_LENGTH;

    // ── Spawn NPC (jumlah berdasarkan difficulty) ──
    state.current.cars = [];
    for (let n = 0; n < diffConfig.npcCount; n++) {
      const z = (n + 1) * (len * SEGMENT_LENGTH / diffConfig.npcCount);
      const offset = Util.randomChoice([-0.8, -0.4, 0.4, 0.8]);
      const speed = MAX_SPEED / 4 + Math.random() * (MAX_SPEED / 2);

      const vehicleTypeRnd = Math.random();
      let vehicleType: 'truck' | 'jne' | 'odong' | 'taxi' = 'truck';
      let vehicleSprite = state.current.sprites.truck2;

      if (vehicleTypeRnd < 0.25) {
        vehicleType = 'truck';
        vehicleSprite = state.current.sprites.truck_straight_0 || state.current.sprites.truck2;
      } else if (vehicleTypeRnd < 0.5) {
        vehicleType = 'jne';
        vehicleSprite = state.current.sprites.jne_straight_1;
      } else if (vehicleTypeRnd < 0.75) {
        vehicleType = 'odong';
        vehicleSprite = state.current.sprites.odong_straight;
      } else {
        vehicleType = 'taxi';
        vehicleSprite = state.current.sprites.taxi_straight || state.current.sprites.truck2;
      }

      const car: Car = {
        offset, z, sprite: vehicleSprite, speed, percent: 0,
        type: vehicleType, animTimer: Math.random() * 100, animFrame: 0,
      };
      state.current.cars.push(car);
      findSegment(z).cars.push(car);
    }

    // ── Spawn obstacle statis (medium + hard) ──
    if (diffConfig.obstacleCount > 0) {
      for (let n = 0; n < diffConfig.obstacleCount; n++) {
        const zLength = len * SEGMENT_LENGTH;
        const startOffset = 20 * SEGMENT_LENGTH;
        const z = startOffset + Math.random() * (zLength - startOffset - 1000);
        const offset = (Math.random() * 1.6) - 0.8;
        const isBarrier = Math.random() > 0.5;
        const obstacleSprite = isBarrier ? state.current.sprites.obstacle2 : state.current.sprites.obstacle1;
        const obstacle: Car = {
          offset, z, sprite: obstacleSprite || state.current.sprites.truck2,
          speed: 0, percent: 0, type: 'obstacle' as any,
        };
        state.current.cars.push(obstacle);
        findSegment(z).cars.push(obstacle);
      }
    }

    // ── Spawn rival NPC ──
    const rivalCar: Car = {
      offset: -0.4, z: 200 * SEGMENT_LENGTH,
      sprite: state.current.sprites.car_rival || state.current.sprites.npc_car,
      speed: MAX_SPEED * 0.7, percent: 0, isRival: true,
    };
    state.current.cars.push(rivalCar);
    findSegment(rivalCar.z).cars.push(rivalCar);

    // ── Warnai garis finish ──
    for (let n = 0; n < RUMBLE_LENGTH; n++) {
      if (len - 1 - n >= 0) state.current.segments[len - 1 - n].color = COLORS.FINISH;
    }

    state.current.trackLength = len * SEGMENT_LENGTH;
  };

  // ════════════════════════════════════════════════════════════════
  // SECTION: RENDERING — Fungsi menggambar ke Canvas
  // ════════════════════════════════════════════════════════════════

  /**
   * Render satu segmen jalan (rumble, sidewalk, road, lane, zebra).
   */
  const renderSegment = (ctx: CanvasRenderingContext2D, width: number, lanes: number, x1: number, y1: number, w1: number, x2: number, y2: number, w2: number, fog: number, color: any, zebra: boolean = false) => {
    const r1 = w1 / Math.max(6, 2 * lanes);
    const r2 = w2 / Math.max(6, 2 * lanes);

    // Rumput
    ctx.fillStyle = color.grass;
    ctx.fillRect(0, y2, width, y1 - y2);

    // Tekstur tanah
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let i = 0; i < 20; i++) {
      const rx = Math.random() * width;
      const ry = y2 + Math.random() * (y1 - y2);
      const rw = 1 + Math.random() * 3;
      ctx.fillRect(rx, ry, rw, 1);
    }

    // Rumble strip (pembatas tepi jalan)
    ctx.fillStyle = color.rumble;
    ctx.beginPath(); ctx.moveTo(x1 - w1 - r1, y1); ctx.lineTo(x1 - w1, y1); ctx.lineTo(x2 - w2, y2); ctx.lineTo(x2 - w2 - r2, y2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x1 + w1 + r1, y1); ctx.lineTo(x1 + w1, y1); ctx.lineTo(x2 + w2, y2); ctx.lineTo(x2 + w2 + r2, y2); ctx.closePath(); ctx.fill();

    // Trotoar
    const sw1 = w1 * 0.5; const sw2 = w2 * 0.5;
    const cw1 = w1 * 0.05; const cw2 = w2 * 0.05;
    ctx.fillStyle = color.sidewalk;
    ctx.beginPath(); ctx.moveTo(x1 - w1 - r1 - sw1, y1); ctx.lineTo(x1 - w1 - r1, y1); ctx.lineTo(x2 - w2 - r2, y2); ctx.lineTo(x2 - w2 - r2 - sw2, y2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x1 + w1 + r1 + sw1, y1); ctx.lineTo(x1 + w1 + r1, y1); ctx.lineTo(x2 + w2 + r2, y2); ctx.lineTo(x2 + w2 + r2 + sw2, y2); ctx.closePath(); ctx.fill();

    // Curb (pinggiran trotoar)
    ctx.fillStyle = color.curb;
    ctx.beginPath(); ctx.moveTo(x1 - w1 - r1 - cw1, y1); ctx.lineTo(x1 - w1 - r1, y1); ctx.lineTo(x2 - w2 - r2, y2); ctx.lineTo(x2 - w2 - r2 - cw2, y2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x1 + w1 + r1 + cw1, y1); ctx.lineTo(x1 + w1 + r1, y1); ctx.lineTo(x2 + w2 + r2, y2); ctx.lineTo(x2 + w2 + r2 + cw2, y2); ctx.closePath(); ctx.fill();

    // Badan jalan
    ctx.fillStyle = color.road;
    ctx.beginPath(); ctx.moveTo(x1 - w1, y1); ctx.lineTo(x2 - w2, y2); ctx.lineTo(x2 + w2, y2); ctx.lineTo(x1 + w1, y1); ctx.closePath(); ctx.fill();

    // Zebra cross
    if (zebra) {
      ctx.fillStyle = '#ffffff';
      const stripes = 10;
      const stripeW1 = (w1 * 2) / stripes; const stripeW2 = (w2 * 2) / stripes;
      for (let i = 0; i < stripes; i++) {
        if (i % 2 === 0) {
          ctx.beginPath();
          ctx.moveTo(x1 - w1 + i * stripeW1, y1); ctx.lineTo(x1 - w1 + (i + 1) * stripeW1, y1);
          ctx.lineTo(x2 - w2 + (i + 1) * stripeW2, y2); ctx.lineTo(x2 - w2 + i * stripeW2, y2);
          ctx.fill();
        }
      }
    }

    // Garis lane (pembagi jalur)
    if (color.strip) {
      ctx.fillStyle = color.strip;
      const laneW1 = w1 * 2 / lanes; const laneW2 = w2 * 2 / lanes;
      for (let i = 1; i < lanes; i++) {
        ctx.beginPath();
        ctx.moveTo(x1 - w1 + i * laneW1 - w1 / 30, y1); ctx.lineTo(x1 - w1 + i * laneW1 + w1 / 30, y1);
        ctx.lineTo(x2 - w2 + i * laneW2 + w2 / 30, y2); ctx.lineTo(x2 - w2 + i * laneW2 - w2 / 30, y2);
        ctx.fill();
      }
    }
  };

  /**
   * Render sprite (aset gambar) di sisi jalan atau NPC di jalan.
   * Ukuran otomatis berdasarkan nama aset.
   */
  const renderSprite = (ctx: CanvasRenderingContext2D, width: number, height: number, resolution: number, roadWidth: number, sprite: any, scale: number, destX: number, destY: number, offsetX: number, offsetY: number, clipY: number) => {
    if (!sprite) return;
    const name = (sprite as any).assetName;

    // Referensi lebar tetap agar ukuran konsisten
    const playerRefWidth = 450;
    const carWorldWidth = playerRefWidth * 1.5;

    let worldWidth = carWorldWidth * 1.0;
    if (name?.includes('lampulalulintas') || name === 'traffic_light') worldWidth = carWorldWidth * 5.5;
    else if (name?.includes('truck')) worldWidth = carWorldWidth * 1.4;
    else if (name?.includes('car_rival') || name === 'foward-opponent') worldWidth = carWorldWidth * 1.0;
    else if (name?.includes('odong') || name?.includes('taxi')) worldWidth = carWorldWidth * 1.0;
    else if (name?.includes('jne')) worldWidth = carWorldWidth * 1.1;
    else if (name?.includes('kiri_') || name?.includes('kanan_')) worldWidth = carWorldWidth * 18.0;
    else if (name?.includes('pohon')) worldWidth = carWorldWidth * 11.0;
    else if (name?.includes('bush') || name?.includes('semak')) worldWidth = carWorldWidth * 3.5;
    else if (name?.includes('bench') || name?.includes('bangku')) worldWidth = carWorldWidth * 3.5;
    else if (name?.includes('barrier') || name?.includes('pembatas_jalan')) worldWidth = carWorldWidth * 3.5;
    else if (name?.includes('cone') || name?.includes('penghalang')) worldWidth = carWorldWidth * 1.2;
    else if (name?.includes('obstacle') || name?.includes('construction')) worldWidth = carWorldWidth * 1.3;

    const destW = scale * worldWidth * (width / 2);
    const destH = destW * (sprite.height / sprite.width);
    let clampedW = destW, clampedH = destH;

    destX = destX + (clampedW * (offsetX || 0));
    destY = destY + (clampedH * Math.min(offsetY || 0, -0.5));

    const clipH = clipY ? Math.max(0, destY + clampedH - clipY) : 0;
    if (clipH < clampedH && clampedH > 1) {
      ctx.save();
      ctx.drawImage(sprite, 0, 0, sprite.width, sprite.height - (sprite.height * clipH / clampedH), destX, destY, clampedW, clampedH - clipH);
      ctx.restore();
    }
  };

  /**
   * Render kendaraan pemain (first-person atau third-person).
   * Menangani animasi NOS, revving, dan driving MC.
   */
  const renderPlayer = (ctx: CanvasRenderingContext2D, width: number, height: number, resolution: number, roadWidth: number, speedPercent: number, scale: number, destX: number, destY: number, steer: number, updown: number, viewMode: ViewMode) => {
    const { keyLeft, keyRight, keyFaster, sprites } = state.current;

    // ── Animasi revving / braking ──
    const isPreparing = gameState === 'preparation';
    const isAtStart = isPreparing;

    if ((isAtStart && keyFaster) || state.current.keySlower) {
      state.current.revvingTimer += 16;
      if (state.current.revvingTimer >= 80) {
        state.current.revvingTimer = 0;
        state.current.revvingFrame = state.current.revvingFrame === 0 ? 1 : 0;
      }
    }

    // ── Animasi MC (driving forward) ──
    if (!isAtStart && (keyFaster || keyLeft || keyRight) && !state.current.keySlower) {
      state.current.mcTimer += 16;
      if (state.current.mcTimer >= 80) {
        state.current.mcTimer = 0;
        state.current.mcFrame = (state.current.mcFrame + 1) % 4;
      }
    }

    // ════ First-person POV ════
    if (viewMode === 'first') {
      let sprite = sprites.mc_1st_straight_0 || sprites.car_1st;
      if (keyLeft) { sprite = sprites[`mc_1st_left_${state.current.mcFrame % 2}`] || sprite; }
      else if (keyRight) { sprite = sprites[`mc_1st_right_${state.current.mcFrame % 2}`] || sprite; }
      else if (keyFaster) {
        const straightFrames = [0, 1, 3];
        sprite = sprites[`mc_1st_straight_${straightFrames[state.current.mcFrame % straightFrames.length]}`] || sprite;
      } else { sprite = sprites.mc_1st_straight_0 || sprite; }
      if (!sprite) return;

      const destW = width;
      const destH = destW * (sprite.height / sprite.width);
      const sway = Math.sin(Date.now() / 200) * 5;
      const x = (steer * -30) + sway;
      const y = height - (destH * 0.8) + Math.abs(sway);

      // Efek rem merah untuk first-person
      if (state.current.keySlower) {
        ctx.save();
        const grd = ctx.createLinearGradient(0, height, 0, height - 150);
        grd.addColorStop(0, 'rgba(255, 0, 0, 0.4)'); grd.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = grd; ctx.fillRect(0, height - 150, width, 150);
        ctx.restore();
      }

      ctx.drawImage(sprite, x, y, destW, destH);
      return;
    }

    // ════ Third-person POV ════
    let sprite = sprites.car;
    if (isAtStart && keyFaster) {
      sprite = state.current.revvingFrame === 0 ? sprites.start_1 : sprites.start_2;
    } else if (state.current.keySlower) {
      sprite = state.current.revvingFrame === 0 ? sprites.rem_1 : sprites.rem_2;
    } else if (keyLeft) {
      sprite = sprites[`mc_left_${state.current.mcFrame}`];
    } else if (keyRight) {
      sprite = sprites[`mc_right_${state.current.mcFrame}`];
    } else if (keyFaster) {
      sprite = sprites[`mc_straight_${state.current.mcFrame}`];
    } else {
      sprite = sprites.car;
    }
    if (!sprite) return;

    // ── Animasi NOS (state machine) ──
    const baseCar = sprites.car;
    const playerScale = (width / 1920) * 1.5;
    const baseW = baseCar ? baseCar.width * playerScale : 200;
    const baseH = baseCar ? baseCar.height * playerScale : 100;

    const isNitro = state.current.keyBoost && state.current.nos > 0;
    const wasPressed = state.current.nosWasPressed;
    const FRAME_DURATION = 5;
    state.current.nosFrameTimer += 16;

    const STARTUP_FRAMES = Array.from({ length: 21 }, (_, i) => i + 1);
    const LOOP_FRAMES = Array.from({ length: 7 }, (_, i) => i + 22);
    let currentNosSprite: any = null;

    if (isNitro) {
      if (!wasPressed) {
        if (state.current.nosPhase === 'ending') {
          const currentAbsolute = state.current.nosFrame;
          if (currentAbsolute >= 22) { state.current.nosPhase = 'loop'; const idx = LOOP_FRAMES.indexOf(currentAbsolute); state.current.nosFrame = idx >= 0 ? idx : 0; }
          else { state.current.nosPhase = 'startup'; const idx = STARTUP_FRAMES.indexOf(currentAbsolute); state.current.nosFrame = idx >= 0 ? idx : 0; }
        } else { state.current.nosPhase = 'startup'; state.current.nosFrame = 0; state.current.nosFrameTimer = 0; }
      }

      if (state.current.nosPhase === 'startup') {
        while (state.current.nosFrameTimer >= FRAME_DURATION) { state.current.nosFrameTimer -= FRAME_DURATION; state.current.nosFrame++; if (state.current.nosFrame >= STARTUP_FRAMES.length) { state.current.nosPhase = 'loop'; state.current.nosFrame = 0; break; } }
        currentNosSprite = sprites[`nos_${STARTUP_FRAMES[state.current.nosFrame]}`];
      }
      if (state.current.nosPhase === 'loop') {
        while (state.current.nosFrameTimer >= FRAME_DURATION) { state.current.nosFrameTimer -= FRAME_DURATION; state.current.nosFrame = (state.current.nosFrame + 1) % LOOP_FRAMES.length; }
        currentNosSprite = sprites[`nos_${LOOP_FRAMES[state.current.nosFrame]}`];
      }
      state.current.nosWasPressed = true;
    } else {
      if (wasPressed) {
        let startReverseFrame = 1;
        if (state.current.nosPhase === 'startup') startReverseFrame = STARTUP_FRAMES[state.current.nosFrame] || 1;
        else if (state.current.nosPhase === 'loop') startReverseFrame = LOOP_FRAMES[state.current.nosFrame] || 22;
        else if (state.current.nosPhase === 'ending') startReverseFrame = state.current.nosFrame;
        state.current.nosPhase = 'ending'; state.current.nosFrame = startReverseFrame; state.current.nosFrameTimer = 0;
      }
      if (state.current.nosPhase === 'ending') {
        while (state.current.nosFrameTimer >= FRAME_DURATION) { state.current.nosFrameTimer -= FRAME_DURATION; state.current.nosFrame--; if (state.current.nosFrame < 1) { state.current.nosPhase = 'idle'; state.current.nosFrame = 0; break; } }
        if (state.current.nosPhase === 'ending' && state.current.nosFrame >= 1) { currentNosSprite = sprites[`nos_${state.current.nosFrame}`]; }
      }
      state.current.nosWasPressed = false;
    }

    // ── Gambar sprite final ──
    const finalSprite = currentNosSprite || sprite;
    let finalW, finalH;

    if (currentNosSprite) { finalW = baseW; finalH = baseH; }
    else {
      const sName = (finalSprite as any)?.assetName || '';
      let correctiveScale = 1.0;
      finalW = finalSprite.width * playerScale * correctiveScale;
      finalH = finalSprite.height * playerScale * correctiveScale;
    }

    const finalX = width / 2 - finalW / 2 + (steer * 50);
    const finalY = height - finalH - 35;
    ctx.drawImage(finalSprite, finalX, finalY, finalW, finalH);
  };

  // ════════════════════════════════════════════════════════════════
  // SECTION: UPDATE — Logika fisika & game per frame
  // ════════════════════════════════════════════════════════════════

  /**
   * Update posisi, kecepatan, NOS, tabrakan, NPC, dan status lap.
   * Dipanggil setiap frame oleh game loop.
   */
  const update = (dt: number) => {
    const { keyLeft, keyRight, keyFaster, keySlower, keyBoost, segments, playerX, speed, trackLength } = state.current;
    let { position, playerZ } = state.current;
    const isPreparing = gameState === 'preparation';

    const playerSegment = findSegment(position + playerZ);
    const speedPercent = speed / MAX_SPEED;
    const dx = dt * 2 * speedPercent;

    // ── Pergerakan (hanya saat playing) ──
    if (gameState === 'playing') {
      position = Util.increase(position, dt * speed, trackLength);
      state.current.position = position;
    }

    // ── Kemudi ──
    let nextPlayerX = playerX;
    if (isMobile && mobileOrientationChoice === 'portrait') {
      nextPlayerX = playerX + (state.current.analogSteer * dx * 3.0);
    } else {
      const steerForce = (isMobile ? 2.5 : 1.0);
      if (state.current.keyLeft) nextPlayerX = playerX - (dx * steerForce);
      else if (state.current.keyRight) nextPlayerX = playerX + (dx * steerForce);
    }

    // Efek sentrifugal dari tikungan
    nextPlayerX = nextPlayerX - (dx * speedPercent * playerSegment.curve * 0.2);
    // Batas jalan
    nextPlayerX = Util.limit(nextPlayerX, -1.5, 1.5);

    // ── Gas, rem, NOS ──
    let nextSpeed = speed;
    let nextNos = state.current.nos;
    const GAS_LIMIT = MAX_SPEED * 0.9;
    const BOOST_LIMIT = MAX_SPEED * 1.1;
    const REVVING_LIMIT = MAX_SPEED * 0.2;

    if (isPreparing) {
      if (keyFaster) { nextSpeed = Util.accelerate(speed, ACCEL * 0.5, dt); nextSpeed = Math.min(nextSpeed, REVVING_LIMIT); }
      else { nextSpeed = Util.accelerate(speed, DECEL, dt); }
    } else {
      const tryingToBoost = keyBoost && nextNos > 0;
      if (keySlower) {
        nextSpeed = Util.accelerate(speed, BREAKING, dt);
      } else if (tryingToBoost) {
        nextSpeed = Util.accelerate(speed, ACCEL * 2.5, dt);
        nextNos = Math.max(0, nextNos - dt * 25);
        if (nextSpeed >= BOOST_LIMIT - 300) { const jitter = (Math.random() - 0.5) * 200; nextSpeed = Util.limit(nextSpeed + jitter, 0, BOOST_LIMIT); }
      } else if (keyFaster) {
        nextSpeed = Util.accelerate(speed, ACCEL, dt);
        if (nextSpeed > GAS_LIMIT) { nextSpeed = Util.accelerate(nextSpeed, DECEL, dt); nextSpeed = Math.max(nextSpeed, GAS_LIMIT); }
      } else {
        nextSpeed = Util.accelerate(speed, DECEL, dt);
      }

      // Regenerasi NOS
      if (!keyBoost && !keySlower) {
        if (keyFaster) nextNos = Math.min(100, nextNos + dt * 2);
        else nextNos = Math.min(100, nextNos + dt * 8);
      }
    }
    state.current.nos = nextNos;

    // ── Cek off-road ──
    if ((nextPlayerX < -1) || (nextPlayerX > 1)) {
      if (nextSpeed > OFF_ROAD_LIMIT) nextSpeed = Util.accelerate(nextSpeed, OFF_ROAD_DECEL, dt);
      for (let n = 0; n < playerSegment.sprites.length; n++) {
        const sprite = playerSegment.sprites[n];
        if (Util.overlap(nextPlayerX, 0.1, sprite.offset, 0.1)) {
          nextSpeed = MAX_SPEED / 5;
          position = Util.increase(playerSegment.p1.world.z, -playerZ, trackLength);
          break;
        }
      }
    }

    nextPlayerX = Util.limit(nextPlayerX, -1.5, 1.5);
    nextSpeed = Util.limit(nextSpeed, 0, MAX_SPEED);
    state.current.playerX = nextPlayerX;
    state.current.speed = nextSpeed;

    // ── Update NPC ──
    for (let n = 0; n < state.current.cars.length; n++) {
      const car = state.current.cars[n];
      const oldSeg = findSegment(car.z);
      car.z = Util.increase(car.z, dt * car.speed, trackLength);
      car.percent = Util.percentRemaining(car.z, SEGMENT_LENGTH);
      const newSeg = findSegment(car.z);
      if (oldSeg !== newSeg) {
        const idx = oldSeg.cars.indexOf(car);
        if (idx !== -1) oldSeg.cars.splice(idx, 1);
        newSeg.cars.push(car);
      }

      // Tabrakan NPC-pemain
      if (newSeg.index === playerSegment.index) {
        if (Util.overlap(nextPlayerX, 0.4, car.offset, 0.4)) {
          if (nextSpeed > car.speed) {
            nextSpeed = nextSpeed * 0.3;
            position = Util.increase(position, -200, trackLength);
            const dir = nextPlayerX > car.offset ? 1 : -1;
            nextPlayerX += dir * 0.15;
          }
        }
      }

      // Re-spawn NPC yang tertinggal jauh
      if (car.z < position && (position - car.z) > trackLength / 2) {
        car.z = Util.increase(car.z, trackLength, trackLength);
      }

      // ── Animasi NPC (truk, JNE, odong, taksi) ──
      if (car.type === 'truck') {
        car.animTimer = (car.animTimer || 0) + dt * 1000;
        if (car.animTimer > 150) { car.animTimer = 0; car.animFrame = car.animFrame === 0 ? 1 : 0; }
        const currentSeg = findSegment(car.z); const curve = currentSeg.curve;
        if (curve < -0.5) car.sprite = car.animFrame === 0 ? state.current.sprites.truck_left_0 : state.current.sprites.truck_left_1;
        else if (curve > 0.5) car.sprite = car.animFrame === 0 ? state.current.sprites.truck_right_0 : state.current.sprites.truck_right_1;
        else car.sprite = car.animFrame === 0 ? state.current.sprites.truck_straight_0 : state.current.sprites.truck_straight_1;
      } else if (car.type === 'jne') {
        car.animTimer = (car.animTimer || 0) + dt * 1000;
        if (car.animTimer > 100) { car.animTimer = 0; car.animFrame = car.animFrame === 0 ? 1 : 0; }
        const currentSeg = findSegment(car.z); const curve = currentSeg.curve;
        let dir = 'straight'; if (curve < -0.5) dir = 'left'; else if (curve > 0.5) dir = 'right';
        if (dir === 'left') car.sprite = car.animFrame === 0 ? state.current.sprites.jne_left_1 : state.current.sprites.jne_left_2;
        else if (dir === 'right') car.sprite = car.animFrame === 0 ? state.current.sprites.jne_right_1 : state.current.sprites.jne_right_2;
        else car.sprite = car.animFrame === 0 ? state.current.sprites.jne_straight_1 : state.current.sprites.jne_straight_2;
      } else if (car.type === 'odong') {
        car.animTimer = (car.animTimer || 0) + dt * 1000;
        if (car.animTimer > 150) { car.animTimer = 0; car.animFrame = car.animFrame === 0 ? 1 : 0; }
        const currentSeg = findSegment(car.z); const curve = currentSeg.curve;
        if (curve < -0.5) { const s1 = state.current.sprites.odong_left; const s2 = state.current.sprites['1odong_left']; car.sprite = (car.animFrame === 1 && s2) ? s2 : s1; }
        else if (curve > 0.5) { const s1 = state.current.sprites.odong_right; const s2 = state.current.sprites['1odong_right']; car.sprite = (car.animFrame === 1 && s2) ? s2 : s1; }
        else { const s1 = state.current.sprites.odong_straight; const s2 = state.current.sprites['1odong_straight']; car.sprite = (car.animFrame === 1 && s2) ? s2 : s1; }
      } else if (car.type === 'taxi') {
        car.animTimer = (car.animTimer || 0) + dt * 1000;
        if (car.animTimer > 150) { car.animTimer = 0; car.animFrame = car.animFrame === 0 ? 1 : 0; }
        const currentSeg = findSegment(car.z); const curve = currentSeg.curve;
        if (curve < -0.5) { const s1 = state.current.sprites.taxi_left || state.current.sprites.taxi_straight || state.current.sprites.truck2; const s2 = state.current.sprites['1taxi_left']; car.sprite = (car.animFrame === 1 && s2) ? s2 : s1; }
        else if (curve > 0.5) { const s1 = state.current.sprites.taxi_right || state.current.sprites.taxi_straight || state.current.sprites.truck2; const s2 = state.current.sprites['1taxi_right']; car.sprite = (car.animFrame === 1 && s2) ? s2 : s1; }
        else { const s1 = state.current.sprites.taxi_straight || state.current.sprites.truck2; const s2 = state.current.sprites['1taxi_straight']; car.sprite = (car.animFrame === 1 && s2) ? s2 : s1; }
      }
    }

    // ── Update parallax background ──
    state.current.bgOffset = state.current.bgOffset || 0;
    const curveFactor = (playerSegment.curve || 0) * (speed / MAX_SPEED);
    const steerFactor = (state.current.keyLeft ? -1 : state.current.keyRight ? 1 : 0) * (speed / MAX_SPEED) * 2;
    state.current.bgOffset += (curveFactor + steerFactor) * dt * 0.1;

    state.current.position = position;
    state.current.playerX = nextPlayerX;
    state.current.speed = nextSpeed;

    // ── Efek FOV dinamis saat NOS aktif ──
    const mobileDepthFactor = (isMobile && aspectRatio < 1) ? 1.4 : 1.0;
    const activeDiff = localStorage.getItem('nitroquiz_game_difficulty') || 'easy';
    const activeDiffConfig = getDifficultyConfig(activeDiff);
    const baseDepth = (1 / Math.tan((activeDiffConfig.fieldOfView / 2) * Math.PI / 180)) * mobileDepthFactor;
    const targetDepth = (keyBoost && nextNos > 0) ? baseDepth * 1.5 : baseDepth;
    state.current.cameraDepth = state.current.cameraDepth + (targetDepth - state.current.cameraDepth) * dt * 5;
    state.current.playerZ = (activeDiffConfig.cameraHeight * state.current.cameraDepth);
    playerZ = state.current.playerZ;

    // ── Update HUD stats ──
    const currentRound = lapRace + 1;
    const totalRounds = Math.max(1, Math.ceil(state.current.allQuizQuestions.length / QUESTIONS_PER_ROUND));
    setStats({ speed: Math.floor(speed / 100), nos: Math.floor(state.current.nos), lap: currentRound, totalLaps: totalRounds });

    // ── Cek finish line → transisi ke kuis ──
    if (position > trackLength - playerZ && gameState !== 'finished' && !(state.current as any).hasFinishedLine) {
      const questions = state.current.allQuizQuestions;
      const hasQuizRemaining = questions.length > 0 && state.current.quizQuestionIndex < questions.length;

      if (questions.length === 0) {
        console.warn("[NitroQuiz] Finish line hit but no questions loaded yet. Waiting...");
        state.current.speed = 0;
        return;
      }

      (state.current as any).hasFinishedLine = true;
      state.current.speed = 0;

      if (hasQuizRemaining) {
        (async () => {
          const participantId = localStorage.getItem('nitroquiz_game_participantId');
          if (participantId) {
            try {
              const { data: pData } = await supabase.from('participants').select('lap_race').eq('id', participantId).single();
              const newLap = (pData?.lap_race || 0) + 1;
              const { error } = await supabase.from('participants').update({ lap_race: newLap, minigame: false }).eq('id', participantId);
              if (!error) { localStorage.setItem('nitroquiz_game_lapRace', String(newLap)); setLapRace(newLap); }
            } catch (e) { console.error("[NitroQuiz] Error updating minigame status:", e); }
          }
          localStorage.setItem('nitroquiz_game_questionIndex', state.current.quizQuestionIndex.toString());
          localStorage.setItem('nitroquiz_game_score', state.current.totalQuizScore.toString());
          setTimeout(() => { router.push(`/player/${roomCode}/quiz`); }, 500);
        })();
      } else {
        const participantId = localStorage.getItem('nitroquiz_game_participantId');
        if (participantId) supabase.from('participants').update({ lap_race: currentRound }).eq('id', participantId).then();
        setGameState('finished');
        endGame();
      }
    }
  };

  // ════════════════════════════════════════════════════════════════
  // SECTION: RENDER — Fungsi render utama per frame
  // ════════════════════════════════════════════════════════════════

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const width = canvas.width;
    const height = canvas.height;
    const { segments, position, playerZ, playerX, speed, sprites } = state.current;

    if (!segments || segments.length === 0) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height); return; }

    // Langit
    ctx.fillStyle = COLORS.SKY; ctx.fillRect(0, 0, width, height);

    const baseSegment = findSegment(position);
    const basePercent = Util.percentRemaining(position, SEGMENT_LENGTH);
    const playerSegment = findSegment(position + playerZ);
    const playerPercent = Util.percentRemaining(position + playerZ, SEGMENT_LENGTH);
    const playerY = Util.interpolate(playerSegment.p1.world.y, playerSegment.p2.world.y, playerPercent);
    const speedPercent = speed / MAX_SPEED;

    // ── Background parallax ──
    const bgAsset = isMobile && sprites.bg_mobile ? sprites.bg_mobile : sprites.bg;
    if (bgAsset) {
      const bg = bgAsset;
      const extraParallax = isMobile ? 1.5 : 1.3;
      const scaleX = (width / bg.width) * extraParallax;
      const scaleY = (height / bg.height);
      const layerScale = Math.max(scaleX, scaleY);
      const scaledW = bg.width * layerScale;
      const scaledH = bg.height * layerScale;
      state.current.bgOffset = state.current.bgOffset || 0;
      const maxOverflowX = (scaledW - width) / 2;
      const maxAllowedFactor = maxOverflowX / scaledW;
      state.current.bgOffset = Util.limit(state.current.bgOffset, -maxAllowedFactor, maxAllowedFactor);
      const finalScrollX = ((width - scaledW) / 2) - (state.current.bgOffset * scaledW);
      const finalScrollY = (height - scaledH) / 2;
      ctx.save(); ctx.drawImage(bg, finalScrollX, finalScrollY, scaledW, scaledH); ctx.restore();
    }

    let maxy = height;
    let x = 0;
    let currDx = -(baseSegment.curve * basePercent);

    const _diff = localStorage.getItem('nitroquiz_game_difficulty') || 'easy';
    const _diffCfg = getDifficultyConfig(_diff);
    const currentCameraHeight = state.current.viewMode === 'first' ? 850 : _diffCfg.cameraHeight;

    // ── Render segmen jalan ──
    for (let n = 0; n < DRAW_DISTANCE; n++) {
      const segment = segments[(baseSegment.index + n) % segments.length];
      segment.looped = segment.index < baseSegment.index;
      segment.fog = Util.exponentialFog(n / DRAW_DISTANCE, _diffCfg.fogDensity);
      segment.clip = maxy;
      Util.project(segment.p1, (playerX * ROAD_WIDTH) - x, playerY + currentCameraHeight, position - (segment.looped ? state.current.trackLength : 0), state.current.cameraDepth, width, height, ROAD_WIDTH);
      Util.project(segment.p2, (playerX * ROAD_WIDTH) - x - currDx, playerY + currentCameraHeight, position - (segment.looped ? state.current.trackLength : 0), state.current.cameraDepth, width, height, ROAD_WIDTH);
      x = x + currDx; currDx = currDx + segment.curve;
      if ((segment.p1.camera.z <= state.current.cameraDepth) || (segment.p2.screen.y >= segment.p1.screen.y) || (segment.p2.screen.y >= maxy)) continue;
      renderSegment(ctx, width, LANES, segment.p1.screen.x, segment.p1.screen.y, segment.p1.screen.w, segment.p2.screen.x, segment.p2.screen.y, segment.p2.screen.w, segment.fog, segment.color, segment.zebra || false);
      maxy = segment.p1.screen.y;
    }

    // ── Render sprites, NPC, dan pemain ──
    for (let n = (DRAW_DISTANCE - 1); n > 0; n--) {
      const segment = segments[(baseSegment.index + n) % segments.length];
      for (let i = 0; i < segment.sprites.length; i++) {
        const sprite = segment.sprites[i];
        const spriteScale = segment.p1.screen.scale;
        const spriteX = segment.p1.screen.x + (spriteScale * sprite.offset * ROAD_WIDTH * width / 2);
        if (segment.p1.screen.scale > 0.00001) renderSprite(ctx, width, height, height / 480, ROAD_WIDTH, sprite.source, spriteScale, spriteX, segment.p1.screen.y, (sprite.offset < 0 ? -1 : 0), (sprite.offsetY || -1), segment.clip);
      }
      for (let i = 0; i < segment.cars.length; i++) {
        const car = segment.cars[i];
        const spriteScale = Util.interpolate(segment.p1.screen.scale, segment.p2.screen.scale, car.percent);
        const spriteX = Util.interpolate(segment.p1.screen.x, segment.p2.screen.x, car.percent) + (spriteScale * car.offset * ROAD_WIDTH * width / 2);
        const spriteY = Util.interpolate(segment.p1.screen.y, segment.p2.screen.y, car.percent);
        if (spriteScale > 0.00001) renderSprite(ctx, width, height, height / 480, ROAD_WIDTH, car.sprite, spriteScale, spriteX, spriteY, (car.offset < 0 ? -1 : 0), -1, segment.clip);
      }
      if (segment == playerSegment && state.current.viewMode === 'third') {
        renderPlayer(ctx, width, height, height / 480, ROAD_WIDTH, speed / MAX_SPEED, state.current.cameraDepth / playerZ, width / 2, height / 2, (state.current.keyLeft ? -1 : state.current.keyRight ? 1 : 0), playerSegment.p2.world.y - playerSegment.p1.world.y, 'third');
      }
    }

    // First-person overlay
    if (state.current.viewMode === 'first') {
      renderPlayer(ctx, width, height, height / 480, ROAD_WIDTH, speed / MAX_SPEED, 1, width / 2, height / 2, (state.current.keyLeft ? -1 : state.current.keyRight ? 1 : 0), 0, 'first');
    }
  };

  // ════════════════════════════════════════════════════════════════
  // SECTION: MINI-MAP
  // ════════════════════════════════════════════════════════════════

  /** Gambar mini-map track dengan posisi pemain & rival */
  const drawMiniMap = () => {
    const canvas = miniMapRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { segments, position, trackLength } = state.current;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const logicalW = 240; const logicalH = 180;

    if (canvas.width !== logicalW * dpr || canvas.height !== logicalH * dpr) {
      canvas.width = logicalW * dpr; canvas.height = logicalH * dpr;
      canvas.style.width = `${logicalW}px`; canvas.style.height = `${logicalH}px`;
    }

    ctx.save(); ctx.scale(dpr, dpr); ctx.clearRect(0, 0, logicalW, logicalH);

    // Background scanner
    ctx.fillStyle = 'rgba(10, 15, 25, 0.95)'; ctx.beginPath();
    if ((ctx as any).roundRect) (ctx as any).roundRect(0, 0, logicalW, logicalH, 20); else ctx.rect(0, 0, logicalW, logicalH);
    ctx.fill();

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'; ctx.lineWidth = 1;
    for (let i = 0; i < logicalW; i += 30) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, logicalH); ctx.stroke(); }
    for (let i = 0; i < logicalH; i += 30) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(logicalW, i); ctx.stroke(); }

    if (!segments || segments.length < 10) { ctx.restore(); return; }

    // Proyeksi track ke 2D
    const points: { x: number, z: number }[] = [];
    let xPos = 0, zPos = 0, heading = -Math.PI / 2;
    for (let i = 0; i < segments.length; i += 5) {
      const s = segments[i]; heading += (s.curve * 0.012);
      xPos += Math.cos(heading) * 10; zPos += Math.sin(heading) * 10;
      points.push({ x: xPos, z: zPos });
    }

    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    points.forEach(p => { if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x; if (p.z < minZ) minZ = p.z; if (p.z > maxZ) maxZ = p.z; });
    const trackW = maxX - minX || 1; const trackH = maxZ - minZ || 1;
    const marginSide = 40, marginTop = 30, marginBot = 30;
    const availW = logicalW - (marginSide * 2); const availH = logicalH - marginTop - marginBot;
    const mapScale = Math.min(availW / trackW, availH / trackH) * 0.95;
    const tx = (px: number) => logicalW / 2 + (px - (minX + maxX) / 2) * mapScale;
    const centerY = marginTop + (availH / 2);
    const ty = (pz: number) => centerY + (pz - (minZ + maxZ) / 2) * mapScale;

    // Garis track neon biru
    ctx.beginPath(); ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.shadowBlur = 8; ctx.shadowColor = '#3b82f6';
    ctx.moveTo(tx(points[0].x), ty(points[0].z));
    for (let i = 1; i < points.length; i++) ctx.lineTo(tx(points[i].x), ty(points[i].z));
    ctx.stroke();
    ctx.beginPath(); ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 1.5; ctx.shadowBlur = 0;
    ctx.moveTo(tx(points[0].x), ty(points[0].z));
    for (let i = 1; i < points.length; i++) ctx.lineTo(tx(points[i].x), ty(points[i].z));
    ctx.stroke();

    // Marker START & FINISH
    const startP = points[0]; const endP = points[points.length - 1];
    ctx.shadowBlur = 0; ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.font = '800 10px sans-serif'; ctx.fillText('START', tx(startP.x) + 14, ty(startP.z) + 3);
    ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(tx(startP.x) - 10, ty(startP.z)); ctx.lineTo(tx(startP.x) + 10, ty(startP.z)); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'right'; ctx.fillText('FINISH', tx(endP.x) - 18, ty(endP.z) + 3);
    ctx.beginPath(); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 6; ctx.setLineDash([3, 3]); ctx.moveTo(tx(endP.x) - 10, ty(endP.z)); ctx.lineTo(tx(endP.x) + 10, ty(endP.z)); ctx.stroke(); ctx.setLineDash([]);

    // Posisi pemain & rival
    const playerIdx = Math.floor((position / trackLength) * points.length);
    const pPoint = points[Math.min(playerIdx, points.length - 1)] || points[0];
    const px = tx(pPoint.x); const py = ty(pPoint.z);

    state.current.cars.forEach(car => {
      if (car.isRival) {
        const rivalIdx = Math.floor((car.z / trackLength) * points.length);
        const rPoint = points[rivalIdx % points.length];
        ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(239, 68, 68, 0.8)'; ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(tx(rPoint.x), ty(rPoint.z), 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
      }
    });

    const pulse = (Date.now() % 1000) / 1000;
    ctx.beginPath(); ctx.arc(px, py, 6 + pulse * 10, 0, Math.PI * 2); ctx.fillStyle = `rgba(59, 130, 246, ${0.5 - pulse * 0.5})`; ctx.fill();
    ctx.shadowBlur = 10; ctx.shadowColor = '#3b82f6'; ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();

    ctx.restore();
  };

  // ════════════════════════════════════════════════════════════════
  // SECTION: END GAME
  // ════════════════════════════════════════════════════════════════

  const hasEndedRef = useRef(false);

  /** Akhiri game: update DB, bersihkan localStorage, redirect ke result */
  const endGame = useCallback(async () => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;

    const participantId = typeof window !== 'undefined' ? localStorage.getItem('nitroquiz_game_participantId') : null;
    if (participantId) {
      try { await supabase.from('participants').update({ finished_at: new Date().toISOString() }).eq('id', participantId); }
      catch (e) { console.error("Failed to update participant finish state:", e); }
    }

    try {
      if (screen.orientation && (screen.orientation as any).unlock) (screen.orientation as any).unlock();
      if (document.exitFullscreen && document.fullscreenElement) document.exitFullscreen().catch(() => { });
    } catch (e) { console.error("Failed to unlock orientation:", e); }

    localStorage.removeItem('nitroquiz_game_questions'); localStorage.removeItem('nitroquiz_game_questionIndex');
    localStorage.removeItem('nitroquiz_game_score'); localStorage.removeItem('nitroquiz_game_roomCode');
    localStorage.removeItem('nitroquiz_game_sessionId'); localStorage.removeItem('nitroquiz_game_quizId');
    localStorage.removeItem('nitroquiz_game_difficulty');

    if (roomCode) router.push(`/player/${roomCode}/result`);
    else router.push('/');
  }, [roomCode, router]);

  // ════════════════════════════════════════════════════════════════
  // HOOKS: LIFECYCLE & SIDE EFFECTS
  // ════════════════════════════════════════════════════════════════

  // ── Hook: Load aset ──
  useEffect(() => {
    const difficulty = localStorage.getItem('nitroquiz_game_difficulty') || 'easy';
    const diffConfig = getDifficultyConfig(difficulty);
    state.current.cameraDepth = 1 / Math.tan((diffConfig.fieldOfView / 2) * Math.PI / 180);
    router.prefetch(`/player/${roomCode}/quiz`);
    state.current.sprites = { ...state.current.sprites };

    const loadAssets = async () => {
      console.log("[NitroQuiz] Starting asset load logic...");
      const globalStore = (typeof window !== 'undefined') ? (window as any).__nitroquiz_asset_store : null;
      if (globalStore) console.log("[NitroQuiz] Found global asset store, adopting preloaded assets...");

      let selectedCharId = 'rico';
      const promises: Promise<void>[] = [];

      const obstacles = (difficulty === 'normal' || difficulty === 'medium' || difficulty === 'hard') ? [
        { name: 'obstacle1', src: '/assets/material/pembatas_jalan/1penghalang.webp' },
        { name: 'obstacle2', src: '/assets/material/pembatas_jalan/1roadbarrier.webp' },
      ] : [];

      [...ASSET_LIST, ...obstacles].forEach(item => {
        promises.push(new Promise<void>((resolve) => {
          if (!item.src) { resolve(); return; }
          let srcPath = item.src;
          if (srcPath.includes('/characters/rico/')) srcPath = srcPath.replace('/characters/rico/', `/characters/${selectedCharId}/`);

          if (globalStore && (globalStore[item.name] || globalStore[srcPath])) {
            const existing = globalStore[item.name] || globalStore[srcPath];
            if (existing.complete && existing.naturalWidth > 0) { if (!(existing as any).assetName) (existing as any).assetName = item.name; state.current.sprites[item.name] = existing; resolve(); return; }
            existing.onload = () => { if (!(existing as any).assetName) (existing as any).assetName = item.name; state.current.sprites[item.name] = existing; resolve(); };
            existing.onerror = () => resolve(); return;
          }

          const img = new Image();
          img.onload = () => { (img as any).assetName = item.name; state.current.sprites[item.name] = img; resolve(); };
          img.onerror = () => { const cvs = document.createElement('canvas'); cvs.width = 128; cvs.height = 128; const c = cvs.getContext('2d'); if (c) { c.fillStyle = '#444'; c.fillRect(0, 0, 128, 128); } (cvs as any).assetName = item.name; state.current.sprites[item.name] = cvs; resolve(); };
          img.src = srcPath;
        }));
      });

      const uniqueSources = Array.from(new Set(TRACK_ASSETS.map(item => item.src))).filter(Boolean);
      uniqueSources.forEach(src => {
        promises.push(new Promise<void>((resolve) => {
          if (globalStore && globalStore[src]) {
            const existing = globalStore[src];
            if (existing.complete && existing.naturalWidth > 0) { if (!(existing as any).assetName) (existing as any).assetName = src; state.current.sprites[src] = existing; resolve(); return; }
            existing.onload = () => { if (!(existing as any).assetName) (existing as any).assetName = src; state.current.sprites[src] = existing; resolve(); };
            existing.onerror = () => resolve(); return;
          }
          const img = new Image();
          img.onload = () => { (img as any).assetName = src; state.current.sprites[src] = img; resolve(); };
          img.onerror = () => { resolve(); };
          img.src = src;
        }));
      });

      await Promise.all(promises);
      setSize(); resetRoad(); setAssetsLoaded(true);
    };
    loadAssets();
  }, []);

  // ── Hook: Mulai game saat aset siap ──
  useEffect(() => {
    if (gameState === 'preparation' && assetsLoaded) {
      if (isMobile) { if (mobileOrientationChoice) setGameState('playing'); }
      else setGameState('playing');
    }
  }, [gameState, assetsLoaded, isMobile, mobileOrientationChoice]);

  // ── Hook: Game loop utama ──
  useEffect(() => {
    syncServerTime(); setMounted(true);

    const fetchServerState = async () => {
      const participantId = typeof window !== 'undefined' ? localStorage.getItem('nitroquiz_game_participantId') : null;
      if (!participantId) return;
      const { data } = await supabase.from('participants').select('minigame, finished_at, lap_race').eq('id', participantId).single();
      if (data) {
        if (data.minigame === false && !data.finished_at) router.push(`/player/${roomCode}/quiz`);
        const dbLap = data.lap_race || 0;
        setLapRace(dbLap); localStorage.setItem('nitroquiz_game_lapRace', String(dbLap));
      }
    };
    fetchServerState();

    if (!assetsLoaded) return;

    const _initDiff = localStorage.getItem('nitroquiz_game_difficulty') || 'easy';
    const _initDiffCfg = getDifficultyConfig(_initDiff);
    state.current.playerZ = (_initDiffCfg.cameraHeight * state.current.cameraDepth);

    let lastTime = performance.now(); let miniMapUpdateTime = 0;
    const loop = (time: number) => {
      if (gameState === 'playing') { const dt = Math.min(1, (time - lastTime) / 1000); update(dt); }
      render();
      if (time - miniMapUpdateTime > 100) { drawMiniMap(); miniMapUpdateTime = time; }
      lastTime = time;
      animationFrameRef.current = requestAnimationFrame(loop);
    };
    animationFrameRef.current = requestAnimationFrame(loop);
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, [assetsLoaded, gameState === 'playing']);

  // ── Hook: Input keyboard ──
  useEffect(() => {
    const togglePOV = () => { const next = state.current.viewMode === 'first' ? 'third' : 'first'; state.current.viewMode = next; setViewMode(next); };
    const handleDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'arrowleft': case 'a': state.current.keyLeft = true; break;
        case 'arrowright': case 'd': state.current.keyRight = true; break;
        case 'arrowup': case 'w': state.current.keyFaster = true; break;
        case 'arrowdown': case 's': state.current.keySlower = true; break;
        case ' ': e.preventDefault(); state.current.keyBoost = true; break;
        case 't': togglePOV(); break;
      }
    };
    const handleUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'arrowleft': case 'a': state.current.keyLeft = false; break;
        case 'arrowright': case 'd': state.current.keyRight = false; break;
        case 'arrowup': case 'w': state.current.keyFaster = false; break;
        case 'arrowdown': case 's': state.current.keySlower = false; break;
        case ' ': e.preventDefault(); state.current.keyBoost = false; break;
      }
    };
    window.addEventListener('keydown', handleDown); window.addEventListener('keyup', handleUp);
    return () => { window.removeEventListener('keydown', handleDown); window.removeEventListener('keyup', handleUp); };
  }, []);

  // ── Hook: Kontrol sentuh mobile (swipe steering + anti-zoom) ──
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      let hitsButton = false;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i]; const target = touch.target as HTMLElement;
        if (target.tagName === 'BUTTON' || target.closest('button')) hitsButton = true;
        else if (!hitsButton && steeringTouchId.current === null) { steeringTouchId.current = touch.identifier; touchStartX.current = touch.clientX; touchCurrentX.current = touch.clientX; }
      }
      if (e.touches.length > 1 && !hitsButton) e.preventDefault();
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      if (steeringTouchId.current === null) return;
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        if (touch.identifier === steeringTouchId.current) {
          touchCurrentX.current = touch.clientX;
          const deltaX = touchCurrentX.current - (touchStartX.current || 0);
          const maxRange = window.innerWidth / 3;
          state.current.analogSteer = Util.limit(deltaX / maxRange, -1, 1);
          if (deltaX < -20) { state.current.keyLeft = true; state.current.keyRight = false; }
          else if (deltaX > 20) { state.current.keyRight = true; state.current.keyLeft = false; }
          else { state.current.keyLeft = false; state.current.keyRight = false; }
          break;
        }
      }
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (steeringTouchId.current === null) return;
      let mappedTouchEnded = false;
      for (let i = 0; i < e.changedTouches.length; i++) { if (e.changedTouches[i].identifier === steeringTouchId.current) { mappedTouchEnded = true; break; } }
      if (mappedTouchEnded) { steeringTouchId.current = null; touchStartX.current = null; touchCurrentX.current = null; state.current.analogSteer = 0; state.current.keyLeft = false; state.current.keyRight = false; }
    };

    if (isMobile && mobileOrientationChoice === 'portrait') {
      window.addEventListener('touchstart', handleTouchStart, { passive: false });
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd, { passive: false });
      window.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    }

    const preventZoom = (e: TouchEvent) => { const target = e.target as HTMLElement; if (e.touches.length > 1 && !(target.tagName === 'BUTTON' || target.closest('button'))) e.preventDefault(); };
    let lastTouchEnd = 0;
    const preventDoubleTapZoom = (e: TouchEvent) => { const now = Date.now(); if (now - lastTouchEnd <= 300) e.preventDefault(); lastTouchEnd = now; };

    if (isMobile) {
      window.addEventListener('touchstart', preventZoom, { passive: false });
      window.addEventListener('touchend', preventDoubleTapZoom, { passive: false });
      (window as any).addEventListener('gesturestart', (e: any) => e.preventDefault(), { passive: false });
    }

    return () => {
      window.removeEventListener('touchstart', handleTouchStart); window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd); window.removeEventListener('touchcancel', handleTouchEnd);
      if (isMobile) { window.removeEventListener('touchstart', preventZoom); window.removeEventListener('touchend', preventDoubleTapZoom); }
    };
  }, [isMobile, mobileOrientationChoice]);

  // ── Hook: Resize & orientasi ──
  useEffect(() => {
    window.addEventListener('resize', setSize);
    if (mounted) setSize();
    if (isMobile && mobileOrientationChoice === 'landscape' && aspectRatio < 1) {
      if (screen.orientation && (screen.orientation as any).lock) (screen.orientation as any).lock('landscape').catch(() => { });
    }
    return () => window.removeEventListener('resize', setSize);
  }, [mounted, isMobile, mobileOrientationChoice, aspectRatio, setSize]);

  // ── Hook: Mobile auto-forward (gas otomatis) ──
  useEffect(() => { if (isMobile && gameState === 'playing') state.current.keyFaster = true; }, [isMobile, gameState]);

  // ── Hook: Auto-complete saat finished ──
  useEffect(() => { if (gameState === 'finished') endGame(); }, [gameState, endGame]);

  // ── Hook: Guard Realtime (session & participant) ──
  useEffect(() => {
    const sessId = typeof window !== 'undefined' ? localStorage.getItem('nitroquiz_game_sessionId') : null;
    const participantId = typeof window !== 'undefined' ? localStorage.getItem('nitroquiz_game_participantId') : null;
    if (!sessId || !participantId) return;

    const channel = supabase.channel(`player_game_guards_${participantId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessId}` },
        (payload) => {
          const status = payload.new.status;
          if (status === 'finished' || status === 'completed') router.push(`/player/${roomCode}/result`);
          else if (status === 'waiting' || status === 'lobby') router.push(`/player/${roomCode}/waiting`);
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'participants', filter: `id=eq.${participantId}` },
        (payload) => {
          if (payload.new.minigame === false && !payload.new.finished_at) router.push(`/player/${roomCode}/quiz`);
          if (payload.new.lap_race !== undefined) { console.log('[GameSpeed] Lap updated from DB:', payload.new.lap_race); setLapRace(payload.new.lap_race); }
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [router, roomCode]);

  // ── Hook: Timer global sinkron ──
  useEffect(() => {
    const sessId = typeof window !== 'undefined' ? localStorage.getItem('nitroquiz_game_sessionId') : null;
    if (!sessId) return;

    const fetchAndStartTimer = async () => {
      await syncServerTime();
      const { data } = await supabase.from('sessions').select('started_at, total_time_minutes').eq('id', sessId).single();
      if (!data?.started_at) { setIsTimerReady(true); return; }

      const start = new Date(data.started_at).getTime();
      const totalSeconds = (data.total_time_minutes || 5) * 60;
      const nowFirst = getSyncedServerTime();
      const elapsedFirst = Math.floor((nowFirst - start) / 1000);
      setGlobalTimeLeft(Math.max(0, Math.min(totalSeconds, totalSeconds - elapsedFirst)));
      setIsTimerReady(true);

      const interval = setInterval(() => {
        const now = getSyncedServerTime();
        const remaining = Math.max(0, Math.min(totalSeconds, totalSeconds - Math.floor((now - start) / 1000)));
        setGlobalTimeLeft(remaining);
        if (remaining <= 0) { clearInterval(interval); setGameState('finished'); endGame(); }
      }, 1000);
      return interval;
    };

    let intervalId: NodeJS.Timeout | undefined;
    fetchAndStartTimer().then(id => { intervalId = id; });
    return () => { if (intervalId) clearInterval(intervalId); };
  }, []);

  // ── Hook: Load soal kuis ──
  useEffect(() => {
    (async () => {
      if (!roomCode) return;
      try {
        let questionsData = [];
        const { data: sessionData, error } = await supabase.from('sessions').select('id, current_questions, difficulty').eq('game_pin', roomCode).single();
        if (!error && sessionData?.current_questions) {
          questionsData = sessionData.current_questions;
          localStorage.setItem('nitroquiz_game_questions', JSON.stringify(questionsData));
          localStorage.setItem('nitroquiz_game_sessionId', sessionData.id);
          if (sessionData.difficulty) localStorage.setItem('nitroquiz_game_difficulty', sessionData.difficulty);
        } else {
          const stored = localStorage.getItem('nitroquiz_game_questions');
          if (stored) questionsData = JSON.parse(stored);
        }

        if (Array.isArray(questionsData) && questionsData.length > 0) {
          const normalized: QuizQuestion[] = questionsData.map((q: any, idx: number) => {
            let options: any[] = []; let correctAnswer = 0;
            if (Array.isArray(q.answers) && q.answers.length > 0 && typeof q.answers[0] === 'object' && (q.answers[0].answer || q.answers[0].text)) {
              options = q.answers.map((a: any) => ({ text: a.answer || a.text || '', image: a.image || a.image_url || a.imageUrl || undefined }));
              if (q.correct !== undefined) { const correctIdx = q.answers.findIndex((a: any) => String(a.id) === String(q.correct)); correctAnswer = correctIdx >= 0 ? correctIdx : 0; }
            } else if (Array.isArray(q.options)) {
              options = q.options.map((opt: any) => typeof opt === 'string' ? { text: opt } : opt);
              correctAnswer = typeof q.correctAnswer === 'number' ? q.correctAnswer : typeof q.correct_answer === 'number' ? q.correct_answer : typeof q.answer === 'number' ? q.answer : 0;
            } else if (Array.isArray(q.choices)) {
              options = q.choices.map((opt: any) => typeof opt === 'string' ? { text: opt } : opt);
              correctAnswer = typeof q.correctAnswer === 'number' ? q.correctAnswer : 0;
            }
            return { id: q.id || `q-${idx}`, question: q.question || q.text || q.pertanyaan || '', options, correctAnswer, image: q.image || q.image_url || q.imageUrl || undefined };
          });

          setAllQuizQuestions(normalized); state.current.allQuizQuestions = normalized;
          const storedIndex = localStorage.getItem('nitroquiz_game_questionIndex');
          const storedScore = localStorage.getItem('nitroquiz_game_score');
          if (storedIndex) { const idx = parseInt(storedIndex, 10); setQuizQuestionIndex(idx); state.current.quizQuestionIndex = idx; }
          if (storedScore) { const sc = parseInt(storedScore, 10); setTotalQuizScore(sc); state.current.totalQuizScore = sc; }

          const participantId = localStorage.getItem('nitroquiz_game_participantId');
          if (participantId) {
            try { const { data: pData } = await supabase.from('participants').select('lap_race').eq('id', participantId).single(); if (pData) { setLapRace(pData.lap_race || 0); localStorage.setItem('nitroquiz_game_lapRace', String(pData.lap_race || 0)); } }
            catch (e) { console.error('Failed to fetch lap_race:', e); }
          }
        }
      } catch (e) { console.error('Failed to load quiz questions:', e); }
    })();
  }, []);

  // ════════════════════════════════════════════════════════════════
  // SECTION: RENDER JSX — UI Overlay di atas Canvas
  // ════════════════════════════════════════════════════════════════

  return (
    <div
      dir="ltr"
      style={{
        width: '100%', height: '100%', background: '#020617', overflow: 'hidden',
        fontFamily: 'var(--font-rajdhani)', userSelect: 'none', touchAction: 'none',
        WebkitUserSelect: 'none', textAlign: 'left',
        filter: (stats.speed > 150 ? `blur(${((stats.speed - 150) / 60) + (state.current.keyBoost && stats.nos > 0 ? 2 : 0)}px) ` : (state.current.keyBoost && stats.nos > 0 ? 'blur(2px) ' : '')) + 'contrast(1.05) brightness(1) saturate(1.1)',
        transition: 'filter 0.4s ease',
      }}
    >
      {/* ── Canvas game utama ── */}
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />

      {/* ── Overlay loading aset ── */}
      {mounted && !assetsLoaded && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, backgroundColor: '#0a0a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'var(--font-rajdhani)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', border: '4px solid rgba(45, 106, 242, 0.3)', borderTopColor: '#2d6af2', borderRadius: '50%', margin: '0 auto 1.5rem auto', animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '1rem', color: '#2d6af2', fontSize: '1.25rem', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>{t('player_game.establishing_signal')}</p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }`}</style>
        </div>
      )}

      {/* ── Overlay pemilihan orientasi mobile ── */}
      {mounted && isMobile && assetsLoaded && !mobileOrientationChoice && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#020617', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2500, color: 'white', fontFamily: 'var(--font-rajdhani)', padding: '1.5rem' }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(transparent 0%, rgba(45,106,242,0.05) 1px, transparent 1px), linear-gradient(90deg, transparent 0%, rgba(45,106,242,0.05) 1px, transparent 1px)', backgroundSize: '50px 50px', transform: 'perspective(500px) rotateX(60deg)', transformOrigin: 'bottom', opacity: 0.4, pointerEvents: 'none' }} />
          <div style={{ textAlign: 'center', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.3))' }}>🏎️</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'white', margin: 0, textShadow: '0 0 20px rgba(45,106,242,0.5)' }}>{t('player_game.select_view')}</h2>
            <p style={{ fontSize: '0.7rem', color: '#64748b', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '0.5rem' }}>{t('player_game.choose_perspective')}</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '340px', position: 'relative', zIndex: 1 }}>
            <button onClick={() => { setMobileOrientationChoice('portrait'); localStorage.setItem('nitroquiz_orientation', 'portrait'); }}
              style={{ flex: 1, padding: '1.5rem 1rem', background: 'linear-gradient(135deg, rgba(45,106,242,0.15) 0%, rgba(45,106,242,0.05) 100%)', border: '2px solid rgba(45,106,242,0.4)', borderRadius: '1.25rem', color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', transition: 'all 0.2s' }}>
              <div style={{ width: '3rem', height: '4.5rem', borderRadius: '0.5rem', border: '2px solid #2d6af2', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(45,106,242,0.1)', boxShadow: '0 0 20px rgba(45,106,242,0.2)' }}><span style={{ fontSize: '1.25rem' }}>📱</span></div>
              <span style={{ fontSize: '0.9rem', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{t('player_game.portrait')}</span>
              <span style={{ fontSize: '0.6rem', color: '#64748b', letterSpacing: '0.1em' }}>{t('player_game.swipe_to_steer')}</span>
            </button>
            <button onClick={() => { setMobileOrientationChoice('landscape'); localStorage.setItem('nitroquiz_orientation', 'landscape'); if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {}); if (screen.orientation && (screen.orientation as any).lock) (screen.orientation as any).lock('landscape').catch(() => {}); }}
              style={{ flex: 1, padding: '1.5rem 1rem', background: 'linear-gradient(135deg, rgba(0,255,157,0.1) 0%, rgba(0,255,157,0.03) 100%)', border: '2px solid rgba(0,255,157,0.4)', borderRadius: '1.25rem', color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', transition: 'all 0.2s' }}>
              <div style={{ width: '4.5rem', height: '3rem', borderRadius: '0.5rem', border: '2px solid #00ff9d', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,255,157,0.08)', boxShadow: '0 0 20px rgba(0,255,157,0.15)' }}><span style={{ fontSize: '1.25rem', transform: 'rotate(90deg)' }}>📱</span></div>
              <span style={{ fontSize: '0.9rem', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{t('player_game.landscape')}</span>
              <span style={{ fontSize: '0.6rem', color: '#64748b', letterSpacing: '0.1em' }}>{t('player_game.button_controls')}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── UI Overlay HUD (stats, timer, kontrol, mini-map) ── */}
      {mounted && assetsLoaded && (isMobile ? !!mobileOrientationChoice : true) && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 200, padding: isMobile ? '0.75rem' : '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontFamily: 'sans-serif', color: 'white', touchAction: 'none' }}>

          {/* ── Timer global ── */}
          <div style={{ position: 'absolute', left: '50%', top: isMobilePortrait ? '0.4rem' : (isMobile ? '0.75rem' : '1.25rem'), transform: 'translateX(-50%)', zIndex: 1000, backgroundColor: (globalTimeLeft !== null && globalTimeLeft <= 30) ? 'rgba(239, 68, 68, 0.35)' : 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(15px)', padding: isMobilePortrait ? '0.2rem 0.6rem' : (isMobile ? '0.4rem 0.75rem' : '0.6rem 1.25rem'), borderRadius: usePCLayout ? '1.25rem' : '0.6rem', border: (globalTimeLeft !== null && globalTimeLeft <= 30) ? '2px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255, 255, 255, 0.15)', boxShadow: (globalTimeLeft !== null && globalTimeLeft <= 30) ? '0 0 20px rgba(239, 68, 68, 0.4)' : '0 10px 30px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '0.6rem', pointerEvents: 'none', animation: (globalTimeLeft !== null && globalTimeLeft <= 30) ? 'timerPulse 1s infinite alternate' : 'none' }}>
            <span style={{ fontSize: isMobilePortrait ? '0.9rem' : (isMobile ? '1.1rem' : '1.5rem'), fontWeight: 900, color: '#fff', fontFamily: 'Orbitron, sans-serif', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.05em' }}>
              {globalTimeLeft !== null ? `${Math.floor(globalTimeLeft / 60).toString().padStart(2, '0')}:${(globalTimeLeft % 60).toString().padStart(2, '0')}` : "--:--"}
            </span>
          </div>

          {/* ── Header: speedometer, NOS, lap, mini-map ── */}
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'start', width: '100%', gap: isMobilePortrait ? '0.5rem' : '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobilePortrait ? '0.4rem' : '1rem', width: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', gap: isMobilePortrait ? '0.4rem' : '1rem', alignItems: 'center', justifyContent: 'flex-start' }}>
                {/* Speedometer */}
                <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(15px)', padding: isMobileLandscape ? '0.6rem 1rem' : (isMobilePortrait ? '0.3rem 0.5rem' : (usePCLayout ? '1.5rem 2.5rem' : '0.4rem 0.6rem')), borderRadius: usePCLayout ? '2rem' : '0.6rem', border: '1px solid rgba(255, 255, 255, 0.15)', flex: 'none', textAlign: 'left' as const }}>
                  <div style={{ fontSize: isMobilePortrait ? '6px' : (isMobileLandscape ? '8px' : (usePCLayout ? '10px' : '7px')), color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase' as const, letterSpacing: '0.3em', fontWeight: 900, marginBottom: '0.1rem' }}>{t('player_game.speedometer')}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem', justifyContent: 'flex-start' }}>
                    <span style={{ fontSize: isMobilePortrait ? '1.2rem' : (isMobileLandscape ? '1.8rem' : (usePCLayout ? '4.5rem' : '1.75rem')), fontWeight: 900, fontFamily: 'var(--font-rajdhani)', color: '#fff', fontStyle: 'italic' as const, textShadow: '0 0 10px rgba(255,255,255,0.7)' }}>{stats.speed}</span>
                    <span style={{ fontSize: isMobilePortrait ? '0.5rem' : (isMobileLandscape ? '0.7rem' : (usePCLayout ? '1rem' : '0.6rem')), color: '#60a5fa', fontWeight: 800 }}>KPH</span>
                  </div>
                </div>
                {/* Tombol toggle POV */}
                <button onClick={() => { const next = state.current.viewMode === 'first' ? 'third' : 'first'; state.current.viewMode = next; setViewMode(next); }}
                  style={{ pointerEvents: 'auto', backgroundColor: 'rgba(59, 130, 246, 0.25)', backdropFilter: 'blur(15px)', width: isMobilePortrait ? '2rem' : (isMobileLandscape ? '3rem' : (usePCLayout ? '5rem' : '2.5rem')), height: isMobilePortrait ? '2rem' : (isMobileLandscape ? '3rem' : (usePCLayout ? '5rem' : '2.5rem')), borderRadius: usePCLayout ? '1.25rem' : '0.5rem', border: '2px solid rgba(59, 130, 246, 0.5)', color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28)', gap: '2px' }}>
                  <span style={{ fontSize: isMobilePortrait ? '0.8rem' : (isMobileLandscape ? '1.2rem' : (usePCLayout ? '1.8rem' : '1rem')), filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.5))' }}>{viewMode === 'first' ? '🎥' : '👤'}</span>
                </button>
              </div>
              {/* NOS bar & Lap counter */}
              <div style={{ display: 'flex', gap: '0.3rem', width: 'auto' }}>
                <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(15px)', padding: isMobilePortrait ? '0.2rem 0.5rem' : (isMobileLandscape ? '0.5rem 0.8rem' : (usePCLayout ? '0.6rem 1rem' : '0.4rem 0.75rem')), borderRadius: usePCLayout ? '1.25rem' : '0.6rem', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', gap: usePCLayout ? '0.75rem' : '0.5rem', flex: isMobilePortrait ? 'none' : (usePCLayout ? 'none' : 1) }}>
                  <span style={{ color: '#60a5fa', fontWeight: 900, fontSize: isMobilePortrait ? '0.5rem' : (isMobileLandscape ? '0.7rem' : (usePCLayout ? '0.7rem' : '0.6rem')), textShadow: '0 0 10px rgba(59, 130, 246, 0.8)' }}>{t('player_game.nos')}</span>
                  <div style={{ flex: 1, minWidth: isMobilePortrait ? '40px' : (isMobileLandscape ? '70px' : (usePCLayout ? '80px' : '30px')), height: '4px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${stats.nos}%`, height: '100%', backgroundColor: '#3b82f6', boxShadow: '0 0 10px #3b82f6' }} />
                  </div>
                </div>
                <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(15px)', padding: isMobilePortrait ? '0.2rem 0.5rem' : (isMobileLandscape ? '0.5rem 0.8rem' : (isMobile ? '0.4rem 0.75rem' : '0.6rem 1rem')), borderRadius: usePCLayout ? '1.25rem' : '0.6rem', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', gap: '0.3rem', flex: 'none' }}>
                  <span style={{ color: '#4ade80', fontWeight: 900, fontSize: isMobilePortrait ? '0.5rem' : (isMobileLandscape ? '0.7rem' : (usePCLayout ? '0.7rem' : '0.6rem')), textShadow: '0 0 10px rgba(74, 222, 128, 0.8)' }}>{t('player_game.lap')}</span>
                  <span style={{ fontSize: isMobilePortrait ? '0.7rem' : (isMobileLandscape ? '1rem' : (usePCLayout ? '1.25rem' : '0.8rem')), fontWeight: 900, color: '#fff' }}>{Math.min(stats.totalLaps, lapRace + 1)}/{stats.totalLaps}</span>
                </div>
              </div>
            </div>

            {/* ── Mini-map ── */}
            <div onClick={() => isMobile && setMiniMapMinimized(!miniMapMinimized)} style={{ position: 'relative', pointerEvents: 'auto', zIndex: 300, alignSelf: 'start', transition: 'all 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28)', cursor: 'pointer' }}>
              <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(10px)', padding: isMobile ? '0.25rem' : '0.4rem', borderRadius: isMobile ? '0.6rem' : '1rem', transform: (isMobile && miniMapMinimized) ? 'scale(0.35)' : (isMobilePortrait ? 'scale(0.55)' : (isMobile ? 'scale(0.85)' : 'none')), transformOrigin: 'top right', position: 'relative', border: isMobile ? '2px solid rgba(255,255,255,0.2)' : 'none' }}>
                <canvas ref={miniMapRef} style={{ borderRadius: usePCLayout ? '0.75rem' : '0.4rem', display: 'block' }} />
                {isMobile && (
                  <div style={{ position: 'absolute', bottom: '-8px', left: '-8px', width: '24px', height: '24px', backgroundColor: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', border: '2px solid white', transform: miniMapMinimized ? 'scale(2.5)' : 'none', transition: 'transform 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28)' }}>{miniMapMinimized ? '🗺️' : '➖'}</div>
                )}
              </div>
            </div>
          </div>

          {/* ── Kontrol bawah (footer) ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', pointerEvents: 'none', paddingBottom: usePCLayout ? '1rem' : '2rem' }}>
            {!usePCLayout ? (
              /* ─── Mobile Portrait: NOS kiri, Brake kanan ─── */
              <>
                <div style={{ display: 'flex', gap: '0.75rem', pointerEvents: 'auto' }}>
                  <button style={{ width: '4.5rem', height: '4.5rem', background: stats.nos > 0 ? 'radial-gradient(circle at center, #3b82f6 0%, #1e40af 100%)' : 'rgba(255, 255, 255, 0.05)', borderRadius: '50%', border: stats.nos > 0 ? '3px solid #60a5fa' : '2px solid rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: stats.nos > 0 ? 1 : 0.5, color: 'white', fontWeight: 900, boxShadow: stats.nos > 0 ? '0 0 25px rgba(59, 130, 246, 0.6), inset 0 0 15px rgba(255, 255, 255, 0.3)' : 'none', transition: 'all 0.1s ease', transform: isBoosting ? 'scale(0.92)' : 'scale(1)', fontFamily: 'var(--font-rajdhani)', touchAction: 'none' }}
                    onPointerDown={(e) => { e.preventDefault(); state.current.keyBoost = true; setIsBoosting(true); }}
                    onPointerUp={(e) => { e.preventDefault(); state.current.keyBoost = false; setIsBoosting(false); }}
                    onPointerCancel={(e) => { e.preventDefault(); state.current.keyBoost = false; setIsBoosting(false); }}
                    onPointerLeave={() => { state.current.keyBoost = false; setIsBoosting(false); }}>
                    <span style={{ fontSize: '1.2rem', fontStyle: 'italic', letterSpacing: '-0.05em' }}>NITRO</span>
                    <div style={{ width: '60%', height: '2px', backgroundColor: 'rgba(255,255,255,0.4)', marginTop: '2px' }} />
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', pointerEvents: 'auto' }}>
                  <button style={{ width: '4.5rem', height: '4.5rem', background: isBraking ? 'radial-gradient(circle at center, #ef4444 0%, #991b1b 100%)' : 'rgba(239, 68, 68, 0.1)', backdropFilter: 'blur(8px)', borderRadius: '50%', border: '3px solid #ef4444', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: isBraking ? 'white' : '#ef4444', fontWeight: 900, textShadow: isBraking ? '0 0 10px white' : '0 0 8px rgba(239, 68, 68, 0.8)', boxShadow: isBraking ? '0 0 30px rgba(239, 68, 68, 0.8), inset 0 0 15px rgba(255, 255, 255, 0.3)' : '0 0 10px rgba(239, 68, 68, 0.2)', transition: 'all 0.1s ease', transform: isBraking ? 'scale(0.92)' : 'scale(1)', fontFamily: 'var(--font-rajdhani)', touchAction: 'none' }}
                    onPointerDown={(e) => { e.preventDefault(); state.current.keySlower = true; setIsBraking(true); }}
                    onPointerUp={(e) => { e.preventDefault(); state.current.keySlower = false; setIsBraking(false); }}
                    onPointerCancel={(e) => { e.preventDefault(); state.current.keySlower = false; setIsBraking(false); }}
                    onPointerLeave={() => { state.current.keySlower = false; setIsBraking(false); }}>
                    <span style={{ fontSize: '1.2rem', fontStyle: 'italic', letterSpacing: '0.05em' }}>BRAKE</span>
                    <div style={{ width: '60%', height: '2px', backgroundColor: isBraking ? 'rgba(255,255,255,0.4)' : 'rgba(239,68,68,0.4)', marginTop: '2px' }} />
                  </button>
                </div>
              </>
            ) : (
              /* ─── PC / Mobile Landscape: Steering + Gas + Brake + NOS ─── */
              <>
                <div style={{ display: 'flex', gap: '0.6rem', pointerEvents: 'auto' }}>
                  <button style={{ width: isMobileLandscape ? '3.5rem' : '5rem', height: isMobileLandscape ? '3.5rem' : '5rem', backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', borderRadius: '50%', border: isMobileLandscape ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none' }}
                    onPointerDown={(e) => { e.preventDefault(); state.current.keyLeft = true; }} onPointerUp={(e) => { e.preventDefault(); state.current.keyLeft = false; }} onPointerCancel={(e) => { e.preventDefault(); state.current.keyLeft = false; }} onPointerLeave={() => { state.current.keyLeft = false; }}>
                    <span style={{ fontSize: isMobileLandscape ? '1rem' : '1.25rem', color: 'white', filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.8))' }}>◀</span>
                  </button>
                  <button style={{ width: isMobileLandscape ? '3.5rem' : '5rem', height: isMobileLandscape ? '3.5rem' : '5rem', backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', borderRadius: '50%', border: isMobileLandscape ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none' }}
                    onPointerDown={(e) => { e.preventDefault(); state.current.keyRight = true; }} onPointerUp={(e) => { e.preventDefault(); state.current.keyRight = false; }} onPointerCancel={(e) => { e.preventDefault(); state.current.keyRight = false; }} onPointerLeave={() => { state.current.keyRight = false; }}>
                    <span style={{ fontSize: isMobileLandscape ? '1rem' : '1.25rem', color: 'white', filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.8))' }}>▶</span>
                  </button>
                </div>
                <div style={{ display: 'flex', gap: isMobileLandscape ? '0.5rem' : '0.75rem', alignItems: 'flex-end', pointerEvents: 'auto' }}>
                  <button style={{ width: isMobileLandscape ? '3.2rem' : '4.5rem', height: isMobileLandscape ? '3.2rem' : '4.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', backdropFilter: 'blur(8px)', borderRadius: '50%', border: isMobileLandscape ? '1px solid #ef4444' : '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444', fontWeight: 900, fontSize: isMobileLandscape ? '0.5rem' : '0.6rem', textShadow: '0 0 8px rgba(239, 68, 68, 0.8)' }}
                    onPointerDown={(e) => { e.preventDefault(); state.current.keySlower = true; }} onPointerUp={(e) => { e.preventDefault(); state.current.keySlower = false; }} onPointerCancel={(e) => { e.preventDefault(); state.current.keySlower = false; }} onPointerLeave={() => { state.current.keySlower = false; }}>STOP</button>
                  <button style={{ width: isMobileLandscape ? '5.5rem' : '7.5rem', height: isMobileLandscape ? '5.5rem' : '7.5rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '50%', border: isMobileLandscape ? '2px solid rgba(255, 255, 255, 0.3)' : '3px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', fontWeight: 900, fontSize: isMobileLandscape ? '1.1rem' : '1.25rem', boxShadow: isMobileLandscape ? '0 0 15px rgba(16, 185, 129, 0.4)' : 'none' }}
                    onPointerDown={(e) => { e.preventDefault(); state.current.keyFaster = true; }} onPointerUp={(e) => { e.preventDefault(); state.current.keyFaster = false; }} onPointerCancel={(e) => { e.preventDefault(); state.current.keyFaster = false; }} onPointerLeave={() => { state.current.keyFaster = false; }}>
                    <span style={{ filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.8))' }}>GO</span>
                  </button>
                  <button style={{ width: isMobileLandscape ? '3.8rem' : '5rem', height: isMobileLandscape ? '3.8rem' : '5rem', background: stats.nos > 0 ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'rgba(255, 255, 255, 0.05)', borderRadius: '50%', border: isMobileLandscape ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: stats.nos > 0 ? 1 : 0.5, color: 'white', fontWeight: 900, fontSize: isMobileLandscape ? '0.7rem' : '0.8rem', boxShadow: stats.nos > 0 && isMobileLandscape ? '0 0 15px rgba(59, 130, 246, 0.4)' : 'none' }}
                    onPointerDown={(e) => { e.preventDefault(); state.current.keyBoost = true; }} onPointerUp={(e) => { e.preventDefault(); state.current.keyBoost = false; }} onPointerCancel={(e) => { e.preventDefault(); state.current.keyBoost = false; }} onPointerLeave={() => { state.current.keyBoost = false; }}>
                    <span style={{ filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.8))' }}>NOS</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`@keyframes countdown-scale { 0% { transform: scale(0.8); opacity: 0; } 50% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }`}</style>

      {/* ── Overlay loading (aset atau timer belum siap) ── */}
      {mounted && (!assetsLoaded || !isTimerReady) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617', color: 'white', fontFamily: 'var(--font-rajdhani)' }}>
          <div style={{ width: '64px', height: '64px', border: '4px solid rgba(59,130,246,0.1)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', boxShadow: '0 0 20px rgba(59,130,246,0.2)' }} />
          <p style={{ marginTop: '2rem', fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4em', color: '#3b82f6', animation: 'pulse 2s ease-in-out infinite' }}>{t('player_game.establishing_signal')}</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
        </div>
      )}

      {/* ── Overlay game selesai ── */}
      {gameState === 'finished' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: '#020617', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#00ff9d', fontFamily: 'var(--font-rajdhani)', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }}>{t('player_game.race_finished')}</div>
          <div style={{ fontSize: '1rem', color: '#94a3b8', maxWidth: '300px' }}>{t('player_game.redirecting')}</div>
        </div>
      )}
      <style>{`@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }`}</style>
    </div>
  );
}
