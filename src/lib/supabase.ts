import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// SHARED SESSION via COOKIE (SSO antar subdomain)
// ============================================================
// Strategi:
//   - Sesi penuh disimpan di localStorage (per-origin, batas 5-10MB)
//   - access_token + refresh_token disimpan di cookie (shared .gameforsmart.com)
//   - Saat user buka subdomain lain, kita pakai setSession() (BUKAN refreshSession!)
//     agar token tidak dirotasi dan semua app tetap sinkron
//   - Saat salah satu app melakukan auto-refresh, token baru ditulis ke cookie
//     dan app lain akan "ikut" saat user focus/kembali ke tab tersebut
// ============================================================

  /**
   * Simpan access_token + refresh_token ke shared cookie (.gameforsmart.com)
   * Format: access_token|refresh_token (~1.5KB, aman di bawah batas 4KB)
   */
  export function syncSessionCookie(tokens: { access_token: string; refresh_token: string } | null) {
    if (typeof document === 'undefined') return;
    const hostname = window.location.hostname;
    const isGfs = hostname.endsWith('gameforsmart.com');
    const isHttps = window.location.protocol === 'https:';

    if (!tokens) {
      // Hapus cookie
      let cookieStr = `gfs-session=; path=/; max-age=0`;
      if (isGfs) cookieStr += `; domain=.gameforsmart.com`;
      document.cookie = cookieStr;
      return;
    }

    const value = `${tokens.access_token}|${tokens.refresh_token}`;
    const parts = [
      `gfs-session=${encodeURIComponent(value)}`,
      `path=/`,
      `max-age=${60 * 60 * 24 * 365}`,
      `SameSite=Lax`,
    ];
    if (isGfs) parts.push(`domain=.gameforsmart.com`);
    if (isHttps) parts.push(`Secure`);
    document.cookie = parts.join('; ');
  }

  /**
   * Baca access_token + refresh_token dari shared cookie
   */
  export function getSessionFromCookie(): { access_token: string; refresh_token: string } | null {
    if (typeof document === 'undefined') return null;
    const cookies = document.cookie.split('; ');
    const found = cookies.find(c => c.startsWith('gfs-session='));
    if (!found) return null;
    try {
      const eqIndex = found.indexOf('=');
      const value = decodeURIComponent(found.substring(eqIndex + 1));
      const pipeIndex = value.indexOf('|');
      if (pipeIndex === -1) return null;
      const access_token = value.substring(0, pipeIndex);
      const refresh_token = value.substring(pipeIndex + 1);
      if (!access_token || !refresh_token) return null;
      return { access_token, refresh_token };
    } catch {
      return null;
    }
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
