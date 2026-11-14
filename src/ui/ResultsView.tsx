"use client";

// Results area of the search screen: heading, screen states and supplier cards (DESIGN 1.2).
import { useEffect, useState } from "react";
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
import { formatDate } from "./formatDate";
import { DownloadIcon, SearchIcon } from "./icons";
import { ProgressBar } from "./ProgressBar";
import { SupplierCard } from "./SupplierCard";
import styles from "./ResultsView.module.css";

export function ResultsView() {
  const { t } = useTranslation();
  const { search, retrySearch } = useAppState();
  const { status, request, response, refresh } = search;

  return (
    <section className={styles.results} aria-live="polite" aria-busy={status === "loading"}>
      {status === "loading" && (
        <SearchProgress
          key={`${request?.cityId}-${request?.serviceId}-${refresh}`}
          delayMs={refresh ? 0 : LOADING_DELAY_MS}
        />
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

const STAGE_KEYS = ["search.stages.sources", "search.stages.criteria", "search.stages.results"];
// When each later stage is shown. The search is one long call with no progress signal,
// so these follow its typical course (35-52 seconds measured), not live events.
const STAGE_STARTS_MS = [15_000, 35_000];

// A saved result usually arrives well within this time and is shown without the loading state (DESIGN 1.2);
// "Search again" always searches the web, so it shows the loading state at once.
const LOADING_DELAY_MS = 800;

function SearchProgress({ delayMs }: { delayMs: number }) {
  const { t } = useTranslation();
  const [stage, setStage] = useState(0);
  const [visible, setVisible] = useState(delayMs === 0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setVisible(true), delayMs),
      ...STAGE_STARTS_MS.map((ms, i) => setTimeout(() => setStage(i + 1), ms)),
    ];
    return () => timers.forEach(clearTimeout);
  }, [delayMs]);

  if (!visible) return null;

  return (
    <div className={styles.loading}>
      <p>{t("search.loading")}</p>
      <ProgressBar label={t("search.loading")} />
      <div>
        <p>{t(STAGE_KEYS[stage])}</p>
        <p className={styles.duration}>{t("search.stages.duration")}</p>
      </div>
    </div>
  );
}

// Mounted only while results are shown, so the export state resets with every new search.
function Results({ request, response }: { request: SearchRequest; response: SearchResponse }) {
  const { t } = useTranslation();
  const { lang, saveResultSupplier, refreshSearch } = useAppState();
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

      <div className={styles.searchedAt}>
        <span className={styles.date}>{t("results.searchedAt", { date: formatDate(response.searchedAt) })}</span>
        <Button variant="ghost" compact icon={<SearchIcon size={16} />} onClick={refreshSearch}>
          {t("results.searchAgain")}
        </Button>
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
