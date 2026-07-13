import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "../../services/auth.service";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [done,            setDone]            = useState(false);
  const [error,           setError]           = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    if (newPassword.length < 8)          { setError("Password must be at least 8 characters."); return; }
    if (!token)                          { setError("Invalid or missing reset token."); return; }
    setLoading(true);
    try {
      await authService.resetPassword(token, newPassword);
      setDone(true);
    } catch {
      setError("This reset link is invalid or has expired. Please request a new one.");
    } finally {
      setLoading(false);
    }
  };

  const inputWrap = "flex items-center gap-2.5 rounded-xl border border-edge bg-surface px-3.5 py-3 transition-colors focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15";

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <div className="w-full max-w-[400px]">
        <div className="mb-10 flex items-center gap-2">
          <img src="/logo-icon.svg" alt="MobPae" width="32" height="21" className="flex-shrink-0 object-contain" />
          <span className="text-[15px] font-bold tracking-tight text-ink">MobPae</span>
        </div>

        {done ? (
          <>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-brand-muted bg-brand-soft">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 className="mb-2 text-[26px] font-bold tracking-tight text-ink">Password updated</h2>
            <p className="mb-7 text-sm leading-relaxed text-ink-3">
              Your password has been reset. All active sessions have been signed out — please sign in again.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-brand text-sm font-semibold text-white shadow-brand transition-all hover:bg-brand-hover"
            >
              Sign in
            </button>
          </>
        ) : (
          <>
            <h2 className="mb-2 text-[28px] font-bold tracking-tight text-ink">Set new password</h2>
            <p className="mb-7 text-sm leading-relaxed text-ink-3">
              Choose a strong password. All active sessions will be signed out.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {[
                { label: "New Password",     val: newPassword,     set: setNewPassword,     show: showNew,     toggle: () => setShowNew(v => !v) },
                { label: "Confirm Password", val: confirmPassword, set: setConfirmPassword, show: showConfirm, toggle: () => setShowConfirm(v => !v) },
              ].map(({ label, val, set, show, toggle }) => (
                <div key={label} className="grid gap-1.5">
                  <label className="text-xs font-semibold text-ink">{label}</label>
                  <div className={inputWrap}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 text-ink-4"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <input
                      type={show ? "text" : "password"} value={val} onChange={e => set(e.target.value)}
                      placeholder="••••••••" required
                      className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-4 outline-none"
                    />
                    <button type="button" onClick={toggle} className="flex-shrink-0 text-ink-disabled transition-colors hover:text-ink-3">
                      {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              ))}

              {error && (
                <div className="rounded-xl border border-danger-bg bg-danger-soft px-3.5 py-3 text-[13px] font-medium text-danger">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 flex h-12 w-full items-center justify-center rounded-xl bg-brand text-sm font-semibold text-white shadow-brand transition-all hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Resetting…" : "Reset password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
