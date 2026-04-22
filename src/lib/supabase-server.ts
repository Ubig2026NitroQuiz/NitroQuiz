import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * ============================================================
 * SERVER-SIDE SUPABASE CLIENTS
 * ============================================================
 * Digunakan HANYA di Server Components dan Route Handlers.
 * Membaca session dari HTTP cookies (bukan localStorage).
 * 
 * Untuk client-side (browser), tetap gunakan `@/lib/supabase`.
 * ============================================================
 */

/**
 * Supabase client untuk CENTRAL database (platform utama).
 * Digunakan untuk: Quiz data, Profiles, Game Sessions.
 * Membaca auth token dari cookie `gfs-auth-token` yang di-set oleh @supabase/ssr middleware.
 */
export async function createSupabaseCentralServer() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_CENTRAL_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_CENTRAL_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll dipanggil dari Server Component — 
            // tidak bisa set cookie di sini, middleware akan handle.
          }
        },
      },
    }
  )
}

/**
 * Supabase client untuk PROJECT database (NitroQuiz spesifik).
 * Digunakan untuk: Sessions, Participants, Scores.
 * TANPA auth (read-only public data) — sesuai konfigurasi asli.
 */
export async function createSupabaseProjectServer() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignored in Server Components
          }
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )
}
