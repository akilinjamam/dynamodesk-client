import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider.jsx';

export default function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'checking') return <div className="page-state">Checking your session…</div>;

  if (status !== 'signed-in') {
    // Remember where they were headed so login can send them back.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
