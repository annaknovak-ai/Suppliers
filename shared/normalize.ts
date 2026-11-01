// Normalization used for duplicate detection, saved-supplier matching and URL safety (ARCHITECTURE 2.6).

// Lowercase name without quotes, punctuation or repeated whitespace.
export function nameKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Returns the URL only when it uses http or https.
export function safeHttpUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withScheme);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : null;
  } catch {
    return null;
  }
}

// Website host without "www.", or null.
export function websiteDomain(url: string | null | undefined): string | null {
  const safe = safeHttpUrl(url);
  if (!safe) return null;
  return new URL(safe).hostname.toLowerCase().replace(/^www\./, "") || null;
}

// Canonical form for comparing source URLs: no fragment, no trailing slash.
export function urlKey(url: string): string | null {
  const safe = safeHttpUrl(url);
  if (!safe) return null;
  const parsed = new URL(safe);
  parsed.hash = "";
  parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
  return parsed.href.replace(/\/+$/, "");
}
