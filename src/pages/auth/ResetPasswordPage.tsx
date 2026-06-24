import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { authService } from "../../services/auth.service";

const B  = "#7679FF";
const BD = "#5659D9";

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

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f8fafc", alignItems: "center", justifyContent: "center" }}>
      <div style={{ maxWidth: 400, width: "100%", padding: "0 24px" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 40 }}>
          {(() => { const s=20,sc=s/530,ip=Math.round(1500*sc),vw=Math.round(888*sc); return <div style={{width:vw,height:s,overflow:"hidden",flexShrink:0,position:"relative"}}><img src="/logo-icon.svg" alt="MobPae" style={{position:"absolute",width:ip,height:ip,maxWidth:"none",top:-Math.round(485*sc),left:-Math.round(319*sc)}}/></div>; })()}
          <span style={{ fontSize: 15, fontWeight: 700, color: "#191A2E", letterSpacing: "-0.01em" }}>MobPae</span>
        </div>

        {done ? (
          <>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "#ECEBFF", border: "1px solid #C8C9FF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7679FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#111", letterSpacing: "-0.025em", margin: "0 0 10px" }}>Password updated</h2>
            <p style={{ fontSize: 14, color: "#8D90A3", lineHeight: 1.6, marginBottom: 28 }}>
              Your password has been reset. All active sessions have been signed out — please sign in again.
            </p>
            <button onClick={() => navigate("/login")} style={{
              width: "100%", height: 48, background: `linear-gradient(135deg, ${BD} 0%, ${B} 100%)`,
              color: "white", borderRadius: 10, border: "none", fontSize: 14, fontWeight: 700,
              cursor: "pointer", boxShadow: "0 4px 16px rgba(118,121,255,0.30)",
            }}>
              Sign in
            </button>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#111", letterSpacing: "-0.025em", margin: "0 0 10px" }}>Set new password</h2>
            <p style={{ fontSize: 14, color: "#8D90A3", lineHeight: 1.6, marginBottom: 28 }}>
              Choose a strong password. All active sessions will be signed out.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "New Password",     val: newPassword,     set: setNewPassword,     show: showNew,     toggleShow: () => setShowNew(v => !v) },
                { label: "Confirm Password", val: confirmPassword, set: setConfirmPassword, show: showConfirm, toggleShow: () => setShowConfirm(v => !v) },
              ].map(({ label, val, set, show, toggleShow }) => (
                <div key={label}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 8 }}>{label}</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, background: "white", border: "1.5px solid #e8e0d8", borderRadius: 10, padding: "11px 14px", transition: "border-color 0.15s" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8D90A3" strokeWidth="2" strokeLinecap="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <input
                      type={show ? "text" : "password"} value={val} onChange={e => set(e.target.value)}
                      placeholder="••••••••" required
                      style={{ flex: 1, fontSize: 14, color: "#111", background: "transparent", outline: "none", minWidth: 0 }}
                      onFocus={e => { (e.target.closest("div") as HTMLElement).style.borderColor = B; }}
                      onBlur={e  => { (e.target.closest("div") as HTMLElement).style.borderColor = "#e8e0d8"; }}
                    />
                    <button type="button" onClick={toggleShow} style={{ color: "#B7B9C7", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                      {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              ))}

              {error && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#e11d48", fontWeight: 500 }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                width: "100%", height: 48, marginTop: 4,
                background: loading ? "#c4825e" : `linear-gradient(135deg, ${BD} 0%, ${B} 100%)`,
                color: "white", borderRadius: 10, border: "none", fontSize: 14, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 4px 16px rgba(118,121,255,0.30)", transition: "all 0.15s",
              }}>
                {loading ? "Resetting…" : "Reset password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
