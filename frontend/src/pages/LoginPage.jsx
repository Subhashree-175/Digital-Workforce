
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ErrorBox } from '../components/ui';

const DEMO_ACCOUNTS = [
  {
    label: 'Admin',
    email: 'admin@digitalworkforce.gov',
    role: 'Administrator',
  },
  {
    label: 'Department Head',
    email: 'anita.sharma@digitalworkforce.gov',
    role: 'Dept Head (Revenue)',
  },
  {
    label: 'Employee',
    email: 'priya.verma@digitalworkforce.gov',
    role: 'Employee (Revenue)',
  },
];

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) {
    navigate('/');
    return null;
  }

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      await login(email.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative isolate flex min-h-screen  items-center justify-center overflow-hidden bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -right-32 -top-32 -z-10 h-80 w-80 rounded-full border border-blue-100 bg-blue-100/20 blur-[1px]" />

      <div className="pointer-events-none absolute -bottom-40 -left-32 -z-10 h-96 w-96 rounded-full border border-blue-100 bg-blue-100/20 blur-[1px]" />

      {/* Login Card */}
      <section className="w-full max-w-md animate-[fadeIn_0.4s_ease-out] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,35,65,0.09)] sm:rounded-3xl">
        {/* Brand */}
        <div className="px-5 pt-8 sm:px-9 sm:pt-10">
          <div className="mb-8 flex items-center justify-center gap-3 sm:mb-9">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-700 to-blue-950 text-base font-extrabold tracking-tight text-white shadow-lg shadow-blue-900/20">
              DW
            </div>

            <div>
              <h2 className="text-base font-bold tracking-tight text-slate-800 sm:text-lg">
                Digital Workforce
              </h2>

              <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">
                Government Performance Platform
              </p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-800">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Welcome back
            </h1>

            <p className="mx-auto mt-2 max-w-xs text-xs leading-6 text-slate-500 sm:text-sm">
              KPI-driven Government Performance Evaluation Platform
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form
          onSubmit={submit}
          className="space-y-5 px-5 sm:px-9"
        >
          {/* Email */}
          <div>
            <label
              htmlFor="login-email"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Official Email
            </label>

            <div className="group flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 transition-all duration-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
              <svg
                className="h-5 w-5 shrink-0 text-slate-400 transition-colors group-focus-within:text-blue-700"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>

              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@digitalworkforce.gov"
                autoComplete="username"
                required
                className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-0 focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="login-password"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Password
            </label>

            <div className="group flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 transition-all duration-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10">
              <svg
                className="h-5 w-5 shrink-0 text-slate-400 transition-colors group-focus-within:text-blue-700"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>

              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-0 focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          {/* Error */}
          <div className="min-w-0 wrap-break-words">
            <ErrorBox message={error} />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={busy}
            className="group flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-700 to-blue-950 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-900/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {busy ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Signing in...
              </>
            ) : (
              <>
                Sign In

                <svg
                  className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 border-t border-slate-100 px-5 py-5 sm:px-9">
          <div className="flex flex-wrap items-center justify-center gap-2 text-center text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />

            <span>Secure Government Access</span>

            <span className="text-slate-300">•</span>

            <span>Digital Workforce</span>
          </div>
        </div>
      </section>
    </main>
  );
}

