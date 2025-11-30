import React, { useMemo, useState } from "react";
import {
  FaEnvelope,
  FaLock,
  FaSpinner,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import ForgotPassword from "./ForgotPassword";

const LoginComp = ({
  onSubmit,
  isLoading,
  heading = "Welcome back",
  accentTitle = "Hostel Management Suite",
  description = "Sign in to manage allotments, requests, and campus life from a single, secure dashboard.",
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const emailPlaceholder = useMemo(() => "Enter your institutional email", []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setFormError("Email and password are required.");
      return;
    }
    setFormError("");
    if (onSubmit) {
      onSubmit({ email, password, rememberMe });
    }
  };

  const handleForgotPasswordClick = (e) => {
    e.preventDefault();
    setShowForgotPassword(true);
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
  };

  if (showForgotPassword) {
    return <ForgotPassword onBackToLogin={handleBackToLogin} />;
  }

  return (
    <section className="bg-gray-50">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center gap-12 px-6 py-16 md:px-10 lg:flex-row lg:items-center">
        <header className="w-full max-w-xl text-slate-800">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
            {accentTitle}
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            {heading}
          </h1>
          <p className="mt-4 text-base text-slate-600">{description}</p>
          <div className="mt-8 grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="font-semibold text-slate-800">Secure access</p>
              <p className="mt-2 leading-relaxed">
                Multi-role authentication keeps every stakeholder&apos;s data
                aligned with university policy.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="font-semibold text-slate-800">
                Integrated workflow
              </p>
              <p className="mt-2 leading-relaxed">
                Stay on top of allotments, requests, and updates without leaving
                the dashboard.
              </p>
            </div>
          </div>
        </header>

        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                Sign in
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Use your registered credentials to continue.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block text-left">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Institutional email
                </span>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-blue-500">
                  <FaEnvelope className="text-base text-blue-500" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={emailPlaceholder}
                    className="w-full border-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 sm:text-base"
                    autoComplete="email"
                    required
                  />
                </div>
              </label>

              <label className="block text-left">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Password
                </span>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-blue-500">
                  <FaLock className="text-base text-blue-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full border-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 sm:text-base"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-slate-400 transition hover:text-slate-600"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </label>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-500">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Remember me
                </label>
                <button
                  onClick={handleForgotPasswordClick}
                  className="font-semibold text-blue-600 transition hover:text-blue-700"
                >
                  Forgot password?
                </button>
              </div>

              {formError && (
                <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Logging in…</span>
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
              <span>New to HMS?</span>{" "}
              <a
                href="/register"
                className="font-semibold text-blue-600 transition hover:text-blue-700"
              >
                Create an account
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginComp;
