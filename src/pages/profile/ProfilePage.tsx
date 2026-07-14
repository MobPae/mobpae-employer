import {
  CheckCircle2, Clock, KeyRound, LogOut, Mail, Monitor, Phone, Save, User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { authService } from "../../services/auth.service";
import { getApiErrorMessage } from "../../services/api-errors";
import { employerService } from "../../services/employer.service";
import type { EmployerProfile, UserSession } from "../../types";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { SUPPORT_EMAIL } from "../../config";
import { formatDate } from "../../utils/formatters";

const FALLBACK: EmployerProfile = {
  companyName: "", companyCode: "", contactPerson: "",
  companyEmail: "", loginEmail: "", payrollDate: null,
  payrollCutoffDate: null, phone: "", status: "",
};

function FieldLabel({ label }: { label: string }) {
  return <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.05em] text-ink-3">{label}</p>;
}

function initialsOf(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";
}

// ── page ──────────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState<EmployerProfile>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  const [sessions,      setSessions]      = useState<UserSession[]>([]);
  const [revokingId,    setRevokingId]    = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<UserSession | null>(null);

  useEffect(() => {
    employerService.getEmployerProfile()
      .then(setProfile)
      .catch(err => toast.error("Failed to load profile", getApiErrorMessage(err)))
      .finally(() => setLoading(false));

    authService.getSessions()
      .then(setSessions)
      .catch(() => {});
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

  const handleRevokeSession = async () => {
    if (!confirmRevoke) return;
    setRevokingId(confirmRevoke.id);
    try {
      await authService.revokeSession(confirmRevoke.id);
      setSessions(cur => cur.filter(s => s.id !== confirmRevoke.id));
      toast.success("Signed out", `${confirmRevoke.device} has been signed out`);
    } catch (err) {
      toast.error("Failed to sign out device", getApiErrorMessage(err));
    } finally {
      setRevokingId(null);
      setConfirmRevoke(null);
    }
  };

  const isActive = profile.status === "ACTIVE";

  return (
    <div className="flex flex-col gap-8">

      {/* ── Identity header — no card, no boxes ──────────────────────────────── */}
      {loading ? (
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 flex-shrink-0 animate-pulse rounded-2xl bg-surface-muted" />
          <div className="flex flex-col gap-2">
            <div className="h-5 w-40 animate-pulse rounded-md bg-surface-muted" />
            <div className="h-3.5 w-56 animate-pulse rounded-md bg-surface-muted" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8B7CFF] to-brand text-lg font-bold text-white">
              {initialsOf(profile.companyName || "?")}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-ink">{profile.companyName || "—"}</h1>
                {profile.status && (
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-2xs font-semibold ${
                    isActive ? "bg-success-bg text-success" : "bg-warning-bg text-warning"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-success" : "bg-warning"}`} />
                    {profile.status}
                  </span>
                )}
                {profile.companyCode && (
                  <span className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-2xs text-ink-3">{profile.companyCode}</span>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <p className="text-[13px] text-ink-3">{profile.loginEmail || "—"}</p>
                {user?.lastLoginAt && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-2xs font-medium text-ink-3">
                    <Clock size={10} className="flex-shrink-0" /> Last login: {formatDate(user.lastLoginAt)}
                  </span>
                )}
              </div>
              <p className="mt-2 text-2xs text-ink-4">
                Company name, code, and login email are managed by MobPae — contact support to change them.
              </p>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              onClick={() => navigate("/change-password")}
              className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-brand-soft px-3 text-xs font-semibold text-brand transition-colors hover:bg-brand-muted"
            >
              <KeyRound size={13} /> Change password
            </button>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Update company details${profile.companyCode ? ` — ${profile.companyCode}` : ""}`)}`}
              className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-brand-soft px-3 text-xs font-semibold text-brand transition-colors hover:bg-brand-muted"
            >
              <Mail size={13} /> Contact support
            </a>
          </div>
        </div>
      )}

      {/* ── Contact information — editable ───────────────────────────────────── */}
      <div>
        <p className="text-sm font-semibold text-ink">Contact information</p>
        <p className="mt-0.5 text-xs text-ink-3">Used for billing and communication about your account</p>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <FieldLabel label="Contact person" />
              <Input
                icon={<User size={13} />}
                value={profile.contactPerson}
                onChange={e => set("contactPerson", e.target.value)}
                placeholder="Arjun Sharma"
              />
            </div>
            <div>
              <FieldLabel label="Company email" />
              <Input
                type="email"
                icon={<Mail size={13} />}
                value={profile.companyEmail}
                disabled
                placeholder="hr@company.com"
              />
              <p className="mt-1.5 text-2xs text-ink-4">Editing isn't available yet.</p>
            </div>
            <div>
              <FieldLabel label="Phone" />
              <Input
                icon={<Phone size={13} />}
                value={profile.phone}
                onChange={e => set("phone", e.target.value)}
                placeholder="+91 98765 00000"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" size="md" icon={<Save size={13} />} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
            {saved && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-success">
                <CheckCircle2 size={13} /> Saved
              </div>
            )}
          </div>
        </form>
      </div>

      {/* ── Active sessions — only renders once the backend supports it ──────── */}
      {sessions.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-ink">Active sessions</p>
          <div className="mt-4 divide-y divide-edge-2 rounded-xl border border-edge">
            {sessions.map(s => (
              <div key={s.id} className="flex flex-col gap-2.5 px-4 py-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-4">
                    <Monitor size={16} />
                  </div>
                  <p className="min-w-0 flex-1 text-[13.5px] font-medium text-ink">{s.device}</p>
                </div>
                <div className="flex flex-shrink-0 items-center justify-between gap-2 sm:flex-col sm:items-end sm:gap-1">
                  {s.current ? (
                    <span className="rounded-full bg-success-bg px-2 py-0.5 text-2xs font-semibold text-success">This device</span>
                  ) : (
                    <Button
                      variant="secondary" size="sm" icon={<LogOut size={12} />}
                      disabled={revokingId === s.id}
                      onClick={() => setConfirmRevoke(s)}
                    >
                      Sign out
                    </Button>
                  )}
                  <p className="text-2xs text-ink-4">
                    {s.ipAddress && `${s.ipAddress} · `}Active {formatDate(s.lastActiveAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(confirmRevoke)}
        title="Sign out this device?"
        description={confirmRevoke ? `${confirmRevoke.device} will be signed out immediately and will need to log in again.` : ""}
        confirmLabel="Sign out"
        loading={Boolean(revokingId)}
        onConfirm={() => void handleRevokeSession()}
        onCancel={() => setConfirmRevoke(null)}
      />
    </div>
  );
}
