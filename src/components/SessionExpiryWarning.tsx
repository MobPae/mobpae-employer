import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSessionExpiry } from "../hooks/useSessionExpiry";

export function SessionExpiryWarning() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { secondsLeft, staySignedIn } = useSessionExpiry(isAuthenticated);
  const [refreshing, setRefreshing] = useState(false);

  const signOutNow = () => { void logout(); navigate("/login", { replace: true }); };

  // Countdown hit zero without the user acting — end the session proactively
  // instead of leaving a stale, about-to-401 UI sitting on screen.
  useEffect(() => {
    if (secondsLeft === 0) signOutNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  if (secondsLeft === null || secondsLeft <= 0) return null;

  const handleStay = async () => {
    setRefreshing(true);
    const ok = await staySignedIn();
    setRefreshing(false);
    if (!ok) signOutNow();
  };

  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-edge bg-surface p-6 shadow-overlay"
        role="alertdialog"
        aria-modal="true"
        aria-label="Session expiring"
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-warning-soft">
            <Clock size={16} className="text-warning" />
          </div>
          <div>
            <h3 className="text-sm font-bold leading-snug text-ink">Your session is about to expire</h3>
            <p className="mt-1 text-xs leading-relaxed text-ink-3">
              You'll be signed out in{" "}
              <span className="font-semibold tabular-nums text-ink">{mm}:{ss}</span>.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={signOutNow}
            className="h-8 rounded-lg border border-edge bg-surface px-4 text-xs font-medium text-ink-3 transition-colors hover:bg-surface-raised"
          >
            Sign out now
          </button>
          <button
            onClick={() => void handleStay()}
            disabled={refreshing}
            className="h-8 rounded-lg bg-brand px-4 text-xs font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-50"
          >
            {refreshing ? "Please wait…" : "Stay signed in"}
          </button>
        </div>
      </div>
    </div>
  );
}
