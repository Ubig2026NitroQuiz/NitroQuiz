import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// SHARED SESSION via REFRESH TOKEN COOKIE
// ============================================================
// Masalah lama: Menyimpan SELURUH sesi Supabase di cookie
//   → Google Login gagal karena data sesi terlalu besar (>4KB)
//   → Browser diam-diam membuang cookie yang terlalu besar
//
// Solusi baru:
//   - Sesi penuh disimpan di localStorage (batas 5-10MB, aman)
//   - Hanya refresh_token (~50 byte) yang disimpan di cookie
//   - Cookie ini di-share antar subdomain .gameforsmart.com
//   - Saat user buka subdomain lain, refresh_token dipakai
//     untuk memulihkan sesi penuh dari Supabase
// ============================================================

/**
 * Simpan refresh_token ke shared cookie (.gameforsmart.com)
 * Cookie ini kecil (~50 byte), jauh di bawah batas 4KB
 */
export function syncSessionCookie(refreshToken: string | null) {
  if (typeof document === 'undefined') return;
  const hostname = window.location.hostname;
  const isGfs = hostname.endsWith('gameforsmart.com');
  const isHttps = window.location.protocol === 'https:';

  if (!refreshToken) {
    // Hapus cookie
    let cookieStr = `gfs-rt=; path=/; max-age=0`;
    if (isGfs) cookieStr += `; domain=.gameforsmart.com`;
    document.cookie = cookieStr;
    return;
  }

  const parts = [
    `gfs-rt=${encodeURIComponent(refreshToken)}`,
    `path=/`,
    `max-age=${60 * 60 * 24 * 365}`,
    `SameSite=Lax`,
  ];
  if (isGfs) parts.push(`domain=.gameforsmart.com`);
  if (isHttps) parts.push(`Secure`);
  document.cookie = parts.join('; ');
}

/**
 * Baca refresh_token dari shared cookie
 */
export function getRefreshTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split('; ');
  const found = cookies.find(c => c.startsWith('gfs-rt='));
  if (!found) return null;
  const eqIndex = found.indexOf('=');
  return decodeURIComponent(found.substring(eqIndex + 1));
}

// ============================================================
// 1. SUPABASE CLIENT PROYEK (nitroquiz database)
// Untuk: Participants, Score, Jawaban
// TIDAK menangani login sama sekali
// ============================================================
let _supabase: SupabaseClient | null = null;

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabase) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase env vars are not set. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are defined.');
      }
      _supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });
    }
    const value = (_supabase as any)[prop];
    if (typeof value === 'function') {
      return value.bind(_supabase);
    }
    return value;
  },
});

// ============================================================
// 2. SUPABASE CLIENT PUSAT (central database)
// Untuk: Login, Profil, Quiz, Sessions
// Menggunakan localStorage (default) + shared cookie untuk SSO
// ============================================================
let _supabaseCentral: SupabaseClient | null = null;

export const supabaseCentral: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabaseCentral) {
      const centralSupabaseUrl = process.env.NEXT_PUBLIC_CENTRAL_SUPABASE_URL;
      const centralSupabaseAnonKey = process.env.NEXT_PUBLIC_CENTRAL_SUPABASE_ANON_KEY;
      if (!centralSupabaseUrl || !centralSupabaseAnonKey) {
        throw new Error('Central Supabase env vars are not set. Make sure NEXT_PUBLIC_CENTRAL_SUPABASE_URL and NEXT_PUBLIC_CENTRAL_SUPABASE_ANON_KEY are defined.');
      }
      _supabaseCentral = createClient(centralSupabaseUrl, centralSupabaseAnonKey, {
        auth: {
          // Gunakan localStorage default (aman untuk semua ukuran sesi)
          storageKey: 'gfs-auth-token',
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      });
    }
    const value = (_supabaseCentral as any)[prop];
    if (typeof value === 'function') {
      return value.bind(_supabaseCentral);
    }
    return value;
  },
});
