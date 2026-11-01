"use client";

// Modal confirmation dialog (DESIGN 2.3, ARCHITECTURE 2.11): native <dialog>, focus starts on Cancel, Escape cancels.
import { useEffect, useId, useRef } from "react";
import { Button } from "./Button";
import { TrashIcon } from "./icons";
import styles from "./ConfirmDialog.module.css";

type ConfirmDialogProps = {
  open: boolean;
  question: string;
  cancelLabel: string;
  confirmLabel: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({ open, question, cancelLabel, confirmLabel, busy, onCancel, onConfirm }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const questionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={questionId}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <p id={questionId} className={styles.question}>
        {question}
      </p>
      <div className={styles.buttons}>
        <Button variant="secondary" autoFocus onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant="destructive" icon={<TrashIcon size={16} />} onClick={onConfirm} disabled={busy} aria-busy={busy}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
