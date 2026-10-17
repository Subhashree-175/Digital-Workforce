
import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import {
  StatusBadge,
  Loading,
  ErrorBox,
  PageHeader,
  toast,
} from '../components/ui';

export default function ReviewSubmissionsPage() {
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState('');
  const [reviewing, setReviewing] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [decision, setDecision] = useState('approved');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      setError('');
      const data = await api.get('/work-logs/pending');
      setLogs(data.workLogs);
    } catch (err) {
      setError(err.message || 'Unable to load pending submissions.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openReview = (log) => {
    setReviewing(log);
    setRemarks('');
    setDecision('approved');
  };

  const confirmReview = async () => {
    if (!reviewing || busy) return;

    if (decision === 'rejected' && !remarks.trim()) {
      alert('Remarks are required to reject.');
      return;
    }

    setBusy(true);

    try {
      const res = await api.put(
        `/work-logs/${reviewing.id}/review`,
        { decision, remarks }
      );

      toast(document.body, res.message);
      setReviewing(null);
      await load();
    } catch (err) {
      toast(document.body, err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const docNames = (log) => {
    let docs = log.supporting_docs;

    if (!Array.isArray(docs)) {
      try {
        docs = JSON.parse(docs || '[]');
      } catch {
        return '';
      }
    }

    return docs.length
      ? docs.map((doc) => doc.fileName).filter(Boolean).join(', ')
      : '';
  };

  const formatDate = (date) => {
    if (!date) return '—';

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return String(date);
    }

    return parsed.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (date) => {
    if (!date) return '—';

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return String(date);
    }

    return parsed.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const filteredLogs = useMemo(() => {
    if (!logs) return [];

    const query = search.trim().toLowerCase();

    if (!query) return logs;

    return logs.filter((log) =>
      [
        log.employee_name,
        log.employee_code,
        log.task_title,
        log.task_details,
        log.kpi_name,
      ].some((value) =>
        String(value || '').toLowerCase().includes(query)
      )
    );
  }, [logs, search]);

  if (error && !logs) {
    return <ErrorBox message={error} />;
  }

  if (!logs) {
    return <Loading />;
  }

  const inputClass =
    'w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

  const labelClass =
    'mb-1.5 block text-sm font-semibold text-slate-700';

  const primaryButton =
    'inline-flex min-h-10 items-center justify-center rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60';

  const secondaryButton =
    'inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <div className="min-w-0 space-y-6 pb-6">
      <PageHeader
        title="Review Submissions"
        subtitle="Verify employee work logs, inspect supporting evidence, and manage submission approvals."
      />

      {/* Overview banner */}
      <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-950 via-blue-950 to-blue-800 p-5 text-white shadow-lg sm:p-7 lg:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 -top-8 h-44 w-44 rounded-full border border-white/10" />

        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-blue-100">
            SUPERVISOR WORKSPACE
          </span>

          <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
            Submission Review Queue
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
            Review submitted work, verify evidence and provide clear
            feedback before approving or rejecting employee submissions.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white">
              {logs.length} Pending Submissions
            </span>

            <span className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white">
              Evidence Verification
            </span>
          </div>
        </div>
      </section>

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SummaryCard
          title="Pending Reviews"
          value={logs.length}
          description="Submissions awaiting your decision"
          symbol="01"
          accent="blue"
        />

        <SummaryCard
          title="Matching Submissions"
          value={filteredLogs.length}
          description="Results matching your search"
          symbol="02"
          accent="indigo"
        />
      </section>

      {/* Empty queue message */}
      {logs.length === 0 && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xl font-bold text-emerald-700">
              ✓
            </div>

            <div>
              <h3 className="font-bold text-emerald-950">
                All caught up!
              </h3>

              <p className="mt-1 text-sm leading-6 text-emerald-800">
                There are no pending submissions. All work logs in the
                current review queue have been processed.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Submissions list */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Submitted Work Logs
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Inspect task information and supporting documents before
              making a decision.
            </p>
          </div>

          {logs.length > 0 && (
            <div className="relative w-full lg:max-w-sm">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">
                ⌕
              </span>

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search employee, task or KPI..."
                aria-label="Search pending submissions"
                className={`${inputClass} pl-9`}
              />
            </div>
          )}
        </div>

        {/* Mobile submission cards */}
        <div className="divide-y divide-slate-100 md:hidden">
          {filteredLogs.map((log) => {
            const documents = docNames(log);

            return (
              <article key={log.id} className="space-y-4 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-800">
                    {(log.employee_name || 'E')
                      .trim()
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="wrap-break-words font-bold text-slate-900">
                      {log.employee_name}
                    </h4>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {log.employee_code || 'No employee code'}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      Submitted {formatDateTime(log.submitted_at)}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                    Pending
                  </span>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Task
                  </p>

                  <h5 className="mt-1.5 wrap-break-words text-sm font-bold text-slate-900">
                    {log.task_title}
                  </h5>

                  {log.task_details && (
                    <p className="mt-1.5 whitespace-pre-wrap wrap-break-words text-sm leading-5 text-slate-600">
                      {log.task_details}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Related KPI
                    </p>

                    <p className="mt-1 wrap-break-words text-sm font-medium text-slate-800">
                      {log.kpi_name || '—'}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Supporting evidence
                    </p>

                    {documents ? (
                      <p className="mt-1 wrap-break-words text-sm text-blue-700">
                        {documents}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm font-medium text-amber-700">
                        No attachment
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openReview(log)}
                  className={`${primaryButton} w-full`}
                >
                  Review Submission
                </button>
              </article>
            );
          })}

          {filteredLogs.length === 0 && logs.length > 0 && (
            <EmptyState search={search} />
          )}
        </div>

        {/* Desktop and tablet table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-237.5 border-collapse text-left">
            <thead>
              <tr className="bg-slate-50">
                {[
                  'Submitted',
                  'Employee',
                  'Task Details',
                  'KPI',
                  'Evidence',
                  'Action',
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => {
                const documents = docNames(log);

                return (
                  <tr
                    key={log.id}
                    className="transition hover:bg-blue-50/30"
                  >
                    <td className="whitespace-nowrap px-5 py-4">
                      <p className="text-sm font-semibold text-slate-800">
                        {formatDate(log.submitted_at)}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {log.submitted_at
                          ? new Date(log.submitted_at).toLocaleTimeString(
                              'en-IN',
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )
                          : '—'}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-800">
                          {(log.employee_name || 'E')
                            .trim()
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p className="wrap-break-words font-semibold text-slate-900">
                            {log.employee_name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {log.employee_code}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="max-w-xs px-5 py-4">
                      <p className="wrap-break-words text-sm font-semibold text-slate-900">
                        {log.task_title}
                      </p>

                      {log.task_details && (
                        <p className="mt-1 whitespace-pre-wrap wrap-break-words text-xs leading-5 text-slate-500">
                          {log.task_details}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span className="wrap-break-words text-sm text-slate-700">
                        {log.kpi_name || '—'}
                      </span>
                    </td>

                    <td className="max-w-xs px-5 py-4">
                      {documents ? (
                        <div className="flex items-start gap-2">
                          <span className="text-blue-700">↗</span>
                          <span className="wrap-break-words text-sm text-blue-700">
                            {documents}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700">
                          No attachment
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => openReview(log)}
                        className={secondaryButton}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredLogs.length === 0 && logs.length > 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12">
                    <EmptyState search={search} />
                  </td>
                </tr>
              )}

              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12">
                    <EmptyState />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-1 border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>
            Showing{' '}
            <strong className="text-slate-800">
              {filteredLogs.length}
            </strong>{' '}
            of{' '}
            <strong className="text-slate-800">{logs.length}</strong>{' '}
            submissions
          </span>

          <span>Employee work log review</span>
        </div>
      </section>

      {/* Review modal */}
      {reviewing && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={(event) => {
            if (
              event.target === event.currentTarget &&
              !busy
            ) {
              setReviewing(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-modal-title"
            className="flex max-h-[96dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-2xl"
          >
            {/* Modal header */}
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
              <div className="min-w-0">
                <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Submission Review
                </span>

                <h2
                  id="review-modal-title"
                  className="mt-2 wrap-break-words text-xl font-bold text-slate-900"
                >
                  {reviewing.task_title || 'Review Submission'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Verify the submission and record your decision.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setReviewing(null)}
                disabled={busy}
                aria-label="Close review dialog"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-2xl text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
              >
                ×
              </button>
            </header>

            {/* Modal body */}
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
              {/* Submission information */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-800">
                    {(reviewing.employee_name || 'E')
                      .trim()
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="wrap-break-words font-bold text-slate-900">
                      {reviewing.employee_name}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Employee code: {reviewing.employee_code || '—'}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      Work date: {formatDate(reviewing.log_date)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-200 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Task description
                  </p>

                  <p className="mt-2 whitespace-pre-wrap wrap-break-words text-sm leading-6 text-slate-700">
                    {reviewing.task_details || 'No task details provided.'}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Related KPI
                    </p>

                    <p className="mt-1 wrap-break-words text-sm font-semibold text-slate-800">
                      {reviewing.kpi_name || '—'}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Submitted at
                    </p>

                    <p className="mt-1 wrap-break-words text-sm font-semibold text-slate-800">
                      {formatDateTime(reviewing.submitted_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Evidence */}
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Supporting evidence
                </h3>

                <div className="mt-2 rounded-xl border border-slate-200 p-4">
                  {docNames(reviewing) ? (
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 font-bold text-blue-700">
                        D
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">
                          Attached documents
                        </p>

                        <p className="mt-1 wrap-break-words text-sm leading-5 text-slate-600">
                          {docNames(reviewing)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-amber-700">
                      No supporting documents were attached.
                    </p>
                  )}
                </div>
              </div>

              {/* Decision form */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="review-decision" className={labelClass}>
                    Review decision
                  </label>

                  <select
                    id="review-decision"
                    value={decision}
                    onChange={(event) => setDecision(event.target.value)}
                    className={inputClass}
                  >
                    <option value="approved">
                      Approve — award KPI credit
                    </option>
                    <option value="rejected">
                      Reject — request resubmission
                    </option>
                  </select>

                  <p className="mt-1.5 text-xs leading-5 text-slate-500">
                    {decision === 'approved'
                      ? 'Confirm that the submitted work and evidence meet the required standards.'
                      : 'Explain the issues and what the employee needs to correct.'}
                  </p>
                </div>

                <div>
                  <label htmlFor="supervisor-remarks" className={labelClass}>
                    Supervisor remarks
                    {decision === 'rejected' && (
                      <span className="ml-1 text-rose-600">
                        (required)
                      </span>
                    )}
                  </label>

                  <textarea
                    id="supervisor-remarks"
                    value={remarks}
                    onChange={(event) => setRemarks(event.target.value)}
                    placeholder={
                      decision === 'rejected'
                        ? 'Explain what evidence is missing and what corrective action is needed...'
                        : 'Confirm evidence verification or add any additional notes...'
                    }
                    required={decision === 'rejected'}
                    rows={4}
                    className={`${inputClass} resize-y`}
                  />

                  {decision === 'rejected' && (
                    <p className="mt-1.5 text-xs text-slate-500">
                      Remarks are required when rejecting a submission.
                    </p>
                  )}
                </div>
              </div>

              {/* Decision notice */}
              <div
                className={`rounded-xl border p-4 ${
                  decision === 'approved'
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-rose-200 bg-rose-50'
                }`}
              >
                <p
                  className={`text-sm font-bold ${
                    decision === 'approved'
                      ? 'text-emerald-900'
                      : 'text-rose-900'
                  }`}
                >
                  {decision === 'approved'
                    ? 'Ready to approve'
                    : 'Ready to reject'}
                </p>

                <p
                  className={`mt-1 text-xs leading-5 ${
                    decision === 'approved'
                      ? 'text-emerald-800'
                      : 'text-rose-800'
                  }`}
                >
                  {decision === 'approved'
                    ? 'Verify the task and evidence before confirming approval.'
                    : 'The employee should receive clear remarks explaining the rejection.'}
                </p>
              </div>
            </div>

            {/* Modal footer */}
            <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
              <button
                type="button"
                className={secondaryButton}
                onClick={() => setReviewing(null)}
                disabled={busy}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  busy ||
                  (decision === 'rejected' && !remarks.trim())
                }
                onClick={confirmReview}
                className={`inline-flex min-h-10 items-center justify-center rounded-xl px-5 py-2 text-sm font-semibold text-white transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${
                  decision === 'approved'
                    ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-100'
                    : 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-100'
                }`}
              >
                {busy
                  ? 'Processing...'
                  : decision === 'approved'
                    ? 'Approve Submission'
                    : 'Reject Submission'}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value, description, symbol, accent }) {
  const accentStyles = {
    blue: {
      icon: 'bg-blue-50 text-blue-700',
      bar: 'bg-blue-600',
    },
    indigo: {
      icon: 'bg-indigo-50 text-indigo-700',
      bar: 'bg-indigo-600',
    },
  };

  const style = accentStyles[accent] || accentStyles.blue;

  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-500">{description}</p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${style.icon}`}
        >
          {symbol}
        </div>
      </div>

      <div className={`absolute bottom-0 left-0 h-1 w-full ${style.bar}`} />
    </article>
  );
}

function EmptyState({ search }) {
  return (
    <div className="px-4 py-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400">
        {search ? '⌕' : '✓'}
      </div>

      <h3 className="mt-4 font-bold text-slate-800">
        {search ? 'No matching submissions' : 'Queue is empty'}
      </h3>

      <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">
        {search
          ? 'Try searching with a different employee name, task title or KPI.'
          : 'There are currently no work log submissions awaiting review.'}
      </p>
    </div>
  );
}
