
import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Loading, ErrorBox, PageHeader, toast } from '../components/ui';

export default function AssignmentsPage() {
  const [kpis, setKpis] = useState(null);
  const [employees, setEmployees] = useState(null);
  const [assignments, setAssignments] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [showForm, setShowForm] = useState(false);

  const [f, setF] = useState({
    employeeId: '',
    kpiId: '',
    targetValue: '',
    weight: '',
    periodStart: '2026-01-01',
    periodEnd: '2026-03-31',
  });

  const load = async () => {
    try {
      setAssignments(null);

      const [a, k, e] = await Promise.all([
        api.get('/kpis/assignments'),
        api.get('/kpis'),
        api.get('/users?role=employee'),
      ]);

      setAssignments(a.assignments);
      setKpis(k.kpis);
      setEmployees(e.users);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = (key) => (e) =>
    setF({ ...f, [key]: e.target.value });

  const save = async () => {
    if (!f.employeeId || !f.kpiId || !f.targetValue) {
      return alert(
        'Employee, KPI and target value are required.'
      );
    }

    setBusy(true);

    try {
      await api.post('/kpis/assignments', {
        employeeId: Number(f.employeeId),
        kpiId: Number(f.kpiId),
        targetValue: Number(f.targetValue),
        weight: Number(f.weight) || undefined,
        periodStart: f.periodStart,
        periodEnd: f.periodEnd,
      });

      toast(document.body, 'KPI assigned to employee.');

      setShowForm(false);
      await load();
    } catch (err) {
      toast(document.body, err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Remove this KPI assignment?')) return;

    try {
      await api.del(`/kpis/assignments/${id}`);

      toast(document.body, 'Assignment removed.');
      await load();
    } catch (err) {
      toast(document.body, err.message, 'error');
    }
  };

  if (error && !assignments) {
    return <ErrorBox message={error} />;
  }

  if (!assignments) {
    return <Loading />;
  }

  return (
    <div className="w-full min-w-0 space-y-6 pb-6">

      {/* Page Header */}
      <PageHeader
        title="KPI Assignments"
        subtitle="Define measurable targets and weightage for each employee's evaluation cycle."
        actions={
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-700 to-blue-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-900/10 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30"
            onClick={() => setShowForm(true)}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>

            Assign KPI
          </button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

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
              <rect x="3" y="4" width="18" height="17" rx="2" />
              <path d="M8 2v4m8-4v4M3 10h18M8 14h3m-3 3h7" />
            </svg>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500">
              Total Assignments
            </p>

            <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              {assignments.length}
            </h3>
          </div>
        </div>

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
              <path d="M3 21v-2a6 6 0 0 1 12 0v2m2-13a4 4 0 0 1 0 8m2 2a5 5 0 0 1 2 4" />
            </svg>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500">
              Employees
            </p>

            <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              {employees?.length ?? 0}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:col-span-2 xl:col-span-1">
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
              <path d="M12 3 14.8 8.7 21 9.6l-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
            </svg>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500">
              Available KPIs
            </p>

            <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              {kpis?.length ?? 0}
            </h3>
          </div>
        </div>
      </div>

      {/* Assignments Table */}
      <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              Employee KPI Assignments
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
              View and manage assigned performance targets.
            </p>
          </div>

          <span className="inline-flex w-fit items-center rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">
            {assignments.length} Records
          </span>
        </div>

        {assignments.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-212.5 border-collapse text-left">
              <thead>
                <tr className="bg-slate-50">
                  <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Employee
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Department
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    KPI
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Target
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Weight
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Period
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {assignments.map((a) => (
                  <tr
                    key={a.id}
                    className="transition-colors hover:bg-slate-50/80"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">
                        {a.employee_name}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {a.employee_code}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {a.department_name || '—'}
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex max-w-52 items-center rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">
                        {a.kpi_name}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-800">
                      {a.target_value} {a.kpi_unit}
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                        {a.weight}%
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-600">
                      <div>
                        {String(a.period_start).slice(0, 10)}
                      </div>

                      <div className="my-1 text-slate-400">
                        to
                      </div>

                      <div>
                        {String(a.period_end).slice(0, 10)}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => remove(a.id)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:border-red-300 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/20"
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M3 6h18m-2 0-.9 14H5.9L5 6m4 0V4h6v2m-5 4v6m4-6v6" />
                        </svg>

                        Remove
                      </button>
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
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <path d="M8 8h8m-8 4h8m-8 4h4" />
              </svg>
            </div>

            <h3 className="text-base font-bold text-slate-800">
              No assignments yet
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Start by assigning a KPI and defining a measurable
              target for an employee.
            </p>

            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30"
            >
              + Assign KPI
            </button>
          </div>
        )}
      </section>

      {/* Assign KPI Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-modal-title"
            className="my-auto max-h-[95dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl animate-[modalIn_0.2s_ease-out] sm:rounded-2xl"
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-5 py-5 sm:px-7">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
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
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>

                <div className="min-w-0">
                  <h3
                    id="assign-modal-title"
                    className="text-base font-bold text-slate-900 sm:text-lg"
                  >
                    Assign KPI to Employee
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Configure the employee's performance target.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Close dialog"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
              >
                ×
              </button>
            </div>

            {/* Modal Form */}
            <div className="px-5 py-6 sm:px-7">
              <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">

                <div className="min-w-0">
                  <label
                    htmlFor="employeeId"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Employee <span className="text-red-500">*</span>
                  </label>

                  <select
                    id="employeeId"
                    value={f.employeeId}
                    onChange={set('employeeId')}
                    required
                    className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="">Select employee</option>

                    {(employees || []).map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.employee_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="kpiId"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    KPI <span className="text-red-500">*</span>
                  </label>

                  <select
                    id="kpiId"
                    value={f.kpiId}
                    onChange={set('kpiId')}
                    required
                    className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="">Select KPI</option>

                    {(kpis || []).map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name} ({k.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="targetValue"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Target Value <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="targetValue"
                    type="number"
                    min="0.01"
                    step="any"
                    value={f.targetValue}
                    onChange={set('targetValue')}
                    placeholder="Enter target value"
                    required
                    className="h-11 w-full min-w-0 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="weight"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Weight (%)
                  </label>

                  <input
                    id="weight"
                    type="number"
                    min="0.1"
                    step="any"
                    value={f.weight}
                    onChange={set('weight')}
                    placeholder="Default from KPI"
                    className="h-11 w-full min-w-0 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="periodStart"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Period Start
                  </label>

                  <input
                    id="periodStart"
                    type="date"
                    value={f.periodStart}
                    onChange={set('periodStart')}
                    className="h-11 w-full min-w-0 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="periodEnd"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Period End
                  </label>

                  <input
                    id="periodEnd"
                    type="date"
                    value={f.periodEnd}
                    onChange={set('periodEnd')}
                    className="h-11 w-full min-w-0 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={save}
                disabled={busy}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-700 to-blue-900 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-900/10 transition hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}

                {busy ? 'Saving...' : 'Assign KPI'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
