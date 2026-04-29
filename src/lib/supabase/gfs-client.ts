import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null

export function createGFSClient() {
    if (client) return client;

    const isProd = typeof window !== "undefined" && window.location.hostname.endsWith("gameforsmart.com");

    client = createBrowserClient(
        process.env.NEXT_PUBLIC_CENTRAL_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_CENTRAL_SUPABASE_ANON_KEY!,
        {
            cookieOptions: {
                domain: isProd ? ".gameforsmart.com" : undefined,
                path: "/",
                sameSite: "lax",
                secure: isProd,
            }
        }
    );
    return client;
}
