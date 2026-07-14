import { createContext } from "react";

export interface ToastContextValue {
  notify: (toast: { type?: "success" | "error" | "info" | "warning"; title: string; description?: string }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);
