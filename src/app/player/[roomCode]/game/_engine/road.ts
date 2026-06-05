/**
 * =====================================================
 * MESIN PEMBANGUNAN JALAN - NitroQuiz Racing Game
 * =====================================================
 * Modul ini menangani pembuatan segmen-segmen jalan,
 * penempatan aset, NPC, dan obstacle berdasarkan
 * tingkat kesulitan.
 * =====================================================
 */

import type { Segment, Car, GameLoopState } from '../_types';
import { Util } from '../_utils';
import {
    SEGMENT_LENGTH, RUMBLE_LENGTH, MAX_SPEED,
    ROAD_CONF, COLORS
} from '../_constants';
import { getDifficultyConfig } from '../_constants';
import { TRACK_ASSETS, getAssetOffset } from '@/lib/gameAssets';

// ==========================================
// Fungsi Pencari Segmen
// ==========================================

/**
 * Mencari segmen jalan berdasarkan posisi Z.
 * Mengembalikan segmen dummy jika data belum diinisialisasi.
 *
 * @param state - State game loop saat ini
 * @param z - Posisi Z yang dicari
 * @returns Segmen jalan yang sesuai
 */
export function findSegment(state: GameLoopState, z: number): Segment {
    if (!state.segments || state.segments.length === 0) {
        // Kembalikan segmen dummy untuk mencegah crash
        return {
            index: 0,
            p1: { world: { x: 0, y: 0, z: 0 }, camera: { x: 0, y: 0, z: 0 }, screen: { scale: 0, x: 0, y: 0, w: 0 } },
            p2: { world: { x: 0, y: 0, z: 0 }, camera: { x: 0, y: 0, z: 0 }, screen: { scale: 0, x: 0, y: 0, w: 0 } },
            curve: 0,
            color: COLORS.LIGHT,
            sprites: [],
            cars: [],
            clip: 0,
            fog: 0,
            looped: false
        } as Segment;
    }
    return state.segments[Math.floor(z / SEGMENT_LENGTH) % state.segments.length];
}

// ==========================================
// Fungsi Pembangunan Segmen Jalan
// ==========================================

/**
 * Menambahkan satu segmen baru ke daftar segmen.
 * Segmen baru akan memiliki ketinggian dan kurva tertentu.
 *
 * @param segments - Array segmen jalan
 * @param curve - Tingkat kelengkungan jalan
 * @param y - Ketinggian ujung segmen
 */
function addSegment(segments: Segment[], curve: number, y: number): void {
    const n = segments.length;
    const lastY = n === 0 ? 0 : segments[n - 1].p2.world.y;

    segments.push({
        index: n,
        p1: { world: { x: 0, y: lastY, z: n * SEGMENT_LENGTH }, camera: { x: 0, y: 0, z: 0 }, screen: { scale: 0, x: 0, y: 0, w: 0 } },
        p2: { world: { x: 0, y: y, z: (n + 1) * SEGMENT_LENGTH }, camera: { x: 0, y: 0, z: 0 }, screen: { scale: 0, x: 0, y: 0, w: 0 } },
        curve: curve,
        sprites: [],
        cars: [],
        color: Math.floor(n / RUMBLE_LENGTH) % 2 ? COLORS.DARK : COLORS.LIGHT,
        fog: 0,
        clip: 0,
        looped: false
    });
}

/**
 * Menambahkan serangkaian segmen jalan dengan transisi masuk, tahan, dan keluar.
 * Digunakan sebagai basis untuk membuat jalan lurus, tikungan, dan bukit.
 *
 * @param segments - Array segmen jalan
 * @param enter - Jumlah segmen transisi masuk
 * @param hold - Jumlah segmen tahan
 * @param leave - Jumlah segmen transisi keluar
 * @param curve - Tingkat kelengkungan
 * @param y - Perubahan ketinggian
 */
function addRoad(segments: Segment[], enter: number, hold: number, leave: number, curve: number, y: number): void {
    const startY = segments.length === 0 ? 0 : segments[segments.length - 1].p2.world.y;
    const endY = startY + (Util.toInt(y, 0) * SEGMENT_LENGTH);
    const total = enter + hold + leave;
    for (let n = 0; n < enter; n++) addSegment(segments, Util.easeIn(0, curve, n / enter), Util.easeInOut(startY, endY, n / total));
    for (let n = 0; n < hold; n++) addSegment(segments, curve, Util.easeInOut(startY, endY, (enter + n) / total));
    for (let n = 0; n < leave; n++) addSegment(segments, Util.easeInOut(curve, 0, n / leave), Util.easeInOut(startY, endY, (enter + hold + n) / total));
}

