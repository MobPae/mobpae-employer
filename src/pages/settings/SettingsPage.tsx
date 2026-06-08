import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { useToast } from "../../hooks/useToast";
import { getApiErrorMessage } from "../../services/api-errors";
import { employerService } from "../../services/employer.service";
import type { EmployerProfile } from "../../types";
import { formatPayrollDay } from "../../utils/formatters";

const fallbackProfile: EmployerProfile = {
  companyName: "",
  companyCode: "",
  contactPerson: "",
  companyEmail: "",
  loginEmail: "",
  payrollDate: null,
  payrollCutoffDate: null,
  phone: "",
  status: ""
};

export function SettingsPage() {
  const toast = useToast();
  const [profile, setProfile] = useState<EmployerProfile>(fallbackProfile);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    employerService
      .getEmployerProfile()
      .then(setProfile)
      .catch((error) => {
        setProfile(fallbackProfile);
        toast.error("Unable to load employer profile", getApiErrorMessage(error));
      });
  }, []);

  const setField = <K extends keyof EmployerProfile>(key: K, value: EmployerProfile[K]) => {
    setSaved(false);
    setError("");
    setProfile((current) => ({ ...current, [key]: value }));
  };

  return (
    <>
      <PageHeader eyebrow="Employer profile" title="Settings" description="Maintain company contact details and account ownership information." />

      <section className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm shadow-blue-950/5">
        <form
          className="grid max-w-3xl gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            try {
              setSaving(true);
              const updatedProfile = await employerService.updateEmployerProfile({
                companyName: profile.companyName,
                contactPerson: profile.contactPerson,
                companyEmail: profile.companyEmail,
                phone: profile.phone
              });
              setProfile(updatedProfile);
              setSaved(true);
              toast.success("Employer profile updated");
            } catch (error) {
              setSaved(false);
              const message = getApiErrorMessage(error, "Unable to update employer profile. Please try again.");
              setError(message);
              toast.error("Unable to update employer profile", message);
            } finally {
              setSaving(false);
            }
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Company Name" value={profile.companyName} onChange={(event) => setField("companyName", event.target.value)} />
            <Input label="Company Code" value={profile.companyCode} disabled />
          </div>
          <Input label="Login Email" type="email" value={profile.loginEmail} disabled />
          <p className="-mt-2 rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">Login email is used for account authentication and cannot be changed.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Payroll Date" value={formatPayrollDay(profile.payrollDate)} disabled />
            <Input label="Payroll Cutoff Date" value={formatPayrollDay(profile.payrollCutoffDate)} disabled />
          </div>
          <Input label="Contact Person" value={profile.contactPerson} onChange={(event) => setField("contactPerson", event.target.value)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Company Email" type="email" value={profile.companyEmail} onChange={(event) => setField("companyEmail", event.target.value)} />
            <Input label="Phone" value={profile.phone} onChange={(event) => setField("phone", event.target.value)} />
          </div>
          {saved ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">Employer profile updated.</p> : null}
          {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}
          <div>
            <Button icon={<Save size={16} />} type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </section>
    </>
  );
}
