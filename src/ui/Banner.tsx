import type { ReactNode } from "react";
import { InfoIcon } from "./icons";
import styles from "./Banner.module.css";

// Info banner (white, navy left bar) or error banner (Ink background) with an optional action.
export function Banner({
  variant,
  message,
  action,
}: {
  variant: "info" | "error";
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className={`${styles.banner} ${styles[variant]}`} role={variant === "error" ? "alert" : "status"}>
      {variant === "info" && <InfoIcon size={18} className={styles.icon} />}
      <p className={styles.message}>{message}</p>
      {action}
    </div>
  );
}
