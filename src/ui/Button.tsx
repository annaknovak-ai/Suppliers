import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "saved" | "ghost" | "destructive";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  compact?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
};

export function Button({
  variant = "primary",
  compact = false,
  fullWidth = false,
  icon,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const classes = [
    styles.button,
    styles[variant],
    compact ? styles.compact : "",
    fullWidth ? styles.fullWidth : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} {...rest}>
      {icon}
      <span>{children}</span>
    </button>
  );
}
