import { useWaking } from '../hooks/useWaking.js';

/**
 * The API sleeps on Render's free plan, so the first request after a quiet
 * spell stalls for up to a minute. Without this the app just looks broken.
 */
export default function WakingNotice() {
  const waking = useWaking();
  if (!waking) return null;

  return (
    <div className="waking-notice" role="status">
      <span className="waking-spinner" aria-hidden="true" />
      Waking the server — this takes up to a minute on the first request.
    </div>
  );
}
