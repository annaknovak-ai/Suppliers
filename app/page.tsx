"use client";

import { useTranslation } from "react-i18next";
import { SearchForm } from "@/src/ui/SearchForm";
import { SearchIllustration } from "@/src/ui/SearchIllustration";
import styles from "./page.module.css";

export default function SearchPage() {
  const { t } = useTranslation();

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
