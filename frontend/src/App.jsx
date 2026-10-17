import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WorkLogsPage from './pages/WorkLogsPage';
import ReviewSubmissionsPage from './pages/ReviewSubmissionsPage';
import AssignmentsPage from './pages/AssignmentsPage';
import EvaluationsPage from './pages/EvaluationsPage';
import DepartmentsPage from './pages/DepartmentsPage';
import UsersPage from './pages/UsersPage';
import AuditPage from './pages/AuditPage';
import ReportsPage from './pages/ReportsPage';
import ProfilePage from './pages/ProfilePage';

function RequireAuth({ children }) {
  const { user, initializing } = useAuth();
  if (initializing) {
    return <div className="loading-screen"><div className="spinner" />Loading…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireRole({ roles, children }) {
  const { user } = useAuth();
  if (user && (roles.includes(user.role) || user.role === 'admin')) return children;
  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/work-logs" element={<WorkLogsPage />} />
            <Route path="/review" element={<RequireRole roles={['hod']}><ReviewSubmissionsPage /></RequireRole>} />
            <Route path="/assignments" element={<RequireRole roles={['admin', 'hod']}><AssignmentsPage /></RequireRole>} />
            <Route path="/evaluations" element={<RequireRole roles={['admin', 'hod']}><EvaluationsPage /></RequireRole>} />
            <Route path="/departments" element={<RequireRole roles={['admin']}><DepartmentsPage /></RequireRole>} />
            <Route path="/users" element={<RequireRole roles={['admin', 'hod']}><UsersPage /></RequireRole>} />
            <Route path="/audit" element={<RequireRole roles={['admin']}><AuditPage /></RequireRole>} />
            <Route path="/reports" element={<RequireRole roles={['admin', 'hod']}><ReportsPage /></RequireRole>} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}