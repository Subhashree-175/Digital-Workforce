
import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Loading,
  ErrorBox,
  PageHeader,
  toast,
  StatusBadge,
} from '../components/ui';

export default function UsersPage() {
  const { user } = useAuth();

  const [users, setUsers] = useState(null);
  const [departments, setDepartments] = useState(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const blank = {
    name: '',
    code: '',
    email: '',
    password: '',
    role: 'employee',
    designation: '',
    departmentId: '',
    joiningDate: '',
  };

  const [f, setF] = useState({ ...blank });

  const load = async () => {
    try {
      setError('');

      const [u, d] = await Promise.all([
        api.get('/users'),
        api.get('/departments'),
      ]);

      setUsers(u.users);
      setDepartments(d.departments);
    } catch (err) {
      setError(err.message || 'Unable to load users.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setF2 = (key) => (e) => {
    setF((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const save = async (e) => {
    e.preventDefault();

    if (
      !f.name.trim() ||
      !f.email.trim() ||
      f.password.length < 8
    ) {
      toast(
        document.body,
        'Name, email and a password of at least 8 characters are required.',
        'error'
      );
      return;
    }

    try {
      setSaving(true);

      await api.post('/users', {
        name: f.name.trim(),
        email: f.email.trim(),
        password: f.password,
        role: f.role,
        employeeCode: f.code.trim() || null,
        designation: f.designation.trim() || null,
        departmentId: f.departmentId
          ? Number(f.departmentId)
          : null,
        joiningDate: f.joiningDate || null,
      });

      toast(document.body, 'User created successfully.');
      setShowForm(false);
      setF({ ...blank });

      await load();
    } catch (err) {
      toast(
        document.body,
        err.message || 'Unable to create user.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (selectedUser) => {
    try {
      setUpdatingId(selectedUser.id);

      await api.put(`/users/${selectedUser.id}`, {
        isActive: !selectedUser.is_active,
      });

      toast(
        document.body,
        `User ${selectedUser.is_active ? 'deactivated' : 'activated'}.`
      );

      await load();
    } catch (err) {
      toast(
        document.body,
        err.message || 'Unable to update user status.',
        'error'
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const closeForm = () => {
    if (!saving) {
      setShowForm(false);
      setF({ ...blank });
    }
  };

  if (error && !users) {
    return (
      <div className="space-y-4">
        <ErrorBox message={error} />
        <button
          onClick={load}
          className="rounded-xl bg-blue-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!users) return <Loading />;

  const normalizedSearch = search.trim().toLowerCase();

  const filteredUsers = users.filter((u) => {
    const matchesSearch = [
      u.name,
      u.email,
      u.employee_code,
      u.department_name,
      u.designation,
      u.manager_name,
    ].some((value) =>
      String(value || '')
        .toLowerCase()
        .includes(normalizedSearch)
    );

    const matchesRole =
      roleFilter === 'all' || u.role === roleFilter;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && Boolean(u.is_active)) ||
      (statusFilter === 'inactive' && !u.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const activeCount = users.filter((u) => u.is_active).length;
  const inactiveCount = users.length - activeCount;
  const departmentCount = new Set(
    users
      .map((u) => u.department_name)
      .filter(Boolean)
  ).size;

  const roleLabel = (role) => {
    const labels = {
      admin: 'Administrator',
      hod: 'Department Head',
      employee: 'Employee',
    };

    return labels[role] || role;
  };

  const roleStyle = (role) => {
    const styles = {
      admin: 'bg-purple-50 text-purple-700 ring-purple-200',
      hod: 'bg-blue-50 text-blue-700 ring-blue-200',
      employee: 'bg-slate-100 text-slate-700 ring-slate-200',
    };

    return styles[role] || styles.employee;
  };

  const inputClass =
    'mt-1.5 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100';

  const labelClass =
    'block text-sm font-semibold text-slate-700';

  return (
    <div className="min-w-0 space-y-6">
      {/* Page heading */}
      <PageHeader
        title="Users & Roles"
        subtitle="Manage user accounts, departments, designations and access roles."
        actions={
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 sm:w-auto"
          >
            <span className="text-lg leading-none">+</span>
            Add User
          </button>
        }
      />

      {/* Overview cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total Users
              </p>
              <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {users.length}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Registered accounts
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl text-blue-800">
              <span aria-hidden="true">♙</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Active Users
              </p>
              <h3 className="mt-2 text-3xl font-bold tracking-tight text-emerald-700">
                {activeCount}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Currently enabled
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
                Inactive Users
              </p>
              <h3 className="mt-2 text-3xl font-bold tracking-tight text-amber-600">
                {inactiveCount}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Disabled accounts
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-xl text-amber-700">
              !
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Departments
              </p>
              <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {departmentCount}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                With assigned users
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-xl text-indigo-700">
              ▦
            </div>
          </div>
        </div>
      </div>

      {/* User list */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                All Users
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Search and manage registered accounts.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:flex">
              <div className="relative min-w-0 xl:w-72">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  ⌕
                </span>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users..."
                  aria-label="Search users"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-700 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                aria-label="Filter by role"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100 sm:min-w-40"
              >
                <option value="all">All roles</option>
                <option value="admin">Administrator</option>
                <option value="hod">Department Head</option>
                <option value="employee">Employee</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100 sm:min-w-36"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Desktop and tablet table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-237.5 text-left">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-5 py-4 font-semibold">Employee</th>
                <th className="px-4 py-4 font-semibold">Role</th>
                <th className="px-4 py-4 font-semibold">Department</th>
                <th className="px-4 py-4 font-semibold">Designation</th>
                <th className="px-4 py-4 font-semibold">Manager</th>
                <th className="px-4 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 text-right font-semibold">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className="transition hover:bg-slate-50/80"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-900">
                        {(u.name || '?')
                          .trim()
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {u.name}
                        </p>
                        <p className="mt-0.5 break-all text-xs text-slate-500">
                          {u.email}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          ID: {u.employee_code || '—'}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${roleStyle(u.role)}`}
                    >
                      {roleLabel(u.role)}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-600">
                    {u.department_name || '—'}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-600">
                    {u.designation || '—'}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-600">
                    {u.manager_name || '—'}
                  </td>

                  <td className="px-4 py-4">
                    <StatusBadge
                      status={u.is_active ? 'active' : 'rejected'}
                    />
                  </td>

                  <td className="px-5 py-4 text-right">
                    {u.id !== user?.id ? (
                      <button
                        type="button"
                        disabled={updatingId === u.id}
                        onClick={() => toggleActive(u)}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          u.is_active
                            ? 'border-red-200 bg-white text-red-600 hover:bg-red-50'
                            : 'border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {updatingId === u.id
                          ? 'Updating...'
                          : u.is_active
                            ? 'Deactivate'
                            : 'Activate'}
                      </button>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">
                        Current user
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500">
                      ⌕
                    </div>
                    <p className="mt-3 font-semibold text-slate-800">
                      No users found
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Try changing your search or filter settings.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 p-3 md:hidden">
          {filteredUsers.map((u) => (
            <article
              key={u.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-900">
                  {(u.name || '?')
                    .trim()
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="wrap-break-words font-semibold text-slate-900">
                    {u.name}
                  </h3>
                  <p className="mt-1 break-all text-xs text-slate-500">
                    {u.email}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Employee Code: {u.employee_code || '—'}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${roleStyle(u.role)}`}
                    >
                      {roleLabel(u.role)}
                    </span>

                    <StatusBadge
                      status={u.is_active ? 'active' : 'rejected'}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-400">
                    Department
                  </p>
                  <p className="mt-1 wrap-break-words text-sm text-slate-700">
                    {u.department_name || '—'}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-400">
                    Designation
                  </p>
                  <p className="mt-1 wrap-break-words text-sm text-slate-700">
                    {u.designation || '—'}
                  </p>
                </div>

                <div className="min-w-0 sm:col-span-2">
                  <p className="text-xs font-medium text-slate-400">
                    Manager
                  </p>
                  <p className="mt-1 wrap-break-words text-sm text-slate-700">
                    {u.manager_name || '—'}
                  </p>
                </div>
              </div>

              {u.id !== user?.id ? (
                <button
                  type="button"
                  disabled={updatingId === u.id}
                  onClick={() => toggleActive(u)}
                  className={`mt-4 w-full rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    u.is_active
                      ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {updatingId === u.id
                    ? 'Updating...'
                    : u.is_active
                      ? 'Deactivate User'
                      : 'Activate User'}
                </button>
              ) : (
                <p className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-center text-xs font-medium text-blue-800">
                  This is your account
                </p>
              )}
            </article>
          ))}

          {filteredUsers.length === 0 && (
            <div className="px-4 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500">
                ⌕
              </div>
              <p className="mt-3 font-semibold text-slate-800">
                No users found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filters.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>
            Showing {filteredUsers.length} of {users.length} users
          </span>
          <span>Manage roles and account access</span>
        </div>
      </section>

      {/* Add user modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeForm();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-user-title"
            className="my-auto flex max-h-[95dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4 sm:px-7 sm:py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-900">
                  +
                </div>
                <div>
                  <h2
                    id="add-user-title"
                    className="text-lg font-bold text-slate-900 sm:text-xl"
                  >
                    Add New User
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                    Create an account and assign its role.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close form"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-2xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
              <div className="overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
                <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                  <p className="text-sm font-semibold text-blue-950">
                    Account information
                  </p>
                  <p className="mt-1 text-xs leading-5 text-blue-800">
                    Fields marked with * are required. The temporary password
                    must contain at least 8 characters.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="user-name">
                      Full Name *
                    </label>
                    <input
                      id="user-name"
                      autoComplete="name"
                      required
                      value={f.name}
                      onChange={setF2('name')}
                      placeholder="Enter full name"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="user-email">
                      Email Address *
                    </label>
                    <input
                      id="user-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={f.email}
                      onChange={setF2('email')}
                      placeholder="name@company.com"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="user-code">
                      Employee Code
                    </label>
                    <input
                      id="user-code"
                      value={f.code}
                      onChange={setF2('code')}
                      placeholder="e.g. EMP-001"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      className={labelClass}
                      htmlFor="user-password"
                    >
                      Temporary Password *
                    </label>
                    <input
                      id="user-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={f.password}
                      onChange={setF2('password')}
                      placeholder="Minimum 8 characters"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="user-role">
                      Role *
                    </label>
                    <select
                      id="user-role"
                      required
                      value={f.role}
                      onChange={setF2('role')}
                      className={inputClass}
                    >
                      <option value="employee">Employee</option>
                      <option value="hod">Department Head</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label
                      className={labelClass}
                      htmlFor="user-department"
                    >
                      Department
                    </label>
                    <select
                      id="user-department"
                      value={f.departmentId}
                      onChange={setF2('departmentId')}
                      className={inputClass}
                    >
                      <option value="">None assigned</option>
                      {(departments || []).map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      className={labelClass}
                      htmlFor="user-designation"
                    >
                      Designation
                    </label>
                    <input
                      id="user-designation"
                      value={f.designation}
                      onChange={setF2('designation')}
                      placeholder="e.g. Software Engineer"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      className={labelClass}
                      htmlFor="user-joining-date"
                    >
                      Joining Date
                    </label>
                    <input
                      id="user-joining-date"
                      type="date"
                      value={f.joiningDate}
                      onChange={setF2('joiningDate')}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Creating...
                    </>
                  ) : (
                    'Create User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
