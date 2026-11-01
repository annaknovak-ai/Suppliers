"use client";

import { useTranslation } from "react-i18next";
import { COUNTRIES, SERVICES, getCitiesByCountry } from "@/shared/catalog";
import { useAppState } from "@/src/state/AppStateProvider";
import { Button } from "./Button";
import { SearchIcon } from "./icons";
import { Select } from "./Select";
import styles from "./SearchForm.module.css";

export function SearchForm() {
  const { t } = useTranslation();
  const { lang, form, setCountry, setCity, setService } = useAppState();

  const cities = form.countryId ? getCitiesByCountry(form.countryId) : [];
  const isComplete = Boolean(form.countryId && form.cityId && form.serviceId);

  return (
    <form
      className={styles.card}
      onSubmit={(e) => {
        // The search request is wired up in Milestone 2.
        e.preventDefault();
      }}
    >
      <Select
        id="country"
        label={t("search.country.label")}
        placeholder={t("search.country.placeholder")}
        options={COUNTRIES.map((c) => ({ value: c.id, label: c.names[lang] }))}
        value={form.countryId}
        onChange={setCountry}
      />
      <Select
        id="city"
        label={t("search.city.label")}
        placeholder={t("search.city.placeholder")}
        options={cities.map((c) => ({ value: c.id, label: c.names[lang] }))}
        value={form.cityId}
        disabled={!form.countryId}
        onChange={setCity}
      />
      <Select
        id="service"
        label={t("search.service.label")}
        placeholder={t("search.service.placeholder")}
        options={SERVICES.map((s) => ({ value: s.id, label: s.names[lang] }))}
        value={form.serviceId}
        onChange={setService}
      />
      <Button
        type="submit"
        fullWidth
        disabled={!isComplete}
        icon={<SearchIcon size={16} />}
        className={styles.submit}
      >
        {t("search.submit")}
      </Button>
    </form>
  );
}
