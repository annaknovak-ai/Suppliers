// Builds the Excel workbooks: search results (PRD F4) and the saved list of one city and service (PRD F7).
// Parameters on top, then one row per supplier (ARCHITECTURE 2.7).
import "server-only";
import ExcelJS from "exceljs";
import { getCity, getCountry, getService, type Lang } from "@/shared/catalog";
import en from "@/shared/i18n/en.json";
import ru from "@/shared/i18n/ru.json";
import uk from "@/shared/i18n/uk.json";
import { safeHttpUrl, urlKey } from "@/shared/normalize";
import type { ExportRequest, SavedSupplier, SearchRequest, Supplier } from "@/shared/schemas";

const TEXTS = { ru, en, uk };

type Texts = typeof ru;
type CellValue = string | number | { text: string; hyperlink: string };
type ColumnKey = keyof Texts["excel"]["columns"];
type ExportedSupplier = Omit<Supplier, "savedId">;

// Column order and widths; header labels come from the "excel.columns" translations.
const COLUMNS: { key: ColumnKey; width: number }[] = [
  { key: "name", width: 28 },
  { key: "description", width: 45 },
  { key: "phone", width: 18 },
  { key: "email", width: 26 },
  { key: "website", width: 30 },
  { key: "address", width: 35 },
  { key: "regNumber", width: 20 },
  { key: "yearsActive", width: 12 },
  { key: "businessClientsCount", width: 14 },
  { key: "businessClientExamples", width: 35 },
  { key: "registration", width: 18 },
  { key: "yearsActiveCriterion", width: 18 },
  { key: "businessClientsCriterion", width: 18 },
  { key: "meetsAll", width: 16 },
  { key: "sources", width: 60 },
];

// Extra columns of the saved list export.
const SAVED_COLUMNS: { key: ColumnKey; width: number }[] = [
  { key: "status", width: 16 },
  { key: "note", width: 45 },
  { key: "savedAt", width: 14 },
];

// All source URLs of a supplier (general and per criterion), http(s) only, without duplicates.
function supplierSourceUrls(supplier: ExportedSupplier): string[] {
  const all = [
    ...supplier.sources.map((s) => s.url),
    ...Object.values(supplier.criteria).flatMap((c) => c.sourceUrls),
  ];
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const url of all) {
    const key = urlKey(url);
    const safe = safeHttpUrl(url);
    if (!key || !safe || seen.has(key)) continue;
    seen.add(key);
    urls.push(safe);
  }
  return urls;
}

function supplierRow(supplier: ExportedSupplier, t: Texts): CellValue[] {
  const na = t.supplier.notAvailable;
  const orNa = (value: string | number | null) => (value === null || value === "" ? na : value);
  const website = safeHttpUrl(supplier.website);
  const sources = supplierSourceUrls(supplier);
  return [
    supplier.name,
    orNa(supplier.description),
    orNa(supplier.phone),
    orNa(supplier.email),
    website ? { text: supplier.website!, hyperlink: website } : orNa(supplier.website),
    orNa(supplier.address),
    orNa(supplier.registrationOrLicenseNumber),
    orNa(supplier.yearsActive),
    orNa(supplier.businessClientsCount),
    orNa(supplier.businessClientExamples.join("; ")),
    t.criteria.status[supplier.criteria.registration.status],
    t.criteria.status[supplier.criteria.yearsActive.status],
    t.criteria.status[supplier.criteria.businessClients.status],
    supplier.meetsAllCriteria ? t.excel.yes : t.excel.no,
    sources.length > 0 ? sources.join("\n") : na,
  ];
}

type WorkbookSpec = {
  lang: Lang;
  search: SearchRequest;
  dateLabel: string;
  date: string;
  columns: { key: ColumnKey; width: number }[];
  rows: CellValue[][];
};

async function buildWorkbook({ lang, search, dateLabel, date, columns, rows }: WorkbookSpec): Promise<Buffer> {
  const t = TEXTS[lang];
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(t.app.name);

  sheet.addRow([t.excel.country, getCountry(search.countryId)?.names[lang] ?? search.countryId]);
  sheet.addRow([t.excel.city, getCity(search.cityId)?.names[lang] ?? search.cityId]);
  sheet.addRow([t.excel.service, getService(search.serviceId)?.names[lang] ?? search.serviceId]);
  sheet.addRow([dateLabel, date]);
  for (let i = 1; i <= 4; i++) sheet.getCell(i, 1).font = { bold: true };
  sheet.addRow([]);

  const header = sheet.addRow(columns.map((c) => t.excel.columns[c.key]));
  header.font = { bold: true };
  header.alignment = { vertical: "top", wrapText: true };
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8EEF5" } };
  });
  sheet.views = [{ state: "frozen", ySplit: header.number }];

  for (const values of rows) {
    const row = sheet.addRow(values);
    row.alignment = { vertical: "top", wrapText: true };
  }

  columns.forEach((c, i) => {
    sheet.getColumn(i + 1).width = c.width;
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export function buildSuppliersWorkbook({ search, response, uiLanguage }: ExportRequest): Promise<Buffer> {
  const t = TEXTS[uiLanguage];
  return buildWorkbook({
    lang: uiLanguage,
    search,
    dateLabel: t.excel.searchDate,
    date: response.searchedAt.slice(0, 10),
    columns: COLUMNS,
    rows: response.suppliers.map((s) => supplierRow(s, t)),
  });
}

// Saved suppliers of one city and service, with status, note and save date (PRD FR7.10).
export function buildSavedSuppliersWorkbook(
  search: SearchRequest,
  items: SavedSupplier[],
  lang: Lang,
  exportedAt: string,
): Promise<Buffer> {
  const t = TEXTS[lang];
  return buildWorkbook({
    lang,
    search,
    dateLabel: t.excel.exportDate,
    date: exportedAt.slice(0, 10),
    columns: [...COLUMNS, ...SAVED_COLUMNS],
    rows: items.map((item) => [
      ...supplierRow(item, t),
      t.saved.status[item.status],
      item.note || "",
      item.savedAt.slice(0, 10),
    ]),
  });
}
