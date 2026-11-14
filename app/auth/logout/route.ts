// POST /auth/logout – ends the session on this device and returns to the sign-in screen.
import { NextResponse } from "next/server";
import { createAuthClient } from "@/server/auth";

export async function POST(request: Request) {
  try {
    const supabase = await createAuthClient();
    // Only this device: the user stays signed in elsewhere (PRD FR6.4).
    await supabase.auth.signOut({ scope: "local" });
  } catch (e) {
    console.error(JSON.stringify({ event: "auth_logout_failed", message: e instanceof Error ? e.message : String(e) }));
  }
  // 303 turns the form POST into a GET of the sign-in page.
  return NextResponse.redirect(new URL("/login", request.url), 303);
}
