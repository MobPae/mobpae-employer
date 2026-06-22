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

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="Close drawer backdrop" className="absolute inset-0 bg-[#191A2E]/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-[#E4E4EF] bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-[#E4E4EF] px-6 py-5">
          <div>
            <h2 className="text-[15px] font-[700] text-[#191A2E]">{title}</h2>
            {description ? <p className="mt-1 text-[12px] text-[#62657A]">{description}</p> : null}
          </div>
          <button className="grid h-8 w-8 place-items-center rounded-lg text-[#62657A] hover:bg-[#F0F0F8] hover:text-[#191A2E]" onClick={onClose} aria-label="Close drawer">
            <X size={16} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-soft">{children}</div>
      </aside>
    </div>
  );
}
