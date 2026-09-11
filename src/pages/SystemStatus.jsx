import { useHealth } from '../hooks/useHealth.js';

const Row = ({ label, children }) => (
  <div className="status-row">
    <dt>{label}</dt>
    <dd>{children}</dd>
  </div>
);

export default function SystemStatus() {
  const { data, isLoading, isError, error } = useHealth();

  const apiUp = !isLoading && !isError;
  const dbState = data?.database?.state ?? 'unknown';
  const dbUp = dbState === 'connected';

  return (
    <div className="page">
      <div className="card">
        <h1 className="brand">
          Dynamo<span>Desk</span>
        </h1>
        <p className="tagline">Document studio — invoices, proposals, notices.</p>

        <div className="section-label">System status</div>
        <dl style={{ margin: 0 }}>
          <Row label="Client">
            <span className="dot up" />
            <span className="state-up">running · :5174</span>
          </Row>
          <Row label="API server">
            <span className={`dot ${apiUp ? 'up' : 'down'}`} />
            <span className={apiUp ? 'state-up' : 'state-down'}>
              {isLoading ? 'checking…' : apiUp ? 'up · :4000' : 'unreachable'}
            </span>
          </Row>
          <Row label="Database">
            <span className={`dot ${dbUp ? 'up' : 'down'}`} />
            <span className={dbUp ? 'state-up' : 'state-down'}>
              {dbUp ? `${dbState} · ${data.database.name}` : dbState}
            </span>
          </Row>
          {apiUp && (
            <>
              <Row label="Service">{data.service}</Row>
              <Row label="Uptime">{data.uptimeSeconds}s</Row>
              <Row label="Checked">{new Date(data.time).toLocaleTimeString()}</Row>
            </>
          )}
        </dl>

        {isError && (
          <div className="hint">
            {error.message} — start the API with{' '}
            <code>cd dynamodesk-server &amp;&amp; npm run dev</code>, and the database
            with <code>docker start dynamodesk-mongo</code>.
          </div>
        )}

        {apiUp && (
          <div className="hint">
            Phase 1 complete. Next: brand settings and logo upload (Phase 2 in{' '}
            <code>PLAN.md</code>).
          </div>
        )}
      </div>
    </div>
  );
}
