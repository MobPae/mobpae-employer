import { Save, Wallet, Info, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "../../hooks/useToast";
import { getApiErrorMessage } from "../../services/api-errors";
import { employerService, type EmployerProductConfig, type ProductAdvanceRules } from "../../services/employer.service";
import { Button } from "../../components/ui/Button";

// ── shared shells ────────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-2xl border border-edge bg-surface shadow-card">{children}</div>;
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-edge px-5 py-4">
      <p className="text-sm font-semibold text-ink">{title}</p>
      {subtitle && <p className="mt-0.5 text-xs text-ink-3">{subtitle}</p>}
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const toast = useToast();

  const [productConfig, setProductConfig] = useState<EmployerProductConfig | null>(null);
  const [advanceRules,  setAdvanceRules]  = useState<ProductAdvanceRules | null>(null);
  const [pctInput,      setPctInput]      = useState("");
  const [pctError,      setPctError]      = useState("");
  const [savingLimit,   setSavingLimit]   = useState(false);

  useEffect(() => {
    employerService.getMyProductConfigs()
      .then(configs => {
        const sa = configs.find(c => c.product.productType === "SA") ?? null;
        setProductConfig(sa);
        setPctInput(sa?.maximumAdvancePercentageOverride != null
          ? String(sa.maximumAdvancePercentageOverride)
          : "");
      })
      .catch(() => {});

    employerService.getProductAdvanceRules("SA")
      .then(rules => {
        // Validate the response has the expected shape before setting state
        if (rules && typeof rules.defaultAdvancePercentage === "number") {
          setAdvanceRules(rules);
        } else {
          console.error("[SettingsPage] Unexpected rules response shape:", rules);
        }
      })
      .catch(err => console.error("[SettingsPage] Failed to load advance rules:", err));
  }, []);

  const ceiling = advanceRules?.hardCeilingPercentage ?? 50;

  const handleSaveLimit = async () => {
    setPctError("");
    if (pctInput.trim() === "") {
      // clear override
      setSavingLimit(true);
      try {
        const updated = await employerService.setAdvanceOverride("SA", null);
        setProductConfig(updated);
        toast.success("Override cleared — platform default restored");
      } catch (err) {
        toast.error("Save failed", getApiErrorMessage(err));
      } finally { setSavingLimit(false); }
      return;
    }
    const pct = parseFloat(pctInput);
    if (isNaN(pct) || pct <= 0) {
      setPctError("Enter a valid percentage greater than 0.");
      return;
    }
    if (pct > ceiling) {
      setPctError(`Cannot exceed the maximum cap of ${ceiling}%.`);
      return;
    }
    setSavingLimit(true);
    try {
      const updated = await employerService.setAdvanceOverride("SA", pct);
      setProductConfig(updated);
      toast.success("Advance limit updated");
    } catch (err) {
      toast.error("Save failed", getApiErrorMessage(err));
    } finally { setSavingLimit(false); }
  };

  return (
    <div className="flex flex-col gap-5">

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Salary Advance</h1>
        <p className="mt-1.5 text-sm text-ink-3">Set the advance policy your employees request against</p>
      </div>

      <Card>
        <SectionHeader
          title="Salary Advance Limit"
          subtitle="The maximum advance your employees can request per salary cycle"
        />

        <div className="flex flex-col gap-4 p-5">

          {/* Platform rules — from API */}
          {advanceRules ? (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div className="rounded-xl border border-edge bg-canvas px-4 py-3.5">
                <p className="text-2xs font-semibold uppercase tracking-[0.07em] text-ink-4">Default advance rule</p>
                <p className="mt-1.5 text-xl font-bold tracking-tight text-ink">
                  {advanceRules.defaultAdvancePercentage}%
                  <span className="ml-1.5 text-sm font-normal text-ink-3">of salary</span>
                </p>
                <p className="mt-0.5 text-2xs text-ink-3">
                  up to ₹{(advanceRules.platformMaxAdvanceAmount ?? 0).toLocaleString("en-IN")} (interest-free tier)
                </p>
              </div>
              <div className="rounded-xl border border-edge bg-canvas px-4 py-3.5">
                <p className="text-2xs font-semibold uppercase tracking-[0.07em] text-ink-4">Maximum cap</p>
                <p className="mt-1.5 text-xl font-bold tracking-tight text-ink">
                  {advanceRules.hardCeilingPercentage}%
                  <span className="ml-1.5 text-sm font-normal text-ink-3">of salary</span>
                </p>
                <p className="mt-0.5 text-2xs text-ink-3">hard ceiling — cannot be exceeded</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {[0, 1].map(i => (
                <div key={i} className="rounded-xl border border-edge bg-canvas px-4 py-3.5">
                  <div className="h-2.5 w-32 animate-pulse rounded-md bg-surface-muted" />
                  <div className="mt-2.5 h-6 w-20 animate-pulse rounded-md bg-surface-muted" />
                  <div className="mt-2 h-2.5 w-40 animate-pulse rounded-md bg-surface-muted" />
                </div>
              ))}
            </div>
          )}

          {/* Current override status */}
          {productConfig?.maximumAdvancePercentageOverride != null && (
            <div className="flex items-center gap-2.5 rounded-lg border border-brand-muted bg-brand-soft px-3.5 py-2.5">
              <Wallet size={14} className="flex-shrink-0 text-brand" />
              <p className="text-[12.5px] text-brand">
                Your current override: <strong>{productConfig.maximumAdvancePercentageOverride}% of salary</strong>
              </p>
            </div>
          )}

          <div className="border-t border-edge" />

          {/* Override input */}
          <div>
            <p className="mb-2 text-xs font-semibold text-ink-2">
              Set your override <span className="font-normal text-ink-3">(optional)</span>
            </p>
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1">
                <input
                  type="number"
                  min={1}
                  max={ceiling}
                  step={1}
                  value={pctInput}
                  onChange={e => { setPctInput(e.target.value); setPctError(""); }}
                  placeholder={`e.g. 20  (max ${ceiling}%)`}
                  aria-label="Advance limit override percentage"
                  className={`h-9 w-full rounded-lg border bg-surface px-3 pr-8 text-sm text-ink outline-none transition-colors focus:ring-2 ${
                    pctError ? "border-danger focus:border-danger focus:ring-danger/15" : "border-edge focus:border-brand focus:ring-brand/15"
                  }`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-3">%</span>
              </div>
              <Button variant="primary" size="md" icon={<Save size={13} />} disabled={savingLimit} onClick={handleSaveLimit}>
                {savingLimit ? "Saving…" : "Save"}
              </Button>
              {pctInput !== "" && (
                <Button variant="secondary" size="md" onClick={() => { setPctInput(""); setPctError(""); }}>
                  Clear
                </Button>
              )}
            </div>
            {pctError ? (
              <div className="mt-1.5 flex items-center gap-1.5">
                <AlertTriangle size={12} className="flex-shrink-0 text-danger" />
                <p className="text-xs text-danger">{pctError}</p>
              </div>
            ) : (
              <p className="mt-1.5 text-xs text-ink-3">
                Leave blank to use platform default ({advanceRules?.defaultAdvancePercentage ?? "—"}%). Cannot exceed {ceiling}%.
              </p>
            )}
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2 rounded-lg border border-warning-bg bg-warning-soft px-3.5 py-2.5">
            <Info size={13} className="mt-0.5 flex-shrink-0 text-warning" />
            <p className="text-[12.5px] leading-relaxed text-warning-dark">
              Your override applies to all employees. Each employee's advance is further limited by their individual salary eligibility. Contact MobPae to request a higher cap.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
