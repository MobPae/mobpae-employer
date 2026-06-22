import { Clock, Eye, EyeOff } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { isForbidden, getApiErrorMessage } from "../../services/api-errors";

const B  = "#7679FF";
const BD = "#5659D9";

const features = [
  { icon: "⊞", label: "Employee Management",  sub: "Onboard, activate, manage payroll" },
  { icon: "₹", label: "Salary Advances",       sub: "Instant approval, zero liability"  },
  { icon: "↻", label: "Payroll Integration",   sub: "Auto-sync with payroll cycles"     },
  { icon: "▲", label: "Recovery Tracking",     sub: "Real-time repayment dashboard"     },
];

export function LoginPage() {
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");
  const [pending,  setPending]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const loginAttempted = useRef(false);

  useEffect(() => {
    if (sessionStorage.getItem("mobpae_session_expired")) {
      sessionStorage.removeItem("mobpae_session_expired");
      setError("Your session has expired. Please sign in again.");
    }
  }, []);

  if (authLoading) return null;
  if (!loginAttempted.current && isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    loginAttempted.current = true;
    setError(""); setPending(false); setLoading(true);
    try {
      const result = await login({ email, password });
      if (!result.passwordChanged) {
        navigate("/change-password", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      loginAttempted.current = false;
      if (isForbidden(err)) setPending(true);
      else setError(getApiErrorMessage(err, "Invalid credentials. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

      {/* ── LEFT PANEL ─────────────────────────────────────────────────────── */}
      <div style={{
        width: "55%", flexShrink: 0,
        background: "#191A2E",
        display: "flex", flexDirection: "column",
        position: "relative", overflow: "hidden",
      }}>
        {/* Dot-grid overlay */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `radial-gradient(circle, rgba(118,121,255,0.12) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }} />
        {/* Purple glow */}
        <div style={{
          position: "absolute", top: "-10%", right: "-5%",
          width: 480, height: 480, borderRadius: "50%", pointerEvents: "none",
          background: "radial-gradient(circle, rgba(118,121,255,0.18) 0%, transparent 70%)",
        }} />

        {/* Logo */}
        <div style={{ padding: "28px 40px", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <svg width="28" height="28" viewBox="0 0 100 100" fill="none" aria-hidden="true">
              <defs><clipPath id="emp-lp-clip"><rect width="100" height="100" rx="20" ry="20"/></clipPath></defs>
              <rect width="100" height="100" rx="20" ry="20" fill="rgba(118,121,255,0.25)"/>
              <g clipPath="url(#emp-lp-clip)">
                <polygon points="6,100 18,100 68,0 56,0" fill="white" opacity="0.95"/>
                <polygon points="30,100 42,100 92,0 80,0" fill="white" opacity="0.95"/>
                <polygon points="54,100 66,100 100,32 100,8" fill="white" opacity="0.95"/>
              </g>
            </svg>
            <span style={{ fontSize: 14, fontWeight: 700, color: "white", letterSpacing: "-0.02em" }}>MobPae</span>
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 48px", position: "relative", zIndex: 1 }}>

          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid rgba(118,121,255,0.35)", borderRadius: 999, padding: "5px 14px", width: "fit-content", marginBottom: 32, background: "rgba(118,121,255,0.10)" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: B, boxShadow: `0 0 6px ${B}` }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#A5A7FF", letterSpacing: "0.10em", textTransform: "uppercase" }}>Employer Portal</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: 48, fontWeight: 800, color: "white", lineHeight: 1.08, letterSpacing: "-0.03em", margin: "0 0 20px" }}>
            Workforce<br />
            <em style={{ fontStyle: "italic", fontWeight: 400, color: "rgba(255,255,255,0.50)" }}>benefits</em><br />
            at scale.
          </h1>

          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, maxWidth: 340, marginBottom: 40 }}>
            Enable earned wage access for your team — zero cost to the employer, instant impact on employee wellbeing.
          </p>

          {/* Feature cards 2×2 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {features.map(f => (
              <div key={f.label} style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12, padding: "16px 18px",
              }}>
                <div style={{ fontSize: 16, marginBottom: 8, color: "#7679FF" }}>{f.icon}</div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "white", marginBottom: 3, lineHeight: 1.3 }}>{f.label}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.4 }}>{f.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Status bar */}
        <div style={{
          position: "relative", zIndex: 1,
          borderTop: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(0,0,0,0.15)",
          padding: "12px 40px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#7679FF", boxShadow: "0 0 6px #7679FF" }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.40)" }}>Protected employer workspace</span>
          </div>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: "0.04em" }}>MobPae v2.0</span>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, background: "#F7F7FB",
        display: "flex", flexDirection: "column",
        overflow: "auto",
      }}>
        {/* Top bar */}
        <div style={{ padding: "28px 48px", display: "flex", justifyContent: "flex-end" }}>
          <span style={{ fontSize: 12, color: "#8D90A3" }}>Secure Employer Access</span>
        </div>

        {/* Form area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 64px 40px" }}>
          <div style={{ maxWidth: 380, width: "100%", margin: "0 auto" }}>

            {/* Access badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(118,121,255,0.10)", border: "1px solid rgba(118,121,255,0.25)", borderRadius: 999, padding: "5px 14px", marginBottom: 28 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: B }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: BD, letterSpacing: "0.10em", textTransform: "uppercase" }}>Employer Access</span>
            </div>

            {/* Heading */}
            <h2 style={{ fontSize: 30, fontWeight: 800, color: "#191A2E", letterSpacing: "-0.025em", lineHeight: 1.15, margin: "0 0 10px" }}>
              Employer sign in
            </h2>
            <p style={{ fontSize: 14, color: "#8D90A3", lineHeight: 1.6, marginBottom: 36 }}>
              Manage your team's salary advances, payroll, and employee wellbeing.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

              {/* Email */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#191A2E", marginBottom: 8 }}>Work Email</label>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "white", border: "1.5px solid #E4E4EF", borderRadius: 10, padding: "11px 14px",
                  transition: "border-color 0.15s",
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#B7B9C7" strokeWidth="2" strokeLinecap="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com" required autoComplete="email"
                    style={{ flex: 1, fontSize: 14, color: "#191A2E", background: "transparent", outline: "none", minWidth: 0, fontFamily: "inherit" }}
                    onFocus={e => { (e.target.closest("div") as HTMLElement).style.borderColor = B; }}
                    onBlur={e  => { (e.target.closest("div") as HTMLElement).style.borderColor = "#E4E4EF"; }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#191A2E" }}>Password</label>
                  <button type="button" onClick={() => navigate("/forgot-password")} style={{ fontSize: 13, color: BD, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>Forgot password?</button>
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "white", border: "1.5px solid #E4E4EF", borderRadius: 10, padding: "11px 14px",
                  transition: "border-color 0.15s",
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#B7B9C7" strokeWidth="2" strokeLinecap="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <input
                    type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••" required autoComplete="current-password"
                    style={{ flex: 1, fontSize: 14, color: "#191A2E", background: "transparent", outline: "none", minWidth: 0, fontFamily: "inherit" }}
                    onFocus={e => { (e.target.closest("div") as HTMLElement).style.borderColor = B; }}
                    onBlur={e  => { (e.target.closest("div") as HTMLElement).style.borderColor = "#E4E4EF"; }}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} style={{ color: "#B7B9C7", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", flexShrink: 0 }}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Pending */}
              {pending && (
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 9, padding: "12px 14px" }}>
                  <Clock size={14} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#92400e" }}>Account Pending Approval</p>
                    <p style={{ fontSize: 12, color: "#b45309", marginTop: 3, lineHeight: 1.5 }}>Your account is under review. You'll be notified once approved.</p>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#C64E57", fontWeight: 500 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit" disabled={loading}
                style={{
                  width: "100%", height: 50, marginTop: 4,
                  background: loading ? "#A5A7FF" : `linear-gradient(135deg, ${BD} 0%, ${B} 100%)`,
                  color: "white", borderRadius: 10, border: "none",
                  fontSize: 14, fontWeight: 700, letterSpacing: "0.01em",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "0 4px 20px rgba(118,121,255,0.35)",
                  transition: "all 0.15s",
                  fontFamily: "inherit",
                }}
              >
                {loading ? (
                  <svg style={{ animation: "spin 1s linear infinite" }} width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <>Continue to verification <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
                )}
              </button>
            </form>

            <p style={{ marginTop: 24, fontSize: 12, color: "#B7B9C7", textAlign: "center" }}>
              © {new Date().getFullYear()} MobPae Financial Technologies
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
