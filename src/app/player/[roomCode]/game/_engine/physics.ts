/**
 * =====================================================
 * MESIN FISIKA & UPDATE - NitroQuiz Racing Game
 * =====================================================
 * Modul ini menangani semua logika update game per frame:
 * - Pergerakan pemain (akselerasi, pengereman, NOS)
 * - Kemudi (keyboard dan analog mobile)
 * - Tabrakan dengan NPC dan obstacle
 * - Update NPC (posisi dan animasi)
 * - Efek parallax latar belakang
 * - FOV dinamis saat NOS aktif
 * =====================================================
 */

import type { GameLoopState, GameState, GameStats } from '../_types';
import { Util } from '../_utils';
import {
    SEGMENT_LENGTH, MAX_SPEED, ACCEL, BREAKING, DECEL,
    OFF_ROAD_DECEL, OFF_ROAD_LIMIT, ROAD_WIDTH, QUESTIONS_PER_ROUND
} from '../_constants';
import { getDifficultyConfig } from '../_constants';
import { findSegment } from './road';

// ==========================================
// Fungsi Update Utama (Dipanggil Setiap Frame)
// ==========================================

/**
 * Parameter yang dibutuhkan fungsi update dari komponen React.
 * Menggunakan interface agar tidak terjadi stale closure.
 */
export interface UpdateContext {
    /** State permainan saat ini */
    gameState: GameState;
    /** Apakah perangkat mobile */
    isMobile: boolean;
    /** Pilihan orientasi mobile */
    mobileOrientationChoice: 'portrait' | 'landscape' | null;
    /** Rasio aspek layar */
    aspectRatio: number;
    /** Lap race saat ini */
    lapRace: number;
    /** Callback untuk set statistik HUD */
    setStats: (stats: GameStats) => void;
}

/**
 * Update state game setiap frame.
 * Menghitung fisika kendaraan, kemudi, tabrakan, dan animasi NPC.
 *
 * @param state - State game loop (mutable ref)
 * @param dt - Delta waktu dalam detik
 * @param ctx - Context dari komponen React
 */
