/**
 * ============================================================================
 *  KONSTANTA HALAMAN LOGIN
 * ============================================================================
 *
 *  File ini menampung semua nilai konstan yang digunakan pada halaman login,
 *  termasuk skema validasi form dan URL eksternal.
 *  Memisahkan konstanta dari komponen membuat kode lebih mudah dikelola
 *  dan menghindari duplikasi nilai di banyak tempat.
 * ============================================================================
 */

import { z } from "zod";

// ── Skema validasi form login ──────────────────────────────────────────────
// Menggunakan Zod untuk validasi sisi klien.
// Pesan error menggunakan kunci i18n agar mendukung multi-bahasa.
export const loginSchema = z.object({
  identifier: z.string().min(3, "login.form.identifier_error_min"),
  password: z.string().min(6, "login.form.password_error_min"),
});

/** Tipe data form login, diturunkan secara otomatis dari skema Zod */
export type LoginFormData = z.infer<typeof loginSchema>;

// ── URL Eksternal ──────────────────────────────────────────────────────────
/** URL halaman registrasi di platform GameForSmart */
export const REGISTER_URL = "https://app.gameforsmart.com/register";
