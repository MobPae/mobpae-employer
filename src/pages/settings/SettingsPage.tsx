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
      <label className="flex items-center gap-1.5 text-[11px] font-[500] text-slate-500 mb-1.5">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full h-9 px-3 text-[13px] bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed";

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
        companyName:    profile.companyName,
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
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-[13px] font-[600] text-slate-900">Company identity</p>
          <p className="text-[12px] text-slate-400 mt-0.5">Read-only — set by your MobPae administrator</p>
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
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-[500] bg-emerald-50 text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {profile.status}
                </span>
              ) : <span className="text-[12px] text-slate-400">—</span>}
            </div>
          </Field>
        </div>
        <div className="px-5 py-3 bg-blue-50/40 border-t border-blue-100">
          <p className="text-[11px] text-blue-600">
            Login email is used for authentication and cannot be changed here. Contact support to update it.
          </p>
        </div>
      </div>

      {/* Editable contact info */}
      <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-[13px] font-[600] text-slate-900">Contact information</p>
          <p className="text-[12px] text-slate-400 mt-0.5">Update company contact and billing details</p>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <Field label="Company name" icon={<Building2 size={11} />}>
            <input
              className={inputCls}
              value={profile.companyName}
              onChange={e => set("companyName", e.target.value)}
              placeholder="Acme Corp"
            />
          </Field>
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
              className="h-9 px-4 flex items-center gap-2 rounded-lg bg-[#059669] hover:bg-[#047857] text-white text-[12px] font-[600] disabled:opacity-50 transition-colors"
            >
              <Save size={13} />
              {saving ? "Saving…" : "Save changes"}
            </button>
            {saved && (
              <div className="flex items-center gap-1.5 text-[12px] font-[500] text-emerald-700">
                <CheckCircle2 size={13} />Changes saved
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
