import { useTranslation } from "react-i18next";
import type { CriterionKey, CriterionStatus } from "@/shared/schemas";
import { CheckIcon, CrossIcon, QuestionIcon } from "./icons";
import styles from "./CriterionChip.module.css";

const ICONS = { met: CheckIcon, not_met: CrossIcon, not_verified: QuestionIcon };

// Threshold criterion chip; the status is conveyed by icon, style and accessible text.
export function CriterionChip({ criterion, status }: { criterion: CriterionKey; status: CriterionStatus }) {
  const { t } = useTranslation();
  const Icon = ICONS[status];
  const name = t(`criteria.${criterion}`);
  const statusText = t(`criteria.status.${status}`);

  return (
    <li className={`${styles.chip} ${styles[status]}`} title={statusText}>
      <Icon size={13} />
      <span aria-hidden="true">{name}</span>
      <span className="visually-hidden">{t("criteria.chipLabel", { name, status: statusText })}</span>
    </li>
  );
}
