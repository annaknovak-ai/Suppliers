// Supabase access for the saved_suppliers and search_results tables (ARCHITECTURE 2.4, 2.7). Server only, Secret Key.
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { nameKey, websiteDomain } from "@/shared/normalize";
import {
  CachedSearchResponseSchema,
  CRITERIA_KEYS,
  type CachedSearchResponse,
  type SavedSupplier,
  type SearchResponse,
  type SearchRequest,
  type Supplier,
  type UpdateSavedSupplierRequest,
} from "@/shared/schemas";

const TABLE = "saved_suppliers";
const UNIQUE_VIOLATION = "23505";

type Row = {
  id: string;
  country_id: string;
  city_id: string;
  service_id: string;
  name: string;
  name_key: string;
  website_domain: string | null;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  registration_or_license_number: string | null;
  years_active: number | null;
  business_clients_count: number | null;
  business_client_examples: string[];
  criteria: Supplier["criteria"];
  meets_all_criteria: boolean;
  sources: Supplier["sources"];
  status: SavedSupplier["status"];
  note: string;
  saved_at: string;
  updated_at: string;
};

export class DbError extends Error {}

let client: SupabaseClient | null = null;

function db(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) throw new DbError("Supabase is not configured");
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}

function fail(operation: string, error: { code?: string; message: string }): never {
  throw new DbError(`${operation}: ${error.code ?? ""} ${error.message}`.trim());
}

function toSavedSupplier(row: Row): SavedSupplier {
  return {
    id: row.id,
    countryId: row.country_id,
    cityId: row.city_id,
    serviceId: row.service_id,
    name: row.name,
    description: row.description,
    address: row.address,
    phone: row.phone,
    email: row.email,
    website: row.website,
    criteria: row.criteria,
    registrationOrLicenseNumber: row.registration_or_license_number,
    yearsActive: row.years_active,
    businessClientsCount: row.business_clients_count,
    businessClientExamples: row.business_client_examples,
    meetsAllCriteria: row.meets_all_criteria,
    sources: row.sources,
    status: row.status,
    note: row.note,
    savedAt: row.saved_at,
    updatedAt: row.updated_at,
  };
}

export async function listSaved(): Promise<SavedSupplier[]> {
  const { data, error } = await db().from(TABLE).select("*").order("saved_at", { ascending: false });
  if (error) fail("list", error);
  return (data as Row[]).map(toSavedSupplier);
}

// Saved suppliers of one city and service, newest first (saved list export).
export async function listSavedFor(cityId: string, serviceId: string): Promise<SavedSupplier[]> {
  const { data, error } = await db()
    .from(TABLE)
    .select("*")
    .eq("city_id", cityId)
    .eq("service_id", serviceId)
    .order("saved_at", { ascending: false });
  if (error) fail("listFor", error);
  return (data as Row[]).map(toSavedSupplier);
}

// Existing row for the same supplier: same city and service, and the same name key or website domain.
async function findExisting(search: SearchRequest, key: string, domain: string | null): Promise<Row | null> {
  const base = () => db().from(TABLE).select("*").eq("city_id", search.cityId).eq("service_id", search.serviceId);
  const byName = await base().eq("name_key", key).maybeSingle();
  if (byName.error) fail("find", byName.error);
  if (byName.data || !domain) return byName.data as Row | null;
  const byDomain = await base().eq("website_domain", domain).maybeSingle();
  if (byDomain.error) fail("find", byDomain.error);
  return byDomain.data as Row | null;
}

export type InsertResult = { conflict: boolean; saved: SavedSupplier };

