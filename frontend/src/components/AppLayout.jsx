
import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '▦', roles: ['admin', 'hod', 'employee'] },
  { to: '/work-logs', label: 'Work Logs', icon: '☰', roles: ['admin', 'hod', 'employee'] },
  { to: '/review', label: 'Review Submissions', icon: '✓', roles: ['hod'] },
  { to: '/assignments', label: 'KPI Assignments', icon: '⚖', roles: ['admin', 'hod'] },
  { to: '/evaluations', label: 'Evaluations', icon: '★', roles: ['admin', 'hod'] },
  { to: '/departments', label: 'Departments', icon: '◈', roles: ['admin'] },
  { to: '/users', label: 'Users & Roles', icon: '♙', roles: ['admin', 'hod'] },
  { to: '/audit', label: 'Audit Trail', icon: '◷', roles: ['admin'] },
  { to: '/reports', label: 'Reports', icon: '⇩', roles: ['admin', 'hod'] },
  { to: '/profile', label: 'My Profile', icon: '⚙', roles: ['admin', 'hod', 'employee'] },
];

const ROLE_LABEL = {
  admin: 'Administrator',
  hod: 'Department Head',
  employee: 'Employee',
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const items = NAV_ITEMS.filter(
    (item) =>
      user &&
      (item.roles.includes(user.role) || user.role === 'admin')
  );

  const name = user?.name || 'User';
  const role = ROLE_LABEL[user?.role] || user?.role || 'Member';
  const departmentName = user?.departmentName;

  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    setMobileOpen(false);
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `group flex min-h-[46px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-[#294A9F] text-white shadow-md shadow-black/10'
        : 'text-white/85 hover:bg-white/10 hover:text-white'
    }`;

  const renderNavigation = (isMobile = false) => (
    <nav className="space-y-1.5" aria-label="Main navigation">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          onClick={() => {
            if (isMobile) setMobileOpen(false);
          }}
          title={collapsed && !isMobile ? item.label : undefined}
          className={navLinkClass}
        >
          {({ isActive }) => (
            <>
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-blue-100 group-hover:bg-white/5'
                }`}
              >
                {item.icon}
              </span>

              <span
                className={`min-w-0 flex-1 truncate ${
                  collapsed && !isMobile ? 'lg:hidden' : ''
                }`}
              >
                {item.label}
              </span>

              {isActive && (
                <span
                  className={`h-2 w-2 shrink-0 rounded-full bg-white ${
                    collapsed && !isMobile ? 'lg:hidden' : ''
                  }`}
                />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );

  const renderUserCard = (isMobile = false) => (
    <div
      className={`flex min-w-0 items-center gap-3 ${
        collapsed && !isMobile
          ? 'lg:justify-center'
          : ''
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#294A9F] text-sm font-bold text-white ring-1 ring-white/20">
        {initials}
      </div>

      <div
        className={`min-w-0 flex-1 ${
          collapsed && !isMobile ? 'lg:hidden' : ''
        }`}
      >
        <p className="truncate text-sm font-semibold text-white">
          {name}
        </p>
        <p className="mt-0.5 truncate text-xs text-blue-200">
          {role}
        </p>
      </div>
    </div>
  );

  const renderSidebar = (isMobile = false) => (
    <>
      {/* Brand */}
      <div
        className={`flex h-20.5 shrink-0 items-center border-b border-white/10 ${
          collapsed && !isMobile
            ? 'justify-center px-3'
            : 'gap-3 px-5'
        }`}
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-lg font-extrabold tracking-tight text-[#142653] shadow-sm">
          DW
        </div>

        <div
          className={`min-w-0 ${
            collapsed && !isMobile ? 'lg:hidden' : ''
          }`}
        >
          <h1 className="whitespace-nowrap text-base font-bold tracking-tight text-white">
            Digital Workforce
          </h1>
          <p className="mt-1 whitespace-nowrap text-[11px] font-medium text-blue-200">
            KPI Evaluation Platform
          </p>
        </div>

        {isMobile && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
            className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-2xl text-white transition hover:bg-white/10"
          >
            ×
          </button>
        )}
      </div>

      {/* Scrollable navigation */}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-5 [scrollbar-thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent]">
        <p
          className={`mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200/70 ${
            collapsed && !isMobile ? 'lg:hidden' : ''
          }`}
        >
          Workspace
        </p>

        {renderNavigation(isMobile)}
      </div>

      {/* Fixed sidebar footer */}
      <div className="shrink-0 space-y-3 border-t border-white/10 bg-[#142653]/40 p-4">
        <div
          className={`rounded-xl border border-white/10 bg-white/5 p-3 ${
            collapsed && !isMobile ? 'lg:hidden' : ''
          }`}
        >
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 text-sm text-blue-200">◈</span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-200">
                Department
              </p>
              <p className="mt-1 wrap-break-words text-xs font-medium leading-5 text-white">
                {departmentName || 'Cross-Department Access'}
              </p>
            </div>
          </div>
        </div>

        {renderUserCard(isMobile)}

        <button
          type="button"
          onClick={handleLogout}
          title={collapsed && !isMobile ? 'Logout' : undefined}
          className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-blue-100 transition hover:bg-white/10 hover:text-white ${
            collapsed && !isMobile ? 'lg:justify-center lg:px-1' : ''
          }`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-lg">
            ⏻
          </span>

          <span className={collapsed && !isMobile ? 'lg:hidden' : ''}>
            Logout
          </span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#F3F6FC]">
      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden bg-linear-to-b from-[#0B1535] via-[#172D65] to-[#203F9A] text-white transition-[width] duration-300 lg:flex ${
          collapsed ? 'w-22' : 'w-67.5'
        }`}
      >
        {renderSidebar(false)}
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(300px,88vw)] flex-col overflow-hidden bg-linear-to-b from-[#0B1535] via-[#172D65] to-[#203F9A] text-white shadow-2xl transition-transform duration-300 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile navigation"
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
      >
        {renderSidebar(true)}
      </aside>

      {/* Main content area */}
      <div
        className={`min-h-screen min-w-0 transition-[padding] duration-300 ${
          collapsed ? 'lg:pl-22' : 'lg:pl-67.5'
        }`}
      >
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-17.5 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              aria-controls="mobile-navigation"
              aria-expanded={mobileOpen}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl text-slate-700 transition hover:bg-slate-50 lg:hidden"
            >
              ☰
            </button>

            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg text-slate-600 transition hover:bg-blue-50 hover:text-blue-900 lg:flex"
            >
              {collapsed ? '☰' : '↤'}
            </button>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900 sm:text-base">
                Digital Workforce
              </p>
              <p className="hidden text-xs text-slate-500 sm:block">
                Performance Management Portal
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:inline-flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Workspace
            </span>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-[#142653]">
              {initials}
            </div>

            <div className="hidden min-w-0 sm:block">
              <p className="max-w-40 truncate text-sm font-semibold text-slate-800">
                {name}
              </p>
              <p className="max-w-40 truncate text-xs text-slate-500">
                {role}
              </p>
            </div>
          </div>
        </header>

        {/* Department banner */}
        <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2348C5]">
              ◈
            </span>

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Current Access
              </p>
              <p className="truncate text-xs font-semibold text-slate-700 sm:text-sm">
                {departmentName
                  ? `Department: ${departmentName}`
                  : 'Cross-Department Access'}
              </p>
            </div>

            <span className="ml-auto hidden shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2348C5] sm:inline-flex">
              {role}
            </span>
          </div>
        </div>

        {/* Routed pages */}
        <main className="min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1800px] min-w-0">
            <Outlet />
          </div>

          <footer className="mx-auto mt-10 flex max-w-[1800px] flex-col gap-2 border-t border-slate-200 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} Digital Workforce
            </p>
            <p>
              KPI Evaluation &amp; Performance Management Platform
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
