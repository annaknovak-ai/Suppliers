// Search orchestration: AI call -> business rules -> saved marks -> SearchResponse, with a usage log line.
import "server-only";
import { getCity, getCountry, getService } from "@/shared/catalog";
import type { SearchRequest, SearchResponse } from "@/shared/schemas";
import { searchWithAi } from "./ai/client";
import { findSavedIds } from "./db";
import { applyRules } from "./rules";

// Fills savedId from the database; a database failure leaves every savedId null and never fails the search.
async function markSaved(request: SearchRequest, response: SearchResponse): Promise<void> {
  try {
    const ids = await findSavedIds(request, response.suppliers);
    response.suppliers.forEach((supplier, i) => {
      supplier.savedId = ids[i];
    });
  } catch (e) {
    console.warn(JSON.stringify({ event: "saved_marks_failed", message: e instanceof Error ? e.message : String(e) }));
  }
}

export async function runSearch(request: SearchRequest): Promise<SearchResponse> {
  const country = getCountry(request.countryId)!;
  const city = getCity(request.cityId)!;
  const service = getService(request.serviceId)!;

  const startedAt = Date.now();
  const result = await searchWithAi(country, city, service);
  const response = applyRules(result.output.suppliers, result.allowedUrls);
  await markSaved(request, response);

  console.info(
    JSON.stringify({
      event: "search",
      cityId: city.id,
      serviceId: service.id,
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
