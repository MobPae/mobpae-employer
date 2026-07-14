import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound, Lock, ShieldCheck } from "lucide-react";
import { authService } from "../../services/auth.service";
import { getApiErrorMessage } from "../../services/api-errors";
import { PasswordStrengthMeter } from "../../components/ui/PasswordStrengthMeter";




export function ChangePasswordPage() {
  const navigate = useNavigate();
  const [current,  setCurrent]  = useState("");
  const [next,     setNext]     = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showCur,  setShowCur]  = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showCon,  setShowCon]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (next !== confirm) {
      setError("New password and confirm password do not match.");
      return;
    }
    if (next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword(current, next);
      // Backend invalidates all sessions on password change — clear tokens and force re-login
      await authService.logout();
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      const msg = getApiErrorMessage(err, "Failed to change password.");
      setError(msg.toLowerCase().includes("incorrect") || msg.toLowerCase().includes("wrong")
        ? "Current password is incorrect."
        : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center border border-brand-muted bg-brand-soft"
          >
            <KeyRound size={26} className="text-brand" />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-7">
          <h1 className="text-[22px] font-[700] text-ink tracking-[-0.02em]">Change Password</h1>
          <p className="text-[13px] text-ink-3 mt-1.5 leading-relaxed">
            Set a new password for your Employer account.
          </p>
        </div>

        {success ? (
          <div className="bg-brand-soft border border-brand-muted rounded-xl p-5 text-center">
            <ShieldCheck size={28} className="text-brand mx-auto mb-2" />
            <p className="text-[14px] font-[600] text-ink">Password changed successfully!</p>
            <p className="text-[12px] text-brand mt-1">Redirecting to dashboard…</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-edge rounded-2xl p-6 shadow-sm space-y-4"
          >
            <Field
              label="Current Password"
              value={current}
              onChange={setCurrent}
              show={showCur}
              onToggle={() => setShowCur(v => !v)}
              placeholder="Enter current password"
              autoComplete="current-password"
            />
            <div>
              <Field
                label="New Password"
                value={next}
                onChange={setNext}
                show={showNext}
                onToggle={() => setShowNext(v => !v)}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
              />
              <PasswordStrengthMeter password={next} />
            </div>
            <Field
              label="Confirm New Password"
              value={confirm}
              onChange={setConfirm}
              show={showCon}
              onToggle={() => setShowCon(v => !v)}
              placeholder="Re-enter new password"
              autoComplete="new-password"
            />

            {error && (
              <div className="bg-danger-soft border border-red-100 rounded-lg px-3 py-2.5">
                <p className="text-[12px] text-danger font-[500]">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !current || !next || !confirm}
              className="w-full h-10 rounded-lg bg-brand text-white text-[13px] font-[600] flex items-center justify-center gap-2 transition disabled:opacity-50 mt-1"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Lock size={14} /> Update Password</>
              }
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, show, onToggle, placeholder, autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
  autoComplete: string;
}) {
  return (
    <div>
      <label className="block text-[12px] font-[500] text-ink-3 mb-1.5">{label}</label>
      <div className="relative">
        <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className="w-full h-10 pl-9 pr-10 text-[13px] bg-white border border-edge rounded-lg text-ink placeholder-[#B7B9C7] outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink-3"
        >
          {show ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      </div>
    </div>
  );
}
