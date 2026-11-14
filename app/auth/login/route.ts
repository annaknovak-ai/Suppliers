// GET /auth/login?next= – starts Google sign-in through Supabase Auth (ARCHITECTURE 2.7, Flow 0).
import { NextResponse } from "next/server";
import { safeNext } from "@/shared/safeNext";
import { createAuthClient } from "@/server/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"));
  try {
    const supabase = await createAuthClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // The same code works on localhost and in Production: Google returns to the origin it was started from.
        redirectTo: `${url.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        skipBrowserRedirect: true,
      },
    });
    if (!error && data.url) return NextResponse.redirect(data.url);
    console.error(JSON.stringify({ event: "auth_login_failed", message: error?.message ?? "no url" }));
  } catch (e) {
    console.error(JSON.stringify({ event: "auth_login_failed", message: e instanceof Error ? e.message : String(e) }));
  }
  return NextResponse.redirect(new URL(`/login?error=1&next=${encodeURIComponent(next)}`, url.origin));
}
