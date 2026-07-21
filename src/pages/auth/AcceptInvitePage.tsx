import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Shield, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { httpClient } from "../../services/http-client";
import { getApiErrorMessage } from "../../services/api-errors";

type InvitePreview = {
  email: string;
  role: string;
  companyName: string;
  expiresAt: string;
};

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  HR: "HR",
  FINANCE: "Finance",
  VIEWER: "Viewer",
};

const ROLE_CLS: Record<string, string> = {
  OWNER:   "bg-[#EDE9FE] text-[#6D28D9]",
  ADMIN:   "bg-[#DBEAFE] text-[#1D4ED8]",
  HR:      "bg-[#D1FAE5] text-[#065F46]",
  FINANCE: "bg-amber-50 text-amber-700",
  VIEWER:  "bg-surface-muted text-ink-3",
};

export function AcceptInvitePage() {
  const [params] = useSearchParams();
  const navigate  = useNavigate();
  const token     = params.get("token") ?? "";

  const [preview,    setPreview]    = useState<InvitePreview | null>(null);
  const [previewErr, setPreviewErr] = useState("");
  const [loading,    setLoading]    = useState(true);

  const [password,   setPassword]   = useState("");
  const [confirm,    setConfirm]    = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [showConf,   setShowConf]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr,  setSubmitErr]  = useState("");
  const [done,       setDone]       = useState(false);

  // Fetch invite preview
  useEffect(() => {
    if (!token) { setPreviewErr("No invite token found in this link."); setLoading(false); return; }
    httpClient.get<InvitePreview>(`/employer-members/invites/preview?token=${encodeURIComponent(token)}`)
      .then(r => setPreview(r.data))
      .catch(err => setPreviewErr(getApiErrorMessage(err, "This invite link is invalid or has expired.")))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setSubmitErr("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setSubmitErr("Passwords do not match."); return; }
    setSubmitErr(""); setSubmitting(true);
    try {
      await httpClient.post("/employer-members/invites/accept", { token, password });
      setDone(true);
    } catch (err) {
      setSubmitErr(getApiErrorMessage(err, "Failed to accept invite. The link may have expired."));
    } finally {
      setSubmitting(false);
    }
  };

  const inputWrap = "flex items-center gap-2.5 rounded-xl border border-edge bg-surface px-3.5 py-3 transition-colors focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15";
  const inputBase = "min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-4 outline-none";

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── LEFT — Form panel ── */}
      <div className="flex w-[45%] flex-shrink-0 flex-col overflow-auto bg-surface">
        <div className="flex-shrink-0 px-10 py-7">
          <div className="flex items-center">
            <img src="/logo-horizontal.svg" alt="MobPae" width="322" height="40" className="flex-shrink-0 object-contain" />
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center px-14 pb-10">
          <div className="w-full max-w-[380px]">

            {/* Loading state */}
            {loading && (
              <div className="flex flex-col items-center gap-3 py-16 text-ink-3">
                <Loader2 size={24} className="animate-spin" />
                <p className="text-sm">Verifying your invite…</p>
              </div>
            )}

            {/* Invalid / expired */}
            {!loading && previewErr && (
              <div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-soft">
                  <AlertCircle size={24} className="text-danger" />
                </div>
                <h1 className="mb-2 text-[24px] font-bold tracking-tight text-ink">Invite unavailable</h1>
                <p className="mb-6 text-sm leading-relaxed text-ink-3">{previewErr}</p>
                <button
                  onClick={() => navigate("/login")}
                  className="text-[13px] font-medium text-brand hover:underline"
                >
                  Go to sign in →
                </button>
              </div>
            )}

            {/* Success */}
            {done && (
              <div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-success-bg">
                  <CheckCircle2 size={24} className="text-success" />
                </div>
                <h1 className="mb-2 text-[24px] font-bold tracking-tight text-ink">Account created!</h1>
                <p className="mb-6 text-sm leading-relaxed text-ink-3">
                  You've joined <span className="font-semibold text-ink">{preview?.companyName}</span> as{" "}
                  <span className="font-semibold text-ink">{ROLE_LABEL[preview?.role ?? ""] ?? preview?.role}</span>.
                  Sign in to access your portal.
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold tracking-wide text-white shadow-brand transition-all hover:bg-brand-hover"
                >
                  Sign in now
                </button>
              </div>
            )}

            {/* Form */}
            {!loading && !previewErr && !done && preview && (
              <>
                <h1 className="mb-1 text-[28px] font-bold tracking-tight text-ink">You're invited!</h1>
                <p className="mb-6 text-sm leading-relaxed text-ink-3">
                  Set a password to join <span className="font-semibold text-ink">{preview.companyName}</span>
                </p>

                {/* Invite card */}
                <div className="mb-6 rounded-xl border border-edge bg-canvas px-4 py-3.5 flex items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-ink to-[#2A2C45] text-[13px] font-bold text-white">
                    {preview.companyName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-ink truncate">{preview.companyName}</p>
                    <p className="text-[12px] text-ink-3 truncate">{preview.email}</p>
                  </div>
                  <span className={`inline-flex h-[20px] flex-shrink-0 items-center rounded px-2 text-[11px] font-semibold ${ROLE_CLS[preview.role] ?? "bg-surface-muted text-ink-3"}`}>
                    {ROLE_LABEL[preview.role] ?? preview.role}
                  </span>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-medium text-ink-2">New password</label>
                    <div className={inputWrap}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 text-ink-disabled"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      <input
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        className={inputBase}
                      />
                      <button type="button" onClick={() => setShowPass(v => !v)} aria-label={showPass ? "Hide" : "Show"} className="flex-shrink-0 text-ink-disabled transition-colors hover:text-ink-3">
                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-1.5">
                    <label className="text-xs font-medium text-ink-2">Confirm password</label>
                    <div className={inputWrap}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 text-ink-disabled"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      <input
                        type={showConf ? "text" : "password"}
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        placeholder="Re-enter your password"
                        required
                        autoComplete="new-password"
                        className={inputBase}
                      />
                      <button type="button" onClick={() => setShowConf(v => !v)} aria-label={showConf ? "Hide" : "Show"} className="flex-shrink-0 text-ink-disabled transition-colors hover:text-ink-3">
                        {showConf ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {submitErr && (
                    <div className="flex items-center gap-2 rounded-xl border border-danger-bg bg-danger-soft px-3.5 py-3 text-[13px] font-medium text-danger">
                      <AlertCircle size={14} className="flex-shrink-0" />
                      {submitErr}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold tracking-wide text-white shadow-brand transition-all hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                  >
                    {submitting
                      ? <><Loader2 size={16} className="animate-spin" /> Creating account…</>
                      : <>Create account &amp; join <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
                    }
                  </button>
                </form>

                <p className="mt-5 text-center text-[12px] text-ink-disabled">
                  Already have an account?{" "}
                  <button onClick={() => navigate("/login")} className="font-medium text-brand hover:underline">Sign in</button>
                </p>
              </>
            )}

            {!done && (
              <div className="mt-7 flex items-center gap-2 rounded-xl bg-canvas px-4 py-3">
                <Shield size={14} className="flex-shrink-0 text-ink-4" />
                <p className="text-[12px] leading-snug text-ink-4">
                  Your data is protected with bank-grade encryption and security.
                </p>
              </div>
            )}

            <p className="mt-5 text-center text-[12px] text-ink-disabled">
              © {new Date().getFullYear()} MobPae Technologies Pvt. Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT — Brand panel ── */}
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#8B7CFF] via-brand to-brand-active px-12 py-12">
        <div className="pointer-events-none absolute -right-[10%] -top-[15%] h-[400px] w-[400px] rounded-full bg-radial from-white/10 to-transparent" />
        <div className="pointer-events-none absolute -bottom-[10%] -left-[8%] h-[320px] w-[320px] rounded-full bg-radial from-white/8 to-transparent" />
        <div className="relative z-10 w-full max-w-[420px] text-center">
          <img src="/logo-icon-white.svg" alt="MobPae" width="56" height="36" className="mx-auto mb-6 object-contain" />
          <h2 className="mb-3 text-[32px] font-bold leading-[1.15] tracking-tight text-white">
            Welcome to the team
          </h2>
          <p className="mx-auto mb-8 max-w-[320px] text-[15px] leading-relaxed text-white/70">
            You've been invited to manage salary advances, employees, and settlements for your organisation.
          </p>
          <div className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm px-5 py-4 text-left space-y-3">
            {[
              { emoji: "👥", text: "View and manage employee advances" },
              { emoji: "✅", text: "Approve or review requests" },
              { emoji: "📊", text: "Track settlements and repayments" },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="text-lg">{item.emoji}</span>
                <p className="text-[13px] text-white/80">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
