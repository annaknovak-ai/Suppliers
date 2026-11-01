"use client";

import { useTranslation } from "react-i18next";
import { EmptyState } from "@/src/ui/EmptyState";
import styles from "./page.module.css";

export default function SavedPage() {
  const { t } = useTranslation();

  return (
    <main className={styles.main}>
      <h2 className={styles.title}>{t("saved.title")}</h2>
      <EmptyState message={t("saved.empty")} />
    </main>
  );
}
