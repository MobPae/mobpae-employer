import {
  Building2, CheckCircle2, Mail, Phone, Save, Shield,
  User, Wallet, Lock, Info, AlertTriangle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "../../hooks/useToast";
import { getApiErrorMessage } from "../../services/api-errors";
import { employerService, type EmployerProductConfig, type ProductAdvanceRules } from "../../services/employer.service";
import type { EmployerProfile } from "../../types";

// ── design tokens ─────────────────────────────────────────────────────────────
const T1  = "var(--color-ink)";
const T2  = "var(--color-ink-3)";
const T3  = "var(--color-ink-4)";
const P   = "var(--color-brand)";
const PS  = "var(--color-brand-soft)";


const BDR = "1px solid var(--color-edge)";
const SHD = "0 1px 4px rgba(17,24,39,0.04)";

const FALLBACK: EmployerProfile = {
  companyName: "", companyCode: "", contactPerson: "",
  companyEmail: "", loginEmail: "", payrollDate: null,
  payrollCutoffDate: null, phone: "", status: "",
};

// ── helpers ───────────────────────────────────────────────────────────────────

function card(extra?: React.CSSProperties): React.CSSProperties {
  return { background: "white", border: BDR, borderRadius: 16, overflow: "hidden", boxShadow: SHD, ...extra };
}

// ── read-only info row ────────────────────────────────────────────────────────

function InfoRow({ icon, label, value, badge }: {
  icon: React.ReactNode; label: string;
  value?: React.ReactNode; badge?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", borderBottom: BDR }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, background: "var(--color-surface-muted)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: T3, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 10.5, fontWeight: 600, color: T3, textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>{label}</p>
        <p style={{ fontSize: 13.5, fontWeight: 500, color: T1, margin: "3px 0 0", lineHeight: 1.2 }}>{value ?? "—"}</p>
      </div>
      {badge && <div style={{ flexShrink: 0 }}>{badge}</div>}
    </div>
  );
}

// ── section header ────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ padding: "16px 20px", borderBottom: BDR }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: T1, margin: 0 }}>{title}</p>
      {subtitle && <p style={{ fontSize: 12, color: T2, margin: "3px 0 0" }}>{subtitle}</p>}
    </div>
  );
}

// ── editable input ────────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: "100%", height: 36, padding: "0 12px", fontSize: 13,
  background: "white", border: BDR, borderRadius: 8,
  color: T1, outline: "none", transition: "border-color 0.15s",
  boxSizing: "border-box", fontFamily: "inherit",
};

function FieldLabel({ label }: { label: string }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 600, color: T2, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
  );
}


