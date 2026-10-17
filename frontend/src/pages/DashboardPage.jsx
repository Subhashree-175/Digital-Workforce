
import React, { useEffect, useState } from 'react';
import {
  LineChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Activity,
  ArrowUpRight,
  ClipboardCheck,
  Clock,
  Target,
  Users,
  TrendingUp,
  ShieldCheck,
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesCombined,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  StatCard,
  StatusBadge,
  RatingPill,
  Loading,
  ErrorBox,
  PageHeader,
} from '../components/ui';

const panelClass =
  'min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md';

const sectionTitleClass =
  'text-base font-bold tracking-tight text-slate-800 sm:text-lg';

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

const getActionColor = (status) => {
  const value = String(status || '').toLowerCase();

  if (value.includes('approved') || value.includes('complete')) {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
  }

  if (value.includes('pending') || value.includes('review')) {
    return 'bg-amber-50 text-amber-700 ring-amber-600/20';
  }

  if (value.includes('reject') || value.includes('fail')) {
    return 'bg-rose-50 text-rose-700 ring-rose-600/20';
  }

  return 'bg-blue-50 text-blue-700 ring-blue-600/20';
};

function SectionHeading({ icon: Icon, title, subtitle, count }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <Icon size={19} />
          </div>
        )}

        <div className="min-w-0">
          <h2 className={sectionTitleClass}>{title}</h2>
          {subtitle && (
            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {count !== undefined && (
        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {count}
        </span>
      )}
    </div>
  );
}

