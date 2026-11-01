"use client";

import { useTranslation } from "react-i18next";
import { LANGS } from "@/shared/catalog";
import { useAppState } from "@/src/state/AppStateProvider";
import styles from "./LanguageSwitcher.module.css";

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const { lang, setLang } = useAppState();

  return (
    <div role="group" aria-label={t("language.switcherLabel")} className={styles.group}>
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={l === lang}
          className={styles.option}
          onClick={() => setLang(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
