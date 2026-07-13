import { type ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface DrawerProps {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}

export function Drawer({ open, title, description, children, onClose }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close drawer"
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-edge bg-surface shadow-overlay">
        <header className="flex items-start justify-between gap-4 border-b border-edge px-6 py-5">
          <div>
            <h2 className="text-[15px] font-bold text-ink">{title}</h2>
            {description && (
              <p className="mt-1 text-xs text-ink-3">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close drawer"
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-4 transition-colors hover:bg-surface-raised hover:text-ink"
          >
            <X size={16} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </aside>
    </div>
  );
}
