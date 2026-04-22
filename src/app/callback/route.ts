import { NextResponse } from 'next/server';
import { createGFSServerClient } from '@/lib/supabase/gfs-server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/';

    if (code) {
        const supabase = await createGFSServerClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // Return the user to login page with error
    return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`);
}
