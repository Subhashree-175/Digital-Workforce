
import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Loading,
  ErrorBox,
  PageHeader,
  toast,
} from '../components/ui';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    api
      .get('/auth/me')
      .then((data) => {
        if (active) setProfile(data.user);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Unable to load profile.');
      });

    return () => {
      active = false;
    };
  }, []);

  const changePw = async (e) => {
    e.preventDefault();

    if (next !== confirm) {
      alert('New passwords do not match.');
      return;
    }

    setBusy(true);

    try {
      await api.post('/auth/change-password', {
        currentPassword: cur,
        newPassword: next,
      });

      toast(document.body, 'Password changed successfully.');

      setCur('');
      setNext('');
      setConfirm('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    } catch (err) {
      toast(document.body, err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (error) return <ErrorBox message={error} />;
  if (!profile) return <Loading />;

  const initials = (profile.name || user?.name || 'User')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  const formatDate = (date) => {
    if (!date) return '—';

    const value = String(date).slice(0, 10);
    const parsed = new Date(`${value}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) return value;

    return parsed.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const details = [
    { label: 'Full Name', value: profile.name, symbol: 'N' },
    {
      label: 'Employee Code',
      value: profile.employee_code,
      symbol: '#',
    },
    { label: 'Official Email', value: profile.email, symbol: '@' },
    {
      label: 'Account Role',
      value: profile.role,
      symbol: 'R',
      capitalize: true,
    },
    {
      label: 'Department',
      value: profile.department_name,
      symbol: 'D',
    },
    {
      label: 'Designation',
      value: profile.designation,
      symbol: 'J',
    },
    {
      label: 'Reporting Manager',
      value: profile.manager_name,
      symbol: 'M',
    },
    {
      label: 'Joining Date',
      value: formatDate(profile.joining_date),
      symbol: 'C',
    },
  ];

  const inputClass =
    'block w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

  const labelClass =
    'mb-1.5 block text-sm font-semibold text-slate-700';

  const primaryButton =
    'inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60';

  const secondaryButton =
    'inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100';

  const PasswordField = ({
    id,
    label,
    value,
    onChange,
    visible,
    toggleVisibility,
    autoComplete,
    minLength,
  }) => (
    <div className="min-w-0">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className={`${inputClass} pr-20`}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          placeholder={`Enter ${label.toLowerCase()}`}
        />

        <button
          type="button"
          onClick={toggleVisibility}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-1 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-w-0 space-y-6 pb-6">
      <PageHeader
        title="My Profile"
        subtitle="Manage your account information and security settings."
      />

      {/* Profile banner */}
      <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-950 via-blue-950 to-blue-800 p-5 text-white shadow-lg sm:p-7 lg:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 -top-8 h-44 w-44 rounded-full border border-white/10" />

        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-2xl font-bold text-white shadow-inner sm:h-24 sm:w-24 sm:text-3xl">
            {initials || 'U'}
          </div>

          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
              ACCOUNT PROFILE
            </span>

            <h2 className="mt-3 wrap-break-words text-2xl font-bold tracking-tight sm:text-3xl">
              {profile.name || 'User'}
            </h2>

            <p className="mt-1 break-all text-sm text-blue-100 sm:text-base">
              {profile.email || 'No email available'}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {profile.role && (
                <span className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold capitalize text-white">
                  {String(profile.role).replace(/_/g, ' ')}
                </span>
              )}

              {profile.employee_code && (
                <span className="rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
                  ID: {profile.employee_code}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 sm:self-center">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-semibold text-emerald-100">
              Account Active
            </span>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        {/* Profile details */}
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg font-bold text-blue-800">
                P
              </div>

              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-900">
                  Profile Details
                </h3>
                <p className="mt-0.5 text-sm text-slate-500">
                  Your registered employee information.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6">
            {details.map((item) => (
              <div
                key={item.label}
                className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:border-blue-100 hover:bg-blue-50/30 sm:p-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-bold text-blue-700 shadow-sm ring-1 ring-slate-200/70">
                  {item.symbol}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {item.label}
                  </p>

                  <p
                    className={`mt-1.5 wrap-break-words text-sm font-semibold text-slate-800 ${
                      item.capitalize ? 'capitalize' : ''
                    }`}
                  >
                    {item.value || '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mx-4 mb-4 rounded-xl border border-blue-100 bg-blue-50/70 p-4 sm:mx-6 sm:mb-6">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 font-bold text-blue-800">
                i
              </div>

              <div className="min-w-0">
                <h4 className="text-sm font-bold text-blue-950">
                  Keep your details accurate
                </h4>
                <p className="mt-1 text-xs leading-5 text-blue-900/80 sm:text-sm">
                  Your profile information is provided by your registered
                  account. Contact your administrator if any details need
                  to be corrected.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Security panel */}
        <div className="min-w-0 space-y-6">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg font-bold text-indigo-700">
                  S
                </div>

                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-slate-900">
                    Security Settings
                  </h3>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Update your account password.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={changePw} className="space-y-5 p-4 sm:p-6">
              <PasswordField
                id="current-password"
                label="Current Password"
                value={cur}
                onChange={(event) => setCur(event.target.value)}
                visible={showCurrent}
                toggleVisibility={() => setShowCurrent((value) => !value)}
                autoComplete="current-password"
              />

              <PasswordField
                id="new-password"
                label="New Password"
                value={next}
                onChange={(event) => setNext(event.target.value)}
                visible={showNew}
                toggleVisibility={() => setShowNew((value) => !value)}
                autoComplete="new-password"
                minLength={8}
              />

              <p className="-mt-3 text-xs text-slate-500">
                Use at least 8 characters for your new password.
              </p>

              <PasswordField
                id="confirm-password"
                label="Confirm New Password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                visible={showConfirm}
                toggleVisibility={() => setShowConfirm((value) => !value)}
                autoComplete="new-password"
                minLength={8}
              />

              {confirm.length > 0 && (
                <p
                  className={`-mt-2 text-xs font-medium ${
                    next === confirm
                      ? 'text-emerald-700'
                      : 'text-rose-600'
                  }`}
                >
                  {next === confirm
                    ? 'Passwords match.'
                    : 'Passwords do not match.'}
                </p>
              )}

              <div className="border-t border-slate-100 pt-4">
                <button
                  type="submit"
                  className={`${primaryButton} w-full`}
                  disabled={busy}
                >
                  {busy ? 'Updating Password…' : 'Update Password'}
                </button>
              </div>
            </form>
          </section>

          {/* Logout card */}
          <section className="rounded-2xl border border-rose-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-lg font-bold text-rose-700">
                ↗
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-900">
                  Sign out of your account
                </h3>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  End your current session on this device.
                </p>

                <button
                  type="button"
                  onClick={logout}
                  className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 focus:outline-none focus:ring-4 focus:ring-rose-100 sm:w-auto"
                >
                  Logout
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
