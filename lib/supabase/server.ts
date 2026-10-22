import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Read-only session client for route handlers (no response to attach
// refreshed cookies to — proxy.ts already keeps the session cookie fresh
// on every request). Used to check who is calling, not to query data.
export async function createSessionClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {
          // No-op: this client only reads the session in a route handler.
        },
      },
    },
  );
}