// ==========================================
// Fungsi Bentuk Jalan (Jalan Lurus, Tikungan, dll)
// ==========================================

/** Menambahkan jalan lurus */
function addStraight(segments: Segment[], num?: number): void {
    num = num || ROAD_CONF.LENGTH.MEDIUM;
    addRoad(segments, num, num, num, 0, 0);
}

/** Menambahkan tikungan dengan ketinggian opsional */
function addCurve(segments: Segment[], num?: number, curve?: number, height?: number): void {
    num = num || ROAD_CONF.LENGTH.MEDIUM;
    curve = curve || ROAD_CONF.CURVE.MEDIUM;
    height = height || ROAD_CONF.HILL.NONE;
    addRoad(segments, num, num, num, curve, height);
}

/** Menambahkan rangkaian tikungan S (S-Curves) */
function addSCurves(segments: Segment[]): void {
    addRoad(segments, ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.LENGTH.MEDIUM, -ROAD_CONF.CURVE.EASY, ROAD_CONF.HILL.NONE);
    addRoad(segments, ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.CURVE.MEDIUM, ROAD_CONF.HILL.MEDIUM);
    addRoad(segments, ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.CURVE.EASY, -ROAD_CONF.HILL.LOW);
    addRoad(segments, ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.LENGTH.MEDIUM, -ROAD_CONF.CURVE.EASY, ROAD_CONF.HILL.MEDIUM);
    addRoad(segments, ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.LENGTH.MEDIUM, -ROAD_CONF.CURVE.MEDIUM, -ROAD_CONF.HILL.MEDIUM);
}

/** Menambahkan segmen jalan bergelombang (bumps) */
function addBumps(segments: Segment[]): void {
    addRoad(segments, 10, 10, 10, 0, 5);
    addRoad(segments, 10, 10, 10, 0, -2);
    addRoad(segments, 10, 10, 10, 0, -5);
    addRoad(segments, 10, 10, 10, 0, 8);
    addRoad(segments, 10, 10, 10, 0, 5);
    addRoad(segments, 10, 10, 10, 0, -7);
    addRoad(segments, 10, 10, 10, 0, 5);
    addRoad(segments, 10, 10, 10, 0, -2);
}

/** Menambahkan turunan menuju akhir track */
function addDownhillToEnd(segments: Segment[], num: number): void {
    num = num || 200;
    const lastY = segments.length === 0 ? 0 : segments[segments.length - 1].p2.world.y;
    addRoad(segments, num, num, num, -ROAD_CONF.CURVE.EASY, -lastY / SEGMENT_LENGTH);
}

// ==========================================
// Fungsi Utama: Reset dan Bangun Track
// ==========================================

/**
 * Mereset dan membangun ulang seluruh track jalan beserta aset,
 * NPC, obstacle, dan rival berdasarkan tingkat kesulitan.
 *
 * @param state - State game loop yang akan dimodifikasi
 */
