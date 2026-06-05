/**
 * =====================================================
 * MESIN RENDERING - NitroQuiz Racing Game
 * =====================================================
 * Modul ini menangani semua fungsi rendering visual:
 * - Rendering segmen jalan (aspal, rumble, trotoar, dll)
 * - Rendering sprite objek di sisi jalan
 * - Rendering karakter pemain (orang pertama & ketiga)
 * =====================================================
 */

import type { GameLoopState, GameState } from '../_types';

// ==========================================
// Rendering Segmen Jalan
// ==========================================

/**
 * Merender satu segmen jalan lengkap, termasuk:
 * rumput, rumble strip, trotoar, curb, aspal, zebra cross, dan garis lajur.
 *
 * @param ctx - Context canvas 2D
 * @param width - Lebar canvas
 * @param lanes - Jumlah lajur
 * @param x1,y1,w1 - Koordinat dan lebar segmen bawah (dekat)
 * @param x2,y2,w2 - Koordinat dan lebar segmen atas (jauh)
 * @param fog - Intensitas kabut
 * @param color - Objek warna untuk segmen ini
 * @param zebra - Apakah segmen ini memiliki zebra cross
 */
export function renderSegment(
    ctx: CanvasRenderingContext2D,
    width: number, lanes: number,
    x1: number, y1: number, w1: number,
    x2: number, y2: number, w2: number,
    fog: number, color: any, zebra: boolean = false
): void {
    const r1 = w1 / Math.max(6, 2 * lanes);
    const r2 = w2 / Math.max(6, 2 * lanes);

    // --- Rumput (latar belakang hijau) ---
    ctx.fillStyle = color.grass;
    ctx.fillRect(0, y2, width, y1 - y2);

    // Tambahkan tekstur "tanah" (noise) pada rumput
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let i = 0; i < 20; i++) {
        const rx = Math.random() * width;
        const ry = y2 + Math.random() * (y1 - y2);
        const rw = 1 + Math.random() * 3;
        ctx.fillRect(rx, ry, rw, 1);
    }

    // --- Rumble Strip (garis peringatan tepi jalan) ---
    ctx.fillStyle = color.rumble;
    // Rumble kiri
    ctx.beginPath();
    ctx.moveTo(x1 - w1 - r1, y1);
    ctx.lineTo(x1 - w1, y1);
    ctx.lineTo(x2 - w2, y2);
    ctx.lineTo(x2 - w2 - r2, y2);
    ctx.closePath();
    ctx.fill();
    // Rumble kanan
    ctx.beginPath();
    ctx.moveTo(x1 + w1 + r1, y1);
    ctx.lineTo(x1 + w1, y1);
    ctx.lineTo(x2 + w2, y2);
    ctx.lineTo(x2 + w2 + r2, y2);
    ctx.closePath();
    ctx.fill();

    // --- Trotoar (sidewalk) ---
    const sw1 = w1 * 0.5; // Lebar trotoar relatif terhadap jalan
    const sw2 = w2 * 0.5;
    const cw1 = w1 * 0.05; // Lebar curb
    const cw2 = w2 * 0.05;

    // Trotoar Kiri
    ctx.fillStyle = color.sidewalk;
    ctx.beginPath();
    ctx.moveTo(x1 - w1 - r1 - sw1, y1);
    ctx.lineTo(x1 - w1 - r1, y1);
    ctx.lineTo(x2 - w2 - r2, y2);
    ctx.lineTo(x2 - w2 - r2 - sw2, y2);
    ctx.closePath();
    ctx.fill();

    // Trotoar Kanan
    ctx.beginPath();
    ctx.moveTo(x1 + w1 + r1 + sw1, y1);
    ctx.lineTo(x1 + w1 + r1, y1);
    ctx.lineTo(x2 + w2 + r2, y2);
    ctx.lineTo(x2 + w2 + r2 + sw2, y2);
    ctx.closePath();
    ctx.fill();

    // --- Curb (Tepi trotoar) ---
    ctx.fillStyle = color.curb;
    // Curb Kiri
    ctx.beginPath();
    ctx.moveTo(x1 - w1 - r1 - cw1, y1);
    ctx.lineTo(x1 - w1 - r1, y1);
    ctx.lineTo(x2 - w2 - r2, y2);
    ctx.lineTo(x2 - w2 - r2 - cw2, y2);
    ctx.closePath();
    ctx.fill();
    // Curb Kanan
    ctx.beginPath();
    ctx.moveTo(x1 + w1 + r1 + cw1, y1);
    ctx.lineTo(x1 + w1 + r1, y1);
    ctx.lineTo(x2 + w2 + r2, y2);
    ctx.lineTo(x2 + w2 + r2 + cw2, y2);
    ctx.closePath();
    ctx.fill();

    // --- Area Jalan (Aspal) ---
    ctx.fillStyle = color.road;
    ctx.beginPath();
    ctx.moveTo(x1 - w1, y1);
    ctx.lineTo(x2 - w2, y2);
    ctx.lineTo(x2 + w2, y2);
    ctx.lineTo(x1 + w1, y1);
    ctx.closePath();
    ctx.fill();

    // --- Zebra Cross ---
    if (zebra) {
        ctx.fillStyle = '#ffffff';
        const stripes = 10;
        const stripeW1 = (w1 * 2) / stripes;
        const stripeW2 = (w2 * 2) / stripes;
        for (let i = 0; i < stripes; i++) {
            if (i % 2 === 0) {
                ctx.beginPath();
                ctx.moveTo(x1 - w1 + i * stripeW1, y1);
                ctx.lineTo(x1 - w1 + (i + 1) * stripeW1, y1);
                ctx.lineTo(x2 - w2 + (i + 1) * stripeW2, y2);
                ctx.lineTo(x2 - w2 + i * stripeW2, y2);
                ctx.fill();
            }
        }
    }

    // --- Garis Lajur ---
    if (color.strip) {
        ctx.fillStyle = color.strip;
        const laneW1 = w1 * 2 / lanes;
        const laneW2 = w2 * 2 / lanes;
        for (let i = 1; i < lanes; i++) {
            ctx.beginPath();
            ctx.moveTo(x1 - w1 + i * laneW1 - w1 / 30, y1);
            ctx.lineTo(x1 - w1 + i * laneW1 + w1 / 30, y1);
            ctx.lineTo(x2 - w2 + i * laneW2 + w2 / 30, y2);
            ctx.lineTo(x2 - w2 + i * laneW2 - w2 / 30, y2);
            ctx.fill();
        }
    }
}

