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
  contactPerson: "",
  companyEmail: "",
  loginEmail: "",
  phone: "",
  status: ""
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
      <PageHeader eyebrow="Employer profile" title="Settings" description="Maintain company contact details and account ownership information." />

      <section className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm shadow-blue-950/5">
        <form
          className="grid max-w-3xl gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            try {
              const updatedProfile = await employerService.updateEmployerProfile({
                companyName: profile.companyName,
                contactPerson: profile.contactPerson,
                companyEmail: profile.companyEmail,
                phone: profile.phone
              });
              setProfile(updatedProfile);
              setSaved(true);
            } catch {
              setSaved(false);
              setError("Unable to update employer profile. Please verify the details and try again.");
            }
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Company Name" value={profile.companyName} disabled />
            <Input label="Company Code" value={profile.companyCode} disabled />
          </div>
          <Input label="Login Email" type="email" value={profile.loginEmail} disabled />
          <p className="-mt-2 rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700">Login email is used for account authentication and cannot be changed.</p>
          <Input label="Contact Person" value={profile.contactPerson} onChange={(event) => setField("contactPerson", event.target.value)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Company Email" type="email" value={profile.companyEmail} onChange={(event) => setField("companyEmail", event.target.value)} />
            <Input label="Phone" value={profile.phone} onChange={(event) => setField("phone", event.target.value)} />
          </div>
          {saved ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">Employer profile updated.</p> : null}
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
