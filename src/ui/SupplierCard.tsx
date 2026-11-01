"use client";

// Search result card (DESIGN 1.2) with the Save / Saved button (PRD FR7.1–FR7.2).
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Supplier } from "@/shared/schemas";
import { Banner } from "./Banner";
import { Button } from "./Button";
import { BookmarkIcon, CheckIcon } from "./icons";
import { SupplierDetails } from "./SupplierDetails";
import styles from "./SupplierCard.module.css";

export function SupplierCard({ supplier, onSave }: { supplier: Supplier; onSave: () => Promise<void> }) {
  const { t } = useTranslation();
  const [saveState, setSaveState] = useState<"idle" | "saving" | "error">("idle");

  async function handleSave() {
    setSaveState("saving");
    try {
      await onSave();
      setSaveState("idle");
    } catch {
      setSaveState("error");
    }
  }

  return (
    <article className={styles.card}>
      <header className={styles.top}>
        <h3 className={styles.name}>{supplier.name}</h3>
        <div className={styles.actions}>
          {!supplier.meetsAllCriteria && <span className={styles.partial}>{t("criteria.partial")}</span>}
          {supplier.savedId ? (
            <Button variant="saved" compact disabled icon={<CheckIcon size={16} />}>
              {t("supplier.saved")}
            </Button>
          ) : (
            <Button
              compact
              icon={<BookmarkIcon size={16} />}
              onClick={handleSave}
              disabled={saveState === "saving"}
              aria-busy={saveState === "saving"}
            >
              {t("supplier.save")}
            </Button>
          )}
        </div>
      </header>

      {saveState === "error" && <Banner variant="error" message={t("saved.saveError")} />}

      <SupplierDetails supplier={supplier} />
    </article>
  );
}
