"use client";

// Results area of the search screen: heading, screen states and supplier cards (DESIGN 1.2).
import { useTranslation } from "react-i18next";
import { getCity, getService } from "@/shared/catalog";
import { useAppState } from "@/src/state/AppStateProvider";
import { Banner } from "./Banner";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";
import { ProgressBar } from "./ProgressBar";
import { SupplierCard } from "./SupplierCard";
import styles from "./ResultsView.module.css";

export function ResultsView() {
  const { t } = useTranslation();
  const { lang, search, retrySearch } = useAppState();
  const { status, request, response } = search;

  return (
    <section className={styles.results} aria-live="polite" aria-busy={status === "loading"}>
      {status === "loading" && (
        <div className={styles.loading}>
          <p>{t("search.loading")}</p>
          <ProgressBar label={t("search.loading")} />
        </div>
      )}

      {status === "error" && (
        <Banner
          variant="error"
          message={t("search.error")}
          action={
            <Button variant="secondary" onClick={retrySearch}>
              {t("search.retry")}
            </Button>
          }
        />
      )}

      {status === "success" && request && response && (
        <>
          <div className={styles.heading}>
            <h2>
              {t("results.heading", {
                service: getService(request.serviceId)?.names[lang],
                city: getCity(request.cityId)?.names[lang],
              })}
            </h2>
            <span className={styles.count}>{t("search.found", { n: response.suppliers.length })}</span>
          </div>

          {response.suppliers.length === 0 ? (
            <EmptyState message={t("search.notFound")} />
          ) : (
            <>
              {response.fewerThanFive && <Banner variant="info" message={t("search.fewerThanFive")} />}
              <ul className={styles.list}>
                {response.suppliers.map((supplier) => (
                  <li key={supplier.name}>
                    <SupplierCard supplier={supplier} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}
