"use client";

// Supplier details shared by the result card and the saved card (DESIGN 1.2, 1.3): description, criteria chips,
// facts, contacts and sources. Supplier data is shown as plain text in its source language.
import { useId, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CRITERIA_KEYS, type Source, type Supplier } from "@/shared/schemas";
import { safeHttpUrl, urlKey, websiteDomain } from "@/shared/normalize";
import { CriterionChip } from "./CriterionChip";
import { ExternalLinkIcon, GlobeIcon, MailIcon, PhoneIcon, PinIcon } from "./icons";
import styles from "./SupplierDetails.module.css";

const EXTERNAL = { target: "_blank", rel: "noopener noreferrer" } as const;

// Fields common to search results and saved suppliers.
export type DisplaySupplier = Omit<Supplier, "savedId">;

// All sources of the supplier: listed sources first, then criterion URLs not already listed.
function allSources(supplier: DisplaySupplier): Source[] {
  const seen = new Set<string>();
  const result: Source[] = [];
  const add = (url: string, title: string | null) => {
    const key = urlKey(url);
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push({ url, title });
  };
  supplier.sources.forEach((s) => add(s.url, s.title));
  CRITERIA_KEYS.forEach((k) => supplier.criteria[k].sourceUrls.forEach((url) => add(url, null)));
  return result;
}

function sourceLabel(source: Source): string {
  return source.title?.trim() || websiteDomain(source.url) || source.url;
}

// Rendered inside a flex column container that provides the vertical spacing.
export function SupplierDetails({ supplier }: { supplier: DisplaySupplier }) {
  const { t } = useTranslation();
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const sourcesId = useId();
  const na = t("supplier.notAvailable");

  const sources = allSources(supplier);
  const website = safeHttpUrl(supplier.website);
  const phoneHref = supplier.phone ? `tel:${supplier.phone.replace(/[^\d+]/g, "")}` : null;

  const clients =
    supplier.businessClientsCount !== null
      ? `${supplier.businessClientsCount}${supplier.businessClientExamples.length ? ` (${supplier.businessClientExamples.join(", ")})` : ""}`
      : supplier.businessClientExamples.length
        ? supplier.businessClientExamples.join(", ")
        : na;

  return (
    <>
      <p className={styles.description} title={supplier.description ?? undefined}>
        {supplier.description ?? na}
      </p>

      <ul className={styles.chips}>
        {CRITERIA_KEYS.map((key) => (
          <CriterionChip key={key} criterion={key} status={supplier.criteria[key].status} />
        ))}
      </ul>

      <p className={styles.facts}>
        <Fact label={t("supplier.regNumber")} value={supplier.registrationOrLicenseNumber ?? na} />
        <span aria-hidden="true"> · </span>
        <Fact label={t("supplier.yearsActive")} value={supplier.yearsActive?.toString() ?? na} />
        <span aria-hidden="true"> · </span>
        <Fact label={t("supplier.businessClients")} value={clients} />
      </p>

      <div className={styles.contacts}>
        <ul className={styles.contactList}>
          <Contact icon={<PhoneIcon size={14} />} label={t("supplier.phone")}>
            {phoneHref ? <a href={phoneHref}>{supplier.phone}</a> : na}
          </Contact>
          <Contact icon={<MailIcon size={14} />} label={t("supplier.email")}>
            {supplier.email ? <a href={`mailto:${supplier.email}`}>{supplier.email}</a> : na}
          </Contact>
          <Contact icon={<GlobeIcon size={14} />} label={t("supplier.website")}>
            {website ? (
              <a href={website} {...EXTERNAL}>
                {websiteDomain(website)}
              </a>
            ) : (
              na
            )}
          </Contact>
          <Contact icon={<PinIcon size={14} />} label={t("supplier.address")}>
            {supplier.address ?? na}
          </Contact>
        </ul>
        {sources.length > 0 ? (
          <button
            type="button"
            className={styles.sourcesToggle}
            aria-expanded={sourcesOpen}
            aria-controls={sourcesId}
            onClick={() => setSourcesOpen((open) => !open)}
          >
            {t("supplier.sourcesToggle", { n: sources.length })}
            <ExternalLinkIcon size={13} />
          </button>
        ) : (
          <span className={styles.sourcesEmpty}>{t("supplier.sourcesToggle", { n: 0 })}</span>
        )}
      </div>

      {sourcesOpen && (
        <div id={sourcesId} className={styles.sources}>
          <ol className={styles.sourceList}>
            {sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} {...EXTERNAL}>
                  {sourceLabel(source)}
                </a>
              </li>
            ))}
          </ol>
          <dl className={styles.criterionSources}>
            {CRITERIA_KEYS.map((key) => (
              <div key={key} className={styles.criterionRow}>
                <dt>{t(`criteria.${key}`)}:</dt>
                <dd>
                  {supplier.criteria[key].sourceUrls.length
                    ? supplier.criteria[key].sourceUrls.map((url, i) => (
                        <a key={url} href={url} {...EXTERNAL} title={url}>
                          {websiteDomain(url) ?? `[${i + 1}]`}
                        </a>
                      ))
                    : na}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <span>
      {label}: <strong>{value}</strong>
    </span>
  );
}

function Contact({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <li className={styles.contact}>
      {icon}
      <span className="visually-hidden">{label}: </span>
      <span className={styles.contactValue}>{children}</span>
    </li>
  );
}
