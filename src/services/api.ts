// API client for the app's Route Handlers.
import type { SearchRequest, SearchResponse } from "@/shared/schemas";

const SEARCH_TIMEOUT_MS = 190_000;

export class ApiRequestError extends Error {
  constructor(public status: number) {
    super(`request failed with status ${status}`);
  }
}

// Throws on any non-200 response or network failure; aborts with the caller's signal or after the client timeout.
export async function searchSuppliers(request: SearchRequest, signal: AbortSignal): Promise<SearchResponse> {
  const response = await fetch("/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    cache: "no-store",
    signal: AbortSignal.any([signal, AbortSignal.timeout(SEARCH_TIMEOUT_MS)]),
  });
  if (!response.ok) throw new ApiRequestError(response.status);
  return (await response.json()) as SearchResponse;
}
