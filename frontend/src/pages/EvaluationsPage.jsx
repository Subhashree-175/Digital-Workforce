
import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  StatusBadge,
  RatingPill,
  Loading,
  ErrorBox,
  PageHeader,
  toast,
} from '../components/ui';

const EMPTY_FORM = {
  employeeId: '',
  periodStart: '2026-01-01',
  periodEnd: '2026-03-31',
};

const panelClass =
  'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100';

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50';

const secondaryButton =
  'inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-50';

const formatDate = (date) => {
  if (!date) return '—';

  const value = String(date).slice(0, 10);
  const parsed = new Date(`${value}T00:00:00`);

  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
};

const getRating = (score) =>
  !score
    ? 'Not Rated'
    : score >= 120
      ? 'Outstanding'
      : score >= 100
        ? 'Exceeds Expectations'
        : score >= 80
          ? 'Meets Expectations'
          : score >= 60
            ? 'Needs Improvement'
            : 'Unsatisfactory';

function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
        📋
      </div>
      <h3 className="mt-4 font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function SectionHeading({ title, subtitle, count }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-slate-800">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
        )}
      </div>

      {count !== undefined && (
        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
          {count} {count === 1 ? 'evaluation' : 'evaluations'}
        </span>
      )}
    </div>
  );
}

