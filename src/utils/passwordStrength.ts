export type PasswordStrengthLabel = "Weak" | "Fair" | "Good" | "Strong";

export interface PasswordStrength {
  score: number; // 0–4
  label: PasswordStrengthLabel;
}

/** Lightweight client-side heuristic — not a replacement for server-side policy checks. */
export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: "Weak" };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const label: PasswordStrengthLabel =
    score <= 1 ? "Weak" : score === 2 ? "Fair" : score <= 3 ? "Good" : "Strong";

  return { score: Math.min(score, 4), label };
}
