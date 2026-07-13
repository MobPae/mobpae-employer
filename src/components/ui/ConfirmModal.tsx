import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: "danger" | "primary";
  confirmClass?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  confirmVariant = "danger",
  confirmClass,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open || loading) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const confirmCls = confirmClass ?? (confirmVariant === "danger"
    ? "bg-danger text-white hover:bg-danger-dark"
    : "bg-brand text-white hover:bg-brand-hover");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onCancel} />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-edge bg-surface p-6 shadow-overlay"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-warning-soft">
            <AlertTriangle size={16} className="text-warning" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink leading-snug">{title}</h3>
            <p className="mt-1 text-xs text-ink-3 leading-relaxed">{description}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="h-8 rounded-lg border border-edge bg-surface px-4 text-xs font-medium text-ink-3 transition-colors hover:bg-surface-raised disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`h-8 rounded-lg px-4 text-xs font-semibold transition-colors disabled:opacity-50 ${confirmCls}`}
          >
            {loading ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
