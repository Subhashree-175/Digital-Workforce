
import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Loading, ErrorBox, PageHeader } from '../components/ui';

export default function AuditPage() {
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/analytics/audit-logs?limit=200')
      .then((d) => setLogs(d.auditLogs))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <ErrorBox message={error} />;
  if (!logs) return <Loading />;

  const formatTimestamp = (date) =>
    new Date(date).toLocaleString('en-IN', {
      dateStyle: 'short',
      timeStyle: 'medium',
    });

  const getActionStyle = (action = '') => {
    const value = action.toLowerCase();

    if (value.includes('login') || value.includes('auth')) {
      return 'bg-blue-50 text-blue-700 ring-blue-600/10';
    }

    if (value.includes('delete') || value.includes('remove')) {
      return 'bg-red-50 text-red-700 ring-red-600/10';
    }

    if (value.includes('approve')) {
      return 'bg-emerald-50 text-emerald-700 ring-emerald-600/10';
    }

    if (value.includes('update') || value.includes('edit')) {
      return 'bg-amber-50 text-amber-700 ring-amber-600/10';
    }

    if (value.includes('create') || value.includes('submit')) {
      return 'bg-violet-50 text-violet-700 ring-violet-600/10';
    }

    return 'bg-slate-100 text-slate-700 ring-slate-500/10';
  };

  return (
    <div className="w-full min-w-0 space-y-6 pb-6">

      {/* Page Header */}
      <PageHeader
        title="Audit Trail"
        subtitle="Full transparency log — logins, submissions, approvals, and data changes."
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

        {/* Total Logs */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
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
              <path d="M8 6h13M8 12h13M8 18h13" />
              <path d="M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500">
              Total Audit Entries
            </p>

            <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              {logs.length}
            </h3>
          </div>
        </div>

        {/* Unique Users */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
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
              <circle cx="9" cy="8" r="4" />
              <path d="M3 21v-2a6 6 0 0 1 12 0v2" />
              <path d="M16 4.5a4 4 0 0 1 0 7.5m2 3a5 5 0 0 1 3 4.5V21" />
            </svg>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500">
              Users Recorded
            </p>

            <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              {new Set(logs.map((l) => l.email || l.user_name || 'system')).size}
            </h3>
          </div>
        </div>

        {/* System Activity */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:col-span-2 lg:col-span-1">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
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
              <path d="M12 3 4.5 6v5c0 4.5 3.2 7.8 7.5 10 4.3-2.2 7.5-5.5 7.5-10V6L12 3Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500">
              Activity Monitoring
            </p>

            <p className="mt-1 text-sm font-semibold text-emerald-700">
              Audit logging active
            </p>
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Table Header */}
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              System Activity Log
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
              Review recorded user actions and system changes.
            </p>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Audit Records
          </div>
        </div>

        {logs.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-225 border-collapse text-left">

              <thead>
                <tr className="bg-slate-50">
                  <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Timestamp
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    User
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Action
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Entity
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Details
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {logs.map((l) => (
                  <tr
                    key={l.id}
                    className="transition-colors hover:bg-slate-50/80"
                  >
                    {/* Timestamp */}
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                        <svg
                          className="h-4 w-4 shrink-0 text-slate-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v5l3 2" />
                        </svg>

                        {formatTimestamp(l.created_at)}
                      </div>
                    </td>

                    {/* User */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold uppercase text-blue-800">
                          {(l.user_name || 'S').charAt(0)}
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800">
                            {l.user_name || 'system'}
                          </p>

                          <p className="mt-1 max-w-52 break-all text-xs text-slate-500">
                            {l.email || '—'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex max-w-48 items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${getActionStyle(l.action)}`}
                      >
                        <span className="wrap-break-words">
                          {l.action}
                        </span>
                      </span>
                    </td>

                    {/* Entity */}
                    <td className="whitespace-nowrap px-5 py-4">
                      <code className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
                        {l.entity_type}#{l.entity_id}
                      </code>
                    </td>

                    {/* Details */}
                    <td className="max-w-xs px-5 py-4">
                      <p
                        className="wrap-break-words text-xs leading-6 text-slate-600"
                        title={l.details ? JSON.stringify(l.details) : ''}
                      >
                        {l.details
                          ? JSON.stringify(l.details).slice(0, 120)
                          : '—'}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <svg
                className="h-8 w-8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M8 6h13M8 12h13M8 18h13" />
                <path d="M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
            </div>

            <h3 className="text-base font-bold text-slate-800">
              No audit entries yet
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              System activity and recorded user actions will appear here
              when audit entries are available.
            </p>
          </div>
        )}

        {/* Bottom information */}
        {logs.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-slate-500">
              Displaying {logs.length} audit entries.
            </p>

            <p className="text-xs text-slate-400">
              Maximum records requested: 200
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
