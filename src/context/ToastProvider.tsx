import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { ToastContext } from "./toast-context";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastInput {
  type?: ToastType;
  title: string;
  description?: string;
}

const toastStyles: Record<ToastType, { icon: ReactNode; accent: string }> = {
  success: { icon: <CheckCircle2 size={18} />, accent: "text-brand" },
  error: { icon: <XCircle size={18} />, accent: "text-rose-600" },
  info: { icon: <Info size={18} />, accent: "text-brand" },
  warning: { icon: <TriangleAlert size={18} />, accent: "text-warning" }
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (toast: ToastInput) => {
      const id = crypto.randomUUID();
      const nextToast = { id, type: toast.type ?? "info", title: toast.title, description: toast.description };
      setToasts((current) => [...current.slice(-3), nextToast]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      notify,
      success: (title: string, description?: string) => notify({ type: "success", title, description }),
      error: (title: string, description?: string) => notify({ type: "error", title, description })
    }),
    [notify]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="false"
        className="fixed right-4 top-4 z-[80] grid w-[calc(100vw-2rem)] max-w-sm gap-3"
      >
        {toasts.map((toast) => {
          const style = toastStyles[toast.type];
          return (
            <div key={toast.id} className="rounded-lg border border-edge bg-white p-4 shadow-xl shadow-[#191A2E]/10">
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 ${style.accent}`}>{style.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink">{toast.title}</p>
                  {toast.description ? <p className="mt-1 text-sm text-ink-3">{toast.description}</p> : null}
                </div>
                <button className="rounded-md p-1 text-ink-3 hover:bg-surface-raised hover:text-ink-3" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification">
                  <X size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
