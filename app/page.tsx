"use client";

import { useTranslation } from "react-i18next";
import { useAppState } from "@/src/state/AppStateProvider";
import { ResultsView } from "@/src/ui/ResultsView";
import { SearchForm } from "@/src/ui/SearchForm";
import { SearchIllustration } from "@/src/ui/SearchIllustration";
import styles from "./page.module.css";

export default function SearchPage() {
  const { t } = useTranslation();
  const { search } = useAppState();

  // After the first search the screen shows the search bar and the results (DESIGN 1.2).
  if (search.status !== "idle") {
    return (
      <main className={`${styles.main} ${styles.resultsMain}`}>
        <h1 className="visually-hidden">{t("search.title")}</h1>
        <SearchForm variant="bar" />
        <ResultsView />
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.intro}>
        <h1>{t("search.title")}</h1>
        <p className={styles.hint}>{t("search.hint")}</p>
      </div>
      <div className={styles.body}>
        <SearchForm />
        <SearchIllustration className={styles.illustration} />
      </div>
    </main>
  );
}
