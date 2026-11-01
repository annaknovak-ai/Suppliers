// GET /api/saved-suppliers – the shared saved list; POST – saves a supplier from the results (ARCHITECTURE 2.7).
import { connection } from "next/server";
import { isValidSelection } from "@/shared/catalog";
import { SaveSupplierRequestSchema, type ApiError, type SavedSuppliersList } from "@/shared/schemas";
import { insertSaved, listSaved } from "@/server/db";

// Runs on the Node.js runtime (the default; `runtime` config is not allowed with cacheComponents, ADR-5).

const NO_STORE = { "Cache-Control": "no-store" };

function error(code: string, status: number) {
  return Response.json({ error: { code } } satisfies ApiError, { status, headers: NO_STORE });
}

function logDbError(e: unknown) {
  console.error(JSON.stringify({ event: "db_failed", message: e instanceof Error ? e.message : String(e) }));
}

export async function GET() {
  // Always read the database at request time; never prerender this list.
  await connection();
  try {
    const items = await listSaved();
    return Response.json({ items, total: items.length } satisfies SavedSuppliersList, { headers: NO_STORE });
  } catch (e) {
    logDbError(e);
    return error("db_error", 500);
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("invalid_input", 400);
  }

  const parsed = SaveSupplierRequestSchema.safeParse(body);
  if (!parsed.success) return error("invalid_input", 400);
  const { search, supplier } = parsed.data;
  if (!isValidSelection(search.countryId, search.cityId, search.serviceId)) return error("invalid_input", 400);

  try {
    const { conflict, saved } = await insertSaved(search, supplier);
    return Response.json(saved, { status: conflict ? 409 : 201, headers: NO_STORE });
  } catch (e) {
    logDbError(e);
    return error("db_error", 500);
  }
}
