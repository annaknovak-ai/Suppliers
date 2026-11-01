"use client";

// Search form: a card with labelled fields on the start screen, a horizontal bar above the results.
import { useTranslation } from "react-i18next";
import { COUNTRIES, SERVICES, getCitiesByCountry } from "@/shared/catalog";
import { useAppState } from "@/src/state/AppStateProvider";
import { Button } from "./Button";
import { SearchIcon } from "./icons";
import { Select } from "./Select";
import styles from "./SearchForm.module.css";

export function SearchForm({ variant = "card" }: { variant?: "card" | "bar" }) {
  const { t } = useTranslation();
  const { lang, form, setCountry, setCity, setService, runSearch } = useAppState();

  const cities = form.countryId ? getCitiesByCountry(form.countryId) : [];
  const isBar = variant === "bar";

  return (
    <form
      className={isBar ? styles.bar : styles.card}
      aria-label={isBar ? t("search.barLabel") : undefined}
      onSubmit={(e) => {
        e.preventDefault();
        if (form.countryId && form.cityId && form.serviceId) {
          runSearch({ countryId: form.countryId, cityId: form.cityId, serviceId: form.serviceId });
        }
      }}
    >
      <Select
        id={`${variant}-country`}
        label={t("search.country.label")}
        labelHidden={isBar}
        placeholder={t("search.country.placeholder")}
        options={COUNTRIES.map((c) => ({ value: c.id, label: c.names[lang] }))}
        value={form.countryId}
        onChange={setCountry}
      />
      <Select
        id={`${variant}-city`}
        label={t("search.city.label")}
        labelHidden={isBar}
        placeholder={t("search.city.placeholder")}
        options={cities.map((c) => ({ value: c.id, label: c.names[lang] }))}
        value={form.cityId}
        disabled={!form.countryId}
        onChange={setCity}
      />
      <Select
        id={`${variant}-service`}
        label={t("search.service.label")}
        labelHidden={isBar}
        className={isBar ? styles.serviceField : undefined}
        placeholder={t("search.service.placeholder")}
        options={SERVICES.map((s) => ({ value: s.id, label: s.names[lang] }))}
        value={form.serviceId}
        onChange={setService}
      />
      <Button
        type="submit"
        fullWidth={!isBar}
        disabled={!(form.countryId && form.cityId && form.serviceId)}
        icon={<SearchIcon size={16} />}
        className={isBar ? styles.barSubmit : styles.submit}
      >
        {t("search.submit")}
      </Button>
    </form>
  );
}
