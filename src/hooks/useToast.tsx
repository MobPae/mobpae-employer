import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

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

interface ToastContextValue {
  notify: (toast: ToastInput) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const toastStyles: Record<ToastType, { icon: ReactNode; accent: string }> = {
  success: { icon: <CheckCircle2 size={18} />, accent: "text-[#7679FF]" },
  error: { icon: <XCircle size={18} />, accent: "text-rose-600" },
  info: { icon: <Info size={18} />, accent: "text-[#7679FF]" },
  warning: { icon: <TriangleAlert size={18} />, accent: "text-amber-600" }
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
      <div className="fixed right-4 top-4 z-[80] grid w-[calc(100vw-2rem)] max-w-sm gap-3">
        {toasts.map((toast) => {
          const style = toastStyles[toast.type];
          return (
            <div key={toast.id} className="rounded-lg border border-[#E4E4EF] bg-white p-4 shadow-xl shadow-[#191A2E]/10">
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 ${style.accent}`}>{style.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#191A2E]">{toast.title}</p>
                  {toast.description ? <p className="mt-1 text-sm text-[#62657A]">{toast.description}</p> : null}
                </div>
                <button className="rounded-md p-1 text-[#62657A] hover:bg-[#F7F7FB] hover:text-[#62657A]" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification">
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

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}
