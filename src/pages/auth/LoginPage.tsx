import { Clock, Eye, EyeOff, Shield } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { isForbidden, getApiErrorMessage } from "../../services/api-errors";

const P  = "#6C4CFF";
const PD = "#5B34FF";


// Mini employer dashboard preview for right panel
function EmployerPreview() {
  return (
    <div style={{
      background: "white",
      borderRadius: 16,
      padding: "16px 16px 12px",
      boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
      width: "100%",
      maxWidth: 440,
    }}>
      {/* Mini topbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FCA5A5" }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FDE68A" }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6EE7B7" }} />
        </div>
        <div style={{ flex: 1, height: 6, background: "#F3F4F6", borderRadius: 4 }} />
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
        {[
          { label: "Total Employees", value: "1,248",         color: "#F3F0FF" },
          { label: "Pending Requests", value: "14",            color: "#FEF3C7" },
          { label: "This Month",       value: "₹18,42,500",   color: "#DCFCE7" },
        ].map((s) => (
          <div key={s.label} style={{ background: s.color, borderRadius: 10, padding: "10px 12px" }}>
            <p style={{ fontSize: 9, color: "#6B7280", marginBottom: 4 }}>{s.label}</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent requests */}
      <div style={{ background: "#F8F9FC", borderRadius: 10, padding: "10px 12px" }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: "#111827", marginBottom: 8 }}>Recent Requests</p>
        {[
          { name: "Ananya Sharma",  action: "Salary advance request",  time: "Today",       status: "Pending",   color: "#FEF3C7", text: "#92400E" },
          { name: "Rohan Mehta",    action: "Advance disbursed",        time: "Yesterday",   status: "Completed", color: "#DCFCE7", text: "#16A34A" },
          { name: "Divya Nair",     action: "Repayment received",       time: "12 Jun 2025", status: "Completed", color: "#DCFCE7", text: "#16A34A" },
          { name: "Karan Iyer",     action: "Salary advance approved",  time: "10 Jun 2025", status: "Approved",  color: "#DCFCE7", text: "#16A34A" },
        ].map((r) => (
          <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 7, marginBottom: 7, borderBottom: "1px solid #E5E7EB" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg, #8B7CFF, #6C4CFF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "white", fontWeight: 700, flexShrink: 0 }}>
              {r.name[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 9, fontWeight: 600, color: "#111827", lineHeight: 1.2 }}>{r.name}</p>
              <p style={{ fontSize: 8, color: "#6B7280", lineHeight: 1.2 }}>{r.action}</p>
            </div>
            <div>
              <p style={{ fontSize: 8, color: "#9CA3AF", marginBottom: 2, textAlign: "right" }}>{r.time}</p>
              <span style={{ fontSize: 8, fontWeight: 600, background: r.color, color: r.text, padding: "1px 6px", borderRadius: 999 }}>{r.status}</span>
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
  const [remember, setRemember] = useState(false);
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
      else setError(getApiErrorMessage(err, "Invalid email or password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "Inter, ui-sans-serif, sans-serif" }}>

      {/* ── LEFT — Form panel ───────────────────────────────────── */}
      <div style={{
        width: "45%", flexShrink: 0,
        background: "white",
        display: "flex", flexDirection: "column",
        overflow: "auto",
      }}>
        {/* Logo */}
        <div style={{ padding: "28px 40px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logo-icon.svg" alt="MobPae" width="44" height="28" style={{ objectFit: "contain", flexShrink: 0 }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>MobPae</span>
          </div>
        </div>

        {/* Form area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 56px 40px" }}>
          <div style={{ maxWidth: 380, width: "100%" }}>

            {/* Heading */}
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827", letterSpacing: "-0.025em", lineHeight: 1.2, margin: "0 0 8px" }}>
              Welcome back 👋
            </h1>
            <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6, marginBottom: 32 }}>
              Sign in to access your MobPae employer portal
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Email */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                  Email address
                </label>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "white", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "11px 14px",
                  transition: "border-color 0.15s",
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email" required autoComplete="email"
                    style={{ flex: 1, fontSize: 14, color: "#111827", background: "transparent", outline: "none", border: "none", minWidth: 0, fontFamily: "inherit" }}
                    onFocus={e  => { (e.target.closest("div") as HTMLElement).style.borderColor = P; }}
                    onBlur={e   => { (e.target.closest("div") as HTMLElement).style.borderColor = "#E5E7EB"; }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 6 }}>
                  Password
                </label>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "white", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: "11px 14px",
                  transition: "border-color 0.15s",
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <input
                    type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password" required autoComplete="current-password"
                    style={{ flex: 1, fontSize: 14, color: "#111827", background: "transparent", outline: "none", border: "none", minWidth: 0, fontFamily: "inherit" }}
                    onFocus={e  => { (e.target.closest("div") as HTMLElement).style.borderColor = P; }}
                    onBlur={e   => { (e.target.closest("div") as HTMLElement).style.borderColor = "#E5E7EB"; }}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} style={{ color: "#D1D5DB", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", flexShrink: 0 }}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#6B7280" }}>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    style={{ accentColor: P, width: 15, height: 15, borderRadius: 4, cursor: "pointer" }}
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  style={{ fontSize: 13, color: P, fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
                >
                  Forgot password?
                </button>
              </div>

              {/* Pending */}
              {pending && (
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 14px" }}>
                  <Clock size={14} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#92400e" }}>Account Pending Approval</p>
                    <p style={{ fontSize: 12, color: "#b45309", marginTop: 3, lineHeight: 1.5 }}>Your account is under review. You'll be notified once approved.</p>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#DC2626", fontWeight: 500 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit" disabled={loading}
                style={{
                  width: "100%", height: 48, marginTop: 4,
                  background: loading ? "#A89CFF" : `linear-gradient(135deg, ${PD} 0%, ${P} 100%)`,
                  color: "white", borderRadius: 12, border: "none",
                  fontSize: 14, fontWeight: 600, letterSpacing: "0.01em",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "0 4px 20px rgba(108,76,255,0.30)",
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
                  <>Sign in <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
                )}
              </button>
            </form>

            {/* Trust note */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 28, padding: "12px 16px", background: "#F8F9FC", borderRadius: 10 }}>
              <Shield size={14} style={{ color: "#9CA3AF", flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.5 }}>
                Your data is protected with bank-grade encryption and security.
              </p>
            </div>

            <p style={{ marginTop: 20, fontSize: 12, color: "#D1D5DB", textAlign: "center" }}>
              © {new Date().getFullYear()} MobPae Technologies Pvt. Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT — Brand panel ──────────────────────────────────── */}
      <div style={{
        flex: 1,
        background: "linear-gradient(135deg, #8B7CFF 0%, #6C4CFF 50%, #5B34FF 100%)",
        display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        padding: "48px 48px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative blobs */}
        <div style={{
          position: "absolute", top: "-15%", right: "-10%",
          width: 400, height: 400, borderRadius: "50%", pointerEvents: "none",
          background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: "-10%", left: "-8%",
          width: 320, height: 320, borderRadius: "50%", pointerEvents: "none",
          background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)",
        }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 480, textAlign: "center" }}>
          <h2 style={{ fontSize: 36, fontWeight: 700, color: "white", letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: 12 }}>
            Smart. Secure. Simple.
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.70)", lineHeight: 1.6, marginBottom: 40, maxWidth: 360, margin: "0 auto 40px" }}>
            Manage your team's salary advances, approvals, and payroll — all in one place.
          </p>

          {/* Employer dashboard preview card */}
          <EmployerPreview />
        </div>
      </div>
    </div>
  );
}