export function updateGame(state: GameLoopState, dt: number, ctx: UpdateContext): void {
    const { keyLeft, keyRight, keyFaster, keySlower, keyBoost, playerX, speed, trackLength } = state;
    let { position, playerZ } = state;
    const isPreparing = ctx.gameState === 'preparation';

    const playerSegment = findSegment(state, position + playerZ);
    const speedPercent = speed / MAX_SPEED;
    const dx = dt * 2 * speedPercent;

    // ==========================================
    // Pergerakan — hanya saat bermain
    // ==========================================
    if (ctx.gameState === 'playing') {
        position = Util.increase(position, dt * speed, trackLength);
        state.position = position;
    }

    // ==========================================
    // Kemudi (Steering)
    // ==========================================
    let nextPlayerX = playerX;
    if (ctx.isMobile && ctx.mobileOrientationChoice === 'portrait') {
        // Kemudi analog untuk mobile portrait berdasarkan jarak swipe
        nextPlayerX = playerX + (state.analogSteer * dx * 3.0); // Ditingkatkan untuk portrait
    } else {
        // Kemudi tombol tradisional untuk PC atau Mobile Landscape
        // Langsung cek state.current untuk memastikan nilai terbaru di perangkat sentuh
        const steerForce = (ctx.isMobile ? 2.5 : 1.0); // Kemudi lebih kuat untuk sentuh
        if (state.keyLeft) nextPlayerX = playerX - (dx * steerForce);
        else if (state.keyRight) nextPlayerX = playerX + (dx * steerForce);
    }

    // Efek sentrifugal — dikurangi untuk kemudi lebih halus
    nextPlayerX = nextPlayerX - (dx * speedPercent * playerSegment.curve * 0.2);

    // Pembatas jalan (batas maksimum keluar lintasan)
    nextPlayerX = Util.limit(nextPlayerX, -1.5, 1.5);

    // ==========================================
    // Logika Kecepatan & NOS
    // ==========================================
    let nextSpeed = speed;
    let nextNos = state.nos;

    const GAS_LIMIT = MAX_SPEED * 0.9;    // ~180 KPH
    const BOOST_LIMIT = MAX_SPEED * 1.1;  // ~220 KPH
    const REVVING_LIMIT = MAX_SPEED * 0.2; // ~40 KPH

    if (isPreparing) {
        // Fase persiapan — kecepatan terbatas
        if (keyFaster) {
            nextSpeed = Util.accelerate(speed, ACCEL * 0.5, dt);
            nextSpeed = Math.min(nextSpeed, REVVING_LIMIT);
        } else {
            nextSpeed = Util.accelerate(speed, DECEL, dt);
        }
    } else {
        // Fase bermain — fisika penuh
        const tryingToBoost = keyBoost && nextNos > 0;

        if (keySlower) {
            // PENGEREMAN — prioritas lebih tinggi dari gas untuk mobile auto-forward
            nextSpeed = Util.accelerate(speed, BREAKING, dt);
        } else if (tryingToBoost) {
            // NOS BOOST — akselerasi 2.5x
            nextSpeed = Util.accelerate(speed, ACCEL * 2.5, dt);
            nextNos = Math.max(0, nextNos - dt * 25); // Konsumsi NOS

            // Efek jitter pada kecepatan tinggi untuk sensasi turbo
            if (nextSpeed >= BOOST_LIMIT - 300) {
                const jitter = (Math.random() - 0.5) * 200;
                nextSpeed = Util.limit(nextSpeed + jitter, 0, BOOST_LIMIT);
            }
        } else if (keyFaster) {
            // GAS NORMAL
            nextSpeed = Util.accelerate(speed, ACCEL, dt);
            if (nextSpeed > GAS_LIMIT) {
                nextSpeed = Util.accelerate(nextSpeed, DECEL, dt);
                nextSpeed = Math.max(nextSpeed, GAS_LIMIT);
            }
        } else {
            // IDLE — perlambatan alami
            nextSpeed = Util.accelerate(speed, DECEL, dt);
        }

        // Logika regenerasi NOS — hanya jika TIDAK menekan boost dan TIDAK mengerem
        if (!keyBoost && !keySlower) {
            if (keyFaster) nextNos = Math.min(100, nextNos + dt * 2); // Regen lambat saat gas
            else nextNos = Math.min(100, nextNos + dt * 8); // Regen cepat saat idle
        }
    }

    state.nos = nextNos;

    // ==========================================
    // Deteksi Di Luar Jalan (Off-road)
    // ==========================================
    if ((nextPlayerX < -1) || (nextPlayerX > 1)) {
        if (nextSpeed > OFF_ROAD_LIMIT) {
            nextSpeed = Util.accelerate(nextSpeed, OFF_ROAD_DECEL, dt);
        }

        // Cek tabrakan dengan sprite di sisi jalan
        for (let n = 0; n < playerSegment.sprites.length; n++) {
            const sprite = playerSegment.sprites[n];
            const spriteW = 0.1;
            if (Util.overlap(nextPlayerX, 0.1, sprite.offset, spriteW)) {
                nextSpeed = MAX_SPEED / 5;
                position = Util.increase(playerSegment.p1.world.z, -playerZ, trackLength);
                break;
            }
        }
    }

    // Pembatas jalan (batas tak terlihat)
    nextPlayerX = Util.limit(nextPlayerX, -1.5, 1.5);
    nextSpeed = Util.limit(nextSpeed, 0, MAX_SPEED);

    state.playerX = nextPlayerX;
    state.speed = nextSpeed;

    // ==========================================
    // Update Kendaraan NPC
    // ==========================================
    for (let n = 0; n < state.cars.length; n++) {
        const car = state.cars[n];
        const oldSeg = findSegment(state, car.z);
        car.z = Util.increase(car.z, dt * car.speed, trackLength);
        car.percent = Util.percentRemaining(car.z, SEGMENT_LENGTH);
        const newSeg = findSegment(state, car.z);

        // Pindahkan NPC ke segmen baru jika berubah
        if (oldSeg !== newSeg) {
            const idx = oldSeg.cars.indexOf(car);
            if (idx !== -1) oldSeg.cars.splice(idx, 1);
            newSeg.cars.push(car);
        }

        // --- Tabrakan NPC-Pemain ---
        if (newSeg.index === playerSegment.index) {
            if (Util.overlap(nextPlayerX, 0.4, car.offset, 0.4)) {
                if (nextSpeed > car.speed) {
                    // "Mental ke belakang" — kurangi kecepatan tapi jangan 0
                    nextSpeed = nextSpeed * 0.3;
                    position = Util.increase(position, -200, trackLength); // Mundur sedikit

                    // Dorongan horizontal ringan
                    const dir = nextPlayerX > car.offset ? 1 : -1;
                    nextPlayerX += dir * 0.15;
                }
            }
        }

        // Re-spawn NPC yang jauh di belakang ke depan
        if (car.z < position && (position - car.z) > trackLength / 2) {
            car.z = Util.increase(car.z, trackLength, trackLength);
        }

        // --- Animasi NPC Berdasarkan Tipe Kendaraan ---
        updateNpcAnimation(car, dt, state);
    }

    // ==========================================
    // Update Parallax Latar Belakang
    // ==========================================
    state.bgOffset = state.bgOffset || 0;
    const curveFactor = (playerSegment.curve || 0) * (speed / MAX_SPEED);
    const steerFactor = (state.keyLeft ? -1 : state.keyRight ? 1 : 0) * (speed / MAX_SPEED) * 2;
    // Update offset berdasarkan dt (waktu) untuk gerakan halus lintas frame rate
    state.bgOffset += (curveFactor + steerFactor) * dt * 0.1;

    // Perbarui posisi dan kecepatan
    state.position = position;
    state.playerX = nextPlayerX;
    state.speed = nextSpeed;

    // ==========================================
    // FOV Dinamis / Efek Tunnel Vision saat NOS Aktif
    // ==========================================
    // FOV lebih sempit untuk mobile portrait agar jalan terlihat lebih besar
    const mobileDepthFactor = (ctx.isMobile && ctx.aspectRatio < 1) ? 1.4 : 1.0;
    const activeDiff = localStorage.getItem('nitroquiz_game_difficulty') || 'easy';
    const activeDiffConfig = getDifficultyConfig(activeDiff);
    const baseDepth = (1 / Math.tan((activeDiffConfig.fieldOfView / 2) * Math.PI / 180)) * mobileDepthFactor;
    const targetDepth = (keyBoost && nextNos > 0) ? baseDepth * 1.5 : baseDepth; // 50% kedalaman lebih = jalan lebih sempit

    // Interpolasi halus kedalaman kamera (lerp)
    state.cameraDepth = state.cameraDepth + (targetDepth - state.cameraDepth) * dt * 5;

    // Update playerZ karena bergantung pada cameraDepth
    state.playerZ = (activeDiffConfig.cameraHeight * state.cameraDepth);
    playerZ = state.playerZ;

    // ==========================================
    // Update Statistik HUD
    // ==========================================
    const currentRound = ctx.lapRace + 1;
    const totalRounds = Math.max(1, Math.ceil(state.allQuizQuestions.length / QUESTIONS_PER_ROUND));

    ctx.setStats({
        speed: Math.floor(speed / 100),
        nos: Math.floor(state.nos),
        lap: currentRound,
        totalLaps: totalRounds
    });
}

