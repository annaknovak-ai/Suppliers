import { BrandMark } from "./BrandMark";
import styles from "./EmptyState.module.css";

export function EmptyState({ message }: { message: string }) {
  return (
    <div className={styles.card}>
      <BrandMark size={64} />
      <p className={styles.message}>{message}</p>
    </div>
  );
}
