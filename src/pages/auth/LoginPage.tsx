import { WalletCards } from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../hooks/useAuth";

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("employer@mobpae.com");
  const [password, setPassword] = useState("MobPae@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/dashboard";

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-fintech">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-950 text-white">
            <WalletCards size={22} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-950">MobPae</p>
            <p className="text-xs font-semibold text-slate-500">Employer Portal</p>
          </div>
        </div>
        <div className="mt-8">
          <h1 className="text-2xl font-bold text-slate-950">Sign in</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Access salary requests, employee activation, repayments and payroll recovery workflows.</p>
        </div>
        <form
          className="mt-6 grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            setLoading(true);
            try {
              await login({ email, password });
              navigate(from, { replace: true });
            } catch (loginError) {
              setError(loginError instanceof Error ? loginError.message : "Unable to sign in");
            } finally {
              setLoading(false);
            }
          }}
        >
          <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Input label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <div className="mt-5 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-500">
          Demo credentials: employer@mobpae.com / MobPae@123
        </div>
      </section>
    </main>
  );
}
