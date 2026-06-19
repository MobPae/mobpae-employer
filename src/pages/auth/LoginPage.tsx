import { Clock, Eye, EyeOff } from "lucide-react";
import { useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { isForbidden, getApiErrorMessage } from "../../services/api-errors";

const B    = "#059669";
const BD   = "#047857";
const CREAM = "#f8fafc";

const features = [
  { icon: "⊞", label: "Employee Management",   sub: "Onboard, activate, manage payroll"  },
  { icon: "₹", label: "Salary Advances",        sub: "Instant approval, zero liability"   },
  { icon: "↻", label: "Payroll Integration",    sub: "Auto-sync with payroll cycles"      },
  { icon: "▲", label: "Recovery Tracking",      sub: "Real-time repayment dashboard"      },
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
    <div style={{ display: "flex", height: "100vh", overflow: "hidden",  }}>

      {/* ── LEFT PANEL ─────────────────────────────────────────────────────── */}
      <div style={{
        width: "55%", flexShrink: 0,
        background: `linear-gradient(155deg, #022c22 0%, #065f46 30%, ${BD} 60%, ${B} 100%)`,
        display: "flex", flexDirection: "column",
        position: "relative", overflow: "hidden",
      }}>
        {/* Grid overlay */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }} />


        {/* Main content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 48px", position: "relative", zIndex: 1 }}>

          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid rgba(255,255,255,0.30)", borderRadius: 999, padding: "5px 14px", width: "fit-content", marginBottom: 32 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.6)" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.75)", letterSpacing: "0.10em", textTransform: "uppercase" }}>Employer Portal</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontSize: 52, fontWeight: 800, color: "white", lineHeight: 1.08, letterSpacing: "-0.03em", margin: "0 0 20px" }}>
            Workforce<br />
            <em style={{ fontStyle: "italic", fontWeight: 400, color: "rgba(255,255,255,0.70)" }}>benefits</em><br />
            at scale.
          </h1>

          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.50)", lineHeight: 1.7, maxWidth: 340, marginBottom: 40 }}>
            Enable earned wage access for your team — zero cost to the employer, instant impact on employee wellbeing.
          </p>

          {/* Feature cards 2×2 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {features.map(f => (
              <div key={f.label} style={{
                background: "rgba(0,0,0,0.22)", border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 12, padding: "16px 18px",
              }}>
                <div style={{ fontSize: 16, marginBottom: 8, color: "rgba(255,255,255,0.55)" }}>{f.icon}</div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "white", marginBottom: 3, lineHeight: 1.3 }}>{f.label}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.40)", lineHeight: 1.4 }}>{f.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Status bar */}
        <div style={{
          position: "relative", zIndex: 1,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.18)",
          padding: "12px 40px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.50)" }}>All services operational</span>
          </div>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.30)", letterSpacing: "0.04em" }}>v2.1.0</span>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, background: CREAM,
        display: "flex", flexDirection: "column",
        overflow: "auto",
      }}>
        {/* Top logo bar */}
        <div style={{ padding: "24px 48px", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: B, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="10" viewBox="0 0 22 16" fill="none">
                <path d="M1 14C1 14 4 3 7 8C10 13 11 2 14 8C17 14 21 3 21 3" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.01em" }}>MobPae</span>
          </div>
        </div>

        {/* Form area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 64px 40px" }}>
          <div style={{ maxWidth: 380, width: "100%", margin: "0 auto" }}>

            {/* Access badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(5,150,105,0.10)", border: "1px solid rgba(5,150,105,0.20)", borderRadius: 999, padding: "5px 14px", marginBottom: 28 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", border: `1.5px solid ${B}` }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: B, letterSpacing: "0.10em", textTransform: "uppercase" }}>Employer Access</span>
            </div>

            {/* Heading */}
            <h2 style={{ fontSize: 32, fontWeight: 800, color: "#111", letterSpacing: "-0.025em", lineHeight: 1.15, margin: "0 0 10px" }}>
              Employer sign in
            </h2>
            <p style={{ fontSize: 14, color: "#888", lineHeight: 1.6, marginBottom: 36 }}>
              Manage your team's salary advances, payroll, and employee wellbeing.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

              {/* Email */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 8 }}>Work Email</label>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "white", border: "1.5px solid #e8e0d8", borderRadius: 10, padding: "11px 14px",
                  transition: "border-color 0.15s",
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com" required autoComplete="email"
                    style={{ flex: 1, fontSize: 14, color: "#111", background: "transparent", outline: "none", minWidth: 0 }}
                    onFocus={e => { (e.target.closest("div") as HTMLElement).style.borderColor = B; }}
                    onBlur={e  => { (e.target.closest("div") as HTMLElement).style.borderColor = "#e8e0d8"; }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>Password</label>
                  <button type="button" onClick={() => navigate("/forgot-password")} style={{ fontSize: 13, color: B, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}>Forgot password?</button>
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "white", border: "1.5px solid #e8e0d8", borderRadius: 10, padding: "11px 14px",
                  transition: "border-color 0.15s",
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <input
                    type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••" required autoComplete="current-password"
                    style={{ flex: 1, fontSize: 14, color: "#111", background: "transparent", outline: "none", minWidth: 0 }}
                    onFocus={e => { (e.target.closest("div") as HTMLElement).style.borderColor = B; }}
                    onBlur={e  => { (e.target.closest("div") as HTMLElement).style.borderColor = "#e8e0d8"; }}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} style={{ color: "#bbb", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", flexShrink: 0 }}>
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
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#e11d48", fontWeight: 500 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit" disabled={loading}
                style={{
                  width: "100%", height: 50, marginTop: 4,
                  background: loading ? "#6ee7b7" : `linear-gradient(135deg, ${BD} 0%, ${B} 100%)`,
                  color: "white", borderRadius: 10, border: "none",
                  fontSize: 14, fontWeight: 700, letterSpacing: "0.01em",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "0 4px 16px rgba(5,150,105,0.30)",
                  transition: "all 0.15s",
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

            <p style={{ marginTop: 24, fontSize: 12, color: "#bbb", textAlign: "center" }}>
              © {new Date().getFullYear()} MobPae Financial Technologies
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