export async function insertSaved(search: SearchRequest, supplier: Supplier): Promise<InsertResult> {
  const key = nameKey(supplier.name);
  const domain = websiteDomain(supplier.website);
  const { data, error } = await db()
    .from(TABLE)
    .insert({
      country_id: search.countryId,
      city_id: search.cityId,
      service_id: search.serviceId,
      name: supplier.name,
      name_key: key,
      website_domain: domain,
      description: supplier.description,
      address: supplier.address,
      phone: supplier.phone,
      email: supplier.email,
      website: supplier.website,
      registration_or_license_number: supplier.registrationOrLicenseNumber,
      years_active: supplier.yearsActive,
      business_clients_count: supplier.businessClientsCount,
      business_client_examples: supplier.businessClientExamples,
      criteria: supplier.criteria,
      // Recomputed here so the stored flag always matches the stored criteria.
      meets_all_criteria: CRITERIA_KEYS.every((k) => supplier.criteria[k].status === "met"),
      sources: supplier.sources,
    })
    .select("*")
    .single();

  if (!error) return { conflict: false, saved: toSavedSupplier(data as Row) };
  if (error.code !== UNIQUE_VIOLATION) fail("insert", error);

  const existing = await findExisting(search, key, domain);
  if (!existing) fail("insert", error);
  return { conflict: true, saved: toSavedSupplier(existing) };
}

// Returns null when the supplier no longer exists.
export async function updateSaved(id: string, patch: UpdateSavedSupplierRequest): Promise<SavedSupplier | null> {
  const { data, error } = await db().from(TABLE).update(patch).eq("id", id).select("*").maybeSingle();
  if (error) fail("update", error);
  return data ? toSavedSupplier(data as Row) : null;
}

// Returns false when the supplier no longer exists.
export async function deleteSaved(id: string): Promise<boolean> {
  const { data, error } = await db().from(TABLE).delete().eq("id", id).select("id");
  if (error) fail("delete", error);
  return data.length > 0;
}

// Saved row id for each supplier (same order), or null when it is not saved (PRD FR7.2).
export async function findSavedIds(search: SearchRequest, suppliers: Supplier[]): Promise<(string | null)[]> {
  if (suppliers.length === 0) return [];
  const keys = suppliers.map((s) => nameKey(s.name));
  const domains = suppliers.map((s) => websiteDomain(s.website));
  const base = () =>
    db().from(TABLE).select("id, name_key, website_domain").eq("city_id", search.cityId).eq("service_id", search.serviceId);

  const nonNullDomains = domains.filter((d): d is string => d !== null);
  const [byName, byDomain] = await Promise.all([
    base().in("name_key", keys),
    nonNullDomains.length ? base().in("website_domain", nonNullDomains) : Promise.resolve({ data: [], error: null }),
  ]);
  if (byName.error) fail("findSavedIds", byName.error);
  if (byDomain.error) fail("findSavedIds", byDomain.error);

  type Match = Pick<Row, "id" | "name_key" | "website_domain">;
  const idByName = new Map((byName.data as Match[]).map((r) => [r.name_key, r.id]));
  const idByDomain = new Map((byDomain.data as Match[]).map((r) => [r.website_domain, r.id]));
  return suppliers.map((_, i) => idByName.get(keys[i]) ?? (domains[i] ? idByDomain.get(domains[i]) : undefined) ?? null);
}

// ---- search_results: the latest web search result per city and service (ADR-11) ----

const SEARCH_TABLE = "search_results";

// The stored result of a city and service, or null when there is none or it no longer matches the schema.
export async function getCachedSearch(cityId: string, serviceId: string): Promise<CachedSearchResponse | null> {
  const { data, error } = await db()
    .from(SEARCH_TABLE)
    .select("response, searched_at")
    .eq("city_id", cityId)
    .eq("service_id", serviceId)
    .maybeSingle();
  if (error) fail("getCachedSearch", error);
  if (!data) return null;
  const parsed = CachedSearchResponseSchema.safeParse({
    ...(data.response as object),
    searchedAt: new Date(data.searched_at as string).toISOString(),
  });
  if (!parsed.success) {
    console.warn(JSON.stringify({ event: "search_cache_invalid", cityId, serviceId }));
    return null;
  }
  return parsed.data;
}

// Replaces the stored result of a city and service; savedId is per user and never stored.
export async function storeSearch(cityId: string, serviceId: string, response: SearchResponse): Promise<void> {
  // Parsing drops the unknown savedId key from every supplier.
  const stored: CachedSearchResponse = CachedSearchResponseSchema.parse(response);
  const { error } = await db()
    .from(SEARCH_TABLE)
    .upsert({ city_id: cityId, service_id: serviceId, response: stored, searched_at: response.searchedAt });
  if (error) fail("storeSearch", error);
}