export default function EvaluationsPage() {
  const [evals, setEvals] = useState(null);
  const [employees, setEmployees] = useState(null);
  const [kpilib, setKpiLib] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      setError('');

      const [e, emp] = await Promise.all([
        api.get('/evaluations'),
        api.get('/users?role=employee'),
      ]);

      setEvals(e.evaluations);
      setEmployees(emp.users);
    } catch (err) {
      setError(err.message || 'Unable to load evaluations.');
    }
  };

  useEffect(() => {
    load();

    api
      .get('/kpis')
      .then((d) => setKpiLib(d.kpis))
      .catch((err) => {
        setError((current) => current || err.message || 'Unable to load KPIs.');
      });
  }, []);

  const pct = (achieved, target, weight) => {
    const t = Number(target);
    const a = Number(achieved);
    const w = Number(weight);

    if (!t || t <= 0) return { p: 0, s: 0 };

    const p = Math.min((a / t) * 100, 150);

    return {
      p: Number(p.toFixed(2)),
      s: Number(((p * w) / 100).toFixed(2)),
    };
  };

  const emptyRows = () =>
    (kpilib || []).map((k) => ({
      kpiId: k.id,
      kpiName: k.name,
      kpiUnit: k.unit,
      targetValue: '',
      weight: k.default_weight,
      achievedValue: '',
      comments: '',
    }));

  const openNew = () => {
    setEditing({ ...EMPTY_FORM });
    setRows(emptyRows());
    setShowForm(true);
  };

  const closeForm = () => {
    if (busy) return;
    setShowForm(false);
  };

  const switchEmployee = async (employeeId) => {
    setEditing((current) => ({ ...current, employeeId }));

    if (!employeeId) {
      setRows(emptyRows());
      return;
    }

    try {
      const asg = await api.get(
        `/kpis/assignments?employeeId=${employeeId}`
      );

      const map = new Map(
        asg.assignments.map((a) => [Number(a.kpi_id), a])
      );

      setRows(
        (kpilib || []).map((k) => {
          const a = map.get(Number(k.id));

          return {
            kpiId: k.id,
            kpiName: k.name,
            kpiUnit: k.unit,
            targetValue: a ? a.target_value : '',
            weight: a ? a.weight : k.default_weight,
            achievedValue: '',
            comments: '',
          };
        })
      );
    } catch {
      setRows(emptyRows());
    }
  };

  const updateRow = (index, field, value) => {
    setRows((current) =>
      current.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      )
    );
  };

  const save = async (submitAfter) => {
    if (!editing?.employeeId) {
      alert('Select an employee.');
      return;
    }

    if (
      editing.periodStart &&
      editing.periodEnd &&
      editing.periodStart > editing.periodEnd
    ) {
      alert('Period end must be on or after period start.');
      return;
    }

    const kpis = rows
      .filter((r) => Number(r.targetValue) > 0)
      .map((r) => ({
        kpiId: Number(r.kpiId),
        targetValue: Number(r.targetValue),
        achievedValue: Number(r.achievedValue || 0),
        weight: Number(r.weight),
        comments: r.comments,
      }));

    if (kpis.length === 0) {
      alert('Enter target value for at least one KPI.');
      return;
    }

    setBusy(true);

    try {
      const res = await api.post('/evaluations/upsert', {
        employeeId: Number(editing.employeeId),
        periodStart: editing.periodStart,
        periodEnd: editing.periodEnd,
        kpis,
      });

      toast(
        document.body,
        `Draft saved — overall score: ${res.evaluation.overall_score}`
      );

      if (submitAfter) {
        await api.put(`/evaluations/${res.evaluation.id}/submit`, {
          remarks: 'Ready for approval',
        });

        toast(document.body, 'Evaluation submitted for approval.');
      }

      setShowForm(false);
      await load();
    } catch (err) {
      toast(document.body, err.message || 'Unable to save evaluation.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const transition = async (id, action) => {
    const actionLabel = {
      submit: 'submit',
      approve: 'approve',
      reject: 'reject',
    }[action];

    if (!actionLabel) return;

    setActionId(id);

    try {
      await api.put(`/evaluations/${id}/${action}`, {
        remarks:
          action === 'reject'
            ? 'Please revise and resubmit.'
            : undefined,
      });

      const message =
        action === 'submit'
          ? 'Evaluation submitted.'
          : action === 'approve'
            ? 'Evaluation approved.'
            : 'Evaluation rejected.';

      toast(document.body, message);

      await load();
    } catch (err) {
      toast(
        document.body,
        err.message || `Unable to ${actionLabel} evaluation.`,
        'error'
      );
    } finally {
      setActionId(null);
    }
  };

  if (error && !evals) {
    return <ErrorBox message={error} />;
  }

  if (!evals || !kpilib) {
    return <Loading />;
  }

  const filteredEvals = evals.filter((e) => {
    const query = search.toLowerCase().trim();

    return (
      (e.employee_name || '').toLowerCase().includes(query) ||
      (e.employee_code || '').toLowerCase().includes(query) ||
      (e.status || '').toLowerCase().includes(query)
    );
  });

  const draftCount = evals.filter((e) => e.status === 'draft').length;
  const submittedCount = evals.filter(
    (e) => e.status === 'submitted'
  ).length;
  const approvedCount = evals.filter((e) => e.status === 'approved').length;

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6 pb-8">
      {/* Page heading */}
      <PageHeader
        title="Evaluations"
        subtitle="Automated KPI scoring — enter achieved values and the platform computes weighted scores."
        actions={
          <button type="button" className={primaryButton} onClick={openNew}>
            <span className="text-lg leading-none">+</span>
            New Evaluation
          </button>
        }
      />

      {/* Hero banner */}
      <section className="relative isolate overflow-hidden rounded-2xl bg-linear-to-br from-slate-950 via-blue-950 to-blue-800 px-5 py-6 text-white shadow-lg sm:px-7 sm:py-8">
        <div className="pointer-events-none absolute -right-12 -top-16 -z-10 h-56 w-56 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 -top-8 -z-10 h-40 w-40 rounded-full border border-white/10" />

        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Performance management
            </span>

            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
              Employee performance evaluations
            </h2>

            <p className="mt-2 text-sm leading-6 text-blue-100/85 sm:text-base">
              Evaluate employee KPIs, calculate weighted scores, and manage
              submissions and approvals in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={openNew}
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20 sm:self-center"
          >
            <span className="text-lg leading-none">+</span>
            Create evaluation
          </button>
        </div>
      </section>

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl">
              📋
            </div>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              All records
            </span>
          </div>
          <p className="mt-4 text-sm font-medium text-slate-500">
            Total Evaluations
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {evals.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-xl">
              📝
            </div>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
              In progress
            </span>
          </div>
          <p className="mt-4 text-sm font-medium text-slate-500">
            Draft Evaluations
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {draftCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-xl">
              ⏳
            </div>
            <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
              Awaiting review
            </span>
          </div>
          <p className="mt-4 text-sm font-medium text-slate-500">
            Submitted
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {submittedCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl">
              ✓
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              Completed
            </span>
          </div>
          <p className="mt-4 text-sm font-medium text-slate-500">
            Approved
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {approvedCount}
          </p>
        </div>
      </section>

      {/* Evaluation records */}
      <section className={panelClass}>
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <SectionHeading
            title="Evaluation records"
            subtitle="Review scores, track statuses, and manage approval actions."
            count={filteredEvals.length}
          />

          <div className="relative w-full lg:max-w-sm">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">
              ⌕
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee, code, status..."
              aria-label="Search evaluations"
              className={`${inputClass} pl-10`}
            />
          </div>
        </div>

        {/* Mobile evaluation cards */}
        <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
          {filteredEvals.map((e) => (
            <article
              key={e.id}
              className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/20"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold uppercase text-blue-700">
                  {(e.employee_name || 'U')
                    .split(' ')
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join('')}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="wrap-break-words font-bold text-slate-800">
                    {e.employee_name || 'Unknown employee'}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {e.employee_code || 'No employee code'}
                  </p>
                </div>

                <div className="shrink-0">
                  <StatusBadge status={e.status} />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Overall score</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {e.overall_score ?? '—'}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Max {e.max_possible || 0}
                  </p>
                </div>

                <div className="min-w-0 rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Rating</p>
                  <div className="mt-2">
                    <RatingPill rating={getRating(e.overall_score)} />
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-slate-100 px-3 py-2.5">
                <p className="text-xs font-medium text-slate-500">
                  Evaluation period
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {formatDate(e.period_start)} – {formatDate(e.period_end)}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                {e.status === 'draft' && (
                  <button
                    type="button"
                    disabled={actionId === e.id}
                    onClick={() => transition(e.id, 'submit')}
                    className={`${primaryButton} flex-1`}
                  >
                    {actionId === e.id ? 'Processing...' : 'Submit'}
                  </button>
                )}

                {e.status === 'submitted' && (
                  <>
                    <button
                      type="button"
                      disabled={actionId === e.id}
                      onClick={() => transition(e.id, 'approve')}
                      className="flex-1 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {actionId === e.id ? 'Processing...' : 'Approve'}
                    </button>

                    <button
                      type="button"
                      disabled={actionId === e.id}
                      onClick={() => transition(e.id, 'reject')}
                      className="flex-1 rounded-xl border border-rose-200 bg-white px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}

          {filteredEvals.length === 0 && (
            <EmptyState
              title="No evaluations found"
              description="Try a different search or create a new evaluation."
            />
          )}
        </div>

        {/* Desktop and tablet table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-225 border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                {[
                  'Employee',
                  'Evaluation period',
                  'Status',
                  'Overall score',
                  'Rating',
                  'Actions',
                ].map((heading) => (
                  <th
                    key={heading}
                    className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredEvals.map((e) => (
                <tr
                  key={e.id}
                  className="transition-colors hover:bg-blue-50/40"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold uppercase text-blue-700">
                        {(e.employee_name || 'U')
                          .split(' ')
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">
                          {e.employee_name || 'Unknown employee'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {e.employee_code || 'No employee code'}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                    {formatDate(e.period_start)} – {formatDate(e.period_end)}
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge status={e.status} />
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-800">
                      {e.overall_score ?? '—'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Max {e.max_possible || 0}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <RatingPill rating={getRating(e.overall_score)} />
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {e.status === 'draft' && (
                        <button
                          type="button"
                          disabled={actionId === e.id}
                          onClick={() => transition(e.id, 'submit')}
                          className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
                        >
                          {actionId === e.id ? 'Processing...' : 'Submit'}
                        </button>
                      )}

                      {e.status === 'submitted' && (
                        <>
                          <button
                            type="button"
                            disabled={actionId === e.id}
                            onClick={() => transition(e.id, 'approve')}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Approve
                          </button>

                          <button
                            type="button"
                            disabled={actionId === e.id}
                            onClick={() => transition(e.id, 'reject')}
                            className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {e.status !== 'draft' && e.status !== 'submitted' && (
                        <span className="text-xs text-slate-400">No actions</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredEvals.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      title="No evaluations found"
                      description="Try a different search or create a new evaluation."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-6">
          <p className="text-xs text-slate-500">
            Showing{' '}
            <span className="font-semibold text-slate-700">
              {filteredEvals.length}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-700">
              {evals.length}
            </span>{' '}
            evaluations
          </p>
        </div>
      </section>

      {/* New evaluation modal */}
      {showForm && editing && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForm();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="evaluation-modal-title"
            className="my-auto flex max-h-[96dvh] w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-2xl"
          >
            {/* Modal header */}
            <div className="relative shrink-0 overflow-hidden bg-linear-to-r from-slate-950 to-blue-800 px-5 py-5 text-white sm:px-7 sm:py-6">
              <div className="pointer-events-none absolute -right-8 -top-12 h-36 w-36 rounded-full border border-white/10" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
                    KPI management
                  </span>

                  <h2
                    id="evaluation-modal-title"
                    className="mt-3 text-xl font-bold sm:text-2xl"
                  >
                    New KPI Evaluation
                  </h2>

                  <p className="mt-1 text-sm leading-5 text-blue-100/85">
                    Select an employee, set targets, and enter achieved values.
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Close evaluation form"
                  disabled={busy}
                  onClick={closeForm}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-2xl transition hover:bg-white/20 disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal content */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              {/* Evaluation details */}
              <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-3 sm:p-5">
                <div className="min-w-0">
                  <label
                    htmlFor="evaluation-employee"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Employee <span className="text-rose-500">*</span>
                  </label>

                  <select
                    id="evaluation-employee"
                    value={editing.employeeId}
                    disabled={busy}
                    onChange={(e) => switchEmployee(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select employee...</option>
                    {(employees || []).map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} ({employee.employee_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="evaluation-start"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Period Start
                  </label>

                  <input
                    id="evaluation-start"
                    type="date"
                    value={editing.periodStart}
                    disabled={busy}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        periodStart: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="evaluation-end"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Period End
                  </label>

                  <input
                    id="evaluation-end"
                    type="date"
                    value={editing.periodEnd}
                    min={editing.periodStart || undefined}
                    disabled={busy}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        periodEnd: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              {/* KPI section heading */}
              <div className="mb-4 mt-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-800">
                    KPI targets and achievements
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Enter a target to include that KPI in this evaluation.
                  </p>
                </div>

                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  {rows.filter((row) => Number(row.targetValue) > 0).length}{' '}
                  KPIs selected
                </span>
              </div>

              {/* Mobile KPI cards */}
              <div className="space-y-4 md:hidden">
                {rows.map((row, index) => {
                  const calc = pct(
                    row.achievedValue,
                    row.targetValue,
                    row.weight
                  );
                  const skip = !Number(row.targetValue);

                  return (
                    <article
                      key={row.kpiId}
                      className={`rounded-2xl border p-4 transition ${
                        skip
                          ? 'border-slate-200 bg-white'
                          : 'border-blue-200 bg-blue-50/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="wrap-break-words font-semibold text-slate-800">
                            {row.kpiName}
                          </h4>
                          <p className="mt-1 text-xs text-slate-500">
                            Unit: {row.kpiUnit || '—'}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                            skip
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {skip ? 'Not included' : 'Included'}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor={`target-${row.kpiId}`}
                            className="mb-1.5 block text-xs font-semibold text-slate-600"
                          >
                            Target
                          </label>
                          <input
                            id={`target-${row.kpiId}`}
                            type="number"
                            min="0"
                            step="any"
                            value={row.targetValue}
                            disabled={busy}
                            onChange={(e) =>
                              updateRow(index, 'targetValue', e.target.value)
                            }
                            placeholder="0"
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`achieved-${row.kpiId}`}
                            className="mb-1.5 block text-xs font-semibold text-slate-600"
                          >
                            Achieved
                          </label>
                          <input
                            id={`achieved-${row.kpiId}`}
                            type="number"
                            min="0"
                            step="any"
                            value={row.achievedValue}
                            disabled={busy}
                            onChange={(e) =>
                              updateRow(index, 'achievedValue', e.target.value)
                            }
                            placeholder="0"
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`weight-${row.kpiId}`}
                            className="mb-1.5 block text-xs font-semibold text-slate-600"
                          >
                            Weight (%)
                          </label>
                          <input
                            id={`weight-${row.kpiId}`}
                            type="number"
                            min="0"
                            step="any"
                            value={row.weight}
                            disabled={busy}
                            onChange={(e) =>
                              updateRow(index, 'weight', e.target.value)
                            }
                            className={inputClass}
                          />
                        </div>

                        <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
                          <p className="text-xs font-medium text-slate-500">
                            Achievement
                          </p>
                          <p className="mt-1 text-lg font-bold text-blue-700">
                            {skip ? '—' : `${calc.p}%`}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-200">
                        <span className="text-sm text-slate-500">
                          Weighted score
                        </span>
                        <span className="font-bold text-slate-800">
                          {skip ? '—' : calc.s}
                        </span>
                      </div>

                      <div className="mt-3">
                        <label
                          htmlFor={`comments-${row.kpiId}`}
                          className="mb-1.5 block text-xs font-semibold text-slate-600"
                        >
                          Comments
                        </label>
                        <input
                          id={`comments-${row.kpiId}`}
                          type="text"
                          value={row.comments}
                          disabled={busy}
                          onChange={(e) =>
                            updateRow(index, 'comments', e.target.value)
                          }
                          placeholder="Optional comments..."
                          className={inputClass}
                        />
                      </div>
                    </article>
                  );
                })}

                {rows.length === 0 && (
                  <EmptyState
                    title="No KPIs available"
                    description="Add KPIs to the KPI library before creating an evaluation."
                  />
                )}
              </div>

              {/* Desktop KPI table */}
              <div className="hidden overflow-x-auto rounded-xl border border-slate-200 md:block">
                <table className="w-full min-w-262.5 border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      {[
                        'KPI',
                        'Target',
                        'Achieved',
                        'Weight (%)',
                        'Achievement',
                        'Score',
                        'Comments',
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row, index) => {
                      const calc = pct(
                        row.achievedValue,
                        row.targetValue,
                        row.weight
                      );
                      const skip = !Number(row.targetValue);

                      return (
                        <tr
                          key={row.kpiId}
                          className={`transition-colors ${
                            skip
                              ? 'bg-white text-slate-400'
                              : 'bg-blue-50/30 hover:bg-blue-50/60'
                          }`}
                        >
                          <td className="px-4 py-4">
                            <p className="min-w-32.5 font-semibold text-slate-800">
                              {row.kpiName}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {row.kpiUnit || '—'}
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            <input
                              aria-label={`${row.kpiName} target`}
                              type="number"
                              min="0"
                              step="any"
                              value={row.targetValue}
                              disabled={busy}
                              onChange={(e) =>
                                updateRow(index, 'targetValue', e.target.value)
                              }
                              placeholder="0"
                              className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            />
                          </td>

                          <td className="px-4 py-4">
                            <input
                              aria-label={`${row.kpiName} achieved`}
                              type="number"
                              min="0"
                              step="any"
                              value={row.achievedValue}
                              disabled={busy}
                              onChange={(e) =>
                                updateRow(
                                  index,
                                  'achievedValue',
                                  e.target.value
                                )
                              }
                              placeholder="0"
                              className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            />
                          </td>

                          <td className="px-4 py-4">
                            <input
                              aria-label={`${row.kpiName} weight`}
                              type="number"
                              min="0"
                              step="any"
                              value={row.weight}
                              disabled={busy}
                              onChange={(e) =>
                                updateRow(index, 'weight', e.target.value)
                              }
                              className="w-20 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            />
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`font-semibold ${
                                skip ? 'text-slate-400' : 'text-blue-700'
                              }`}
                            >
                              {skip ? '—' : `${calc.p}%`}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <span className="font-bold text-slate-800">
                              {skip ? '—' : calc.s}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <input
                              aria-label={`${row.kpiName} comments`}
                              type="text"
                              value={row.comments}
                              disabled={busy}
                              onChange={(e) =>
                                updateRow(index, 'comments', e.target.value)
                              }
                              placeholder="Optional..."
                              className="w-36 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            />
                          </td>
                        </tr>
                      );
                    })}

                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center">
                          <p className="font-semibold text-slate-700">
                            No KPIs available
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Add KPIs to the KPI library first.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Calculation explanation */}
              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 font-bold text-blue-700">
                    i
                  </span>

                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-blue-900">
                      How scoring works
                    </h4>
                    <p className="mt-1 text-xs leading-6 text-blue-800/80 sm:text-sm">
                      Achievement % = achieved ÷ target × 100, capped at 150%.
                      Weighted score = achievement % × weight ÷ 100. Overall
                      score = sum of weighted scores.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
              <p className="hidden text-xs text-slate-400 lg:block">
                Review the KPI values before submitting.
              </p>

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={busy}
                  onClick={closeForm}
                  className={secondaryButton}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => save(false)}
                  className={secondaryButton}
                >
                  {busy ? 'Saving...' : 'Save Draft'}
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => save(true)}
                  className={primaryButton}
                >
                  {busy ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Processing...
                    </>
                  ) : (
                    'Save & Submit'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 pt-4">
        <div className="flex flex-col gap-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>Government Workforce Performance Evaluation Platform</p>
          <p>Employee KPI evaluation and approval management</p>
        </div>
      </footer>
    </main>
  );
}
