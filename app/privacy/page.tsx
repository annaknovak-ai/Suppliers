"use client";

// Public privacy policy (PRD FR6.6, DESIGN 1.5, ADR-13). Open without signing in; Google links to it from the consent screen.
import { useTranslation } from "react-i18next";
import styles from "./page.module.css";

const CONTACT_EMAIL = "novak.k.anna@gmail.com";
// Update together with the text whenever the data the app keeps changes.
const UPDATED = "14.11.2026";

const SECTIONS = ["account", "saved", "use", "search", "storage", "deletion"] as const;

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <main className={styles.main}>
      <article className={styles.article}>
        <header className={styles.intro}>
          <h1>{t("privacy.title")}</h1>
          <p className={styles.updated}>{t("privacy.updated", { date: UPDATED })}</p>
          <p>{t("privacy.intro")}</p>
        </header>

        {SECTIONS.map((id) => (
          <section key={id} className={styles.section}>
            <h3>{t(`privacy.sections.${id}.title`)}</h3>
            <p>{t(`privacy.sections.${id}.body`)}</p>
          </section>
        ))}

        <section className={styles.section}>
          <h3>{t("privacy.sections.contact.title")}</h3>
          <p>
            {t("privacy.sections.contact.body")} <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        </section>
      </article>
    </main>
  );
}
