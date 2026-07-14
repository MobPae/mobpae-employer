/**
 * Single seam for wiring up an error-reporting service (e.g. Sentry) later.
 * No-op today beyond a console log — swap the body for `Sentry.captureException`
 * (or equivalent) without touching call sites.
 */
export function reportError(error: unknown, context?: Record<string, unknown>): void {
  console.error("[errorReporter]", error, context);
}
