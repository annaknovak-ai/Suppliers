// GET /auth/callback?code=&next= – back from Google: creates the session cookies and returns to the requested page.
import { NextResponse } from "next/server";
import { safeNext } from "@/shared/safeNext";
import { createAuthClient } from "@/server/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"));
  const code = url.searchParams.get("code");

  // No code means the sign-in failed or was cancelled on Google's side.
  if (code) {
    try {
      const supabase = await createAuthClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(next, url.origin));
      console.error(JSON.stringify({ event: "auth_callback_failed", message: error.message }));
    } catch (e) {
      console.error(JSON.stringify({ event: "auth_callback_failed", message: e instanceof Error ? e.message : String(e) }));
    }
  }
  return NextResponse.redirect(new URL(`/login?error=1&next=${encodeURIComponent(next)}`, url.origin));
}
