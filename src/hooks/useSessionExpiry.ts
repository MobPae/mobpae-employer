import { useCallback, useEffect, useState } from "react";
import { tryRefreshSession } from "../services/http-client";
import { tokenStore } from "../services/token-store";
import { getJwtExpiryMs } from "../utils/jwt";

const WARNING_LEAD_MS = 2 * 60 * 1000; // start warning 2 minutes before the access token expires

/** `secondsLeft` is null outside the warning window, and counts down once inside it. */
export function useSessionExpiry(isAuthenticated: boolean) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [armToken, setArmToken] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    let warnTimer: ReturnType<typeof setTimeout> | undefined;
    let tickTimer: ReturnType<typeof setInterval> | undefined;

    const startCountdown = (expMs: number) => {
      const tick = () => setSecondsLeft(Math.max(0, Math.round((expMs - Date.now()) / 1000)));
      tick();
      tickTimer = setInterval(tick, 1000);
    };

    const token = tokenStore.getToken();
    const expMs = token ? getJwtExpiryMs(token) : null;
    if (!expMs) return;

    const msUntilWarning = expMs - Date.now() - WARNING_LEAD_MS;
    if (msUntilWarning <= 0) startCountdown(expMs);
    else warnTimer = setTimeout(() => startCountdown(expMs), msUntilWarning);

    return () => { clearTimeout(warnTimer); clearInterval(tickTimer); };
  }, [isAuthenticated, armToken]);

  const staySignedIn = useCallback(async () => {
    const ok = await tryRefreshSession();
    if (ok) {
      setSecondsLeft(null);
      setArmToken(t => t + 1); // re-arm the timer against the freshly-issued token's new exp
    }
    return ok;
  }, []);

  return { secondsLeft: isAuthenticated ? secondsLeft : null, staySignedIn };
}
