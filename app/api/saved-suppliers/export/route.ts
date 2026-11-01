// GET /api/saved-suppliers/export?city=&service=&lang= – the saved suppliers of one city and service as xlsx (PRD FR7.10).
import { getCity, getService, LANGS, type Lang } from "@/shared/catalog";
import { savedExportFileName, XLSX_MIME } from "@/shared/exportFileName";
import type { ApiError } from "@/shared/schemas";
import { listSavedFor } from "@/server/db";
import { buildSavedSuppliersWorkbook } from "@/server/excel";

// Runs on the Node.js runtime (the default; `runtime` config is not allowed with cacheComponents, ADR-5).

const NO_STORE = { "Cache-Control": "no-store" };

function error(code: string, status: number) {
  return Response.json({ error: { code } } satisfies ApiError, { status, headers: NO_STORE });
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const city = getCity(params.get("city") ?? "");
  const service = getService(params.get("service") ?? "");
  const lang = params.get("lang") as Lang;
  if (!city || !service || !LANGS.includes(lang)) return error("invalid_input", 400);

  const search = { countryId: city.countryId, cityId: city.id, serviceId: service.id };
  try {
    const items = await listSavedFor(city.id, service.id);
    // Same rule as the search export: nothing to export is a bad request.
    if (items.length === 0) return error("empty", 400);
    const exportedAt = new Date().toISOString();
    const file = await buildSavedSuppliersWorkbook(search, items, lang, exportedAt);
    return new Response(new Uint8Array(file), {
      headers: {
        ...NO_STORE,
        "Content-Type": XLSX_MIME,
        "Content-Disposition": `attachment; filename="${savedExportFileName(search, exportedAt)}"`,
      },
    });
  } catch (e) {
    console.error(JSON.stringify({ event: "saved_export_failed", message: e instanceof Error ? e.message : String(e) }));
    return error("export_failed", 500);
  }
}