// ==========================================
// Rendering Sprite (Objek di Sisi Jalan)
// ==========================================

/**
 * Merender sprite di sisi jalan (pohon, gedung, lampu, kendaraan NPC, dll).
 * Ukuran sprite ditentukan berdasarkan nama aset untuk menjaga proporsi.
 *
 * @param ctx - Context canvas 2D
 * @param width - Lebar canvas
 * @param height - Tinggi canvas
 * @param resolution - Resolusi render
 * @param roadWidth - Lebar jalan
 * @param sprite - Gambar sprite yang akan dirender
 * @param scale - Skala dari proyeksi 3D
 * @param destX - Posisi X tujuan di canvas
 * @param destY - Posisi Y tujuan di canvas
 * @param offsetX - Offset horizontal
 * @param offsetY - Offset vertikal
 * @param clipY - Batas clip Y (untuk menyembunyikan bagian yang tertutup)
 */
export function renderSprite(
    ctx: CanvasRenderingContext2D,
    width: number, height: number, resolution: number, roadWidth: number,
    sprite: any, scale: number,
    destX: number, destY: number,
    offsetX: number, offsetY: number, clipY: number
): void {
    if (!sprite) return;

    const name = (sprite as any).assetName;

    // Gunakan lebar referensi tetap agar ukuran aset konsisten
    const playerRefWidth = 450;
    const carWorldWidth = playerRefWidth * 1.5; // Basis lebih besar untuk kendaraan

    // Tentukan ukuran dunia berdasarkan tipe aset
    let worldWidth = carWorldWidth * 1.0;
    if (name?.includes('lampulalulintas') || name === 'traffic_light') worldWidth = carWorldWidth * 5.5;
    else if (name?.includes('truck')) worldWidth = carWorldWidth * 1.4;
    else if (name?.includes('car_rival') || name === 'foward-opponent') worldWidth = carWorldWidth * 1.0;
    else if (name?.includes('odong') || name?.includes('taxi')) worldWidth = carWorldWidth * 1.0;
    else if (name?.includes('jne')) worldWidth = carWorldWidth * 1.1;
    else if (name?.includes('kiri_') || name?.includes('kanan_')) worldWidth = carWorldWidth * 18.0; // Pengali gedung
    else if (name?.includes('pohon')) worldWidth = carWorldWidth * 11.0; // Pengali pohon
    else if (name?.includes('bush') || name?.includes('semak')) worldWidth = carWorldWidth * 3.5;
    else if (name?.includes('bench') || name?.includes('bangku')) worldWidth = carWorldWidth * 3.5;
    else if (name?.includes('barrier') || name?.includes('pembatas_jalan')) worldWidth = carWorldWidth * 3.5;
    else if (name?.includes('cone') || name?.includes('penghalang')) worldWidth = carWorldWidth * 1.2;
    else if (name?.includes('obstacle') || name?.includes('construction')) worldWidth = carWorldWidth * 1.3;

    const destW = scale * worldWidth * (width / 2);
    const destH = destW * (sprite.height / sprite.width);

    // Biarkan objek tumbuh secara alami saat mendekat (tanpa batasan)
    let clampedW = destW;
    let clampedH = destH;

    destX = destX + (clampedW * (offsetX || 0));
    // Posisi vertikal yang diperbaiki — sprite duduk di atas jalan
    destY = destY + (clampedH * Math.min(offsetY || 0, -0.5));

    const clipH = clipY ? Math.max(0, destY + clampedH - clipY) : 0;
    if (clipH < clampedH && clampedH > 1) {
        ctx.save();
        ctx.drawImage(sprite, 0, 0, sprite.width, sprite.height - (sprite.height * clipH / clampedH), destX, destY, clampedW, clampedH - clipH);
        ctx.restore();
    }
}

