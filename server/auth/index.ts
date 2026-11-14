// Supabase Auth (Google sign-in) on the server: the session lives in HttpOnly cookies (ARCHITECTURE 2.4, 2.9, ADR-12).
import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export type AuthUser = { id: string; email: string | null };

export function authConfig(): { url: string; key: string } {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase Auth is not configured");
  return { url, key };
}

// Auth client bound to the cookies of the current request.
export async function createAuthClient() {
  const store = await cookies();
  const { url, key } = authConfig();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Server Components cannot write cookies; proxy.ts refreshes the session on every request anyway.
        }
      },
    },
  });
}

// The signed-in user, verified with Supabase (auth.getUser), or null.
export async function getUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createAuthClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email ?? null };
  } catch {
    return null;
  }
}
