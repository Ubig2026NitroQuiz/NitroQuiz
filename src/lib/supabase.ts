import { createClient, SupabaseClient } from '@supabase/supabase-js';

class SharedCookieStorage {
  private storageKey: string;

  // ← kasih default value, jadi bisa dipanggil tanpa argumen
  constructor(storageKey: string = 'gfs-auth-token') {
    this.storageKey = storageKey;
  }

  getItem(key: string): string | null {
    if (typeof document === 'undefined') return null;
    const cookies = document.cookie.split('; ');
    const found = cookies.find(c => c.startsWith(`${key}=`));
    return found ? decodeURIComponent(found.split('=')[1]) : null;
  }

  setItem(key: string, value: string): void {
    if (typeof document === 'undefined') return;
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = [
      `${key}=${encodeURIComponent(value)}`,
      `domain=.gameforsmart.com`,
      `path=/`,
      `max-age=${maxAge}`,
      `SameSite=Lax`,
      `Secure`,
    ].join('; ');
  }

  removeItem(key: string): void {
    if (typeof document === 'undefined') return;
    document.cookie = `${key}=; domain=.gameforsmart.com; path=/; max-age=0`;
  }
}

// ==========================================
// 1. SUPABASE CLIENT UTAMA (PROJECT-MU SENDIRI)
// Digunakan untuk:
// - Menyimpan Participants
// - Mencatat Jawaban, Score, Time
// ==========================================
let _supabase: SupabaseClient | null = null;

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabase) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase env vars are not set. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are defined.');
      }
      _supabase = createClient(supabaseUrl, supabaseAnonKey);
    }
    const value = (_supabase as any)[prop];
    if (typeof value === 'function') {
      return value.bind(_supabase);
    }
    return value;
  },
});


// ==========================================
// 2. SUPABASE CLIENT PUSAT (DATABASE QUIZ PUSAT)
// Digunakan HANYA untuk:
// - Menyimpan Sessions
// - Menarik (Read-only) data Quiz dari Host/Pusat
// - Menarik soal-soal dan jawabannya
// ==========================================
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
          storage: new SharedCookieStorage(),
          storageKey: 'gfs-auth-token', // sama di axiom, zigma, app, landing
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        }

      });
    }
    const value = (_supabaseCentral as any)[prop];
    if (typeof value === 'function') {
      return value.bind(_supabaseCentral);
    }
    return value;
  },
});
