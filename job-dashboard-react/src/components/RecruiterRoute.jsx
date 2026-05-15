import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RecruiterRoute({ children }) {
  const { isRecruiter, isAdmin, loading } = useAuth();

  if (loading) return null;

  // Admins can access recruiter portal too
  if (!isRecruiter && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
