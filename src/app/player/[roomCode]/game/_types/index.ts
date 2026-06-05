/**
 * =====================================================
 * TIPE DATA GAME - NitroQuiz Racing Game
 * =====================================================
 * File ini berisi semua interface dan tipe data yang
 * digunakan dalam game racing NitroQuiz.
 * =====================================================
 */

// --- Tipe Data untuk Soal Kuis ---
/** Representasi satu pertanyaan kuis */
export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
}

// --- Tipe Data untuk Proyeksi 3D ---
/** Titik dalam ruang 3D (world, camera, screen) */
export interface Point {
    world: { x: number; y: number; z: number };
    camera: { x: number; y: number; z: number };
    screen: { scale: number; x: number; y: number; w: number };
}

// --- Tipe Data untuk Objek Sisi Jalan ---
/** Sprite objek di sisi jalan (pohon, gedung, dll) */
export interface Sprite {
    source: any;
    offset: number;
    offsetY?: number;
}

// --- Tipe Data untuk Kendaraan NPC ---
/** Kendaraan NPC di jalan raya */
export interface Car {
    offset: number;
    z: number;
    sprite: any;
    speed: number;
    percent: number;
    isRival?: boolean;
    type?: 'jne' | 'truck' | 'odong' | 'taxi';
    animTimer?: number;
    animFrame?: number;
}

// --- Tipe Data untuk Segmen Jalan ---
/** Satu segmen jalan dengan properti visual dan data */
export interface Segment {
    index: number;
    p1: Point;
    p2: Point;
    color: { road: string; grass: string; rumble: string; strip: string };
    curve: number;
    fog: number;
    clip: number;
    looped: boolean;
    sprites: Sprite[];
    cars: Car[];
    zebra?: boolean;
}

// --- Tipe Data untuk State Game ---
/** State permainan (persiapan, bermain, selesai, game over) */
export type GameState = 'preparation' | 'playing' | 'finished' | 'gameover';

/** Mode tampilan kamera (orang pertama / orang ketiga) */
export type ViewMode = 'first' | 'third';

/** Pilihan orientasi mobile */
export type MobileOrientation = 'portrait' | 'landscape' | null;

/** Statistik yang ditampilkan di HUD */
export interface GameStats {
    speed: number;
    nos: number;
    lap: number;
    totalLaps: number;
}

// --- Tipe Data untuk Konfigurasi Kesulitan ---
/** Konfigurasi berdasarkan tingkat kesulitan */
export interface DifficultyConfig {
    fieldOfView: number;
    cameraHeight: number;
    fogDensity: number;
    npcCount: number;
    obstacleCount: number;
    trackType: 'simple' | 'complex' | 'hard';
}

// --- Tipe Data untuk Game Loop State (Ref) ---
/** State internal game loop yang disimpan di useRef (menghindari stale closure) */
export interface GameLoopState {
    segments: Segment[];
    cars: Car[];
    position: number;
    playerX: number;
    playerZ: number;
    speed: number;
    trackLength: number;
    sprites: Record<string, any>;
    keyLeft: boolean;
    keyRight: boolean;
    keyFaster: boolean;
    keySlower: boolean;
    keyBoost: boolean;
    nos: number;
    currentLap: number;
    totalLaps: number;
    countdown: number;
    cameraDepth: number;
    viewMode: ViewMode;
    bgOffset: number;
    analogSteer: number;
    // State animasi NOS
    nosPhase: 'idle' | 'startup' | 'loop' | 'ending';
    nosFrame: number;
    nosFrameTimer: number;
    nosWasPressed: boolean;
    // State animasi start (revving)
    revvingFrame: number;
    revvingTimer: number;
    // State animasi karakter utama
    mcFrame: number;
    mcTimer: number;
    // State kuis untuk akses di game loop (menghindari stale closure)
    allQuizQuestions: QuizQuestion[];
    quizQuestionIndex: number;
    totalQuizScore: number;
    // Flag garis finish
    hasFinishedLine?: boolean;
}
