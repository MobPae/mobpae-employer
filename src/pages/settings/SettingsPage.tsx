import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { employerService } from "../../services/employer.service";
import type { EmployerProfile } from "../../types";

const fallbackProfile: EmployerProfile = {
  companyName: "",
  companyCode: "",
  payrollDate: "",
  payrollCutoffDate: "",
  contactPerson: "",
  email: "",
  phone: ""
};

export function SettingsPage() {
  const [profile, setProfile] = useState<EmployerProfile>(fallbackProfile);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    employerService.getEmployerProfile().then(setProfile).catch(() => setProfile(fallbackProfile));
  }, []);

  const setField = <K extends keyof EmployerProfile>(key: K, value: EmployerProfile[K]) => {
    setSaved(false);
    setError("");
    setProfile((current) => ({ ...current, [key]: value }));
  };

  return (
    <>
      <PageHeader eyebrow="Employer profile" title="Settings" description="Maintain company identity, payroll cycle details and HR contact information." />

      <section className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm shadow-blue-950/5">
        <form
          className="grid max-w-3xl gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            try {
              const updatedProfile = await employerService.updateEmployerProfile(profile);
              setProfile(updatedProfile);
              setSaved(true);
            } catch {
              setSaved(false);
              setError("You do not have permission to update employer settings yet.");
            }
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Company Name" value={profile.companyName} onChange={(event) => setField("companyName", event.target.value)} />
            <Input label="Company Code" value={profile.companyCode} onChange={(event) => setField("companyCode", event.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Payroll Date" type="date" value={profile.payrollDate} onChange={(event) => setField("payrollDate", event.target.value)} />
            <Input label="Payroll Cutoff Date" type="date" value={profile.payrollCutoffDate} onChange={(event) => setField("payrollCutoffDate", event.target.value)} />
          </div>
          <Input label="Contact Person" value={profile.contactPerson} onChange={(event) => setField("contactPerson", event.target.value)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Email" type="email" value={profile.email} onChange={(event) => setField("email", event.target.value)} />
            <Input label="Phone" value={profile.phone} onChange={(event) => setField("phone", event.target.value)} />
          </div>
          {saved ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">Employer profile saved for this demo session.</p> : null}
          {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}
          <div>
            <Button icon={<Save size={16} />} type="submit">
              Save Settings
            </Button>
          </div>
        </form>
      </section>
    </>
  );
}
