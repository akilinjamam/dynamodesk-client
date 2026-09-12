import { Link } from "react-router-dom";
import { useStats } from "../hooks/useDocuments.js";
import { useTemplates } from "../hooks/useTemplates.js";
import { useSettings } from "../hooks/useSettings.js";

const TYPE_LABELS = {
  invoice: "Invoices",
  proposal: "Proposals",
  requirements: "Requirements",
  overview: "Overviews",
  notice: "Notices",
  worklog: "Work logs",
  receipt: "Receipts",
  renewal: "Renewals",
};

const formatMoney = (value, locale) =>
  new Intl.NumberFormat(locale || "en-GB", { maximumFractionDigits: 0 }).format(
    value ?? 0,
  );

export default function Dashboard() {
  const { data: stats, isLoading, isError, error } = useStats();
  const { data: templates = [] } = useTemplates();
  const { data: settings } = useSettings();

  if (isLoading) return <div className="page-state">Loading…</div>;
  if (isError) return <div className="page-state error">{error.message}</div>;

  const { counts, money, recent } = stats;
  const symbol = money.symbol || money.currency;

  return (
    <div className="page-form dashboard">
      <header className="page-head">
        <div>
          <h1>{settings?.company?.name ?? "DynamoDesk"}</h1>
          <p>
            {counts.total} active document{counts.total === 1 ? "" : "s"} across{" "}
            {Object.keys(counts.byType).length || 0} type
            {Object.keys(counts.byType).length === 1 ? "" : "s"}.
          </p>
        </div>
        <Link to="/templates">
          <button type="button" className="btn btn-primary">
            New document
          </button>
        </Link>
      </header>

      <div className="money-row">
        <div className="money-card accent">
          <span className="k">Outstanding</span>
          <span className="v">
            {symbol} {formatMoney(money.outstanding, money.locale)}
          </span>
          <span className="sub">issued invoices not yet marked paid</span>
        </div>
        <div className="money-card">
          <span className="k">Received</span>
          <span className="v">
            {symbol} {formatMoney(money.paid, money.locale)}
          </span>
          <span className="sub">invoices marked paid</span>
        </div>
        <div className="money-card quiet">
          <span className="k">In draft</span>
          <span className="v">
            {symbol} {formatMoney(money.drafted, money.locale)}
          </span>
          <span className="sub">not issued yet</span>
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <h2>By type</h2>
        </div>
        <div className="section-body">
          {counts.total === 0 ? (
            <p className="field-hint">Nothing yet — start from a template.</p>
          ) : (
            <div className="count-row">
              {Object.entries(counts.byType).map(([type, count]) => (
                <Link
                  key={type}
                  className="count-chip"
                  to={`/documents?type=${type}`}
                >
                  <span className="n">{count}</span>
                  <span className="t">{TYPE_LABELS[type] ?? type}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <h2>Recently touched</h2>
          <p>The six documents you worked on last.</p>
        </div>
        {recent.length === 0 ? (
          <div className="section-body empty-state">
            Nothing yet. <Link to="/templates">Pick a template</Link> to start.
          </div>
        ) : (
          <table className="data-table">
            <tbody>
              {recent.map((document) => (
                <tr key={document._id}>
                  <td className="nowrap">
                    <Link
                      className="mono-link"
                      to={`/documents/${document._id}`}
                    >
                      {document.number}
                    </Link>
                  </td>
                  <td>
                    {document.title || (
                      <span className="field-hint">Untitled</span>
                    )}
                  </td>
                  <td>{document.client?.name || "—"}</td>
                  <td className="nowrap">
                    <span className={`status-pill ${document.status}`}>
                      {document.status}
                    </span>
                  </td>
                  <td className="nowrap field-hint">
                    {new Date(document.updatedAt).toLocaleDateString("en-GB")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="section">
        <div className="section-head">
          <h2>Start something</h2>
        </div>
        <div className="section-body">
          <div className="quick-tiles">
            {templates.map((template) => (
              <Link key={template.key} className="quick-tile" to="/templates">
                <strong>{template.name}</strong>
                <span>{TYPE_LABELS[template.type] ?? template.type}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
