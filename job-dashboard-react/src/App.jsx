import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider }            from './context/AuthContext';
import { ThemeProvider }           from './context/ThemeContext';
import { NotificationProvider }    from './context/NotificationContext';
import { SubscriptionProvider }    from './context/SubscriptionContext';
import ProtectedRoute      from './components/ProtectedRoute';
import AdminRoute          from './components/AdminRoute';
import RecruiterRoute      from './components/RecruiterRoute';
import Layout              from './components/layout/Layout';
import LoginPage           from './pages/Login/LoginPage';
import DashboardPage       from './pages/Dashboard/DashboardPage';
import JobsPage            from './pages/Jobs/JobsPage';
import ApplicationsPage    from './pages/Applications/ApplicationsPage';
import AutomationPage      from './pages/Automation/AutomationPage';
import CareerPage          from './pages/Career/CareerPage';
import ResumePage          from './pages/Resume/ResumePage';
import AutoApplyPage       from './pages/AutoApply/AutoApplyPage';
import WorkflowPage        from './pages/Workflow/WorkflowPage';
import SettingsPage        from './pages/Settings/SettingsPage';
import AdminPage           from './pages/Admin/AdminPage';

// Recruiter Portal pages
import RecruiterDashboardPage  from './pages/Recruiter/RecruiterDashboardPage';
import RecruiterJobsPage       from './pages/Recruiter/RecruiterJobsPage';
import RecruiterApplicantsPage from './pages/Recruiter/RecruiterApplicantsPage';
import RecruiterInterviewsPage from './pages/Recruiter/RecruiterInterviewsPage';
import CompanyProfilePage      from './pages/Recruiter/CompanyProfilePage';

// Billing pages
import PricingPage  from './pages/Billing/PricingPage';
import BillingPage  from './pages/Billing/BillingPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SubscriptionProvider>
        <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"    element={<DashboardPage />} />
              <Route path="jobs"         element={<JobsPage />} />
              <Route path="applications" element={<ApplicationsPage />} />
              <Route path="automation"   element={<AutomationPage />} />
              <Route path="career"       element={<CareerPage />} />
              <Route path="resume"       element={<ResumePage />} />
              <Route path="auto-apply"   element={<AutoApplyPage />} />
              <Route path="workflow"     element={<WorkflowPage />} />
              <Route path="settings"     element={<SettingsPage />} />
              <Route path="pricing"     element={<PricingPage />} />
              <Route path="billing"     element={<BillingPage />} />

              {/* Admin */}
              <Route
                path="admin"
                element={
                  <AdminRoute>
                    <AdminPage />
                  </AdminRoute>
                }
              />

              {/* Recruiter Portal */}
              <Route
                path="recruiter"
                element={
                  <RecruiterRoute>
                    <RecruiterDashboardPage />
                  </RecruiterRoute>
                }
              />
              <Route
                path="recruiter/jobs"
                element={
                  <RecruiterRoute>
                    <RecruiterJobsPage />
                  </RecruiterRoute>
                }
              />
              <Route
                path="recruiter/applicants"
                element={
                  <RecruiterRoute>
                    <RecruiterApplicantsPage />
                  </RecruiterRoute>
                }
              />
              <Route
                path="recruiter/applicants/:jobId"
                element={
                  <RecruiterRoute>
                    <RecruiterApplicantsPage />
                  </RecruiterRoute>
                }
              />
              <Route
                path="recruiter/interviews"
                element={
                  <RecruiterRoute>
                    <RecruiterInterviewsPage />
                  </RecruiterRoute>
                }
              />
              <Route
                path="recruiter/company"
                element={
                  <RecruiterRoute>
                    <CompanyProfilePage />
                  </RecruiterRoute>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        </NotificationProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
