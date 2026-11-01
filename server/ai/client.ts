// Calls the OpenAI Responses API with web search and collects the structured result and the URLs seen in search results.
import "server-only";
import OpenAI from "openai";
import type { Response } from "openai/resources/responses/responses";
import type { City, Country, ServiceType } from "@/shared/catalog";
import { AiOutputSchema, type AiOutput } from "@/shared/schemas";
import { urlKey } from "@/shared/normalize";
import { buildUserMessage, INSTRUCTIONS } from "./prompt";
import { SUPPLIERS_SCHEMA_NAME, suppliersSchema } from "./schema";

const REQUEST_TIMEOUT_MS = 150_000;

export class AiError extends Error {}
export class AiTimeoutError extends Error {}

export type AiSearchResult = {
  output: AiOutput;
  allowedUrls: Set<string>;
  usage: { inputTokens: number; outputTokens: number; reasoningTokens: number; webSearchCalls: number };
};

type ReasoningEffort = "none" | "minimal" | "low" | "medium" | "high" | "xhigh";

let client: OpenAI | null = null;
function getClient(): OpenAI {
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 2 });
  return client;
}

function config() {
  const maxToolCalls = Number.parseInt(process.env.SEARCH_MAX_TOOL_CALLS ?? "", 10);
  return {
    model: process.env.OPENAI_MODEL || "gpt-5.5",
    effort: (process.env.OPENAI_REASONING_EFFORT || "low") as ReasoningEffort,
    maxToolCalls: Number.isFinite(maxToolCalls) && maxToolCalls > 0 ? maxToolCalls : 8,
  };
}

// Collects every URL the model consulted (web search sources, opened pages) or cited.
function collectUrls(response: Response): Set<string> {
  const urls = new Set<string>();
  const add = (url: string | null | undefined) => {
    const key = url ? urlKey(url) : null;
    if (key) urls.add(key);
  };
  for (const item of response.output) {
    if (item.type === "web_search_call") {
      if (item.action.type === "search") item.action.sources?.forEach((s) => add(s.url));
      else if (item.action.type === "open_page") add(item.action.url);
    } else if (item.type === "message") {
      for (const part of item.content) {
        if (part.type === "output_text") {
          part.annotations.forEach((a) => a.type === "url_citation" && add(a.url));
        }
      }
    }
  }
  return urls;
}

async function runOnce(country: Country, city: City, service: ServiceType, signal: AbortSignal): Promise<AiSearchResult> {
  const { model, effort, maxToolCalls } = config();
  const response = await getClient().responses.create(
    {
      model,
      instructions: INSTRUCTIONS,
      input: buildUserMessage(country, city, service),
      reasoning: { effort },
      max_output_tokens: 16000,
      store: false,
      tools: [
        {
          type: "web_search",
          user_location: {
            type: "approximate",
            city: city.names.en,
            country: country.iso2,
            timezone: city.timezone,
          },
        },
      ],
      max_tool_calls: maxToolCalls,
      include: ["web_search_call.action.sources"],
      text: {
        format: { type: "json_schema", name: SUPPLIERS_SCHEMA_NAME, strict: true, schema: suppliersSchema },
      },
    },
    { signal },
  );

  if (response.status !== "completed") {
    throw new AiError(`response not completed (status: ${response.status}, reason: ${response.incomplete_details?.reason})`);
  }
  const refused = response.output.some(
    (item) => item.type === "message" && item.content.some((part) => part.type === "refusal"),
  );
  if (refused) throw new AiError("model refused the request");

  let json: unknown;
  try {
    json = JSON.parse(response.output_text);
  } catch {
    throw new AiError("result is not valid JSON");
  }
  const parsed = AiOutputSchema.safeParse(json);
  if (!parsed.success) throw new AiError(`invalid result: ${parsed.error.message}`);

  return {
    output: parsed.data,
    allowedUrls: collectUrls(response),
    usage: {
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
      reasoningTokens: response.usage?.output_tokens_details?.reasoning_tokens ?? 0,
      webSearchCalls: response.output.filter((item) => item.type === "web_search_call").length,
    },
  };
}

// One retry when the model does not return a valid result (ARCHITECTURE 2.6).
export async function searchWithAi(country: Country, city: City, service: ServiceType): Promise<AiSearchResult> {
  const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  try {
    try {
      return await runOnce(country, city, service, signal);
    } catch (error) {
      if (!(error instanceof AiError)) throw error;
      console.warn(JSON.stringify({ event: "search_retry", reason: error.message }));
      return await runOnce(country, city, service, signal);
    }
  } catch (error) {
    if (signal.aborted || error instanceof OpenAI.APIConnectionTimeoutError) {
      throw new AiTimeoutError("search timed out");
    }
    if (error instanceof AiError) throw error;
    throw new AiError(error instanceof Error ? error.message : String(error));
  }
}
