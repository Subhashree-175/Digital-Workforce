import React from 'react';

export function StatCard({ label, value, sub, tone = 'blue', icon = '▦' }) {
  return (
    <div className={`stat-card ${tone}`}>
      <div className="stat-icon">{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    approved: 'ok', submitted: 'info', pending: 'warn',
    rejected: 'bad', draft: 'muted', active: 'ok', present: 'ok',
  };
  return <span className={`badge ${map[status] || 'muted'}`}>{String(status).toUpperCase()}</span>;
}

export function RatingPill({ rating }) {
  const tone = {
    Outstanding: 'ok',
    'Exceeds Expectations': 'ok',
    'Meets Expectations': 'info',
    'Needs Improvement': 'warn',
    Unsatisfactory: 'bad',
  }[rating] || 'muted';
  return <span className={`badge ${tone}`}>{rating || 'Not Rated'}</span>;
}

export function Loading() {
  return <div className="muted-callout"><div className="spinner small" />Loading…</div>;
}

export function ErrorBox({ message }) {
  if (!message) return null;
  return <div className="alert alert-danger" role="alert">⚠ {message}</div>;
}

export function PageHeader({ title, subtitle, actions = null }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function toast(container, message, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 3200);
}