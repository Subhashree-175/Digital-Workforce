
import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Loading, ErrorBox, PageHeader, toast } from '../components/ui';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [f, setF] = useState({
    name: '',
    code: '',
    description: '',
  });

  const load = async () => {
    try {
      setError('');
      const d = await api.get('/departments');
      setDepartments(d.departments);
    } catch (err) {
      setError(err.message || 'Unable to load departments.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!f.name.trim() || !f.code.trim()) {
      alert('Name and code are required.');
      return;
    }

    try {
      setSaving(true);

      await api.post('/departments', {
        name: f.name.trim(),
        code: f.code.trim(),
        description: f.description.trim(),
      });

      toast(document.body, 'Department created.');
      setShowForm(false);
      setF({ name: '', code: '', description: '' });

      await load();
    } catch (err) {
      toast(document.body, err.message || 'Unable to create department.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id, name) => {
    if (!confirm(`Delete department "${name}"? This cascades to its KPIs.`)) {
      return;
    }

    try {
      await api.del(`/departments/${id}`);
      toast(document.body, 'Department deleted.');
      await load();
    } catch (err) {
      toast(document.body, err.message || 'Unable to delete department.', 'error');
    }
  };

  const filteredDepartments = (departments || []).filter((d) => {
    const query = search.toLowerCase().trim();

    return (
      d.name?.toLowerCase().includes(query) ||
      d.code?.toLowerCase().includes(query) ||
      d.description?.toLowerCase().includes(query)
    );
  });

  const totalEmployees = (departments || []).reduce(
    (total, d) => total + Number(d.employee_count || 0),
    0
  );

  const totalKpis = (departments || []).reduce(
    (total, d) => total + Number(d.kpi_count || 0),
    0
  );

  if (error && !departments) {
    return <ErrorBox message={error} />;
  }

  if (!departments) {
    return <Loading />;
  }

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6 pb-8">
      {/* Page heading */}
      <PageHeader
        title="Departments"
        subtitle="Configure government departments for KPI-based evaluation."
        actions={
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 sm:w-auto"
          >
            <span className="text-lg leading-none">+</span>
            Add Department
          </button>
        }
      />

      {/* Welcome banner */}
      <section className="relative isolate overflow-hidden rounded-2xl bg-linear-to-br from-slate-950 via-blue-950 to-blue-800 px-5 py-6 text-white shadow-lg sm:px-7 sm:py-8">
        <div className="pointer-events-none absolute -right-12 -top-16 -z-10 h-56 w-56 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 -top-8 -z-10 h-40 w-40 rounded-full border border-white/10" />

        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Organization management
            </span>

            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
              Department directory
            </h2>

            <p className="mt-2 text-sm leading-6 text-blue-100/85 sm:text-base">
              Manage departments, monitor workforce distribution, and organize
              KPIs from one central workspace.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm sm:self-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-xl">
              🏢
            </div>
            <div>
              <p className="text-xs text-blue-100">Total departments</p>
              <p className="mt-0.5 text-2xl font-bold">
                {departments.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Departments
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {departments.length}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Registered departments
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
              🏢
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Employees
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {totalEmployees}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Across all departments
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-2xl">
              👥
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total KPIs
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {totalKpis}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Configured performance indicators
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl">
              🎯
            </div>
          </div>
        </div>
      </section>

      {/* Department directory */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-800">
              All Departments
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              View and manage your registered departments.
            </p>
          </div>

          <div className="relative w-full lg:max-w-sm">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">
              ⌕
            </span>

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, code, or description..."
              aria-label="Search departments"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Mobile department cards */}
        <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
          {filteredDepartments.map((d) => (
            <article
              key={d.id}
              className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl">
                    🏛️
                  </div>

                  <div className="min-w-0">
                    <h3 className="wrap-break-words font-bold text-slate-800">
                      {d.name}
                    </h3>
                    <span className="mt-1 inline-flex rounded-lg bg-blue-50 px-2.5 py-1 font-mono text-xs font-semibold text-blue-700">
                      {d.code}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => remove(d.id, d.name)}
                  className="shrink-0 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 focus:outline-none focus:ring-4 focus:ring-rose-100"
                >
                  Delete
                </button>
              </div>

              <p className="mt-4 wrap-break-words text-sm leading-6 text-slate-500">
                {d.description || 'No description provided.'}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Employees</p>
                  <p className="mt-1 text-xl font-bold text-slate-800">
                    {d.employee_count || 0}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">KPIs</p>
                  <p className="mt-1 text-xl font-bold text-slate-800">
                    {d.kpi_count || 0}
                  </p>
                </div>
              </div>
            </article>
          ))}

          {filteredDepartments.length === 0 && (
            <div className="col-span-full py-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                🏢
              </div>
              <p className="mt-3 font-semibold text-slate-700">
                No departments found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try a different search or add a department.
              </p>
            </div>
          )}
        </div>

        {/* Tablet and desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-212.5 border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                {[
                  'Code',
                  'Department name',
                  'Description',
                  'Employees',
                  'KPIs',
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
              {filteredDepartments.map((d) => (
                <tr
                  key={d.id}
                  className="transition-colors hover:bg-blue-50/40"
                >
                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 font-mono text-xs font-bold text-blue-700">
                      {d.code}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg">
                        🏛️
                      </div>
                      <span className="font-semibold text-slate-800">
                        {d.name}
                      </span>
                    </div>
                  </td>

                  <td className="max-w-xs px-5 py-4 text-sm leading-6 text-slate-500">
                    <p className="line-clamp-2 wrap-break-words">
                      {d.description || '—'}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <span className="font-semibold text-slate-700">
                      {d.employee_count || 0}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span className="font-semibold text-slate-700">
                      {d.kpi_count || 0}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => remove(d.id, d.name)}
                      className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 focus:outline-none focus:ring-4 focus:ring-rose-100"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {filteredDepartments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                      🏢
                    </div>
                    <p className="mt-3 font-semibold text-slate-700">
                      No departments found
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Try a different search or add a department.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            Showing{' '}
            <span className="font-semibold text-slate-700">
              {filteredDepartments.length}
            </span>{' '}
            of{' '}
            <span className="font-semibold text-slate-700">
              {departments.length}
            </span>{' '}
            departments
          </p>
          <p>Department management</p>
        </div>
      </section>

      {/* Add department modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !saving) {
              setShowForm(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-department-title"
            className="my-auto w-full max-w-xl overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
          >
            {/* Modal header */}
            <div className="relative overflow-hidden bg-linear-to-r from-slate-950 to-blue-800 px-5 py-5 text-white sm:px-7 sm:py-6">
              <div className="pointer-events-none absolute -right-8 -top-12 h-36 w-36 rounded-full border border-white/10" />

              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-xl">
                    +
                  </div>
                  <h2
                    id="add-department-title"
                    className="text-xl font-bold sm:text-2xl"
                  >
                    Add Department
                  </h2>
                  <p className="mt-1 text-sm text-blue-100">
                    Enter the department information below.
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Close dialog"
                  disabled={saving}
                  onClick={() => setShowForm(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-2xl text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal form */}
            <div className="max-h-[65vh] space-y-5 overflow-y-auto p-5 sm:max-h-[70vh] sm:p-7">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="department-name"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Department Name <span className="text-rose-500">*</span>
                  </label>

                  <input
                    id="department-name"
                    type="text"
                    autoFocus
                    value={f.name}
                    onChange={(e) =>
                      setF({ ...f, name: e.target.value })
                    }
                    placeholder="e.g. Revenue Department"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="department-code"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Department Code <span className="text-rose-500">*</span>
                  </label>

                  <input
                    id="department-code"
                    type="text"
                    value={f.code}
                    onChange={(e) =>
                      setF({ ...f, code: e.target.value })
                    }
                    placeholder="e.g. REV"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm uppercase text-slate-800 outline-none transition placeholder:normal-case placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="department-description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Description
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    Optional
                  </span>
                </label>

                <textarea
                  id="department-description"
                  rows={4}
                  value={f.description}
                  onChange={(e) =>
                    setF({ ...f, description: e.target.value })
                  }
                  placeholder="Describe the department's responsibilities..."
                  className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <p className="text-xs leading-5 text-slate-400">
                Fields marked with <span className="text-rose-500">*</span>{' '}
                are required.
              </p>
            </div>

            {/* Modal footer */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 p-5 sm:flex-row sm:justify-end sm:px-7 sm:py-5">
              <button
                type="button"
                disabled={saving}
                onClick={() => setShowForm(false)}
                className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={save}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Creating...
                  </>
                ) : (
                  <>
                    <span className="text-lg leading-none">+</span>
                    Create Department
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
