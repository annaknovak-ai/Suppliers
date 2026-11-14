// What the browser remembers: the interface language (across visits, on this device)
// and the last search (until the tab is closed, so a refresh does not lose it).
// Storage can be blocked or full; the app then simply works without this memory.
import { z } from "zod";
import { LANGS, type Lang } from "@/shared/catalog";
import { SearchRequestSchema, SearchResponseSchema } from "@/shared/schemas";

const LANG_KEY = "supplier-finder.lang";
const SEARCH_KEY = "supplier-finder.search";

const nullableId = z.string().nullable();
const StoredSearchSchema = z.object({
  form: z.object({ countryId: nullableId, cityId: nullableId, serviceId: nullableId }),
  // Only a finished search is kept: one that was still running cannot be resumed after a refresh.
  last: z.object({ request: SearchRequestSchema, response: SearchResponseSchema }).nullable(),
});
export type StoredSearch = z.infer<typeof StoredSearchSchema>;

export function loadLang(): Lang | null {
  try {
    const lang = localStorage.getItem(LANG_KEY);
    return LANGS.find((l) => l === lang) ?? null;
  } catch {
    return null;
  }
}

export function storeLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // Not remembered; the chosen language still applies until the page is refreshed.
  }
}

export function loadSearch(): StoredSearch | null {
  try {
    const raw = sessionStorage.getItem(SEARCH_KEY);
    if (!raw) return null;
    const parsed = StoredSearchSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function storeSearch(search: StoredSearch): void {
  try {
    sessionStorage.setItem(SEARCH_KEY, JSON.stringify(search));
  } catch {
    // Not remembered; a refresh returns to the empty search form.
  }
}

// Called before signing out, so the next person in this browser does not see the previous search (PRD edge cases).
export function clearSearch(): void {
  try {
    sessionStorage.removeItem(SEARCH_KEY);
  } catch {
    // Nothing was stored.
  }
}
