// JSON Schema of the structured search result (strict mode: every field required, no extra fields).
import "server-only";

const nullableString = { type: ["string", "null"] } as const;
const nullableInteger = { type: ["integer", "null"] } as const;

const criterion = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["met", "not_met", "not_verified"] },
    sourceUrls: { type: "array", items: { type: "string" } },
  },
  required: ["status", "sourceUrls"],
  additionalProperties: false,
} as const;

const supplier = {
  type: "object",
  properties: {
    name: { type: "string" },
    description: nullableString,
    address: nullableString,
    phone: nullableString,
    email: nullableString,
    website: nullableString,
    criteria: {
      type: "object",
      properties: {
        registration: criterion,
        yearsActive: criterion,
        businessClients: criterion,
      },
      required: ["registration", "yearsActive", "businessClients"],
      additionalProperties: false,
    },
    registrationOrLicenseNumber: nullableString,
    yearsActive: nullableInteger,
    businessClientsCount: nullableInteger,
    businessClientExamples: { type: "array", items: { type: "string" } },
    sources: {
      type: "array",
      items: {
        type: "object",
        properties: { url: { type: "string" }, title: nullableString },
        required: ["url", "title"],
        additionalProperties: false,
      },
    },
  },
  required: [
    "name",
    "description",
    "address",
    "phone",
    "email",
    "website",
    "criteria",
    "registrationOrLicenseNumber",
    "yearsActive",
    "businessClientsCount",
    "businessClientExamples",
    "sources",
  ],
  additionalProperties: false,
} as const;

export const SUPPLIERS_SCHEMA_NAME = "suppliers";

export const suppliersSchema = {
  type: "object",
  properties: { suppliers: { type: "array", items: supplier } },
  required: ["suppliers"],
  additionalProperties: false,
};
