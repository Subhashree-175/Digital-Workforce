
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  StatusBadge,
  Loading,
  ErrorBox,
  PageHeader,
  toast,
} from '../components/ui';

export default function WorkLogsPage() {
  const { user } = useAuth();

  const [logs, setLogs] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDetails, setTaskDetails] = useState('');
  const [kpiId, setKpiId] = useState('');
  const [logDate, setLogDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = async () => {
    try {
      setError('');
      setLogs(null);

      const data = await api.get('/work-logs');
      setLogs(data.workLogs);
    } catch (err) {
      setError(err.message || 'Unable to load work logs.');
    }
  };

  useEffect(() => {
    load();

    api
      .get('/kpis?active=true')
      .then((data) => setKpis(data.kpis))
      .catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();

    if (!taskTitle.trim() || !taskDetails.trim()) {
      toast(
        document.body,
        'Please fill in the task title and details.',
        'error'
      );
      return;
    }

    if (files.length > 5) {
      toast(
        document.body,
        'You can upload a maximum of 5 files.',
        'error'
      );
      return;
    }

    const oversizedFile = Array.from(files).find(
      (file) => file.size > 5 * 1024 * 1024
    );

    if (oversizedFile) {
      toast(
        document.body,
        `${oversizedFile.name} exceeds the 5 MB file limit.`,
        'error'
      );
      return;
    }

    setBusy(true);

    try {
      const fd = new FormData();

      fd.append('taskTitle', taskTitle.trim());
      fd.append('taskDetails', taskDetails.trim());
      fd.append('logDate', logDate);

      if (kpiId) {
        fd.append('kpiId', kpiId);
      }

      Array.from(files).forEach((file) => {
        fd.append('documents', file);
      });

      const res = await api.upload('/work-logs', fd);

      setTaskTitle('');
      setTaskDetails('');
      setKpiId('');
      setFiles([]);

      const fileInput = document.getElementById('work-log-files');
      if (fileInput) fileInput.value = '';

      toast(
        document.body,
        res.message || 'Work log submitted for approval.'
      );

      await load();
    } catch (err) {
      toast(
        document.body,
        err.message || 'Unable to submit work log.',
        'error'
      );
    } finally {
      setBusy(false);
    }
  };

  if (error && !logs) {
    return (
      <div className="space-y-4">
        <ErrorBox message={error} />
        <button
          type="button"
          onClick={load}
          className="rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!logs) return <Loading />;

  const canReview =
    user?.role === 'hod' || user?.role === 'admin';

  const visibleLogs = canReview
    ? logs
    : logs.filter((log) => log.employee_id === user?.id);

  const getDocuments = (log) => {
    let docs = log.supporting_docs;

    if (!Array.isArray(docs)) {
      try {
        docs = JSON.parse(docs || '[]');
      } catch {
        return [];
      }
    }

    return Array.isArray(docs) ? docs : [];
  };

  const filteredLogs = visibleLogs.filter((log) => {
    const query = search.trim().toLowerCase();

    const matchesSearch = [
      log.task_title,
      log.task_details,
      log.kpi_name,
      log.supervisor_remarks,
    ].some((value) =>
      String(value || '').toLowerCase().includes(query)
    );

    const matchesStatus =
      statusFilter === 'all' ||
      String(log.status || '').toLowerCase() ===
        statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const pendingCount = visibleLogs.filter(
    (log) => String(log.status || '').toLowerCase() === 'pending'
  ).length;

  const approvedCount = visibleLogs.filter(
    (log) => String(log.status || '').toLowerCase() === 'approved'
  ).length;

  const rejectedCount = visibleLogs.filter(
    (log) => String(log.status || '').toLowerCase() === 'rejected'
  ).length;

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100';

  const labelClass =
    'mb-1.5 block text-sm font-semibold text-slate-700';

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

  const renderDocuments = (log) => {
    const documents = getDocuments(log);

    if (!documents.length) return null;

    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {documents.map((doc, index) => (
          <span
            key={`${doc.fileName || 'document'}-${index}`}
            title={doc.fileName || 'Supporting document'}
            className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-2 py-1 text-xs text-blue-800"
          >
            <span aria-hidden="true">📎</span>
            <span className="max-w-45 truncate">
              {doc.fileName || 'Supporting document'}
            </span>
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="min-w-0 space-y-6">
      {/* Page header */}
      <PageHeader
        title="Work Logs"
        subtitle="Record daily activities, attach supporting documents, and track KPI approval status."
      />

      {/* Intro banner */}
      <section className="relative overflow-hidden rounded-2xl bg-linear-to-r from-blue-950 via-blue-900 to-blue-800 p-5 text-white shadow-sm sm:p-7">
        <div className="pointer-events-none absolute -right-8 -top-12 h-48 w-48 rounded-full border-24 border-white/5" />
        <div className="pointer-events-none absolute -bottom-20 right-28 h-48 w-48 rounded-full border-20 border-white/5" />

        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
            Daily Activity Management
          </span>

          <h2 className="mt-4 text-xl font-bold tracking-tight sm:text-2xl">
            {canReview
              ? 'Work Log Overview'
              : 'Document Your Daily Progress'}
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
            {canReview
              ? 'Monitor submissions, review supporting information, and track work-log approval progress across your organization.'
              : 'Submit clear task details and relevant evidence so your work can be reviewed and considered for KPI credit.'}
          </p>
        </div>
      </section>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Submissions
              </p>
              <h3 className="mt-2 text-3xl font-bold text-slate-900">
                {visibleLogs.length}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Work logs recorded
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl text-blue-800">
              ▤
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Pending
              </p>
              <h3 className="mt-2 text-3xl font-bold text-amber-600">
                {pendingCount}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Awaiting review
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-xl text-amber-700">
              ◷
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Approved
              </p>
              <h3 className="mt-2 text-3xl font-bold text-emerald-700">
                {approvedCount}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Successfully approved
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-xl text-emerald-700">
              ✓
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Rejected
              </p>
              <h3 className="mt-2 text-3xl font-bold text-red-600">
                {rejectedCount}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Require attention
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-xl text-red-700">
              !
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.5fr)]">
        {/* Submit form */}
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-900">
                +
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Submit Work Log
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter your task information below.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
            <div>
              <label className={labelClass} htmlFor="task-title">
                Task Title <span className="text-red-500">*</span>
              </label>
              <input
                id="task-title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Land record digitization"
                maxLength={200}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="task-details">
                Task Details <span className="text-red-500">*</span>
              </label>
              <textarea
                id="task-details"
                value={taskDetails}
                onChange={(e) => setTaskDetails(e.target.value)}
                placeholder="Describe the work performed, quantity completed, and any issues encountered..."
                rows={5}
                maxLength={5000}
                required
                className={`${inputClass} min-h-32 resize-y leading-6`}
              />
              <p className="mt-1 text-right text-xs text-slate-400">
                {taskDetails.length}/5000
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <label className={labelClass} htmlFor="related-kpi">
                  Related KPI
                </label>
                <select
                  id="related-kpi"
                  value={kpiId}
                  onChange={(e) => setKpiId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">None selected</option>
                  {(kpis || []).map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label className={labelClass} htmlFor="work-date">
                  Work Date
                </label>
                <input
                  id="work-date"
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            {/* Supporting documents */}
            <div>
              <label className={labelClass} htmlFor="work-log-files">
                Supporting Documents
              </label>

              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-blue-400 hover:bg-blue-50/40">
                <div className="text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl text-blue-800 shadow-sm">
                    ↑
                  </div>

                  <p className="mt-3 text-sm font-semibold text-slate-800">
                    Attach supporting files
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    PDF, Excel, CSV, Word, images or TXT
                  </p>

                  <input
                    id="work-log-files"
                    type="file"
                    multiple
                    accept=".pdf,.xlsx,.xls,.csv,.docx,.doc,.jpg,.jpeg,.png,.gif,.txt"
                    onChange={(e) => setFiles(Array.from(e.target.files || []))}
                    className="mt-4 block w-full cursor-pointer text-xs text-slate-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-blue-900 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-blue-800"
                  />

                  <p className="mt-3 text-xs text-slate-500">
                    Maximum 5 files · 5 MB per file
                  </p>
                </div>
              </div>

              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-800">
                        ▤
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = files.filter(
                            (_, fileIndex) => fileIndex !== index
                          );
                          setFiles(updated);

                          const input = document.getElementById(
                            'work-log-files'
                          );

                          if (input) {
                            const transfer = new DataTransfer();
                            updated.forEach((item) =>
                              transfer.items.add(item)
                            );
                            input.files = transfer.files;
                          }
                        }}
                        aria-label={`Remove ${file.name}`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3.5">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 text-blue-800">ⓘ</span>
                <p className="text-xs leading-5 text-blue-900">
                  Include clear task details and relevant supporting
                  documents to help your supervisor review the submission.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit for Approval
                  <span aria-hidden="true">→</span>
                </>
              )}
            </button>
          </form>
        </section>

        {/* Submission tracker */}
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Submission Tracker
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  View the status of submitted work logs.
                </p>
              </div>

              <button
                type="button"
                onClick={load}
                className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:self-auto"
              >
                <span aria-hidden="true">↻</span>
                Refresh
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks or KPI..."
                aria-label="Search work logs"
                className={inputClass}
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by work log status"
                className={`${inputClass} sm:w-40`}
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-190 text-left">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-4 font-semibold">Date</th>
                  <th className="px-4 py-4 font-semibold">Task Details</th>
                  <th className="px-4 py-4 font-semibold">KPI</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 font-semibold">Remarks</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="align-top transition hover:bg-slate-50/80"
                  >
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                      {formatDate(log.log_date)}
                    </td>

                    <td className="max-w-xs px-4 py-4">
                      <p className="wrap-break-words text-sm font-semibold text-slate-900">
                        {log.task_title}
                      </p>
                      <p className="mt-1 whitespace-pre-line wrap-break-words text-xs leading-5 text-slate-500">
                        {log.task_details}
                      </p>
                      {renderDocuments(log)}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {log.kpi_name || '—'}
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={log.status} />
                    </td>

                    <td className="max-w-45 px-4 py-4 text-xs leading-5 text-slate-600">
                      <span className="wrap-break-words">
                        {log.supervisor_remarks || '—'}
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500">
                        ▤
                      </div>
                      <p className="mt-3 font-semibold text-slate-800">
                        No work logs found
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Your submissions will appear here.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile and tablet cards */}
          <div className="space-y-3 p-3 lg:hidden">
            {filteredLogs.map((log) => (
              <article
                key={log.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500">
                      {formatDate(log.log_date)}
                    </p>
                    <h3 className="mt-1 wrap-break-words font-semibold text-slate-900">
                      {log.task_title}
                    </h3>
                  </div>

                  <div className="self-start">
                    <StatusBadge status={log.status} />
                  </div>
                </div>

                <p className="mt-3 whitespace-pre-line wrap-break-words text-sm leading-6 text-slate-600">
                  {log.task_details}
                </p>

                {renderDocuments(log)}

                <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-400">
                      Related KPI
                    </p>
                    <p className="mt-1 wrap-break-words text-sm text-slate-700">
                      {log.kpi_name || '—'}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-400">
                      Supervisor Remarks
                    </p>
                    <p className="mt-1 whitespace-pre-line wrap-break-words text-sm text-slate-700">
                      {log.supervisor_remarks || '—'}
                    </p>
                  </div>
                </div>
              </article>
            ))}

            {filteredLogs.length === 0 && (
              <div className="px-4 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500">
                  ▤
                </div>
                <p className="mt-3 font-semibold text-slate-800">
                  No work logs found
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Try changing your search or status filter.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:px-6">
            Showing {filteredLogs.length} of {visibleLogs.length} submissions
          </div>
        </section>
      </div>
    </div>
  );
}
