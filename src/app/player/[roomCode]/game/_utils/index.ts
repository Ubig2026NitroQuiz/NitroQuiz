/**
 * =====================================================
 * UTILITAS MATEMATIKA - NitroQuiz Racing Game
 * =====================================================
 * Kumpulan fungsi utilitas untuk perhitungan matematika
 * yang digunakan dalam mesin game racing pseudo-3D.
 * =====================================================
 */

import type { Point } from '../_types';

/**
 * Objek utilitas yang berisi semua fungsi matematika game.
 * Digunakan untuk proyeksi 3D, interpolasi, fisika, dan efek visual.
 */
export const Util = {
    /**
     * Konversi ke integer dengan nilai default.
     * @param obj - Nilai yang akan dikonversi
     * @param def - Nilai default jika konversi gagal
     */
    toInt: (obj: any, def: number): number => {
        if (obj !== null) {
            const x = parseInt(obj, 10);
            if (!isNaN(x)) return x;
        }
        return Util.toInt(def, 0);
    },

    /**
     * Konversi ke float dengan nilai default.
     * @param obj - Nilai yang akan dikonversi
     * @param def - Nilai default jika konversi gagal
     */
    toFloat: (obj: any, def: number): number => {
        if (obj !== null) {
            const x = parseFloat(obj);
            if (!isNaN(x)) return x;
        }
        return Util.toFloat(def, 0.0);
    },

    /**
     * Membatasi nilai dalam rentang minimum dan maksimum.
     * @param value - Nilai yang akan dibatasi
     * @param min - Batas bawah
     * @param max - Batas atas
     */
    limit: (value: number, min: number, max: number) =>
        Math.max(min, Math.min(value, max)),

    /**
     * Menghasilkan bilangan bulat acak dalam rentang [min, max].
     * @param min - Batas bawah (inklusif)
     * @param max - Batas atas (inklusif)
     */
    randomInt: (min: number, max: number) =>
        Math.floor(Math.random() * (max - min + 1)) + min,

    /**
     * Memilih elemen acak dari array.
     * @param options - Array pilihan
     */
    randomChoice: (options: any[]) =>
        options[Util.randomInt(0, options.length - 1)],

    /**
     * Menghitung sisa persentase dari pembagian.
     * Digunakan untuk menentukan posisi dalam segmen.
     * @param n - Nilai posisi
     * @param total - Panjang total
     */
    percentRemaining: (n: number, total: number) =>
        (n % total) / total,

    /**
     * Menghitung kecepatan setelah akselerasi.
     * v_baru = v + (a * dt)
     * @param v - Kecepatan saat ini
     * @param accel - Akselerasi
     * @param dt - Delta waktu
     */
    accelerate: (v: number, accel: number, dt: number) =>
        v + (accel * dt),

    /**
     * Interpolasi linear antara dua nilai.
     * @param a - Nilai awal
     * @param b - Nilai akhir
     * @param percent - Persentase (0-1)
     */
    interpolate: (a: number, b: number, percent: number) =>
        a + (b - a) * percent,

    /**
     * Interpolasi ease-in (percepatan di awal).
     * @param a - Nilai awal
     * @param b - Nilai akhir
     * @param percent - Persentase (0-1)
     */
    easeIn: (a: number, b: number, percent: number) =>
        a + (b - a) * Math.pow(percent, 2),

    /**
     * Interpolasi ease-in-out (halus di awal dan akhir).
     * @param a - Nilai awal
     * @param b - Nilai akhir
     * @param percent - Persentase (0-1)
     */
    easeInOut: (a: number, b: number, percent: number) =>
        a + (b - a) * ((-Math.cos(percent * Math.PI) / 2) + 0.5),

    /**
     * Menghitung intensitas kabut eksponensial.
     * Semakin jauh objek, semakin tebal kabut.
     * @param distance - Jarak objek (normalized)
     * @param density - Kepadatan kabut
     */
    exponentialFog: (distance: number, density: number) =>
        1 / (Math.pow(Math.E, (distance * distance * density))),

    /**
     * Menambah posisi dalam loop (melingkar) track.
     * Nilai akan kembali ke awal jika melebihi max.
     * @param start - Posisi awal
     * @param increment - Penambahan
     * @param max - Panjang maksimum track
     */
    increase: (start: number, increment: number, max: number) => {
        let result = start + increment;
        while (result >= max) result -= max;
        while (result < 0) result += max;
        return result;
    },

    /**
     * Memproyeksikan titik 3D ke layar 2D.
     * Inti dari rendering pseudo-3D road.
     * @param p - Titik yang akan diproyeksikan
     * @param cameraX - Posisi kamera X
     * @param cameraY - Posisi kamera Y
     * @param cameraZ - Posisi kamera Z
     * @param cameraDepth - Kedalaman kamera (FOV)
     * @param width - Lebar layar
     * @param height - Tinggi layar
     * @param roadWidth - Lebar jalan
     */
    project: (p: Point, cameraX: number, cameraY: number, cameraZ: number, cameraDepth: number, width: number, height: number, roadWidth: number) => {
        p.camera.x = (p.world.x || 0) - cameraX;
        p.camera.y = (p.world.y || 0) - cameraY;
        p.camera.z = (p.world.z || 0) - cameraZ;
        p.screen.scale = cameraDepth / p.camera.z;
        p.screen.x = Math.round((width / 2) + (p.screen.scale * p.camera.x * width / 2));
        p.screen.y = Math.round((height / 2) - (p.screen.scale * p.camera.y * height / 2));
        p.screen.w = Math.round(p.screen.scale * roadWidth * width / 2);
    },

    /**
     * Memeriksa apakah dua objek saling tumpang tindih (collision detection).
     * @param x1 - Posisi X objek 1
     * @param w1 - Lebar objek 1
     * @param x2 - Posisi X objek 2
     * @param w2 - Lebar objek 2
     * @param percent - Persentase overlap yang diperlukan (default 1)
     */
    overlap: (x1: number, w1: number, x2: number, w2: number, percent: number = 1) => {
        const half1 = (percent || 1) * w1 / 2;
        const half2 = (percent || 1) * w2 / 2;
        return !(x1 - half1 > x2 + half2 || x1 + half1 < x2 - half2);
    }
};
