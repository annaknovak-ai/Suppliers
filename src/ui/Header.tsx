"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAppState } from "@/src/state/AppStateProvider";
import { BrandMark } from "./BrandMark";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { savedHref } from "./SavedFilter";
import styles from "./Header.module.css";

const NAV_ITEMS = [
  { href: "/", key: "nav.search" },
  { href: "/saved", key: "nav.saved" },
] as const;

export function Header() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { form, search } = useAppState();

  // The saved screen opens filtered to the city and service chosen in the search (or of the last search).
  const selection = form.countryId && form.cityId && form.serviceId ? form : search.request;
  const hrefs: Record<string, string> = { "/": "/", "/saved": savedHref(selection) };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.wordmark} lang="en">
          <BrandMark size={28} />
          <span className={styles.wordmarkText}>Supplier Finder</span>
        </Link>
        <nav aria-label={t("nav.label")} className={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={hrefs[item.href]}
                className={styles.navLink}
                aria-current={active ? "page" : undefined}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>
        <div className={styles.lang}>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
