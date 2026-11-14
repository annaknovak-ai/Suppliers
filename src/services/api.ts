// API client for the app's Route Handlers.
import type {
  ExportRequest,
  SavedSupplier,
  SavedSuppliersList,
  SearchRequest,
  SearchResponse,
  Supplier,
  UpdateSavedSupplierRequest,
} from "@/shared/schemas";

const SEARCH_TIMEOUT_MS = 190_000;
const SAVED_TIMEOUT_MS = 15_000;

export class ApiRequestError extends Error {
  constructor(public status: number) {
    super(`request failed with status ${status}`);
  }
}

// Every API call goes through here: a 401 (not signed in, or the session expired) sends the browser to the
// sign-in screen and back to this page afterwards (ARCHITECTURE 2.3). The page is leaving, so no error is shown.
async function apiFetch(url: string, init: RequestInit): Promise<Response> {
  const response = await fetch(url, init);
  if (response.status === 401) {
    const here = window.location.pathname + window.location.search;
    // A full page load on purpose: it drops the in-memory state of the signed-out session.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`/login?next=${encodeURIComponent(here)}`);
    throw new ApiRequestError(401);
  }
  return response;
}

// Throws on any non-200 response or network failure; aborts with the caller's signal or after the client timeout.
export async function searchSuppliers(request: SearchRequest, signal: AbortSignal): Promise<SearchResponse> {
  const response = await apiFetch("/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    cache: "no-store",
    signal: AbortSignal.any([signal, AbortSignal.timeout(SEARCH_TIMEOUT_MS)]),
  });
  if (!response.ok) throw new ApiRequestError(response.status);
  return (await response.json()) as SearchResponse;
}

// Saves a supplier; an already saved supplier (409) counts as success and returns the existing row.
export async function saveSupplier(search: SearchRequest, supplier: Supplier): Promise<SavedSupplier> {
  const response = await savedFetch("/api/saved-suppliers", {
    method: "POST",
    body: JSON.stringify({ search, supplier }),
  });
  if (response.status !== 201 && response.status !== 409) throw new ApiRequestError(response.status);
  return (await response.json()) as SavedSupplier;
}

export async function listSavedSuppliers(): Promise<SavedSuppliersList> {
  const response = await savedFetch("/api/saved-suppliers", { method: "GET" });
  if (!response.ok) throw new ApiRequestError(response.status);
  return (await response.json()) as SavedSuppliersList;
}

// Throws ApiRequestError(404) when the supplier was deleted meanwhile.
export async function updateSavedSupplier(id: string, patch: UpdateSavedSupplierRequest): Promise<SavedSupplier> {
  const response = await savedFetch(`/api/saved-suppliers/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  if (!response.ok) throw new ApiRequestError(response.status);
  return (await response.json()) as SavedSupplier;
}

// A supplier that is already gone (404) counts as deleted.
export async function deleteSavedSupplier(id: string): Promise<void> {
  const response = await savedFetch(`/api/saved-suppliers/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!response.ok && response.status !== 404) throw new ApiRequestError(response.status);
}

// The saved suppliers of one city and service as an xlsx file, with the file name chosen by the server.
export async function exportSavedSuppliers(
  cityId: string,
  serviceId: string,
  lang: string,
): Promise<{ blob: Blob; fileName: string }> {
  const query = new URLSearchParams({ city: cityId, service: serviceId, lang });
  const response = await apiFetch(`/api/saved-suppliers/export?${query}`, { cache: "no-store" });
  if (!response.ok) throw new ApiRequestError(response.status);
  const fileName = /filename="([^"]+)"/.exec(response.headers.get("Content-Disposition") ?? "")?.[1] ?? "saved_suppliers.xlsx";
  return { blob: await response.blob(), fileName };
}

function savedFetch(url: string, init: RequestInit): Promise<Response> {
  return apiFetch(url, {
    ...init,
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(SAVED_TIMEOUT_MS),
  });
}

// Returns the generated xlsx file; throws on any non-200 response or network failure.
export async function exportSuppliers(request: ExportRequest): Promise<Blob> {
  const response = await apiFetch("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    cache: "no-store",
  });
  if (!response.ok) throw new ApiRequestError(response.status);
  return response.blob();
}
