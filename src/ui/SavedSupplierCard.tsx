"use client";

// Saved supplier card (DESIGN 1.3): details on the left, status / note / delete on the right (PRD FR7.4–FR7.7).
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { getCity, getCountry, getService } from "@/shared/catalog";
import { NOTE_MAX_LENGTH, SAVED_STATUSES, type SavedStatus, type SavedSupplier } from "@/shared/schemas";
import { ApiRequestError, deleteSavedSupplier, updateSavedSupplier } from "@/src/services/api";
import { useAppState } from "@/src/state/AppStateProvider";
import { Banner } from "./Banner";
import { Button } from "./Button";
import { ConfirmDialog } from "./ConfirmDialog";
import { TrashIcon } from "./icons";
import { Select } from "./Select";
import { StatusChip } from "./StatusChip";
import { SupplierDetails } from "./SupplierDetails";
import cardStyles from "./SupplierCard.module.css";
import styles from "./SavedSupplierCard.module.css";

// DD.MM.YYYY in every interface language (DESIGN 2.2).
function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

type SavedSupplierCardProps = {
  item: SavedSupplier;
  onUpdated: (item: SavedSupplier) => void;
  onDeleted: (id: string) => void;
  // The supplier was deleted elsewhere while being edited: the list must be reloaded.
  onGone: () => void;
};

export function SavedSupplierCard({ item, onUpdated, onDeleted, onGone }: SavedSupplierCardProps) {
  const { t } = useTranslation();
  const { lang } = useAppState();
  const id = useId();

  const [status, setStatus] = useState<SavedStatus>(item.status);
  const [note, setNote] = useState(item.note);
  const [busy, setBusy] = useState<"status" | "note" | "delete" | null>(null);
  const [noteSaved, setNoteSaved] = useState(false);
  const [failed, setFailed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Runs one change; on failure the change is not shown as saved and the error message appears.
  async function update(kind: "status" | "note", patch: { status?: SavedStatus; note?: string }) {
    setBusy(kind);
    setFailed(false);
    try {
      const updated = await updateSavedSupplier(item.id, patch);
      onUpdated(updated);
      return true;
    } catch (e) {
      setFailed(true);
      if (e instanceof ApiRequestError && e.status === 404) onGone();
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function handleStatus(next: string | null) {
    if (!next || next === status) return;
    const previous = status;
    setStatus(next as SavedStatus);
    if (!(await update("status", { status: next as SavedStatus }))) setStatus(previous);
  }

  async function handleSaveNote() {
    setNoteSaved(false);
    if (await update("note", { note })) setNoteSaved(true);
  }

  async function handleDelete() {
    setBusy("delete");
    setFailed(false);
    try {
      await deleteSavedSupplier(item.id);
      setConfirmOpen(false);
      onDeleted(item.id);
    } catch {
      setConfirmOpen(false);
      setFailed(true);
      setBusy(null);
    }
  }

  const meta = [
    getCountry(item.countryId)?.names[lang],
    getCity(item.cityId)?.names[lang],
    getService(item.serviceId)?.names[lang],
    t("saved.savedAt", { date: formatDate(item.savedAt) }),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className={styles.card}>
      <div className={styles.details}>
        <header className={cardStyles.top}>
          <h3 className={cardStyles.name}>{item.name}</h3>
          {!item.meetsAllCriteria && <span className={cardStyles.partial}>{t("criteria.partial")}</span>}
        </header>
        <p className={styles.meta}>{meta}</p>
        {failed && <Banner variant="error" message={t("saved.saveError")} />}
        <SupplierDetails supplier={item} />
      </div>

      <div className={styles.edit}>
        <div className={styles.statusRow}>
          <Select
            id={`${id}-status`}
            label={t("saved.statusLabel")}
            className={styles.statusSelect}
            options={SAVED_STATUSES.map((s) => ({ value: s, label: t(`saved.status.${s}`) }))}
            value={status}
            disabled={busy === "status"}
            onChange={handleStatus}
          />
          <StatusChip status={status} />
        </div>

        <div className={styles.noteField}>
          <label htmlFor={`${id}-note`} className={styles.label}>
            {t("saved.noteLabel")}
          </label>
          <textarea
            id={`${id}-note`}
            className={styles.note}
            rows={3}
            maxLength={NOTE_MAX_LENGTH}
            placeholder={t("saved.notePlaceholder")}
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setNoteSaved(false);
            }}
            aria-describedby={`${id}-counter`}
          />
          <span id={`${id}-counter`} className={styles.counter}>
            {note.length} / {NOTE_MAX_LENGTH}
          </span>
        </div>

        <div className={styles.buttons}>
          <Button variant="secondary" compact onClick={handleSaveNote} disabled={busy === "note"} aria-busy={busy === "note"}>
            {t("saved.saveNote")}
          </Button>
          <Button variant="ghost" compact icon={<TrashIcon size={16} />} onClick={() => setConfirmOpen(true)}>
            {t("saved.delete")}
          </Button>
        </div>
        {noteSaved && (
          <p className={styles.noteSaved} role="status">
            {t("saved.noteSaved")}
          </p>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        question={t("saved.deleteConfirm")}
        cancelLabel={t("saved.cancel")}
        confirmLabel={t("saved.delete")}
        busy={busy === "delete"}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </article>
  );
}
