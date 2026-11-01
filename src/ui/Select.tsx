// Native <select> styled per the Style Guide (ADR-3), with a label above it.
import { ChevronIcon } from "./icons";
import styles from "./Select.module.css";

type Option = { value: string; label: string };

type SelectProps = {
  id: string;
  label: string;
  placeholder: string;
  options: Option[];
  value: string | null;
  disabled?: boolean;
  onChange: (value: string | null) => void;
};

export function Select({ id, label, placeholder, options, value, disabled, onChange }: SelectProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.control}>
        <select
          id={id}
          className={styles.select}
          value={value ?? ""}
          disabled={disabled}
          data-empty={value ? undefined : ""}
          onChange={(e) => onChange(e.target.value || null)}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronIcon size={18} className={styles.chevron} />
      </div>
    </div>
  );
}
