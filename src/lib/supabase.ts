import { createClient } from '@supabase/supabase-js';

// ==========================================
// 1. SUPABASE CLIENT UTAMA (PROJECT-MU SENDIRI)
// Digunakan untuk:
// - Menyimpan Sessions
// - Menyimpan Participants
// - Mencatat Jawaban, Score, Time
// ==========================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


// ==========================================
// 2. SUPABASE CLIENT PUSAT (DATABASE QUIZ PUSAT)
// Digunakan HANYA untuk:
// - Menarik (Read-only) data Quiz dari Host/Pusat
// - Menarik soal-soal dan jawabannya
// ==========================================
const centralSupabaseUrl = process.env.NEXT_PUBLIC_CENTRAL_SUPABASE_URL || '';
const centralSupabaseAnonKey = process.env.NEXT_PUBLIC_CENTRAL_SUPABASE_ANON_KEY || '';

export const supabaseCentral = createClient(centralSupabaseUrl, centralSupabaseAnonKey);
