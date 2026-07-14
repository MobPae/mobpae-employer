import { ArrowLeft, SearchX } from "lucide-react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-muted text-ink-3">
          <SearchX size={24} strokeWidth={1.75} />
        </div>
        <h1 className="text-lg font-bold tracking-tight text-ink">Page not found</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-3">
          The page you're looking for doesn't exist or may have moved.
        </p>
        <Link
          to="/dashboard"
          className="mx-auto mt-6 flex h-10 w-fit items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white shadow-brand transition-all hover:bg-brand-hover"
        >
          <ArrowLeft size={14} /> Back to dashboard
        </Link>
      </div>
    </div>
  );
}
