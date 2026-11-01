"use client";

// City / service filter of the saved suppliers screen: same dependent fields as the search form, no submit button.
import { useTranslation } from "react-i18next";
import { COUNTRIES, SERVICES, getCitiesByCountry } from "@/shared/catalog";
import { useAppState } from "@/src/state/AppStateProvider";
import { Select } from "./Select";
import styles from "./SavedFilter.module.css";

export type SavedFilterValue = { countryId: string | null; cityId: string | null; serviceId: string | null };

// URL of the saved screen for a filter; the URL is the single source of the filter.
export function savedHref(filter: SavedFilterValue | null): string {
  const query = new URLSearchParams();
  if (filter?.countryId) query.set("country", filter.countryId);
  if (filter?.cityId) query.set("city", filter.cityId);
  if (filter?.serviceId) query.set("service", filter.serviceId);
  return query.size ? `/saved?${query}` : "/saved";
}

// onChange receives only the changed fields, so quick successive changes are never lost.
export function SavedFilter({
  value,
  onChange,
}: {
  value: SavedFilterValue;
  onChange: (patch: Partial<SavedFilterValue>) => void;
}) {
  const { t } = useTranslation();
  const { lang } = useAppState();
  const cities = value.countryId ? getCitiesByCountry(value.countryId) : [];

  return (
    <div className={styles.filter}>
      <Select
        id="saved-country"
        label={t("search.country.label")}
        placeholder={t("search.country.placeholder")}
        options={COUNTRIES.map((c) => ({ value: c.id, label: c.names[lang] }))}
        value={value.countryId}
        // Changing the country resets the city, as in the search form.
        onChange={(countryId) => onChange({ countryId, cityId: null })}
      />
      <Select
        id="saved-city"
        label={t("search.city.label")}
        placeholder={t("search.city.placeholder")}
        options={cities.map((c) => ({ value: c.id, label: c.names[lang] }))}
        value={value.cityId}
        disabled={!value.countryId}
        onChange={(cityId) => onChange({ cityId })}
      />
      <Select
        id="saved-service"
        label={t("search.service.label")}
        placeholder={t("search.service.placeholder")}
        options={SERVICES.map((s) => ({ value: s.id, label: s.names[lang] }))}
        value={value.serviceId}
        onChange={(serviceId) => onChange({ serviceId })}
      />
    </div>
  );
}
