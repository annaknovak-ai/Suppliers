// Business rules applied to the AI result (ARCHITECTURE 2.6). Pure functions, no I/O.
import "server-only";
import { CRITERIA_KEYS, type AiSupplier, type SearchResponse, type Source, type Supplier } from "@/shared/schemas";
import { nameKey, urlKey, websiteDomain } from "@/shared/normalize";

const MAX_RESULTS = 5;

function uniqueUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  return urls.filter((url) => {
    const key = urlKey(url);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueSources(sources: Source[]): Source[] {
  const seen = new Set<string>();
  return sources.filter((s) => {
    const key = urlKey(s.url);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// 1. Drop every source URL that did not appear in this response's search results;
//    a "met" criterion left without a source becomes "not_verified".
export function verifySources(supplier: AiSupplier, allowedUrls: Set<string>): AiSupplier {
  const allowed = (url: string) => {
    const key = urlKey(url);
    return key !== null && allowedUrls.has(key);
  };
  const criteria = { ...supplier.criteria };
  for (const key of CRITERIA_KEYS) {
    const sourceUrls = uniqueUrls(criteria[key].sourceUrls.filter(allowed));
    const status = criteria[key].status === "met" && sourceUrls.length === 0 ? "not_verified" : criteria[key].status;
    criteria[key] = { status, sourceUrls };
  }
  return { ...supplier, criteria, sources: uniqueSources(supplier.sources.filter((s) => allowed(s.url))) };
}

function regKey(supplier: AiSupplier): string | null {
  const value = supplier.registrationOrLicenseNumber?.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
  return value ? value : null;
}

function isDuplicate(a: AiSupplier, b: AiSupplier): boolean {
  if (nameKey(a.name) === nameKey(b.name)) return true;
  const domainA = websiteDomain(a.website);
  if (domainA && domainA === websiteDomain(b.website)) return true;
  const regA = regKey(a);
  return regA !== null && regA === regKey(b);
}

// Keeps the first supplier and fills its gaps from the duplicate.
function merge(a: AiSupplier, b: AiSupplier): AiSupplier {
  const criteria = { ...a.criteria };
  for (const key of CRITERIA_KEYS) {
    criteria[key] = {
      status: a.criteria[key].status,
      sourceUrls: uniqueUrls([...a.criteria[key].sourceUrls, ...b.criteria[key].sourceUrls]),
    };
  }
  return {
    name: a.name,
    description: a.description ?? b.description,
    address: a.address ?? b.address,
    phone: a.phone ?? b.phone,
    email: a.email ?? b.email,
    website: a.website ?? b.website,
    criteria,
    registrationOrLicenseNumber: a.registrationOrLicenseNumber ?? b.registrationOrLicenseNumber,
    yearsActive: a.yearsActive ?? b.yearsActive,
    businessClientsCount: a.businessClientsCount ?? b.businessClientsCount,
    businessClientExamples: [...new Set([...a.businessClientExamples, ...b.businessClientExamples])],
    sources: uniqueSources([...a.sources, ...b.sources]),
  };
}

// 2. Merge suppliers that share a name key, website domain or registration number.
export function dedupe(suppliers: AiSupplier[]): AiSupplier[] {
  const result: AiSupplier[] = [];
  for (const supplier of suppliers) {
    const index = result.findIndex((existing) => isDuplicate(existing, supplier));
    if (index === -1) result.push(supplier);
    else result[index] = merge(result[index], supplier);
  }
  return result;
}

function metCount(supplier: AiSupplier): number {
  return CRITERIA_KEYS.filter((key) => supplier.criteria[key].status === "met").length;
}

// 3–5. Compute meetsAllCriteria, sort full matches first, then partial by met count; take up to 5.
export function selectSuppliers(suppliers: AiSupplier[]): Supplier[] {
  return suppliers
    .map((s) => ({ ...s, meetsAllCriteria: metCount(s) === CRITERIA_KEYS.length, savedId: null }))
    .sort((a, b) => metCount(b) - metCount(a))
    .slice(0, MAX_RESULTS);
}

export function applyRules(suppliers: AiSupplier[], allowedUrls: Set<string>, now = new Date()): SearchResponse {
  const selected = selectSuppliers(dedupe(suppliers.map((s) => verifySources(s, allowedUrls))));
  return {
    suppliers: selected,
    fewerThanFive: selected.length < MAX_RESULTS,
    searchedAt: now.toISOString(),
  };
}
