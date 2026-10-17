
import React, { useState } from 'react';
import { downloadFromUrl } from '../api/client';
import { PageHeader } from '../components/ui';

const REPORT_TYPES = [
  {
    type: 'departments',
    label: 'Department Productivity',
    desc: 'Cross-department KPI achievement, scores and work log compliance.',
    code: '01',
    symbol: 'D',
    category: 'Performance',
  },
  {
    type: 'performers',
    label: 'Top Performers',
    desc: 'Highest scoring employees across evaluated periods.',
    code: '02',
    symbol: 'T',
    category: 'Employees',
  },
  {
    type: 'evaluations',
    label: 'Evaluation Register',
    desc: 'All evaluations in scope, with role-aware exports.',
    code: '03',
    symbol: 'E',
    category: 'Evaluations',
  },
  {
    type: 'audit',
    label: 'Audit Log',
    desc: 'Full audit trail. Available to administrators only.',
    code: '04',
    symbol: 'A',
    category: 'Administration',
  },
];

const EXPORT_FORMATS = [
  {
    format: 'pdf',
    title: 'Download PDF',
    description: 'Printable report in A4 format',
    extension: '.pdf',
    symbol: 'P',
  },
  {
    format: 'excel',
    title: 'Download Excel',
    description: 'Spreadsheet with styled headers',
    extension: '.xlsx',
    symbol: 'X',
  },
  {
    format: 'csv',
    title: 'Download CSV',
    description: 'Simple format for data analysis',
    extension: '.csv',
    symbol: 'C',
  },
];

export default function ReportsPage() {
  const [type, setType] = useState('departments');
  const [busy, setBusy] = useState('');

  const selectedReport = REPORT_TYPES.find(
    (report) => report.type === type
  );

  const exportType = (format) => {
    if (busy) return;

    setBusy(format);

    try {
      const extension = format === 'excel' ? 'xlsx' : format;
      const filename = `${type}_${new Date()
        .toISOString()
        .slice(0, 10)}.${extension}`;

      downloadFromUrl(
        `/reports/${type}?format=${format}`,
        filename
      );
    } catch (error) {
      console.error('Unable to initiate report download:', error);
    } finally {
      // Preserve the existing download-trigger behavior.
      setTimeout(() => setBusy(''), 2000);
    }
  };

  return (
    <div className="min-w-0 space-y-6 pb-6">
      <PageHeader
        title="Reports & Exports"
        subtitle="Generate, download and analyze performance reports across your organization."
      />

      {/* Hero section */}
      <section className="relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-950 via-blue-950 to-blue-800 p-5 text-white shadow-lg sm:p-7 lg:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 -top-8 h-44 w-44 rounded-full border border-white/10" />

        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-blue-100">
            REPORTING CENTER
          </span>

          <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
            Your data, ready to export.
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
            Select a report, choose your preferred format and generate
            a downloadable copy of your organization's performance data.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white">
              4 Report Types
            </span>
            <span className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white">
              PDF · Excel · CSV
            </span>
          </div>
        </div>
      </section>

      {/* Main layout */}
      <div className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Step 1: Report selection */}
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-sm font-bold text-white shadow-sm">
                01
              </div>

              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-900">
                  Choose a report
                </h3>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Select the information you want to export.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 p-4 sm:p-6">
            {REPORT_TYPES.map((report) => {
              const selected = type === report.type;

              return (
                <label
                  key={report.type}
                  className={`group relative flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border p-4 transition duration-200 sm:gap-4 ${
                    selected
                      ? 'border-blue-500 bg-blue-50/70 shadow-sm ring-1 ring-blue-100'
                      : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50/70'
                  }`}
                >
                  <input
                    type="radio"
                    name="rtype"
                    value={report.type}
                    checked={selected}
                    onChange={() => setType(report.type)}
                    className="mt-1 h-4 w-4 shrink-0 accent-blue-700 focus:ring-blue-500"
                  />

                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition ${
                      selected
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-800'
                    }`}
                  >
                    {report.symbol}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="wrap-break-words text-sm font-bold text-slate-900 sm:text-base">
                        {report.label}
                      </h4>

                      {selected && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-800">
                          Selected
                        </span>
                      )}
                    </div>

                    <p className="mt-1.5 wrap-break-words text-xs leading-5 text-slate-500 sm:text-sm">
                      {report.desc}
                    </p>

                    <div className="mt-3">
                      <span
                        className={`inline-flex rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                          selected
                            ? 'bg-white text-blue-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {report.category}
                      </span>
                    </div>
                  </div>

                  <span
                    aria-hidden="true"
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs transition ${
                      selected
                        ? 'border-blue-700 bg-blue-700 text-white'
                        : 'border-slate-300 bg-white text-transparent'
                    }`}
                  >
                    ✓
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        {/* Step 2: Export formats */}
        <div className="min-w-0 space-y-6">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-sm">
                  02
                </div>

                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-slate-900">
                    Export format
                  </h3>
                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    Choose how you want to download the report.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 sm:p-6">
              {EXPORT_FORMATS.map((format) => (
                <button
                  key={format.format}
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => exportType(format.format)}
                  className={`group flex min-h-19 w-full min-w-0 items-center gap-3 rounded-xl border p-3 text-left transition duration-200 sm:gap-4 sm:p-4 ${
                    busy === format.format
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold transition ${
                      format.format === 'pdf'
                        ? 'bg-rose-50 text-rose-700 group-hover:bg-rose-100'
                        : format.format === 'excel'
                          ? 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-700 group-hover:bg-amber-100'
                    }`}
                  >
                    {format.symbol}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="wrap-break-words text-sm font-bold text-slate-900 sm:text-base">
                      {busy === format.format
                        ? 'Generating report…'
                        : format.title}
                    </h4>

                    <p className="mt-1 wrap-break-words text-xs leading-5 text-slate-500">
                      {format.description}
                    </p>
                  </div>

                  <span className="shrink-0 text-lg font-semibold text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-700">
                    {busy === format.format ? '…' : '↓'}
                  </span>
                </button>
              ))}
            </div>

            <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Selected report
              </p>

              <div className="mt-2 flex min-w-0 items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm font-bold text-blue-800">
                  {selectedReport?.symbol || 'R'}
                </div>

                <div className="min-w-0">
                  <p className="wrap-break-words text-sm font-bold text-slate-900">
                    {selectedReport?.label}
                  </p>
                  <p className="mt-1 wrap-break-words text-xs leading-5 text-slate-500">
                    {selectedReport?.desc}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Information card */}
          <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-800">
                i
              </div>

              <div className="min-w-0">
                <h3 className="text-sm font-bold text-blue-950">
                  About report generation
                </h3>

                <p className="mt-2 text-xs leading-5 text-blue-900/80 sm:text-sm">
                  Reports are generated server-side using the platform's
                  scoring model. The reporting service is intended to
                  support timestamped audit entries, PDF output in A4
                  format and Excel exports with styled headers.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {['PDF · A4', 'Excel · XLSX', 'CSV'].map((item) => (
                    <span
                      key={item}
                      className="rounded-lg border border-blue-100 bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-800"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-1 border-t border-slate-200 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>Performance Reporting Center</span>
        <span>Choose a report and export format to continue.</span>
      </div>
    </div>
  );
}
