import { Building2, CheckCircle2, Lock, Mail, Phone, Save, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "../../hooks/useToast";
import { getApiErrorMessage } from "../../services/api-errors";
import { employerService } from "../../services/employer.service";
import type { EmployerProfile } from "../../types";

const FALLBACK: EmployerProfile = {
  companyName: "", companyCode: "", contactPerson: "",
  companyEmail: "", loginEmail: "", payrollDate: null,
  payrollCutoffDate: null, phone: "", status: ""
};

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] font-[500] text-[#62657A] mb-1.5">
        {icon && <span className="text-[#62657A]">{icon}</span>}
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full h-9 px-3 text-[13px] bg-white border border-[#E4E4EF] rounded-lg text-[#191A2E] placeholder-[#B7B9C7] focus:outline-none focus:border-[#7679FF] focus:ring-2 focus:ring-[#7679FF]/10 transition disabled:bg-[#F7F7FB] disabled:text-[#62657A] disabled:cursor-not-allowed";

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
    <div className="max-w-2xl space-y-4">
      {/* Company identity (read-only) */}
      <div className="bg-white border border-[#E4E4EF] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E4E4EF]">
          <p className="text-[13px] font-[600] text-[#191A2E]">Company identity</p>
          <p className="text-[12px] text-[#62657A] mt-0.5">Read-only — set by your MobPae administrator</p>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          <Field label="Company name" icon={<Building2 size={11} />}>
            <input className={inputCls} value={profile.companyName} disabled />
          </Field>
          <Field label="Company code" icon={<Lock size={11} />}>
            <input className={inputCls} value={profile.companyCode} disabled />
          </Field>
          <Field label="Login email" icon={<Mail size={11} />}>
            <input className={inputCls} value={profile.loginEmail} disabled />
          </Field>
          <Field label="Account status" icon={<CheckCircle2 size={11} />}>
            <div className="h-9 px-3 flex items-center">
              {profile.status ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-[500] bg-[#EBF6E3] text-[#3B6D11]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4E8A18]" />
                  {profile.status}
                </span>
              ) : <span className="text-[12px] text-[#62657A]">—</span>}
            </div>
          </Field>
        </div>
        <div className="px-5 py-3 bg-[#ECEBFF]/40 border-t border-[#E4E4EF]">
          <p className="text-[11px] text-[#7679FF]">
            Login email is used for authentication and cannot be changed here. Contact support to update it.
          </p>
        </div>
      </div>

      {/* Editable contact info */}
      <div className="bg-white border border-[#E4E4EF] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E4E4EF]">
          <p className="text-[13px] font-[600] text-[#191A2E]">Contact information</p>
          <p className="text-[12px] text-[#62657A] mt-0.5">Update company contact and billing details</p>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <Field label="Contact person" icon={<User size={11} />}>
            <input
              className={inputCls}
              value={profile.contactPerson}
              onChange={e => set("contactPerson", e.target.value)}
              placeholder="Arjun Sharma"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Company email" icon={<Mail size={11} />}>
              <input
                className={inputCls}
                type="email"
                value={profile.companyEmail}
                onChange={e => set("companyEmail", e.target.value)}
                placeholder="hr@company.com"
              />
            </Field>
            <Field label="Phone" icon={<Phone size={11} />}>
              <input
                className={inputCls}
                value={profile.phone}
                onChange={e => set("phone", e.target.value)}
                placeholder="+91 98765 00000"
              />
            </Field>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="h-9 px-4 flex items-center gap-2 rounded-lg bg-[#7679FF] hover:bg-[#5659D9] text-white text-[12px] font-[600] disabled:opacity-50 transition-colors"
            >
              <Save size={13} />
              {saving ? "Saving…" : "Save changes"}
            </button>
            {saved && (
              <div className="flex items-center gap-1.5 text-[12px] font-[500] text-[#5659D9]">
                <CheckCircle2 size={13} />Changes saved
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
