import { ArrowRight, Building2, LockKeyhole, Mail, ShieldCheck, WalletCards } from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../hooks/useAuth";

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const routeState = location.state as { from?: { pathname?: string }; roleError?: string } | null;
  const from = routeState?.from?.pathname ?? "/dashboard";

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="min-h-screen bg-[#f4f8ff] px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-48px)] max-w-6xl overflow-hidden rounded-lg border border-blue-100 bg-white shadow-fintech lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative hidden bg-blue-700 p-8 text-white lg:flex lg:flex-col">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0)_42%),radial-gradient(circle_at_18%_16%,rgba(125,211,252,0.42),transparent_30%),linear-gradient(160deg,#1d4ed8_0%,#1e40af_55%,#0f2f6e_100%)]" />
          <div className="relative flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-white/15 text-white ring-1 ring-white/20">
              <WalletCards size={22} />
            </div>
            <div>
              <p className="text-base font-bold">MobPae</p>
              <p className="text-xs font-semibold text-blue-100">Employer Portal</p>
            </div>
          </div>

          <div className="relative mt-auto max-w-xl">
            <p className="inline-flex rounded-full bg-white/12 px-3 py-1 text-xs font-bold uppercase tracking-normal text-blue-50 ring-1 ring-white/20">
              Earned wage access operations
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-normal">
              Control employee advances, payroll recovery, and app activation from one secure desk.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-blue-100">
              Built for HR and finance teams managing salary access requests with enterprise-grade visibility.
            </p>

            <div className="mt-8 grid gap-3">
              {[
                { label: "JWT secured employer access", icon: ShieldCheck },
                { label: "Payroll-linked recovery workflow", icon: WalletCards },
                { label: "Employee activation management", icon: Building2 }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/15">
                    <Icon size={18} />
                    {item.label}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-600/25">
                <WalletCards size={22} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-950">MobPae</p>
                <p className="text-xs font-semibold text-slate-500">Employer Portal</p>
              </div>
            </div>

            <div className="mt-8 lg:mt-0">
              <p className="text-xs font-bold uppercase tracking-normal text-blue-700">Secure employer access</p>
              <h2 className="mt-2 text-3xl font-bold tracking-normal text-slate-950">Sign in to your workspace</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Manage employees, salary requests, repayments, and payroll recovery from the employer console.
              </p>
            </div>

            <form
              className="mt-7 grid gap-4"
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
              <Input
                icon={<Mail size={16} />}
                label="Work email"
                type="email"
                value={email}
                autoComplete="email"
                placeholder="name@company.com"
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <Input
                icon={<LockKeyhole size={16} />}
                label="Password"
                type="password"
                value={password}
                autoComplete="current-password"
                placeholder="Enter your password"
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p> : null}
              {routeState?.roleError ? (
                <p className="rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
                  This portal is available for EMPLOYER users only.
                </p>
              ) : null}
              <Button type="submit" className="min-h-11 w-full" disabled={loading} icon={!loading ? <ArrowRight size={16} /> : undefined}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50/70 p-4">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 text-blue-600" size={18} />
                <div>
                  <p className="text-sm font-semibold text-slate-950">Connected to MobPae backend</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Use the employer credentials provisioned by your backend administrator.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
