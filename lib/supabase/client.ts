import { createBrowserClient } from "@supabase/ssr";

// Browser client, used by client components (sign-in, cards).
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
