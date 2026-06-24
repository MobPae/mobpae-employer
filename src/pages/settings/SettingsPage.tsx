import { Building2, CheckCircle2, Lock, Mail, Phone, Save, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "../../hooks/useToast";
import { getApiErrorMessage } from "../../services/api-errors";
import { employerService } from "../../services/employer.service";
import type { EmployerProfile } from "../../types";

const P  = "#6C4CFF";
const PS = "#F3F0FF";
const T1 = "#111827";
const T2 = "#6B7280";
const T3 = "#9CA3AF";
const BDR = "1px solid #E5E7EB";
const SHD = "0 1px 4px rgba(17,24,39,0.04)";

const FALLBACK: EmployerProfile = {
  companyName: "", companyCode: "", contactPerson: "",
  companyEmail: "", loginEmail: "", payrollDate: null,
  payrollCutoffDate: null, phone: "", status: ""
};

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 500, color: T2, marginBottom: 6 }}>
        {icon && <span style={{ color: T3 }}>{icon}</span>}
        {label}
      </label>
      {children}
    </div>
  );
}

const inputBase: React.CSSProperties = {
  width: "100%", height: 36, padding: "0 12px", fontSize: 13,
  background: "white", border: BDR, borderRadius: 8,
  color: T1, outline: "none", transition: "border-color 0.15s",
  boxSizing: "border-box",
};

function Input({ value, onChange, disabled, type, placeholder }: {
  value: string; onChange?: (v: string) => void; disabled?: boolean; type?: string; placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={onChange ? e => onChange(e.target.value) : undefined}
      disabled={disabled}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...inputBase,
        borderColor: focused ? P : "#E5E7EB",
        boxShadow: focused ? `0 0 0 3px ${PS}` : "none",
        background: disabled ? "#F9FAFB" : "white",
        color: disabled ? T2 : T1,
        cursor: disabled ? "not-allowed" : "text",
      }}
    />
  );
}

function card(style?: React.CSSProperties): React.CSSProperties {
  return { background: "white", border: BDR, borderRadius: 16, overflow: "hidden", boxShadow: SHD, ...style };
}

export function SettingsPage() {
  const toast = useToast();
  const [profile, setProfile] = useState<EmployerProfile>(FALLBACK);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    employerService.getEmployerProfile()
      .then(setProfile)
      .catch(err => toast.error("Failed to load profile", getApiErrorMessage(err)));
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
        contactPerson:  profile.contactPerson,
        companyEmail:   profile.companyEmail,
        phone:          profile.phone,
      });
      setProfile(updated);
      setSaved(true);
      toast.success("Profile updated");
    } catch (err) {
      toast.error("Save failed", getApiErrorMessage(err));
    } finally { setSaving(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Page header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: T1, letterSpacing: "-0.025em", margin: 0 }}>Settings</h1>
        <p style={{ fontSize: 13, color: T2, marginTop: 4 }}>Manage your company profile and contact details</p>
      </div>

      {/* Company identity (read-only) */}
      <div style={card()}>
        <div style={{ padding: "16px 20px", borderBottom: BDR }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: T1 }}>Company identity</p>
          <p style={{ fontSize: 12, color: T2, marginTop: 2 }}>Read-only — set by your MobPae administrator</p>
        </div>
        <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Company name" icon={<Building2 size={11} />}>
            <Input value={profile.companyName} disabled />
          </Field>
          <Field label="Company code" icon={<Lock size={11} />}>
            <Input value={profile.companyCode} disabled />
          </Field>
          <Field label="Login email" icon={<Mail size={11} />}>
            <Input value={profile.loginEmail} disabled />
          </Field>
          <Field label="Account status" icon={<CheckCircle2 size={11} />}>
            <div style={{ height: 36, padding: "0 12px", display: "flex", alignItems: "center" }}>
              {profile.status ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 500, background: "#DCFCE7", color: "#16A34A" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16A34A" }} />
                  {profile.status}
                </span>
              ) : <span style={{ fontSize: 12, color: T2 }}>—</span>}
            </div>
          </Field>
        </div>
        <div style={{ padding: "10px 20px", background: PS + "40", borderTop: BDR }}>
          <p style={{ fontSize: 11, color: P }}>
            Login email is used for authentication and cannot be changed here. Contact support to update it.
          </p>
        </div>
      </div>

      {/* Editable contact info */}
      <div style={card()}>
        <div style={{ padding: "16px 20px", borderBottom: BDR }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: T1 }}>Contact information</p>
          <p style={{ fontSize: 12, color: T2, marginTop: 2 }}>Update company contact and billing details</p>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Contact person" icon={<User size={11} />}>
            <Input value={profile.contactPerson} onChange={v => set("contactPerson", v)} placeholder="Arjun Sharma" />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Company email" icon={<Mail size={11} />}>
              <Input type="email" value={profile.companyEmail} onChange={v => set("companyEmail", v)} placeholder="hr@company.com" />
            </Field>
            <Field label="Phone" icon={<Phone size={11} />}>
              <Input value={profile.phone} onChange={v => set("phone", v)} placeholder="+91 98765 00000" />
            </Field>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 4 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                height: 36, padding: "0 16px", display: "flex", alignItems: "center", gap: 6,
                borderRadius: 8, background: P, border: "none", color: "white",
                fontSize: 12, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.6 : 1, boxShadow: "0 4px 14px rgba(108,76,255,0.25)",
                transition: "opacity 0.15s",
              }}
            >
              <Save size={13} />
              {saving ? "Saving…" : "Save changes"}
            </button>
            {saved && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 500, color: "#16A34A" }}>
                <CheckCircle2 size={13} />Changes saved
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
