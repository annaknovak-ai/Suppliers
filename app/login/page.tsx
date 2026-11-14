"use client";

// "Вход": the only screen a signed-out user sees (PRD Flow 6, DESIGN 1.0).
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { safeNext } from "@/shared/safeNext";
import { Banner } from "@/src/ui/Banner";
import { BrandMark } from "@/src/ui/BrandMark";
import { ButtonLink } from "@/src/ui/Button";
import { GoogleIcon } from "@/src/ui/icons";
import { SearchIllustration } from "@/src/ui/SearchIllustration";
import styles from "./page.module.css";

export default function LoginPage() {
  // The URL query is read on the client only, below this boundary.
  return (
    <Suspense>
      <LoginScreen />
    </Suspense>
  );
}

function LoginScreen() {
  const { t } = useTranslation();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const failed = params.get("error") === "1";

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <BrandMark size={56} />
        <h1 className={styles.title} lang="en">
          Supplier Finder
        </h1>
        <p className={styles.hint}>{t("login.hint")}</p>
        {failed && <Banner variant="error" message={t("login.error")} />}
        {/* A full navigation: /auth/login is a route handler that redirects to Google. */}
        <ButtonLink href={`/auth/login?next=${encodeURIComponent(next)}`} fullWidth icon={<GoogleIcon size={18} />}>
          {t("login.button")}
        </ButtonLink>
        <Link href="/privacy" className={styles.privacy}>
          {t("privacy.title")}
        </Link>
      </div>
      <SearchIllustration className={styles.illustration} />
    </main>
  );
}
