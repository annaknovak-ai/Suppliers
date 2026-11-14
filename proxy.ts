// Refreshes the Supabase session cookie on every request and sends signed-out visitors of any page to /login
// (ARCHITECTURE 2.3, ADR-12). API routes are not redirected: their handlers answer 401 themselves.
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Pages open without signing in (PRD FR6.1, FR6.6).
const PUBLIC_PAGES = ["/login", "/privacy"];

function isProtectedPage(pathname: string): boolean {
  return !pathname.startsWith("/api/") && !pathname.startsWith("/auth/") && !PUBLIC_PAGES.includes(pathname);
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(process.env.SUPABASE_URL ?? "", process.env.SUPABASE_PUBLISHABLE_KEY ?? "", {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list, headers) {
        // The refreshed session must reach both this request (for the page) and the browser.
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
      },
    },
  });

  let signedIn = false;
  try {
    const { data } = await supabase.auth.getUser();
    signedIn = Boolean(data.user);
  } catch {
    // Auth unreachable or not configured: treat as signed out.
  }

  const { pathname, search } = request.nextUrl;
  if (!signedIn && isProtectedPage(pathname)) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = `?next=${encodeURIComponent(pathname + search)}`;
    const redirect = NextResponse.redirect(login);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }
  return response;
}

export const config = {
  // Static files, the manifest and icons load without signing in (Android fetches the manifest without cookies).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|.*\\.(?:png|svg|ico|webp|jpg)$).*)"],
};
