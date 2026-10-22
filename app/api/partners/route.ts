import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createSessionClient } from "@/lib/supabase/server";

// Any signed-in partner can list or create partner accounts (decision:
// all five are equally trusted). SUPABASE_SECRET_KEY is server-only
// and must never reach the browser — it is not NEXT_PUBLIC_.
async function requireSignedIn() {
  const session = await createSessionClient();
  const { data } = await session.auth.getClaims();
  return Boolean(data?.claims);
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function GET() {
  if (!(await requireSignedIn())) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data, error } = await adminClient().auth.admin.listUsers();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const partners = data.users
    .map((user) => ({
      id: user.id,
      email: user.email ?? "",
      created_at: user.created_at,
    }))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  return NextResponse.json({ partners });
}

export async function POST(request: NextRequest) {
  if (!(await requireSignedIn())) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { email, password } = await request.json();
  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Missing email or password" }, {
      status: 400,
    });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 },
    );
  }

  const { data, error } = await adminClient().auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    partner: { id: data.user.id, email: data.user.email ?? "" },
  });
}
