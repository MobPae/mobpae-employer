import { getPasswordStrength } from "../../utils/passwordStrength";

const BAR_COLOR: Record<number, string> = {
  0: "bg-edge",
  1: "bg-danger",
  2: "bg-warning",
  3: "bg-info",
  4: "bg-success",
};

const LABEL_COLOR: Record<number, string> = {
  0: "text-ink-4",
  1: "text-danger",
  2: "text-warning",
  3: "text-info",
  4: "text-success",
};

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const { score, label } = getPasswordStrength(password);

  return (
    <div className="mt-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? BAR_COLOR[score] : "bg-edge"}`} />
        ))}
      </div>
      <p className={`mt-1 text-2xs font-medium ${LABEL_COLOR[score]}`}>{label}</p>
    </div>
  );
}
