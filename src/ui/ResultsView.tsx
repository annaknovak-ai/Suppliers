"use client";

// Results area of the search screen: heading, screen states and supplier cards (DESIGN 1.2).
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getCity, getService } from "@/shared/catalog";
import { exportFileName } from "@/shared/exportFileName";
import type { SearchRequest, SearchResponse } from "@/shared/schemas";
import { exportSuppliers } from "@/src/services/api";
import { deliverFile } from "@/src/services/download";
import { useAppState } from "@/src/state/AppStateProvider";
import { Banner } from "./Banner";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";
import { DownloadIcon } from "./icons";
import { ProgressBar } from "./ProgressBar";
import { SupplierCard } from "./SupplierCard";
import styles from "./ResultsView.module.css";

export function ResultsView() {
  const { t } = useTranslation();
  const { search, retrySearch } = useAppState();
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

      {status === "success" && request && response && <Results request={request} response={response} />}
    </section>
  );
}

// Mounted only while results are shown, so the export state resets with every new search.
function Results({ request, response }: { request: SearchRequest; response: SearchResponse }) {
  const { t } = useTranslation();
  const { lang, saveResultSupplier } = useAppState();
  const [exportState, setExportState] = useState<"idle" | "exporting" | "error">("idle");

  async function handleExport() {
    setExportState("exporting");
    try {
      // Column headers follow the interface language at the moment of export (PRD FR4.4).
      const blob = await exportSuppliers({ search: request, response, uiLanguage: lang });
      await deliverFile(blob, exportFileName(request, response.searchedAt));
      setExportState("idle");
    } catch {
      setExportState("error");
    }
  }

  const hasSuppliers = response.suppliers.length > 0;

  return (
    <>
      <div className={styles.heading}>
        <div className={styles.title}>
          <h2>
            {t("results.heading", {
              service: getService(request.serviceId)?.names[lang],
              city: getCity(request.cityId)?.names[lang],
            })}
          </h2>
          <span className={styles.count}>{t("search.found", { n: response.suppliers.length })}</span>
        </div>
        {hasSuppliers && (
          <Button
            variant="secondary"
            icon={<DownloadIcon size={18} />}
            onClick={handleExport}
            disabled={exportState === "exporting"}
            aria-busy={exportState === "exporting"}
          >
            {t("search.export")}
          </Button>
        )}
      </div>

      {exportState === "error" && <Banner variant="error" message={t("search.exportError")} />}

      {!hasSuppliers ? (
        <EmptyState message={t("search.notFound")} />
      ) : (
        <>
          {response.fewerThanFive && <Banner variant="info" message={t("search.fewerThanFive")} />}
          <ul className={styles.list}>
            {response.suppliers.map((supplier, index) => (
              <li key={supplier.name}>
                <SupplierCard supplier={supplier} onSave={() => saveResultSupplier(index)} />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
