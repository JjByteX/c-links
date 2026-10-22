import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Signed-out visitors go to /login, and signed-in partners skip it.
// The public short link (/c/...) and the logo files in public/ never reach
// this function, so signed-out visitors can still load them.
export async function proxy(request: NextRequest) {
  const { response, signedIn } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (!signedIn && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (signedIn && (pathname === "/login" || pathname === "/")) {
    return NextResponse.redirect(new URL("/cards", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!c/|_next/static|_next/image|favicon.ico|clinks_logo).*)"],
};
