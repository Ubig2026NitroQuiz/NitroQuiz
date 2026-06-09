/**
 * =====================================================
 * MESIN MINI MAP - NitroQuiz Racing Game
 * =====================================================
 * Modul ini merender peta mini (mini map) yang menunjukkan
 * posisi pemain dan rival di track secara real-time.
 * =====================================================
 */

import type { GameLoopState } from '../_types';

/**
 * Menggambar mini map pada canvas terpisah.
 * Menampilkan track, posisi pemain (biru), rival (merah),
 * titik START dan FINISH.
 *
 * @param canvas - Elemen canvas mini map
 * @param state - State game loop saat ini
 */
export function drawMiniMap(canvas: HTMLCanvasElement | null, state: GameLoopState): void {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { segments, position, trackLength } = state;

    // ==========================================
    // Penskalaan DPR (Device Pixel Ratio)
    // ==========================================
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const logicalW = 240;
    const logicalH = 180;

    // Sesuaikan ukuran canvas jika DPR berubah
    if (canvas.width !== logicalW * dpr || canvas.height !== logicalH * dpr) {
        canvas.width = logicalW * dpr;
        canvas.height = logicalH * dpr;
        canvas.style.width = `${logicalW}px`;
        canvas.style.height = `${logicalH}px`;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, logicalW, logicalH);

    // ==========================================
    // 1. Latar Belakang Scanner (Biru Gelap/Hitam)
    // ==========================================
    ctx.fillStyle = 'rgba(10, 15, 25, 0.95)';
    ctx.beginPath();
    if ((ctx as any).roundRect) {
        (ctx as any).roundRect(0, 0, logicalW, logicalH, 20);
    } else {
        ctx.rect(0, 0, logicalW, logicalH);
    }
    ctx.fill();

    // ==========================================
    // 2. Grid Scanner (Garis-garis samar)
    // ==========================================
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < logicalW; i += 30) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, logicalH); ctx.stroke();
    }
    for (let i = 0; i < logicalH; i += 30) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(logicalW, i); ctx.stroke();
    }

    // ==========================================
    // 3. Proyeksi Garis Track
    // ==========================================
    if (!segments || segments.length < 10) {
        ctx.restore();
        return;
    }

    // Konversi segmen kurva menjadi titik 2D untuk visualisasi
    const points: { x: number, z: number }[] = [];
    let xPos = 0, zPos = 0, heading = -Math.PI / 2;

    for (let i = 0; i < segments.length; i += 5) {
        const s = segments[i];
        heading += (s.curve * 0.012);
        xPos += Math.cos(heading) * 10;
        zPos += Math.sin(heading) * 10;
        points.push({ x: xPos, z: zPos });
    }

    // Hitung batas untuk penskalaan otomatis
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    points.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.z < minZ) minZ = p.z;
        if (p.z > maxZ) maxZ = p.z;
    });

    const trackW = maxX - minX || 1;
    const trackH = maxZ - minZ || 1;

    // Margin kustom untuk memaksimalkan ukuran
    const marginSide = 40;
    const marginTop = 30;
    const marginBot = 30;

    const availW = logicalW - (marginSide * 2);
    const availH = logicalH - marginTop - marginBot;

    const scale = Math.min(availW / trackW, availH / trackH) * 0.95; // Skalakan hingga 95%

    // Fungsi transformasi koordinat
    const tx = (px: number) => logicalW / 2 + (px - (minX + maxX) / 2) * scale;
    const centerY = marginTop + (availH / 2);
    const ty = (pz: number) => centerY + (pz - (minZ + maxZ) / 2) * scale;

    // ==========================================
    // 4. Gambar Track Neon Biru
    // ==========================================
    // Garis utama (biru tebal dengan bayangan)
    ctx.beginPath();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#3b82f6';
    ctx.moveTo(tx(points[0].x), ty(points[0].z));
    for (let i = 1; i < points.length; i++) ctx.lineTo(tx(points[i].x), ty(points[i].z));
    ctx.stroke();

    // Garis inti (biru terang tipis)
    ctx.beginPath();
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 0;
    ctx.moveTo(tx(points[0].x), ty(points[0].z));
    for (let i = 1; i < points.length; i++) ctx.lineTo(tx(points[i].x), ty(points[i].z));
    ctx.stroke();

    // ==========================================
    // 5. Penanda START dan FINISH
    // ==========================================
    const startP = points[0];
    const endP = points[points.length - 1];

    // Label START
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.font = '800 10px sans-serif';
    ctx.fillText('START', tx(startP.x) + 14, ty(startP.z) + 3);

    // Ikon START (garis hijau)
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(tx(startP.x) - 10, ty(startP.z));
    ctx.lineTo(tx(startP.x) + 10, ty(startP.z));
    ctx.stroke();

    // Label FINISH
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText('FINISH', tx(endP.x) - 18, ty(endP.z) + 3);

    // Ikon FINISH (garis putus-putus merah)
    ctx.beginPath();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 6;
    ctx.setLineDash([3, 3]);
    ctx.moveTo(tx(endP.x) - 10, ty(endP.z));
    ctx.lineTo(tx(endP.x) + 10, ty(endP.z));
    ctx.stroke();
    ctx.setLineDash([]);

    // ==========================================
    // 6. Posisi Pemain (Titik Biru dengan Garis Putih)
    // ==========================================
    const playerIdx = Math.floor((position / trackLength) * points.length);
    const pPoint = points[Math.min(playerIdx, points.length - 1)] || points[0];
    const px = tx(pPoint.x);
    const py = ty(pPoint.z);

    // Gambar posisi rival (titik merah)
    state.cars.forEach(car => {
        if (car.isRival) {
            const rivalIdx = Math.floor((car.z / trackLength) * points.length);
            const rPoint = points[rivalIdx % points.length];
            const rx = tx(rPoint.x);
            const ry = ty(rPoint.z);

            // Ikon Rival (merah dengan glow)
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(rx, ry, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });

    // Efek pulse pemain (biru)
    const pulse = (Date.now() % 1000) / 1000;
    ctx.beginPath();
    ctx.arc(px, py, 6 + pulse * 10, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(59, 130, 246, ${0.5 - pulse * 0.5})`;
    ctx.fill();

    // Ikon Pemain (biru)
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#3b82f6';
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
}
