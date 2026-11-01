// API client for the app's Route Handlers.
import type { ExportRequest, SearchRequest, SearchResponse } from "@/shared/schemas";

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

// Returns the generated xlsx file; throws on any non-200 response or network failure.
export async function exportSuppliers(request: ExportRequest): Promise<Blob> {
  const response = await fetch("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    cache: "no-store",
  });
  if (!response.ok) throw new ApiRequestError(response.status);
  return response.blob();
}
