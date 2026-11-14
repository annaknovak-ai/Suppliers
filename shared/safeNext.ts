// The page to return to after signing in: only a path inside this app, never another site (ARCHITECTURE 2.3).
export function safeNext(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
}
