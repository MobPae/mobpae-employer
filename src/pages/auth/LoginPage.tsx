import { Clock, Eye, EyeOff, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getApiErrorMessage, isForbidden } from "../../services/api-errors";

function EmployerPreview() {
  return (
    <div className="w-full max-w-[440px] rounded-2xl bg-surface p-4 shadow-overlay">
      <div className="mb-3.5 flex items-center gap-2">
        <div className="flex gap-1">
          <div className="h-2 w-2 rounded-full bg-red-300" />
          <div className="h-2 w-2 rounded-full bg-yellow-200" />
          <div className="h-2 w-2 rounded-full bg-green-300" />
        </div>
        <div className="h-1.5 flex-1 rounded-full bg-surface-muted" />
      </div>
      <div className="mb-3 grid grid-cols-3 gap-2">
        {[
          { label: "Total Employees", value: "1,248",       bg: "bg-brand-soft"    },
          { label: "Pending Requests", value: "14",          bg: "bg-warning-bg"    },
          { label: "This Month",       value: "₹18,42,500", bg: "bg-success-bg"    },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-lg px-3 py-2.5`}>
            <p className="mb-1 text-[9px] text-ink-3">{s.label}</p>
            <p className="text-[13px] font-bold text-ink">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg bg-canvas px-3 py-2.5">
        <p className="mb-2 text-[10px] font-semibold text-ink">Recent Requests</p>
        {[
          { name: "Ananya Sharma", action: "Salary advance request",  time: "Today",       status: "Pending",   statusCls: "bg-warning-bg text-warning-dark"  },
          { name: "Rohan Mehta",   action: "Advance disbursed",        time: "Yesterday",   status: "Completed", statusCls: "bg-success-bg text-success"         },
          { name: "Divya Nair",    action: "Repayment received",       time: "12 Jun 2025", status: "Completed", statusCls: "bg-success-bg text-success"         },
        ].map((r) => (
          <div key={r.name} className="mb-1.5 flex items-center gap-2 border-b border-edge-2 pb-1.5 last:border-0 last:mb-0 last:pb-0">
            <div className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#8B7CFF] to-brand text-[9px] font-bold text-white">
              {r.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-semibold leading-snug text-ink">{r.name}</p>
              <p className="text-[8px] leading-snug text-ink-3">{r.action}</p>
            </div>
            <div className="text-right">
              <p className="mb-0.5 text-[8px] text-ink-4">{r.time}</p>
              <span className={`rounded-full px-1.5 py-px text-[8px] font-semibold ${r.statusCls}`}>{r.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");
  const [pending,  setPending]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  // useState, not useRef: this value is read during render (below) to decide
  // the redirect target, and refs aren't safe to read outside events/effects.
  const [loginAttempted, setLoginAttempted] = useState(false);

  // Mount-only check of a one-shot sessionStorage flag set by the http client.
  useEffect(() => {
    if (sessionStorage.getItem("mobpae_session_expired")) {
      sessionStorage.removeItem("mobpae_session_expired");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("Your session has expired. Please sign in again.");
    }
  }, []);

  if (authLoading) return null;
  if (!loginAttempted && isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginAttempted(true);
    setError(""); setPending(false); setLoading(true);
    try {
      const result = await login({ email: email.trim().toLowerCase(), password });
      if (!result.passwordChanged) {
        navigate("/change-password", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setLoginAttempted(false);
      if (isForbidden(err)) setPending(true);
      else setError(getApiErrorMessage(err, "Invalid email or password."));
    } finally {
      setLoading(false);
    }
  };

  const inputWrap = "flex items-center gap-2.5 rounded-xl border border-edge bg-surface px-3.5 py-3 transition-colors focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15";
  const inputBase = "min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-4 outline-none";

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── LEFT — Form panel ── */}
      <div className="flex w-[45%] flex-shrink-0 flex-col overflow-auto bg-surface">
        <div className="flex-shrink-0 px-10 py-7">
          <div className="flex items-center gap-2.5">
            <img src="/logo-icon.svg" alt="MobPae" width="44" height="28" className="flex-shrink-0 object-contain" />
            <span className="text-[16px] font-bold tracking-tight text-ink">MobPae</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center px-14 pb-10">
          <div className="w-full max-w-[380px]">
            <h1 className="mb-2 text-[28px] font-bold tracking-tight text-ink">Welcome back 👋</h1>
            <p className="mb-8 text-sm leading-relaxed text-ink-3">
              Sign in to access your MobPae employer portal
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-ink-2">Email address</label>
                <div className={inputWrap}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 text-ink-disabled"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required autoComplete="email" className={inputBase} />
                </div>
              </div>

              <div className="grid gap-1.5">
                <label className="text-xs font-medium text-ink-2">Password</label>
                <div className={inputWrap}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 text-ink-disabled"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required autoComplete="current-password" className={inputBase} />
                  <button type="button" onClick={() => setShowPass(v => !v)} aria-label={showPass ? "Hide password" : "Show password"} className="flex-shrink-0 text-ink-disabled transition-colors hover:text-ink-3">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button type="button" onClick={() => navigate("/forgot-password")} className="text-[13px] font-medium text-brand hover:underline">
                  Forgot password?
                </button>
              </div>

              {pending && (
                <div className="flex items-start gap-2.5 rounded-xl border border-warning-bg bg-warning-soft px-3.5 py-3">
                  <Clock size={14} className="mt-0.5 flex-shrink-0 text-warning" />
                  <div>
                    <p className="text-[13px] font-semibold text-warning-dark">Account Pending Approval</p>
                    <p className="mt-0.5 text-xs leading-snug text-warning">Your account is under review. You'll be notified once approved.</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-danger-bg bg-danger-soft px-3.5 py-3 text-[13px] font-medium text-danger">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold tracking-wide text-white shadow-brand transition-all hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
              >
                {loading ? (
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <>Sign in <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
                )}
              </button>
            </form>

            <div className="mt-7 flex items-center gap-2 rounded-xl bg-canvas px-4 py-3">
              <Shield size={14} className="flex-shrink-0 text-ink-4" />
              <p className="text-[12px] leading-snug text-ink-4">
                Your data is protected with bank-grade encryption and security.
              </p>
            </div>

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
        <div className="relative z-10 w-full max-w-[480px] text-center">
          <h2 className="mb-3 text-[36px] font-bold leading-[1.15] tracking-tight text-white">
            Smart. Secure. Simple.
          </h2>
          <p className="mx-auto mb-10 max-w-[360px] text-[16px] leading-relaxed text-white/70">
            Manage your team's salary advances, approvals, and settlements — all in one place.
          </p>
          <EmployerPreview />
        </div>
      </div>
    </div>
  );
}
