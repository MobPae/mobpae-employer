import { Component, type ErrorInfo, type ReactNode } from "react";
import { RefreshCcw } from "lucide-react";
import { reportError } from "../utils/errorReporter";

interface Props {
  children: ReactNode;
  /** Compact variant for use inside an already-rendered layout (keeps sidebar/nav usable). */
  compact?: boolean;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, { componentStack: info.componentStack });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const content = (
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-muted bg-brand-soft">
          <img src="/logo-icon.svg" alt="" width="28" height="18" className="object-contain" />
        </div>
        <h1 className="text-lg font-bold tracking-tight text-ink">Something went wrong</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-3">
          {this.props.compact
            ? "This page hit an unexpected error. Try another page from the sidebar, or reload."
            : "Reloading usually fixes it — if it keeps happening, contact support."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mx-auto mt-6 flex h-10 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white shadow-brand transition-all hover:bg-brand-hover"
        >
          <RefreshCcw size={14} /> Reload page
        </button>
      </div>
    );

    if (this.props.compact) {
      return <div className="grid min-h-[60vh] place-items-center px-6">{content}</div>;
    }
    return <div className="grid min-h-screen place-items-center bg-canvas px-6">{content}</div>;
  }
}
