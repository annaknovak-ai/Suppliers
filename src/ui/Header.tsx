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

// Public pages show only the wordmark and the language switcher (DESIGN 1.0, 1.5).
const MINIMAL_HEADER_PATHS = ["/login", "/privacy"];

// userArea: the signed-in user's email and «Выйти», rendered on the server (app/_components/UserArea).
export function Header({ userArea }: { userArea?: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { form, search } = useAppState();

  // The saved screen opens filtered to the city and service chosen in the search (or of the last search).
  const selection = form.countryId && form.cityId && form.serviceId ? form : search.request;
  const hrefs: Record<string, string> = { "/": "/", "/saved": savedHref(selection) };
  const minimal = MINIMAL_HEADER_PATHS.includes(pathname);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.wordmark} lang="en">
          <BrandMark size={28} />
          <span className={styles.wordmarkText}>Supplier Finder</span>
        </Link>
        {!minimal && (
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
        )}
        <div className={styles.lang}>
          <LanguageSwitcher />
        </div>
        {!minimal && <div className={styles.user}>{userArea}</div>}
      </div>
    </header>
  );
}
