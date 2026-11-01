// POST /api/export – validates the search results and returns them as an xlsx file (ARCHITECTURE 2.4, 2.7).
import { isValidSelection } from "@/shared/catalog";
import { exportFileName, XLSX_MIME } from "@/shared/exportFileName";
import { ExportRequestSchema, type ApiError } from "@/shared/schemas";
import { buildSuppliersWorkbook } from "@/server/excel";

// Runs on the Node.js runtime (the default; `runtime` config is not allowed with cacheComponents, ADR-5).

const NO_STORE = { "Cache-Control": "no-store" };

function error(code: string, status: number) {
  return Response.json({ error: { code } } satisfies ApiError, { status, headers: NO_STORE });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("invalid_input", 400);
  }

  const parsed = ExportRequestSchema.safeParse(body);
  if (!parsed.success) return error("invalid_input", 400);
  const { search, response } = parsed.data;
  if (!isValidSelection(search.countryId, search.cityId, search.serviceId)) return error("invalid_input", 400);

  try {
    const file = await buildSuppliersWorkbook(parsed.data);
    return new Response(new Uint8Array(file), {
      headers: {
        ...NO_STORE,
        "Content-Type": XLSX_MIME,
        "Content-Disposition": `attachment; filename="${exportFileName(search, response.searchedAt)}"`,
      },
    });
  } catch (e) {
    console.error(JSON.stringify({ event: "export_failed", message: e instanceof Error ? e.message : String(e) }));
    return error("export_failed", 500);
  }
}
