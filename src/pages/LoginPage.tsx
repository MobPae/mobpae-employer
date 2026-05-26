import { useState } from "react";
import type { FormEvent } from "react";
import { Building2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { setToken } from "../services/auth";

type LoginResponse = {
  data?: {
    accessToken?: string;
    token?: string;
    user?: {
      role?: string;
    };
  };
  accessToken?: string;
  token?: string;
  user?: {
    role?: string;
  };
};

export function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("employer@mobpae.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post<LoginResponse>("/auth/login", {
        email: email.trim(),
        password,
      });

      const responseBody = response.data;

      const token =
        responseBody?.data?.accessToken ||
        responseBody?.data?.token ||
        responseBody?.accessToken ||
        responseBody?.token;

      const user = responseBody?.data?.user || responseBody?.user;

      if (!token) {
        throw new Error("Login token not found");
      }

      if (user?.role && user.role !== "EMPLOYER") {
        throw new Error("Only employer users can access this portal");
      }

      setToken(token);
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Invalid email or password";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-soft lg:grid-cols-2">
      <section className="hidden bg-gradient-to-br from-slate-950 to-blue-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-2xl font-black">
            Mob<span className="text-blue-300">Pae</span>
          </p>
          <p className="mt-2 text-sm font-semibold text-blue-100">
            Employer Portal
          </p>
        </div>

        <div>
          <h1 className="max-w-xl text-5xl font-black leading-tight">
            Manage employees and salary advance approvals easily.
          </h1>
          <p className="mt-5 max-w-lg text-slate-300">
            Review employee requests, track company-level disbursals, and manage
            workforce salary advance access from one clean dashboard.
          </p>
        </div>

        <p className="text-sm text-slate-400">Secure employer access</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-soft"
        >
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-primary">
            <Building2 size={26} />
          </div>

          <h2 className="mt-6 text-3xl font-black">Employer Login</h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to manage your company employees and advance requests.
          </p>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 grid gap-4">
            <label>
              <span className="text-sm font-bold text-slate-700">Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="email"
                placeholder="Enter employer email"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </label>

            <label>
              <span className="text-sm font-bold text-slate-700">Password</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                placeholder="Enter password"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}
