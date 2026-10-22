import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

// Public short link. No session involved: counts the tap via the
// tap_card RPC (supabase/migrations) and redirects to the destination.
// Not seen by proxy.ts — excluded by its matcher.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );

  const { data: destination, error } = await supabase.rpc("tap_card", {
    card_code: code,
  });

  if (error || !destination) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.redirect(destination);
}
