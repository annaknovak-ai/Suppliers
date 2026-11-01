// Zod schemas and types shared by the client and the server (ARCHITECTURE 2.5).
import { z } from "zod";

const text = (max: number) => z.string().max(max);
const nullableText = (max: number) => text(max).nullable();

export const SearchRequestSchema = z.object({
  countryId: text(10),
  cityId: text(40),
  serviceId: text(40),
});
export type SearchRequest = z.infer<typeof SearchRequestSchema>;

export const CRITERION_STATUSES = ["met", "not_met", "not_verified"] as const;
export type CriterionStatus = (typeof CRITERION_STATUSES)[number];

export const CriterionResultSchema = z.object({
  status: z.enum(CRITERION_STATUSES),
  sourceUrls: z.array(text(2000)).max(20),
});
export type CriterionResult = z.infer<typeof CriterionResultSchema>;

export const SourceSchema = z.object({
  url: text(2000),
  title: nullableText(500),
});
export type Source = z.infer<typeof SourceSchema>;

export const CRITERIA_KEYS = ["registration", "yearsActive", "businessClients"] as const;
export type CriterionKey = (typeof CRITERIA_KEYS)[number];

// Supplier as returned by the AI (no server-computed fields).
export const AiSupplierSchema = z.object({
  name: text(300).min(1),
  description: nullableText(2000),
  address: nullableText(500),
  phone: nullableText(100),
  email: nullableText(200),
  website: nullableText(2000),
  criteria: z.object({
    registration: CriterionResultSchema,
    yearsActive: CriterionResultSchema,
    businessClients: CriterionResultSchema,
  }),
  registrationOrLicenseNumber: nullableText(200),
  yearsActive: z.number().int().min(0).max(500).nullable(),
  businessClientsCount: z.number().int().min(0).max(1_000_000).nullable(),
  businessClientExamples: z.array(text(300)).max(20),
  sources: z.array(SourceSchema).max(30),
});
export type AiSupplier = z.infer<typeof AiSupplierSchema>;

export const AiOutputSchema = z.object({
  suppliers: z.array(AiSupplierSchema).max(12),
});
export type AiOutput = z.infer<typeof AiOutputSchema>;

export const SupplierSchema = AiSupplierSchema.extend({
  meetsAllCriteria: z.boolean(),
  savedId: z.string().nullable(),
});
export type Supplier = z.infer<typeof SupplierSchema>;

export const SearchResponseSchema = z.object({
  suppliers: z.array(SupplierSchema).max(5),
  fewerThanFive: z.boolean(),
  searchedAt: z.iso.datetime(),
});
export type SearchResponse = z.infer<typeof SearchResponseSchema>;

export type ApiError = { error: { code: string } };
