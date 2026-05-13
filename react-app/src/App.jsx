import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth }       from './context/AuthContext';

import ProtectedRoute    from './components/ProtectedRoute';
import AdminRoute        from './components/AdminRoute';
import Layout            from './components/Layout/Layout';
import LoginPage         from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage     from './pages/DashboardPage';
import JobsPage          from './pages/JobsPage';
import ApplicationsPage  from './pages/ApplicationsPage';
import ResumePage        from './pages/ResumePage';
import SettingsPage      from './pages/SettingsPage';
import NotFoundPage      from './pages/NotFoundPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage    from './pages/admin/AdminUsersPage';
import AdminJobsPage     from './pages/admin/AdminJobsPage';

export default function App() {
  const { loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="auth-loading-overlay">
        <div className="auth-loading-spinner" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/login"          element={<LoginPage />}         />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected — redirects to /login when not authenticated */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Layout />}>
          <Route index               element={<DashboardPage />}    />
          <Route path="jobs"         element={<JobsPage />}         />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="resume"       element={<ResumePage />}       />
          <Route path="settings"     element={<SettingsPage />}     />

          {/* Admin-only — redirects to / when role !== 'admin' */}
          <Route element={<AdminRoute />}>
            <Route path="admin"       element={<AdminDashboardPage />} />
            <Route path="admin/users" element={<AdminUsersPage />}     />
            <Route path="admin/jobs"  element={<AdminJobsPage />}      />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
