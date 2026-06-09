import { createClient } from "@supabase/supabase-js";

const supabaseUrlGame = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKeyGame = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrlGame) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!supabaseAnonKeyGame) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");

export const supabaseGame = createClient(
    supabaseUrlGame,
    supabaseAnonKeyGame,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
        },
    }
);