// ==========================================
// Fungsi Animasi NPC Internal
// ==========================================

/**
 * Mengupdate animasi sprite NPC berdasarkan tipe kendaraan dan arah tikungan.
 *
 * @param car - Objek kendaraan NPC
 * @param dt - Delta waktu
 * @param state - State game loop
 */
function updateNpcAnimation(car: any, dt: number, state: GameLoopState): void {
    if (car.type === 'truck') {
        // Animasi Truck
        car.animTimer = (car.animTimer || 0) + dt * 1000;
        if (car.animTimer > 150) { // Siklus setiap 150ms
            car.animTimer = 0;
            car.animFrame = car.animFrame === 0 ? 1 : 0;
        }

        const currentSeg = findSegment(state, car.z);
        const curve = currentSeg.curve;

        if (curve < -0.5) {
            car.sprite = car.animFrame === 0 ? state.sprites.truck_left_0 : state.sprites.truck_left_1;
        } else if (curve > 0.5) {
            car.sprite = car.animFrame === 0 ? state.sprites.truck_right_0 : state.sprites.truck_right_1;
        } else {
            car.sprite = car.animFrame === 0 ? state.sprites.truck_straight_0 : state.sprites.truck_straight_1;
        }
    } else if (car.type === 'jne') {
        // Animasi JNE
        car.animTimer = (car.animTimer || 0) + dt * 1000;
        if (car.animTimer > 100) { // Toggle setiap 100ms
            car.animTimer = 0;
            car.animFrame = car.animFrame === 0 ? 1 : 0;
        }

        const currentSeg = findSegment(state, car.z);
        const curve = currentSeg.curve;

        let dir = 'straight';
        if (curve < -0.5) dir = 'left';
        else if (curve > 0.5) dir = 'right';

        // Pilih Sprite berdasarkan arah + frame
        if (dir === 'left') {
            car.sprite = car.animFrame === 0 ? state.sprites.jne_left_1 : state.sprites.jne_left_2;
        } else if (dir === 'right') {
            car.sprite = car.animFrame === 0 ? state.sprites.jne_right_1 : state.sprites.jne_right_2;
        } else {
            car.sprite = car.animFrame === 0 ? state.sprites.jne_straight_1 : state.sprites.jne_straight_2;
        }
    } else if (car.type === 'odong') {
        // Animasi Odong-odong
        car.animTimer = (car.animTimer || 0) + dt * 1000;
        if (car.animTimer > 150) { // Animasi sedikit lebih lambat (150ms)
            car.animTimer = 0;
            car.animFrame = car.animFrame === 0 ? 1 : 0;
        }

        const currentSeg = findSegment(state, car.z);
        const curve = currentSeg.curve;

        if (curve < -0.5) {
            const s1 = state.sprites.odong_left;
            const s2 = state.sprites['1odong_left'];
            car.sprite = (car.animFrame === 1 && s2) ? s2 : s1;
        } else if (curve > 0.5) {
            const s1 = state.sprites.odong_right;
            const s2 = state.sprites['1odong_right'];
            car.sprite = (car.animFrame === 1 && s2) ? s2 : s1;
        } else {
            const s1 = state.sprites.odong_straight;
            const s2 = state.sprites['1odong_straight'];
            car.sprite = (car.animFrame === 1 && s2) ? s2 : s1;
        }
    } else if (car.type === 'taxi') {
        // Animasi Taxi
        car.animTimer = (car.animTimer || 0) + dt * 1000;
        if (car.animTimer > 150) { // Siklus setiap 150ms
            car.animTimer = 0;
            car.animFrame = car.animFrame === 0 ? 1 : 0;
        }

        const currentSeg = findSegment(state, car.z);
        const curve = currentSeg.curve;

        if (curve < -0.5) {
            const s1 = state.sprites.taxi_left || state.sprites.taxi_straight || state.sprites.truck2;
            const s2 = state.sprites['1taxi_left'];
            car.sprite = (car.animFrame === 1 && s2) ? s2 : s1;
        } else if (curve > 0.5) {
            const s1 = state.sprites.taxi_right || state.sprites.taxi_straight || state.sprites.truck2;
            const s2 = state.sprites['1taxi_right'];
            car.sprite = (car.animFrame === 1 && s2) ? s2 : s1;
        } else {
            const s1 = state.sprites.taxi_straight || state.sprites.truck2;
            const s2 = state.sprites['1taxi_straight'];
            car.sprite = (car.animFrame === 1 && s2) ? s2 : s1;
        }
    }
}
