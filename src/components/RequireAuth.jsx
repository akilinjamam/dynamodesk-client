import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider.jsx';
import { useWaking } from '../hooks/useWaking.js';

export default function RequireAuth() {
  const { status, retryConnection } = useAuth();
  const waking = useWaking();
  const location = useLocation();

  if (status === 'checking') {
    return (
      <div className="page-state">
        {waking
          ? 'Waking the server — this takes up to a minute on the first request.'
          : 'Checking your session…'}
      </div>
    );
  }

  // The token is still good; it is the server that could not be reached. Send
  // them to login and they would only meet the same wall, so offer a retry.
  if (status === 'unreachable') {
    return (
      <div className="page-state">
        <p>Could not reach the server. On the free plan it sleeps after a quiet spell.</p>
        <button type="button" className="btn" onClick={retryConnection}>
          Try again
        </button>
      </div>
    );
  }

  if (status !== 'signed-in') {
    // Remember where they were headed so login can send them back.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