function EmptyState({ children, colSpan }) {
  if (colSpan) {
    return (
      <tr>
        <td colSpan={colSpan} className="px-4 py-12 text-center">
          <div className="mx-auto flex max-w-xs flex-col items-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <ClipboardCheck size={22} />
            </div>
            <p className="text-sm font-medium text-slate-600">{children}</p>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <ClipboardCheck size={22} />
      </div>
      <p className="text-sm font-medium text-slate-600">{children}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const [summary, setSummary] = useState(null);
  const [deptData, setDeptData] = useState(null);
  const [trend, setTrend] = useState(null);
  const [myAssignments, setMyAssignments] = useState(null);
  const [myEvaluations, setMyEvaluations] = useState(null);
  const [pendingLogs, setPendingLogs] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [s, d, t, asg, evl] = await Promise.all([
          api.get('/analytics/summary'),
          api.get('/analytics/department-productivity'),
          api.get('/analytics/kpi-trend?months=6'),
          api.get('/kpis/assignments'),
          api.get('/evaluations'),
        ]);

        if (cancelled) return;

        setSummary(s.summary);
        setDeptData(d.departments);
        setTrend(t.trend);
        setMyAssignments(asg.assignments);
        setMyEvaluations(evl.evaluations);

        if (user.role !== 'employee') {
          const p = await api.get('/work-logs/pending');

          if (!cancelled) {
            setPendingLogs(p.workLogs);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Unable to load dashboard data.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <ErrorBox message={error} />;
  if (!summary || !deptData) return <Loading />;

  const trendData = (trend || []).map((item) => ({
    period: item.period,
    achievement: Number(item.avg_achievement || 0),
    score: Number(item.avg_score || 0),
  }));

  const deptChart = deptData
    .filter((item) => item.avg_overall_score)
    .map((item) => ({
      name: item.department_name,
      avgScore: Number(item.avg_overall_score),
      ach: Number(item.avg_kpi_achievement || 0),
    }));

  const activeAssignments = (myAssignments || [])
    .filter((item) => item.period_end >= '2024-01-01')
    .slice(0, 6);

  const recentEvals = (myEvaluations || []).slice(0, 5);

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6 pb-8">
      {/* Page heading */}
      <div className="min-w-0">
        <PageHeader
          title={`Welcome, ${firstName}`}
          subtitle={
            user.role === 'employee'
              ? 'View your assigned KPIs, performance summary and work log status.'
              : user.role === 'hod'
                ? 'Monitor your team’s KPI status, pending approvals and performance trends.'
                : 'Monitor cross-department productivity and platform adoption.'
          }
        />
      </div>

      {/* Welcome banner */}
      <section className="relative isolate overflow-hidden rounded-2xl bg-linear-to-br from-slate-950 via-blue-950 to-blue-800 px-5 py-6 text-white shadow-lg shadow-blue-950/10 sm:px-7 sm:py-8 lg:px-9">
        <div className="pointer-events-none absolute -right-12 -top-20 -z-10 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 -top-10 -z-10 h-48 w-48 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-24 right-1/4 -z-10 h-48 w-48 rounded-full bg-blue-400/10 blur-2xl" />

        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100">
              <Activity size={14} />
              Performance overview
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Your workforce at a glance
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/85 sm:text-base">
              Track performance, review progress, and stay updated on
              organizational goals from one place.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 self-start rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm sm:self-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-xs text-blue-100">Signed in as</p>
              <p className="mt-0.5 text-sm font-semibold capitalize">
                {user.role}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Summary cards */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <ChartNoAxesCombined size={19} className="text-blue-700" />
          <h2 className={sectionTitleClass}>Performance snapshot</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <ClipboardCheck size={21} />
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                Approved
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500">
              Approved Evaluations
            </p>
            <div className="mt-2 flex items-end justify-between gap-2">
              <p className="text-3xl font-bold tracking-tight text-slate-900">
                {summary.approved_evals ?? 0}
              </p>
              <ArrowUpRight size={19} className="mb-1 text-emerald-600" />
            </div>
          </div>

          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Clock size={21} />
              </div>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                Attention
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500">
              Pending Work Logs
            </p>
            <div className="mt-2 flex items-end justify-between gap-2">
              <p className="text-3xl font-bold tracking-tight text-slate-900">
                {summary.pending_worklogs ?? 0}
              </p>
              <ArrowUpRight size={19} className="mb-1 text-amber-600" />
            </div>
          </div>

          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Target size={21} />
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                KPI tracking
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500">
              Active KPI Targets
            </p>
            <div className="mt-2 flex items-end justify-between gap-2">
              <p className="text-3xl font-bold tracking-tight text-slate-900">
                {summary.active_assignments ?? 0}
              </p>
              <ArrowUpRight size={19} className="mb-1 text-blue-600" />
            </div>
          </div>

          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <Users size={21} />
              </div>
              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                Active scope
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500">Employees</p>
            <div className="mt-2 flex items-end justify-between gap-2">
              <p className="text-3xl font-bold tracking-tight text-slate-900">
                {summary.employee_count ?? 0}
              </p>
              <ArrowUpRight size={19} className="mb-1 text-violet-600" />
            </div>
          </div>
        </div>
      </section>

      {/* Charts */}
      <section className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
        {trendData.length > 0 && (
          <div className={`${panelClass} p-4 sm:p-6`}>
            <SectionHeading
              icon={TrendingUp}
              title="Performance trend"
              subtitle="KPI achievement and overall score over the last six months."
            />

            <div className="h-65 w-full min-w-0 sm:h-75">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ top: 10, right: 8, bottom: 4, left: -18 }}
                >
                  <CartesianGrid
                    stroke="#e2e8f0"
                    strokeDasharray="4 4"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="period"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    minTickGap={15}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={45}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                      fontSize: 12,
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="achievement"
                    name="KPI Achievement %"
                    stroke="#d4883c"
                    strokeWidth={3}
                    dot={{ r: 3, fill: '#d4883c' }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="Overall Score"
                    stroke="#1f4e79"
                    strokeWidth={3}
                    dot={{ r: 3, fill: '#1f4e79' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {deptChart.length > 0 && (
          <div className={`${panelClass} p-4 sm:p-6`}>
            <SectionHeading
              icon={BriefcaseBusiness}
              title="Department productivity"
              subtitle="Compare average KPI achievement and overall scores."
            />

            <div className="h-65 w-full min-w-0 sm:h-75">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={deptChart}
                  margin={{ top: 10, right: 8, bottom: 4, left: -18 }}
                >
                  <CartesianGrid
                    stroke="#e2e8f0"
                    strokeDasharray="4 4"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={55}
                  />
                  <YAxis
                    domain={[0, 130]}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={45}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                      fontSize: 12,
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                  />
                  <Bar
                    dataKey="ach"
                    name="Avg KPI Achievement %"
                    fill="#d4883c"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={34}
                  />
                  <Bar
                    dataKey="avgScore"
                    name="Avg Overall Score"
                    fill="#2f6ba6"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={34}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </section>

      {/* Department KPI health */}
      {(user.role === 'admin' || user.role === 'hod') && (
        <section className="min-w-0">
          <SectionHeading
            icon={BriefcaseBusiness}
            title="Department KPI health"
            subtitle="Review performance scores and work-log activity across departments."
          />

          <div className={panelClass}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-212.5 border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    {[
                      'Department',
                      'Avg. overall',
                      'Avg. achievement',
                      'Employees evaluated',
                      'Work logs',
                      'Rating',
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
                  {deptData
                    .filter((d) => d.avg_overall_score)
                    .map((d) => (
                      <tr
                        key={d.id}
                        className="transition-colors hover:bg-blue-50/40"
                      >
                        <td className="px-5 py-4">
                          <span className="font-semibold text-slate-800">
                            {d.department_name}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-bold text-slate-800">
                            {d.avg_overall_score}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-medium text-slate-700">
                            {d.avg_kpi_achievement ?? '—'}
                            {d.avg_kpi_achievement != null ? '%' : ''}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {d.employees_evaluated ?? 0}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {d.total_worklogs ?? 0}
                        </td>
                        <td className="px-5 py-4">
                          <RatingPill rating={d.rating} />
                        </td>
                      </tr>
                    ))}

                  {deptData.filter((d) => d.avg_overall_score).length ===
                    0 && (
                    <EmptyState colSpan={6}>
                      No scored evaluations yet.
                    </EmptyState>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
              <p className="text-xs text-slate-500">
                Scroll horizontally to view all department metrics on smaller
                screens.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Recent evaluations */}
      <section className="min-w-0">
        <SectionHeading
          icon={ClipboardCheck}
          title="Recent evaluations"
          subtitle="Latest evaluation records and their current performance ratings."
          count={recentEvals.length}
        />

        <div className={panelClass}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  {[
                    'Employee',
                    'Evaluation period',
                    'Status',
                    'Overall score',
                    'Rating',
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
                {recentEvals.map((e) => (
                  <tr
                    key={e.id}
                    className="transition-colors hover:bg-blue-50/40"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold uppercase text-blue-700">
                          {(e.employee_name || 'U')
                            .split(' ')
                            .map((part) => part[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <span className="font-semibold text-slate-800">
                          {e.employee_name || '—'}
                        </span>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <CalendarDays
                          size={15}
                          className="shrink-0 text-slate-400"
                        />
                        {formatDate(e.period_start)} –{' '}
                        {formatDate(e.period_end)}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={e.status} />
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-800">
                        {e.overall_score ?? '—'}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <RatingPill rating={getRating(e.overall_score)} />
                    </td>
                  </tr>
                ))}

                {recentEvals.length === 0 && (
                  <EmptyState colSpan={5}>
                    No evaluations in scope yet.
                  </EmptyState>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Employee KPI assignments */}
      {user.role === 'employee' && (
        <section className="min-w-0">
          <SectionHeading
            icon={Target}
            title="My assigned KPI targets"
            subtitle="Keep track of your assigned targets, weights and evaluation periods."
            count={activeAssignments.length}
          />

          <div className={panelClass}>
            {activeAssignments.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {activeAssignments.map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-col gap-4 p-4 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                        <Target size={19} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="wrap-break-words font-semibold text-slate-800">
                          {a.kpi_name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Target:{' '}
                          <span className="font-semibold text-slate-700">
                            {a.target_value} {a.kpi_unit}
                          </span>
                          <span className="mx-2 text-slate-300">•</span>
                          Weight:{' '}
                          <span className="font-semibold text-slate-700">
                            {a.weight}%
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
                        {formatDate(a.period_start)} –{' '}
                        {formatDate(a.period_end)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>No active KPI targets assigned.</EmptyState>
            )}
          </div>
        </section>
      )}

      {/* Pending work-log approvals */}
      {pendingLogs && (
        <section className="min-w-0">
          <SectionHeading
            icon={Clock}
            title="Pending work-log approvals"
            subtitle="Work logs awaiting review."
            count={pendingLogs.length}
          />

          <div className={panelClass}>
            {pendingLogs.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {pendingLogs.slice(0, 5).map((l) => (
                  <div
                    key={l.id}
                    className="flex flex-col gap-3 p-4 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                        <ClipboardCheck size={19} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="wrap-break-words font-semibold text-slate-800">
                          {l.task_title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {l.employee_name}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Submitted for: {formatDate(l.log_date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center self-start sm:self-center">
                      <StatusBadge status={l.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>No pending work-log approvals.</EmptyState>
            )}
          </div>
        </section>
      )}

      <footer className="border-t border-slate-200 pt-4">
        <div className="flex flex-col gap-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>Government Workforce Performance Evaluation Platform</p>
          <p className="flex items-center gap-1.5">
            <ShieldCheck size={14} />
            Authorized performance overview
          </p>
        </div>
      </footer>
    </main>
  );
}
