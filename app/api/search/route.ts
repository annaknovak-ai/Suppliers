// POST /api/search – validates the selection and runs a supplier search (ARCHITECTURE 2.4).
import { isValidSelection } from "@/shared/catalog";
import { SearchRequestSchema, type ApiError } from "@/shared/schemas";
import { AiTimeoutError } from "@/server/ai/client";
import { runSearch } from "@/server/search";
import { getUser } from "@/server/auth";

// Runs on the Node.js runtime (the default; `runtime` config is not allowed with cacheComponents, ADR-5).
export const maxDuration = 180;

const NO_STORE = { "Cache-Control": "no-store" };

function error(code: string, status: number) {
  return Response.json({ error: { code } } satisfies ApiError, { status, headers: NO_STORE });
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return error("unauthorized", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error("invalid_input", 400);
  }

  const parsed = SearchRequestSchema.safeParse(body);
  if (!parsed.success || !isValidSelection(parsed.data.countryId, parsed.data.cityId, parsed.data.serviceId)) {
    return error("invalid_input", 400);
  }

  try {
    // request.signal fires when the browser leaves (refresh, new search), so an abandoned search stops costing money.
    const response = await runSearch(parsed.data, user.id, request.signal);
    return Response.json(response, { headers: NO_STORE });
  } catch (e) {
    if (request.signal.aborted) {
      console.info(JSON.stringify({ event: "search_cancelled" }));
      return error("cancelled", 499);
    }
    if (e instanceof AiTimeoutError) return error("timeout", 504);
    console.error(JSON.stringify({ event: "search_failed", message: e instanceof Error ? e.message : String(e) }));
    return error("ai_error", 502);
  }
}