// ==========================================
// Rendering Karakter Pemain
// ==========================================

/**
 * Merender karakter pemain di layar, mendukung mode orang pertama dan ketiga.
 * Termasuk animasi NOS, revving, belok, dan maju.
 *
 * @param ctx - Context canvas 2D
 * @param width - Lebar canvas
 * @param height - Tinggi canvas
 * @param resolution - Resolusi render
 * @param roadWidth - Lebar jalan
 * @param speedPercent - Persentase kecepatan saat ini
 * @param scale - Skala render
 * @param destX - Posisi X tujuan
 * @param destY - Posisi Y tujuan
 * @param steer - Arah kemudi (-1 = kiri, 1 = kanan)
 * @param updown - Perubahan ketinggian segmen
 * @param viewMode - Mode tampilan ('first' | 'third')
 * @param state - State game loop
 * @param gameState - State permainan saat ini
 */
export function renderPlayer(
    ctx: CanvasRenderingContext2D,
    width: number, height: number, resolution: number, roadWidth: number,
    speedPercent: number, scale: number,
    destX: number, destY: number,
    steer: number, updown: number,
    viewMode: 'first' | 'third',
    state: GameLoopState,
    gameState: GameState
): void {
    const { keyLeft, keyRight, keyFaster, sprites } = state;

    // Flag animasi karakter
    const isPreparing = gameState === 'preparation';
    const isAtStart = isPreparing;

    // --- Update timer animasi revving ---
    // Dimainkan saat menekan gas di awal ATAU saat mengerem
    if ((isAtStart && keyFaster) || state.keySlower) {
        state.revvingTimer += 16; // ~60fps
        if (state.revvingTimer >= 80) { // Toggle cepat untuk efek revving/pengereman
            state.revvingTimer = 0;
            state.revvingFrame = state.revvingFrame === 0 ? 1 : 0;
        }
    }

    // --- Update timer animasi MC (karakter utama) ---
    // Dimainkan saat berkendara (maju, belok kiri, atau belok kanan)
    if (!isAtStart && (keyFaster || keyLeft || keyRight) && !state.keySlower) {
        state.mcTimer += 16;
        if (state.mcTimer >= 80) {
            state.mcTimer = 0;
            state.mcFrame = (state.mcFrame + 1) % 4;
        }
    }

    // ==========================================
    // Mode Orang Pertama (First Person POV)
    // ==========================================
    if (viewMode === 'first') {
        let sprite = sprites.mc_1st_straight_0 || sprites.car_1st;

        if (keyLeft) {
            // Animasi belok kiri (frame 0-1)
            const frame = state.mcFrame % 2;
            sprite = sprites[`mc_1st_left_${frame}`] || sprite;
        } else if (keyRight) {
            // Animasi belok kanan (frame 0-1)
            const frame = state.mcFrame % 2;
            sprite = sprites[`mc_1st_right_${frame}`] || sprite;
        } else if (keyFaster) {
            // Animasi maju lurus (frame 0, 1, 3)
            // Catatan: frame 2 tidak tersedia, jadi siklus 0->1->3
            const straightFrames = [0, 1, 3];
            const frameIdx = state.mcFrame % straightFrames.length;
            const suffix = straightFrames[frameIdx];
            sprite = sprites[`mc_1st_straight_${suffix}`] || sprite;
        } else {
            // Diam (idle)
            sprite = sprites.mc_1st_straight_0 || sprite;
        }

        if (!sprite) return;

        // Skala "layar penuh": sesuaikan dengan lebar
        const destW = width;
        const destH = destW * (sprite.height / sprite.width);

        // Efek goyang dinamis untuk orang pertama agar terasa hidup
        const sway = Math.sin(Date.now() / 200) * 5;
        const x = (steer * -30) + sway;
        const y = height - (destH * 0.8) + Math.abs(sway); // Posisi stabil dengan sedikit bounce

        // Efek merah dashboard saat mengerem di mode orang pertama
        if (state.keySlower) {
            ctx.save();
            const grd = ctx.createLinearGradient(0, height, 0, height - 150);
            grd.addColorStop(0, 'rgba(255, 0, 0, 0.4)');
            grd.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = grd;
            ctx.fillRect(0, height - 150, width, 150);
            ctx.restore();
        }

        // Render sprite apa adanya tanpa tilt
        ctx.drawImage(sprite, x, y, destW, destH);
        return;
    }

    // ==========================================
    // Mode Orang Ketiga (Third Person POV)
    // ==========================================
    let sprite = sprites.car;

    // Pilih sprite berdasarkan kondisi
    if (isAtStart && keyFaster) {
        // Tampilkan animasi revving saat menekan gas di awal
        sprite = state.revvingFrame === 0 ? sprites.start_1 : sprites.start_2;
    } else if (state.keySlower) {
        // Animasi Pengereman (Braking)
        sprite = state.revvingFrame === 0 ? sprites.rem_1 : sprites.rem_2;
    } else if (keyLeft) {
        // Animasi Belok Kiri (frame 0-3)
        sprite = sprites[`mc_left_${state.mcFrame}`];
    } else if (keyRight) {
        // Animasi Belok Kanan (frame 0-3)
        sprite = sprites[`mc_right_${state.mcFrame}`];
    } else if (keyFaster) {
        // Animasi Maju Normal (frame 0-3)
        sprite = sprites[`mc_straight_${state.mcFrame}`];
    } else {
        // IDLE / Meluncur (tidak ada tombol ditekan)
        sprite = sprites.car;
    }

    if (!sprite) return;

    // Hitung dimensi dasar dari sprite utama (foward-sonic.png)
    const baseCar = sprites.car;
    const playerScale = (width / 1920) * 1.5;
    const baseW = baseCar ? baseCar.width * playerScale : 200;
    const baseH = baseCar ? baseCar.height * playerScale : 100;

    const isNitro = state.keyBoost && state.nos > 0;
    const wasPressed = state.nosWasPressed;

    // ==========================================
    // Mesin State Animasi NOS
    // ==========================================
    const FRAME_DURATION = 5; // SANGAT CEPAT: 5ms per frame (~200fps kecepatan putar)
    state.nosFrameTimer += 16;

    // Definisikan urutan frame untuk sekuens 1-28
    // Startup: 1-21, Loop: 22-28
    const STARTUP_FRAMES = Array.from({ length: 21 }, (_, i) => i + 1);
    const LOOP_FRAMES = Array.from({ length: 7 }, (_, i) => i + 22);

    let currentNosSprite: any = null;

    if (isNitro) {
        // NOS sedang ditekan
        if (!wasPressed) {
            // Jika sebelumnya mundur (ending), coba lanjutkan dari frame saat ini
            if (state.nosPhase === 'ending') {
                const currentAbsolute = state.nosFrame;
                if (currentAbsolute >= 22) {
                    // Lanjutkan di loop
                    state.nosPhase = 'loop';
                    const idx = LOOP_FRAMES.indexOf(currentAbsolute);
                    state.nosFrame = idx >= 0 ? idx : 0;
                } else {
                    // Lanjutkan di startup
                    state.nosPhase = 'startup';
                    const idx = STARTUP_FRAMES.indexOf(currentAbsolute);
                    state.nosFrame = idx >= 0 ? idx : 0;
                }
            } else {
                // Mulai baru
                state.nosPhase = 'startup';
                state.nosFrame = 0;
                state.nosFrameTimer = 0;
            }
        }

        // Gunakan while loop untuk mengejar frame jika durasi lebih kecil dari delta update
        if (state.nosPhase === 'startup') {
            while (state.nosFrameTimer >= FRAME_DURATION) {
                state.nosFrameTimer -= FRAME_DURATION;
                state.nosFrame++;
                if (state.nosFrame >= STARTUP_FRAMES.length) {
                    state.nosPhase = 'loop';
                    state.nosFrame = 0;
                    break;
                }
            }
            const frameNum = STARTUP_FRAMES[state.nosFrame];
            currentNosSprite = sprites[`nos_${frameNum}`];
        }

        if (state.nosPhase === 'loop') {
            while (state.nosFrameTimer >= FRAME_DURATION) {
                state.nosFrameTimer -= FRAME_DURATION;
                state.nosFrame = (state.nosFrame + 1) % LOOP_FRAMES.length;
            }
            const frameNum = LOOP_FRAMES[state.nosFrame];
            currentNosSprite = sprites[`nos_${frameNum}`];
        }

        state.nosWasPressed = true;
    } else {
        // NOS dilepas
        if (wasPressed) {
            // Baru saja dilepas — beralih ke mode mundur (ending)
            let startReverseFrame = 1;
            if (state.nosPhase === 'startup') {
                startReverseFrame = STARTUP_FRAMES[state.nosFrame] || 1;
            } else if (state.nosPhase === 'loop') {
                startReverseFrame = LOOP_FRAMES[state.nosFrame] || 22;
            } else if (state.nosPhase === 'ending') {
                startReverseFrame = state.nosFrame;
            }

            state.nosPhase = 'ending';
            // Simpan nomor frame absolut langsung di nosFrame untuk fase ending
            state.nosFrame = startReverseFrame;
            state.nosFrameTimer = 0;
        }

        if (state.nosPhase === 'ending') {
            // Putar mundur dari frame saat ini ke frame 1
            while (state.nosFrameTimer >= FRAME_DURATION) {
                state.nosFrameTimer -= FRAME_DURATION;
                state.nosFrame--;
                if (state.nosFrame < 1) {
                    state.nosPhase = 'idle';
                    state.nosFrame = 0;
                    break;
                }
            }

            if (state.nosPhase === 'ending') {
                const frameNum = state.nosFrame;
                // Pastikan nomor frame valid (1-28)
                if (frameNum >= 1) {
                    currentNosSprite = sprites[`nos_${frameNum}`];
                }
            }
        }

        state.nosWasPressed = false;
    }

    // Tentukan sprite yang akan digambar
    const finalSprite = currentNosSprite || sprite;

    let finalW, finalH;

    if (currentNosSprite) {
        // Untuk animasi NOS, gunakan dimensi mobil dasar agar ukuran tetap konsisten
        finalW = baseW;
        finalH = baseH;
    } else {
        // Periksa apakah sprite saat ini adalah frame animasi MC yang perlu diskalakan
        const sName = (finalSprite as any)?.assetName || '';
        const isMcStraight = sName.startsWith('mc_straight_');
        const isMcTurn = sName.startsWith('mc_left_') || sName.startsWith('mc_right_');

        let correctiveScale = 1.0;
        if (isMcStraight) correctiveScale = 1.0;
        else if (isMcTurn) correctiveScale = 1.0; // Disesuaikan agar cocok dengan mc_straight

        // Gunakan dimensi natural untuk MC/lainnya agar tidak distorsi
        finalW = finalSprite.width * playerScale * correctiveScale;
        finalH = finalSprite.height * playerScale * correctiveScale;
    }

    const finalX = width / 2 - finalW / 2 + (steer * 50);
    const finalY = height - finalH - 35;

    // Render sprite apa adanya tanpa tilt — gambar sudah memiliki posisi miring sendiri
    ctx.drawImage(finalSprite, finalX, finalY, finalW, finalH);
}
