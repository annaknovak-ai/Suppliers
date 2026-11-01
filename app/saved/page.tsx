"use client";

// "Сохранённые поставщики": the shared saved list, always loaded fresh from the server (ARCHITECTURE 2.3),
// shown only for the chosen city and service (PRD FR7.3). The choice lives in the URL, so it survives a refresh.
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getCity, getCountry, getService } from "@/shared/catalog";
import type { SavedSupplier } from "@/shared/schemas";
import { listSavedSuppliers } from "@/src/services/api";
import { Banner } from "@/src/ui/Banner";
import { Button } from "@/src/ui/Button";
import { EmptyState } from "@/src/ui/EmptyState";
import { ProgressBar } from "@/src/ui/ProgressBar";
import { SavedFilter, savedHref, type SavedFilterValue } from "@/src/ui/SavedFilter";
import { SavedSupplierCard } from "@/src/ui/SavedSupplierCard";
import styles from "./page.module.css";

type ListState = { status: "loading" } | { status: "error" } | { status: "ready"; items: SavedSupplier[] };

export default function SavedPage() {
  // The URL query is read on the client only, below this boundary.
  return (
    <Suspense>
      <SavedScreen />
    </Suspense>
  );
}

// Reads the filter from the URL, keeping only catalog values that fit together.
function filterFromParams(params: URLSearchParams): SavedFilterValue {
  const country = getCountry(params.get("country") ?? "");
  const city = getCity(params.get("city") ?? "");
  const service = getService(params.get("service") ?? "");
  return {
    countryId: country?.id ?? null,
    cityId: country && city?.countryId === country.id ? city.id : null,
    serviceId: service?.id ?? null,
  };
}

function SavedScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();

  // The URL holds the filter (the header link fills it from the search selection; a refresh keeps it).
  const filter = filterFromParams(new URLSearchParams(params.toString()));

  // Changes not yet reflected in the URL, so quick successive changes build on each other.
  const pending = useRef<SavedFilterValue | null>(null);
  useEffect(() => {
    pending.current = null;
  }, [params]);
  const changeFilter = useCallback(
    (patch: Partial<SavedFilterValue>) => {
      const next = { ...(pending.current ?? filterFromParams(new URLSearchParams(window.location.search))), ...patch };
      pending.current = next;
      router.replace(savedHref(next), { scroll: false });
    },
    [router],
  );

  const [list, setList] = useState<ListState>({ status: "loading" });
  // Shown after an edit of a supplier that was deleted elsewhere (the list is reloaded).
  const [goneError, setGoneError] = useState(false);

  // Bumped to load the list again; the list is fetched on every visit and every reload.
  const [loadId, setLoadId] = useState(0);

  useEffect(() => {
    let current = true;
    listSavedSuppliers()
      .then(({ items }) => current && setList({ status: "ready", items }))
      .catch(() => current && setList({ status: "error" }));
    return () => {
      current = false;
    };
  }, [loadId]);

  const reload = useCallback(() => {
    setList({ status: "loading" });
    setLoadId((n) => n + 1);
  }, []);

  function replaceItem(updated: SavedSupplier) {
    setList((current) =>
      current.status === "ready"
        ? { ...current, items: current.items.map((i) => (i.id === updated.id ? updated : i)) }
        : current,
    );
  }

  function removeItem(id: string) {
    setList((current) =>
      current.status === "ready" ? { ...current, items: current.items.filter((i) => i.id !== id) } : current,
    );
  }

  const chosen = Boolean(filter.cityId && filter.serviceId);
  const shown =
    list.status === "ready" && chosen
      ? list.items.filter((i) => i.cityId === filter.cityId && i.serviceId === filter.serviceId)
      : [];

  return (
    <main className={styles.main}>
      <div className={styles.heading}>
        <h2>{t("saved.title")}</h2>
        {list.status === "ready" && chosen && <span className={styles.count}>{t("saved.total", { n: shown.length })}</span>}
      </div>

      <SavedFilter value={filter} onChange={changeFilter} />

      <div className={styles.body} aria-live="polite" aria-busy={list.status === "loading"}>
        {list.status === "loading" && <ProgressBar label={t("saved.title")} />}

        {list.status === "error" && (
          <Banner
            variant="error"
            message={t("saved.loadError")}
            action={
              <Button variant="secondary" onClick={reload}>
                {t("saved.retry")}
              </Button>
            }
          />
        )}

        {goneError && list.status !== "error" && <Banner variant="error" message={t("saved.saveError")} />}

        {list.status === "ready" &&
          (!chosen ? (
            <EmptyState message={t("saved.choose")} />
          ) : shown.length === 0 ? (
            <EmptyState message={t("saved.empty")} />
          ) : (
            <ul className={styles.list}>
              {shown.map((item) => (
                <li key={item.id}>
                  <SavedSupplierCard
                    item={item}
                    onUpdated={(updated) => {
                      setGoneError(false);
                      replaceItem(updated);
                    }}
                    onDeleted={removeItem}
                    onGone={() => {
                      setGoneError(true);
                      reload();
                    }}
                  />
                </li>
              ))}
            </ul>
          ))}
      </div>
    </main>
  );
}
