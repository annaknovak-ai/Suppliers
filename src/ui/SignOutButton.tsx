"use client";

import { useTranslation } from "react-i18next";
import { clearSearch } from "@/src/state/browserMemory";
import { Button } from "./Button";

// «Выйти»: forgets the last search, then posts to /auth/logout. The full page navigation also resets the in-memory state.
export function SignOutButton({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <form method="post" action="/auth/logout" onSubmit={clearSearch} className={className}>
      <Button type="submit" variant="ghost" compact>
        {t("auth.signOut")}
      </Button>
    </form>
  );
}