export function resetRoad(state: GameLoopState): void {
    const difficulty = localStorage.getItem('nitroquiz_game_difficulty') || 'easy';
    const diffConfig = getDifficultyConfig(difficulty);

    state.segments = [];
    state.hasFinishedLine = false;

    // --- Bangun track berdasarkan tingkat kesulitan ---
    if (diffConfig.trackType === 'hard') {
        // --- HARD: 'Grand Hard' - Halus, Mengalir & 1.5x Panjang Medium (~1400 seg) ---
        // 1. Pintu Masuk Hutan (200 segmen)
        addStraight(state.segments, ROAD_CONF.LENGTH.MEDIUM);
        addCurve(state.segments, ROAD_CONF.LENGTH.LONG, ROAD_CONF.CURVE.MEDIUM, ROAD_CONF.HILL.NONE);
        addStraight(state.segments, ROAD_CONF.LENGTH.MEDIUM);

        // 2. Lintasan Gunung Besar (400 segmen)
        addCurve(state.segments, ROAD_CONF.LENGTH.LONG, -ROAD_CONF.CURVE.MEDIUM, ROAD_CONF.HILL.MEDIUM);
        addCurve(state.segments, ROAD_CONF.LENGTH.LONG, ROAD_CONF.CURVE.HARD, ROAD_CONF.HILL.HIGH);
        addCurve(state.segments, ROAD_CONF.LENGTH.LONG, -ROAD_CONF.CURVE.HARD, ROAD_CONF.HILL.MEDIUM);
        addStraight(state.segments, ROAD_CONF.LENGTH.LONG);

        // 3. Punggung Bukit Tinggi (300 segmen)
        addCurve(state.segments, ROAD_CONF.LENGTH.LONG, ROAD_CONF.CURVE.MEDIUM, ROAD_CONF.HILL.NONE);
        addBumps(state.segments);
        addCurve(state.segments, ROAD_CONF.LENGTH.LONG, -ROAD_CONF.CURVE.MEDIUM, ROAD_CONF.HILL.NONE);
        addStraight(state.segments, ROAD_CONF.LENGTH.LONG);

        // 4. Turunan Alpen (300 segmen)
        addCurve(state.segments, ROAD_CONF.LENGTH.LONG, ROAD_CONF.CURVE.HARD, -ROAD_CONF.HILL.HIGH);
        addCurve(state.segments, ROAD_CONF.LENGTH.LONG, -ROAD_CONF.CURVE.MEDIUM, -ROAD_CONF.HILL.MEDIUM);
        addCurve(state.segments, ROAD_CONF.LENGTH.LONG, ROAD_CONF.CURVE.EASY, -ROAD_CONF.HILL.LOW);

        // 5. Sprint Besar Terakhir (200 segmen)
        addSCurves(state.segments);
        addDownhillToEnd(state.segments, 250);
    } else if (diffConfig.trackType === 'complex') {
        // --- MEDIUM: Track berkelok dengan S-Curves dan Bumps ---
        addStraight(state.segments, ROAD_CONF.LENGTH.SHORT);
        addSCurves(state.segments);
        addCurve(state.segments, ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.CURVE.EASY, ROAD_CONF.HILL.NONE);
        addBumps(state.segments);
        addCurve(state.segments, ROAD_CONF.LENGTH.LONG, ROAD_CONF.CURVE.HARD, -ROAD_CONF.HILL.MEDIUM);
        addStraight(state.segments, ROAD_CONF.LENGTH.SHORT);
        addCurve(state.segments, ROAD_CONF.LENGTH.LONG, -ROAD_CONF.CURVE.HARD, ROAD_CONF.HILL.HIGH);
        addBumps(state.segments);
        addStraight(state.segments, ROAD_CONF.LENGTH.MEDIUM);
        addDownhillToEnd(state.segments, 150);
    } else {
        // --- EASY: Track sederhana ---
        addStraight(state.segments, ROAD_CONF.LENGTH.SHORT);
        addCurve(state.segments, ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.CURVE.MEDIUM, ROAD_CONF.HILL.LOW);
        addStraight(state.segments, ROAD_CONF.LENGTH.LONG);
        addCurve(state.segments, ROAD_CONF.LENGTH.MEDIUM, -ROAD_CONF.CURVE.MEDIUM, ROAD_CONF.HILL.NONE);
        addStraight(state.segments, ROAD_CONF.LENGTH.MEDIUM);
        addCurve(state.segments, ROAD_CONF.LENGTH.LONG, ROAD_CONF.CURVE.EASY, ROAD_CONF.HILL.MEDIUM);
        addStraight(state.segments, ROAD_CONF.LENGTH.LONG);
        addCurve(state.segments, ROAD_CONF.LENGTH.MEDIUM, ROAD_CONF.CURVE.MEDIUM, -ROAD_CONF.HILL.LOW);
        addStraight(state.segments, ROAD_CONF.LENGTH.SHORT);
        addDownhillToEnd(state.segments, 100);
    }

    const len = state.segments.length;

    // ==========================================
    // Penempatan Aset di Sisi Jalan (Hybrid)
    // ==========================================
    const occupied: { [key: string]: boolean } = {};

    // Tempatkan aset dari TRACK_ASSETS (konfigurasi global)
    TRACK_ASSETS.forEach(item => {
        const segIdx = item.z;
        if (segIdx < len) {
            if (item.src) {
                let sprite = state.sprites[item.src];
                if (sprite) {
                    const offset = item.offset !== undefined ? item.offset : getAssetOffset(item.side, item.src);
                    state.segments[segIdx].sprites.push({ source: sprite, offset: offset, offsetY: -1 });
                    // Tandai segmen sebagai terisi agar tidak ada overlap
                    occupied[`${segIdx}_${item.side}`] = true;
                    occupied[`${segIdx + 1}_${item.side}`] = true;
                    occupied[`${segIdx + 2}_${item.side}`] = true;
                    // Tambahkan zebra cross jika ada lampu lalu lintas
                    if (item.src.includes('lampulalulintas')) {
                        for (let z = 0; z < 10; z++) {
                            if (state.segments[segIdx + z]) {
                                state.segments[segIdx + z].zebra = true;
                            }
                        }
                    }
                }
            }
        }
    });

    // Untuk mode hard: salin aset ke bagian track yang diperpanjang
    if (diffConfig.trackType === 'hard') {
        const maxAssetZ = Math.max(...TRACK_ASSETS.map(a => a.z));
        const assetOffset = maxAssetZ + 50;
        // Hanya isi jika track lebih panjang dari aset yang ada
        if (len > assetOffset) {
            TRACK_ASSETS.forEach(item => {
                const segIdx = item.z + assetOffset;
                if (segIdx < len) {
                    if (item.src) {
                        let sprite = state.sprites[item.src];
                        if (sprite) {
                            const key = `${segIdx}_${item.side}`;
                            if (!occupied[key]) {
                                const offset = item.offset !== undefined ? item.offset : getAssetOffset(item.side, item.src);
                                state.segments[segIdx].sprites.push({ source: sprite, offset: offset, offsetY: -1 });
                                occupied[key] = true;
                                occupied[`${segIdx + 1}_${item.side}`] = true;
                                occupied[`${segIdx + 2}_${item.side}`] = true;
                            }
                        }
                    }
                }
            });
        }
    }

    state.trackLength = len * SEGMENT_LENGTH;

    // ==========================================
    // Pembuatan NPC (Kendaraan Lalu Lintas)
    // ==========================================
    state.cars = [];
    for (let n = 0; n < diffConfig.npcCount; n++) {
        const z = (n + 1) * (len * SEGMENT_LENGTH / diffConfig.npcCount);
        const offset = Util.randomChoice([-0.8, -0.4, 0.4, 0.8]);
        const speed = MAX_SPEED / 4 + Math.random() * (MAX_SPEED / 2);

        // Tentukan tipe kendaraan NPC secara acak
        const vehicleTypeRnd = Math.random();
        let vehicleType: 'truck' | 'jne' | 'odong' | 'taxi' = 'truck';
        let vehicleSprite = state.sprites.truck2;

        if (vehicleTypeRnd < 0.25) {
            vehicleType = 'truck';
            vehicleSprite = state.sprites.truck_straight_0 || state.sprites.truck2;
        } else if (vehicleTypeRnd < 0.5) {
            vehicleType = 'jne';
            vehicleSprite = state.sprites.jne_straight_1;
        } else if (vehicleTypeRnd < 0.75) {
            vehicleType = 'odong';
            vehicleSprite = state.sprites.odong_straight;
        } else {
            vehicleType = 'taxi';
            vehicleSprite = state.sprites.taxi_straight || state.sprites.truck2;
        }

        const car: Car = {
            offset: offset,
            z: z,
            sprite: vehicleSprite,
            speed: speed,
            percent: 0,
            type: vehicleType,
            animTimer: Math.random() * 100,
            animFrame: 0
        };
        state.cars.push(car);
        findSegment(state, z).cars.push(car);
    }

    // ==========================================
    // Pembuatan Obstacle Statis (Medium + Hard)
    // ==========================================
    if (diffConfig.obstacleCount > 0) {
        for (let n = 0; n < diffConfig.obstacleCount; n++) {
            const zLength = len * SEGMENT_LENGTH;
            const startOffset = 20 * SEGMENT_LENGTH;
            const z = startOffset + Math.random() * (zLength - startOffset - 1000);
            const offset = (Math.random() * 1.6) - 0.8;
            const isBarrier = Math.random() > 0.5;
            const obstacleSprite = isBarrier ? state.sprites.obstacle2 : state.sprites.obstacle1;
            const obstacle: Car = {
                offset: offset,
                z: z,
                sprite: obstacleSprite || state.sprites.truck2,
                speed: 0,
                percent: 0,
                type: 'obstacle' as any
            };
            state.cars.push(obstacle);
            findSegment(state, z).cars.push(obstacle);
        }
    }

    // ==========================================
    // Pembuatan Rival NPC
    // ==========================================
    const rivalCar: Car = {
        offset: -0.4,
        z: 200 * SEGMENT_LENGTH,
        sprite: state.sprites.car_rival || state.sprites.npc_car,
        speed: MAX_SPEED * 0.7,
        percent: 0,
        isRival: true
    };
    state.cars.push(rivalCar);
    findSegment(state, rivalCar.z).cars.push(rivalCar);

    // Warnai garis finish
    for (let n = 0; n < RUMBLE_LENGTH; n++) {
        if (len - 1 - n >= 0) state.segments[len - 1 - n].color = COLORS.FINISH;
    }

    state.trackLength = len * SEGMENT_LENGTH;
}
