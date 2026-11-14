// Search orchestration (ARCHITECTURE 2.4): saved result or AI call -> business rules -> store -> saved marks,
// with a usage log line.
import "server-only";
import { getCity, getCountry, getService } from "@/shared/catalog";
import type { SearchRequest, SearchResponse } from "@/shared/schemas";
import { searchWithAi } from "./ai/client";
import { findSavedIds, getCachedSearch, storeSearch } from "./db";
import { applyRules } from "./rules";

// A stored result is reused for this long after its web search (PRD FR2.6, FR2.7).
const CACHE_DAYS = 30;
const CACHE_MS = CACHE_DAYS * 24 * 60 * 60 * 1000;

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

// Fills savedId from the database; a database failure leaves every savedId null and never fails the search.
async function markSaved(userId: string, request: SearchRequest, response: SearchResponse): Promise<void> {
  try {
    const ids = await findSavedIds(userId, request, response.suppliers);
    response.suppliers.forEach((supplier, i) => {
      supplier.savedId = ids[i];
    });
  } catch (e) {
    console.warn(JSON.stringify({ event: "saved_marks_failed", message: errorMessage(e) }));
  }
}

// The stored result when it is still valid; a database failure counts as "none", so the web search runs instead.
async function readCache(request: SearchRequest): Promise<SearchResponse | null> {
  try {
    const cached = await getCachedSearch(request.cityId, request.serviceId);
    if (!cached || Date.now() - Date.parse(cached.searchedAt) > CACHE_MS) return null;
    return { ...cached, suppliers: cached.suppliers.map((s) => ({ ...s, savedId: null })) };
  } catch (e) {
    console.warn(JSON.stringify({ event: "search_cache_read_failed", message: errorMessage(e) }));
    return null;
  }
}

// savedId marks only the suppliers saved by this user (PRD FR7.2); the stored result itself is shared by everyone.
export async function runSearch(request: SearchRequest, userId: string, cancelSignal: AbortSignal): Promise<SearchResponse> {
  const country = getCountry(request.countryId)!;
  const city = getCity(request.cityId)!;
  const service = getService(request.serviceId)!;
  const startedAt = Date.now();

  if (!request.refresh) {
    const cached = await readCache(request);
    if (cached) {
      await markSaved(userId, request, cached);
      console.info(
        JSON.stringify({
          event: "search_cached",
          cityId: city.id,
          serviceId: service.id,
          durationMs: Date.now() - startedAt,
          searchedAt: cached.searchedAt,
          suppliers: cached.suppliers.length,
        }),
      );
      return cached;
    }
  }

  const result = await searchWithAi(country, city, service, cancelSignal);
  const response = applyRules(result.output.suppliers, result.allowedUrls);

  // Only a successful web search reaches this point, so a failed or cancelled one never replaces the stored result.
  try {
    await storeSearch(city.id, service.id, response);
  } catch (e) {
    console.warn(JSON.stringify({ event: "search_cache_write_failed", message: errorMessage(e) }));
  }
  await markSaved(userId, request, response);

  console.info(
    JSON.stringify({
      event: "search",
      cityId: city.id,
      serviceId: service.id,
      refresh: request.refresh === true,
      durationMs: Date.now() - startedAt,
      input_tokens: result.usage.inputTokens,
      output_tokens: result.usage.outputTokens,
      reasoning_tokens: result.usage.reasoningTokens,
      web_search_calls: result.usage.webSearchCalls,
      candidates: result.output.suppliers.length,
      allowedUrls: result.allowedUrls.size,
      suppliers: response.suppliers.length,
    }),
  );
  return response;
}
