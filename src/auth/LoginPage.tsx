import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import { useAuth } from "./AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const loginResponse = await api.post("/auth/login", {
        email,
        password,
      });

      const token = loginResponse.data.accessToken;

      localStorage.setItem("token", token);

      const meResponse = await api.get("/auth/me");

      const user = meResponse.data;

      if (user.role !== "EMPLOYER") {
        localStorage.removeItem("token");

        setError("Only employer accounts can login.");

        return;
      }

      setUser(user);

      navigate("/dashboard");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-8">
      <div className="w-full max-w-6xl bg-white rounded-[32px] shadow-xl overflow-hidden border border-slate-200">
        <div className="grid lg:grid-cols-2">
          {/* LEFT PANEL */}
          <div className="bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 p-12 text-white flex items-center">
            <div className="max-w-md mx-auto">
              {/* Illustration */}
              {/* <div className="bg-white rounded-3xl p-6 shadow-2xl">
                <img
                  src="/employer-login.png"
                  alt="Employer Portal"
                  className="w-full h-auto"
                />
              </div> */}

              {/* Content */}
              <div className="mt-8">
                <h2 className="text-3xl font-bold leading-tight">
                  Welcome to the
                  <br />
                  MobPae Employer Portal
                </h2>

                <p className="mt-4 text-blue-100 leading-relaxed">
                  Streamlined financial management for your workforce. Empower
                  employees with early salary access while maintaining complete
                  payroll control.
                </p>
              </div>

              {/* Divider */}
              <div className="my-8 h-px bg-white/20" />

              {/* Features */}
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                    ✓
                  </div>

                  <span className="text-sm text-blue-50">
                    Payroll Management
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                    ✓
                  </div>

                  <span className="text-sm text-blue-50">
                    Working Capital Solutions
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                    ✓
                  </div>

                  <span className="text-sm text-blue-50">
                    Simplified Salary Funding
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="p-12 flex items-center">
            <div className="w-full max-w-md mx-auto">
              <h2 className="text-3xl font-bold text-slate-900">
                Welcome Back
              </h2>

              <p className="text-slate-500 mt-2">
                Sign in to access your employer dashboard.
              </p>

              <form onSubmit={handleLogin} className="mt-10 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="
                      w-full
                      rounded-2xl
                      border
                      border-slate-200
                      px-4
                      py-3
                      text-sm
                      focus:outline-none
                      focus:ring-4
                      focus:ring-blue-100
                      focus:border-blue-500
                    "
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Password
                  </label>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="
                      w-full
                      rounded-2xl
                      border
                      border-slate-200
                      px-4
                      py-3
                      text-sm
                      focus:outline-none
                      focus:ring-4
                      focus:ring-blue-100
                      focus:border-blue-500
                    "
                    placeholder="Enter your password"
                  />
                </div>

                {error && <div className="text-sm text-red-600">{error}</div>}

                <button
                  type="submit"
                  disabled={loading}
                  className="
                    w-full
                    bg-blue-600
                    hover:bg-blue-700
                    text-white
                    rounded-2xl
                    py-3.5
                    text-sm
                    font-medium
                  "
                >
                  {loading ? "Signing In..." : "Access Employer Dashboard"}
                </button>
              </form>

              <p className="text-xs text-slate-400 mt-8 text-center">
                © 2026 MobPae. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
