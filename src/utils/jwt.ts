export function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const [, payload] = token.split(".");
    if (!payload) return {};
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const decoded = JSON.parse(atob(padded));
    return decoded && typeof decoded === "object" ? decoded : {};
  } catch {
    return {};
  }
}

/** JWT `exp` claim is seconds-since-epoch; returns milliseconds, or null if absent/invalid. */
export function getJwtExpiryMs(token: string): number | null {
  const exp = decodeJwtPayload(token).exp;
  return typeof exp === "number" ? exp * 1000 : null;
}
