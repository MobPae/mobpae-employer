import { ArrowRight, Clock, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { isForbidden } from "../../services/api-errors";

export function LoginPage() {
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState("");
  const [pending, setPending]   = useState(false);
  const [loading, setLoading]   = useState(false);

  // Wait for auth check before deciding to redirect
  if (authLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPending(false);
    setLoading(true);
    try {
      await login({ email, password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (isForbidden(err)) {
        setPending(true);
      } else {
        setError(err instanceof Error ? err.message : "Invalid credentials. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] flex-col bg-[#c4522a] relative overflow-hidden flex-shrink-0">
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "28px 28px"
          }}
        />
        {/* Glow */}
        <div className="absolute top-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full bg-white/10 blur-[100px]" />
        <div className="absolute bottom-[-60px] right-[-60px] w-[300px] h-[300px] rounded-full bg-black/10 blur-[80px]" />

        <div className="relative flex flex-col h-full px-10 py-10 justify-center">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white font-[700] text-[15px]">
              M
            </div>
            <div>
              <p className="text-[14px] font-[600] text-white leading-none">MobPae</p>
              <p className="text-[10px] text-white/50 leading-none mt-0.5 uppercase tracking-[0.1em]">Employer Portal</p>
            </div>
          </div>

          {/* Main copy */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-3 py-1 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="text-[11px] font-[500] text-white/80 uppercase tracking-[0.07em]">Earned Wage Access</span>
            </div>
            <h1 className="text-[36px] font-[700] text-white leading-[1.15] tracking-[-0.02em]">
              Payroll-linked<br />salary advances<br />
              <span className="text-white/70">for your team.</span>
            </h1>
            <p className="mt-5 text-[14px] text-white/60 leading-relaxed max-w-[340px]">
              Manage employee salary access requests, track recoveries, and control payroll integrations from one place.
            </p>

            {/* Feature rows */}
            <div className="mt-8 space-y-3">
              {[
                { label: "Real-time salary request approvals" },
                { label: "Payroll-linked automated recovery" },
                { label: "Employee app activation control"   },
              ].map(({ label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-[13px] text-white/70">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-white/30">Trusted by leading companies</span>
            <div className="flex-1 h-px bg-white/15" />
          </div>
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 bg-[#f8fafc]">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-[#c4522a] flex items-center justify-center text-white font-[700] text-[15px]">
              M
            </div>
            <div>
              <p className="text-[14px] font-[600] text-slate-900">MobPae Employer</p>
            </div>
          </div>

          <p className="text-[11px] font-[600] uppercase tracking-[0.1em] text-[#c4522a] mb-2">Secure employer access</p>
          <h2 className="text-[28px] font-[700] text-slate-900 tracking-[-0.02em] leading-tight">
            Sign in to your<br />workspace
          </h2>
          <p className="mt-2 text-[13px] text-slate-500 leading-relaxed">
            Manage employees, approvals, and payroll recovery.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[12px] font-[500] text-slate-700 mb-1.5">Work email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  autoComplete="email"
                  required
                  className="w-full h-10 pl-9 pr-4 text-[13px] bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#c4522a] focus:ring-3 focus:ring-[#fdf3ee] transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[12px] font-[500] text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full h-10 pl-9 pr-10 text-[13px] bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#c4522a] focus:ring-3 focus:ring-[#fdf3ee] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Account pending approval */}
            {pending && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-4 flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock size={15} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-[13px] font-[600] text-amber-800 leading-snug">Account Pending Approval</p>
                  <p className="text-[12px] text-amber-700 mt-1.5 leading-relaxed">
                    Your employer account has been created successfully and is currently under review by MobPae.
                  </p>
                  <p className="text-[12px] text-amber-700 mt-1 leading-relaxed">
                    You will be able to login once onboarding approval is completed.
                  </p>
                </div>
              </div>
            )}

            {/* Generic error */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                <p className="text-[12px] text-red-600 font-[500]">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-[#c4522a] hover:bg-[#a8411f] text-white text-[13px] font-[600] flex items-center justify-center gap-2 transition disabled:opacity-50 mt-2"
            >
              {loading ? (
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" strokeLinecap="round" />
                </svg>
              ) : (
                <>Sign in <ArrowRight size={14} /></>
              )}
            </button>
          </form>

          {/* Info box */}
          <div className="mt-6 bg-white border border-slate-100 rounded-xl p-4 flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Lock size={12} className="text-slate-500" />
            </div>
            <div>
              <p className="text-[12px] font-[500] text-slate-800">Employer access only</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Use credentials provisioned by your MobPae administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
