// Excel export file name, shared by the server (Content-Disposition) and the client (download name) (ARCHITECTURE 2.7).
import type { SearchRequest } from "./schemas";

export const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// suppliers_<country>_<city>_<service>_<YYYY-MM-DD>.xlsx, using the Latin catalog ids.
export function exportFileName(search: SearchRequest, searchedAt: string): string {
  return `suppliers_${search.countryId}_${search.cityId}_${search.serviceId}_${searchedAt.slice(0, 10)}.xlsx`;
}
