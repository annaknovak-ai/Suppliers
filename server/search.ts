// Search orchestration: AI call -> business rules -> SearchResponse, with a usage log line.
import "server-only";
import { getCity, getCountry, getService } from "@/shared/catalog";
import type { SearchRequest, SearchResponse } from "@/shared/schemas";
import { searchWithAi } from "./ai/client";
import { applyRules } from "./rules";

export async function runSearch(request: SearchRequest): Promise<SearchResponse> {
  const country = getCountry(request.countryId)!;
  const city = getCity(request.cityId)!;
  const service = getService(request.serviceId)!;

  const startedAt = Date.now();
  const result = await searchWithAi(country, city, service);
  const response = applyRules(result.output.suppliers, result.allowedUrls);

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
