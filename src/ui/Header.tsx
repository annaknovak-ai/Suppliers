"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { BrandMark } from "./BrandMark";
import { LanguageSwitcher } from "./LanguageSwitcher";
import styles from "./Header.module.css";

const NAV_ITEMS = [
  { href: "/", key: "nav.search" },
  { href: "/saved", key: "nav.saved" },
] as const;

export function Header() {
  const { t } = useTranslation();
  const pathname = usePathname();

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
                href={item.href}
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
