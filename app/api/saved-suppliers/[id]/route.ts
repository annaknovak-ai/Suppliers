// PATCH /api/saved-suppliers/[id] – updates status and/or note; DELETE – removes the supplier (ARCHITECTURE 2.7).
import { z } from "zod";
import { UpdateSavedSupplierRequestSchema, type ApiError } from "@/shared/schemas";
import { deleteSaved, updateSaved } from "@/server/db";

// Runs on the Node.js runtime (the default; `runtime` config is not allowed with cacheComponents, ADR-5).

const NO_STORE = { "Cache-Control": "no-store" };

type Context = { params: Promise<{ id: string }> };

function error(code: string, status: number) {
  return Response.json({ error: { code } } satisfies ApiError, { status, headers: NO_STORE });
}

function logDbError(e: unknown) {
  console.error(JSON.stringify({ event: "db_failed", message: e instanceof Error ? e.message : String(e) }));
}

// An id that is not a uuid can never exist, so it is reported as not found.
async function validId({ params }: Context): Promise<string | null> {
  const { id } = await params;
  return z.uuid().safeParse(id).success ? id : null;
}

export async function PATCH(request: Request, context: Context) {
  const id = await validId(context);
  if (!id) return error("not_found", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("invalid_input", 400);
  }
  const parsed = UpdateSavedSupplierRequestSchema.safeParse(body);
  if (!parsed.success) return error("invalid_input", 400);

  try {
    const saved = await updateSaved(id, parsed.data);
    if (!saved) return error("not_found", 404);
    return Response.json(saved, { headers: NO_STORE });
  } catch (e) {
    logDbError(e);
    return error("db_error", 500);
  }
}

export async function DELETE(_request: Request, context: Context) {
  const id = await validId(context);
  if (!id) return error("not_found", 404);

  try {
    const deleted = await deleteSaved(id);
    if (!deleted) return error("not_found", 404);
    return new Response(null, { status: 204, headers: NO_STORE });
  } catch (e) {
    logDbError(e);
    return error("db_error", 500);
  }
}
