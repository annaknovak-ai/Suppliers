import { useTranslation } from "react-i18next";
import type { SavedStatus } from "@/shared/schemas";
import styles from "./StatusChip.module.css";

// Saved-supplier status chip (DESIGN 2.3); the status text is always shown, not only the color.
export function StatusChip({ status }: { status: SavedStatus }) {
  const { t } = useTranslation();
  return <span className={`${styles.chip} ${styles[status]}`}>{t(`saved.status.${status}`)}</span>;
}