// ── page ──────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const toast = useToast();

  const [profile,       setProfile]       = useState<EmployerProfile>(FALLBACK);
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [productConfig, setProductConfig] = useState<EmployerProductConfig | null>(null);
  const [advanceRules,  setAdvanceRules]  = useState<ProductAdvanceRules | null>(null);
  const [pctInput,      setPctInput]      = useState("");
  const [pctError,      setPctError]      = useState("");
  const [savingLimit,   setSavingLimit]   = useState(false);

  useEffect(() => {
    employerService.getEmployerProfile()
      .then(setProfile)
      .catch(err => toast.error("Failed to load profile", getApiErrorMessage(err)));

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

  const set = <K extends keyof EmployerProfile>(k: K, v: EmployerProfile[K]) => {
    setSaved(false);
    setProfile(p => ({ ...p, [k]: v }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await employerService.updateEmployerProfile({
        contactPerson: profile.contactPerson,
        companyEmail:  profile.companyEmail,
        phone:         profile.phone,
      });
      setProfile(updated);
      setSaved(true);
      toast.success("Profile updated");
    } catch (err) {
      toast.error("Save failed", getApiErrorMessage(err));
    } finally { setSaving(false); }
  };

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
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── ADVANCE LIMIT — top priority ────────────────────────────────────── */}
      <div style={card()}>
        <SectionHeader
          title="Salary Advance Limit"
          subtitle="The maximum advance your employees can request per salary cycle"
        />

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Platform rules — from API */}
          {advanceRules ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: "var(--color-canvas)", border: BDR, borderRadius: 12, padding: "14px 16px" }}>
                <p style={{ fontSize: 10.5, fontWeight: 600, color: T3, textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>Default advance rule</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: T1, margin: "6px 0 2px", letterSpacing: "-0.02em" }}>
                  {advanceRules.defaultAdvancePercentage}%
                  <span style={{ fontSize: 13, fontWeight: 400, color: T2, marginLeft: 6 }}>of salary</span>
                </p>
                <p style={{ fontSize: 11.5, color: T3, margin: 0 }}>
                  up to ₹{(advanceRules.platformMaxAdvanceAmount ?? 0).toLocaleString("en-IN")} (interest-free tier)
                </p>
              </div>
              <div style={{ background: "var(--color-canvas)", border: BDR, borderRadius: 12, padding: "14px 16px" }}>
                <p style={{ fontSize: 10.5, fontWeight: 600, color: T3, textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>Maximum cap</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: T1, margin: "6px 0 2px", letterSpacing: "-0.02em" }}>
                  {advanceRules.hardCeilingPercentage}%
                  <span style={{ fontSize: 13, fontWeight: 400, color: T2, marginLeft: 6 }}>of salary</span>
                </p>
                <p style={{ fontSize: 11.5, color: T3, margin: 0 }}>hard ceiling — cannot be exceeded</p>
              </div>
            </div>
          ) : (
            <div style={{ height: 80, background: "var(--color-canvas)", borderRadius: 12, border: BDR, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontSize: 12, color: T3, margin: 0 }}>Loading platform rules…</p>
            </div>
          )}

          {/* Current override status */}
          {productConfig?.maximumAdvancePercentageOverride != null && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: PS, border: `1px solid #C7D4FF`, borderRadius: 10 }}>
              <Wallet size={14} style={{ color: P, flexShrink: 0 }} />
              <p style={{ fontSize: 12.5, color: "var(--color-brand)", margin: 0 }}>
                Your current override: <strong>{productConfig.maximumAdvancePercentageOverride}% of salary</strong>
              </p>
            </div>
          )}

          {/* Divider */}
          <div style={{ borderTop: BDR }} />

          {/* Override input — FIX #19 (no pre-fill), #20 (sentence-case label), #21 (aligned row) */}
          <div>
            {/* FIX #20: sentence-case, not ALL CAPS */}
            <p style={{ fontSize: 12, fontWeight: 600, color: T2, margin: "0 0 8px" }}>Set your override <span style={{ fontWeight: 400, color: T3 }}>(optional)</span></p>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <input
                  type="number"
                  min={1}
                  max={ceiling}
                  step={1}
                  value={pctInput}
                  onChange={e => { setPctInput(e.target.value); setPctError(""); }}
                  placeholder={`e.g. 20  (max ${ceiling}%)`}
                  style={{
                    ...inputBase,
                    paddingRight: 30,
                    borderColor: pctError ? "#EF4444" : "#E5E7EB",
                  }}
                />
                <span style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: T3, pointerEvents: "none" }}>%</span>
              </div>
              {/* FIX #21: buttons vertically centred with input */}
              <button
                onClick={handleSaveLimit}
                disabled={savingLimit}
                style={{
                  height: 38, padding: "0 18px", display: "flex", alignItems: "center", gap: 6,
                  borderRadius: 8, background: P, border: "none", color: "white", flexShrink: 0,
                  fontSize: 13, fontWeight: 600, cursor: savingLimit ? "not-allowed" : "pointer",
                  opacity: savingLimit ? 0.6 : 1, boxShadow: "0 4px 14px rgba(49,94,255,0.22)",
                  fontFamily: "inherit",
                }}
              >
                <Save size={13} />
                {savingLimit ? "Saving…" : "Save"}
              </button>
              {pctInput !== "" && (
                <button
                  onClick={() => { setPctInput(""); setPctError(""); }}
                  style={{ height: 38, padding: "0 14px", borderRadius: 8, background: "white", border: BDR, color: T2, fontSize: 13, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
                >
                  Clear
                </button>
              )}
            </div>
            {pctError ? (
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 7 }}>
                <AlertTriangle size={12} style={{ color: "#EF4444", flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: "#EF4444", margin: 0 }}>{pctError}</p>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: T3, margin: "7px 0 0" }}>
                Leave blank to use platform default ({advanceRules?.defaultAdvancePercentage ?? "—"}%). Cannot exceed {ceiling}%.
              </p>
            )}
          </div>

          {/* Info note — FIX #22: increase text to 12.5px */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "11px 14px", background: "var(--color-warning-soft)", border: "1px solid var(--color-warning-bg)", borderRadius: 10 }}>
            <Info size={13} style={{ color: "var(--color-warning)", flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 12.5, color: "var(--color-warning-dark)", margin: 0, lineHeight: 1.55 }}>
              Your override applies to all employees. Each employee's advance is further limited by their individual salary eligibility. Contact MobPae to request a higher cap.
            </p>
          </div>
        </div>
      </div>

      {/* ── COMPANY IDENTITY — read-only ─────────────────────────────────────── */}
      <div style={card()}>
        <SectionHeader
          title="Company identity"
          subtitle="Managed by your MobPae administrator — contact support to update"
        />

        <InfoRow
          icon={<Building2 size={16} />}
          label="Company name"
          value={profile.companyName || "—"}
        />
        <InfoRow
          icon={<Lock size={16} />}
          label="Company code"
          value={
            profile.companyCode
              ? <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 13, background: "var(--color-surface-muted)", padding: "2px 8px", borderRadius: 6 }}>{profile.companyCode}</span>
              : "—"
          }
        />
        <InfoRow
          icon={<Mail size={16} />}
          label="Login email"
          value={profile.loginEmail || "—"}
        />
        <InfoRow
          icon={<Shield size={16} />}
          label="Account status"
          value={null}
          badge={
            profile.status ? (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                background: profile.status === "ACTIVE" ? "var(--color-success-bg)" : "var(--color-warning-bg)",
                color: profile.status === "ACTIVE" ? "var(--color-success)" : "var(--color-warning)",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: profile.status === "ACTIVE" ? "var(--color-success)" : "var(--color-warning)" }} />
                {profile.status}
              </span>
            ) : <span style={{ fontSize: 13, color: T3 }}>—</span>
          }
        />
        {/* Last row: no border-bottom */}
        <div style={{ padding: "10px 20px", background: PS + "55", borderTop: BDR }}>
          <p style={{ fontSize: 11, color: P, margin: 0 }}>
            Login email is your authentication credential and cannot be changed here.
          </p>
        </div>
      </div>

      {/* ── CONTACT INFO — editable ───────────────────────────────────────────── */}
      <div style={card()}>
        <SectionHeader title="Contact information" subtitle="Update your company's contact and billing details" />

        <form onSubmit={handleSubmit} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <FieldLabel label="Contact person" />
            <div style={{ position: "relative" }}>
              <User size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T3 }} />
              <input
                value={profile.contactPerson}
                onChange={e => set("contactPerson", e.target.value)}
                placeholder="Arjun Sharma"
                style={{ ...inputBase, paddingLeft: 30 }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <FieldLabel label="Company email" />
              <div style={{ position: "relative" }}>
                <Mail size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T3 }} />
                <input
                  type="email"
                  value={profile.companyEmail}
                  onChange={e => set("companyEmail", e.target.value)}
                  placeholder="hr@company.com"
                  style={{ ...inputBase, paddingLeft: 30 }}
                />
              </div>
            </div>
            <div>
              <FieldLabel label="Phone" />
              <div style={{ position: "relative" }}>
                <Phone size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T3 }} />
                <input
                  value={profile.phone}
                  onChange={e => set("phone", e.target.value)}
                  placeholder="+91 98765 00000"
                  style={{ ...inputBase, paddingLeft: 30 }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 4 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                height: 36, padding: "0 16px", display: "flex", alignItems: "center", gap: 6,
                borderRadius: 8, background: P, border: "none", color: "white",
                fontSize: 12, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.6 : 1, boxShadow: "0 4px 14px rgba(49,94,255,0.22)",
                fontFamily: "inherit",
              }}
            >
              <Save size={13} />
              {saving ? "Saving…" : "Save changes"}
            </button>
            {saved && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500, color: "var(--color-success)" }}>
                <CheckCircle2 size={13} /> Saved
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
