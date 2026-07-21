import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/auth.service";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim().toLowerCase());
    } catch {
      // Always show success to prevent email enumeration
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <div className="w-full max-w-[400px]">
        <div className="mb-10 flex items-center">
          <img src="/logo-horizontal.svg" alt="MobPae" width="225" height="28" className="flex-shrink-0 object-contain" />
        </div>

        {sent ? (
          <>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-brand-muted bg-brand-soft">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 className="mb-2 text-[26px] font-bold tracking-tight text-ink">Check your inbox</h2>
            <p className="mb-7 text-sm leading-relaxed text-ink-3">
              If an account exists for{" "}
              <strong className="font-semibold text-ink-2">{email}</strong>, a reset link has been sent. It expires in 15 minutes.
            </p>
            <button onClick={() => navigate("/login")} className="text-[13px] font-semibold text-brand hover:underline">
              ← Back to sign in
            </button>
          </>
        ) : (
          <>
            <h2 className="mb-2 text-[28px] font-bold tracking-tight text-ink">Reset password</h2>
            <p className="mb-7 text-sm leading-relaxed text-ink-3">
              Enter your work email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-ink">Work Email</label>
                <div className="flex items-center gap-2.5 rounded-xl border border-edge bg-surface px-3.5 py-3 transition-colors focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 text-ink-4"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com" required autoComplete="email"
                    className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-4 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-1 flex h-12 w-full items-center justify-center rounded-xl bg-brand text-sm font-semibold text-white shadow-brand transition-all hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>

            <p className="mt-5 text-center">
              <button onClick={() => navigate("/login")} className="text-[13px] font-semibold text-brand hover:underline">
                ← Back to sign in
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
