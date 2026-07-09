import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/auth.service";

const B  = "#7679FF";
const BD = "#5659D9";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword(email);
    } catch {
      // Always show success to prevent email enumeration
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f8fafc", alignItems: "center", justifyContent: "center" }}>
      <div style={{ maxWidth: 400, width: "100%", padding: "0 24px" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 40 }}>
          <img src="/logo-icon.svg" alt="MobPae" width="32" height="21" style={{ objectFit: "contain", flexShrink: 0 }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: "#191A2E", letterSpacing: "-0.01em" }}>MobPae</span>
        </div>

        {sent ? (
          <>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "#ECEBFF", border: "1px solid #C8C9FF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7679FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#111", letterSpacing: "-0.025em", margin: "0 0 10px" }}>Check your inbox</h2>
            <p style={{ fontSize: 14, color: "#8D90A3", lineHeight: 1.6, marginBottom: 28 }}>
              If an account exists for <strong style={{ color: "#62657A" }}>{email}</strong>, a reset link has been sent. It expires in 15 minutes.
            </p>
            <button onClick={() => navigate("/login")} style={{ fontSize: 13, color: B, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
              ← Back to sign in
            </button>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#111", letterSpacing: "-0.025em", margin: "0 0 10px" }}>Reset password</h2>
            <p style={{ fontSize: 14, color: "#8D90A3", lineHeight: 1.6, marginBottom: 28 }}>
              Enter your work email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 8 }}>Work Email</label>
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "white", border: "1.5px solid #e8e0d8", borderRadius: 8, padding: "11px 14px", transition: "border-color 0.15s" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8D90A3" strokeWidth="2" strokeLinecap="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com" required autoComplete="email"
                    style={{ flex: 1, fontSize: 14, color: "#111", background: "transparent", outline: "none", minWidth: 0 }}
                    onFocus={e => { (e.target.closest("div") as HTMLElement).style.borderColor = B; }}
                    onBlur={e  => { (e.target.closest("div") as HTMLElement).style.borderColor = "#e8e0d8"; }}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} style={{
                width: "100%", height: 48, marginTop: 4,
                background: loading ? "#c4825e" : `linear-gradient(135deg, ${BD} 0%, ${B} 100%)`,
                color: "white", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 4px 16px rgba(118,121,255,0.30)", transition: "all 0.15s",
              }}>
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>

            <p style={{ marginTop: 20, textAlign: "center" }}>
              <button onClick={() => navigate("/login")} style={{ fontSize: 13, color: B, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
                ← Back to sign in
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
