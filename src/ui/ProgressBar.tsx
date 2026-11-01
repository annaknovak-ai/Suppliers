import styles from "./ProgressBar.module.css";

// Indeterminate progress bar (Style Guide: 6px, pill, Forest Green on Line).
export function ProgressBar({ label }: { label: string }) {
  return (
    <div className={styles.track} role="progressbar" aria-label={label}>
      <div className={styles.fill} />
    </div>
  );
}
