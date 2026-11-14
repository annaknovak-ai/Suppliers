import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
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

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant;
  fullWidth?: boolean;
  icon?: ReactNode;
};

// A plain <a> styled as a button, for actions that must navigate the whole page (e.g. to a route handler).
export function ButtonLink({ variant = "primary", fullWidth = false, icon, className, children, ...rest }: ButtonLinkProps) {
  const classes = [styles.button, styles.link, styles[variant], fullWidth ? styles.fullWidth : "", className ?? ""]
    .filter(Boolean)
    .join(" ");
  return (
    <a className={classes} {...rest}>
      {icon}
      <span>{children}</span>
    </a>
  );
}
