import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Confirm from '../components/ui/Confirm.jsx';
import { Button } from '../components/ui/Field.jsx';
import {
  useArchiveDocument,
  useDocuments,
  useDuplicateDocument,
} from '../hooks/useDocuments.js';
import { useTemplates } from '../hooks/useTemplates.js';
import { downloadDocumentPdf } from '../api/documents.js';
import { useToast } from '../context/ToastProvider.jsx';

const STATUSES = ['draft', 'issued', 'paid', 'archived'];
const PAGE_SIZE = 20;

export default function DocumentList() {
  const [params, setParams] = useSearchParams();
  const { data: templates = [] } = useTemplates();
  const toast = useToast();

  // The URL is the state, so a filtered list can be linked to and survives a reload.
  const type = params.get('type') ?? '';
  const status = params.get('status') ?? '';
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const page = Number(params.get('page') ?? 1);
  const q = params.get('q') ?? '';

  const [searchInput, setSearchInput] = useState(q);
  useEffect(() => setSearchInput(q), [q]);

  // Debounce the search so a query is not fired per keystroke.
  useEffect(() => {
    if (searchInput === q) return undefined;
    const timer = setTimeout(() => setParam('q', searchInput), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  const query = {
    limit: PAGE_SIZE,
    page,
    sort: 'newest',
    ...(type && { type }),
    ...(status && { status }),
    ...(from && { from }),
    ...(to && { to }),
    ...(q && { q }),
    ...(status === 'archived' && { includeArchived: 'true' }),
  };

  const { data, isLoading, isError, error, isFetching } = useDocuments(query);
  const duplicate = useDuplicateDocument();
  const archive = useArchiveDocument();
  const [pendingArchive, setPendingArchive] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const types = [...new Set(templates.map((template) => template.type))];
  const hasFilters = Boolean(type || status || from || to || q);

  const handleDuplicate = async (document) => {
    setBusyId(document._id);
    try {
      const copy = await duplicate.mutateAsync(document._id);
      toast.success(`Duplicated as ${copy.number}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handlePdf = async (document) => {
    setBusyId(document._id);
    try {
      await downloadDocumentPdf(document);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const confirmArchive = async () => {
    try {
      await archive.mutateAsync(pendingArchive._id);
      toast.success(`${pendingArchive.number} archived`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPendingArchive(null);
    }
  };

  return (
    <div className="page-form wide">
      <header className="page-head">
        <div>
          <h1>Documents</h1>
          <p>
            {isLoading ? 'Loading…' : `${data.total} document${data.total === 1 ? '' : 's'}`}
            {hasFilters && ' matching your filters'}
            {isFetching && !isLoading && ' · refreshing'}
          </p>
        </div>
        <Link to="/templates">
          <Button type="button">New document</Button>
        </Link>
      </header>

      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="Search number, title or client…"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
        <select value={type} onChange={(event) => setParam('type', event.target.value)}>
          <option value="">All types</option>
          {types.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select value={status} onChange={(event) => setParam('status', event.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <input type="date" value={from} onChange={(event) => setParam('from', event.target.value)} title="Issued from" />
        <input type="date" value={to} onChange={(event) => setParam('to', event.target.value)} title="Issued to" />
        {hasFilters && (
          <button type="button" className="link-btn" onClick={() => setParams({}, { replace: true })}>
            Clear
          </button>
        )}
      </div>

      {isError && <div className="alert error">{error.message}</div>}

      <div className="section">
        {isLoading ? (
          <div className="section-body">Loading documents…</div>
        ) : data.items.length === 0 ? (
          <div className="section-body empty-state">
            {hasFilters ? (
              <>Nothing matches those filters.</>
            ) : (
              <>
                Nothing here yet. <Link to="/templates">Pick a template</Link> to start.
              </>
            )}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Number</th>
                <th>Title</th>
                <th>Client</th>
                <th>Issued</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.items.map((document) => (
                <tr key={document._id} className={busyId === document._id ? 'busy' : ''}>
                  <td className="nowrap">
                    <Link className="mono-link" to={`/documents/${document._id}`}>
                      {document.number}
                    </Link>
                  </td>
                  <td>{document.title || <span className="field-hint">Untitled</span>}</td>
                  <td>{document.client?.name || '—'}</td>
                  <td className="nowrap field-hint">
                    {document.issuedAt
                      ? new Date(document.issuedAt).toLocaleDateString('en-GB')
                      : '—'}
                  </td>
                  <td className="nowrap">
                    <span className={`status-pill ${document.status}`}>{document.status}</span>
                  </td>
                  <td className="row-actions nowrap">
                    <Link className="link-btn" to={`/documents/${document._id}`}>
                      Open
                    </Link>
                    <button type="button" className="link-btn" onClick={() => handlePdf(document)}>
                      PDF
                    </button>
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => handleDuplicate(document)}
                    >
                      Duplicate
                    </button>
                    {document.status !== 'archived' && (
                      <button
                        type="button"
                        className="link-btn danger"
                        onClick={() => setPendingArchive(document)}
                      >
                        Archive
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!isLoading && data.pages > 1 && (
        <div className="pager">
          <Button
            type="button"
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setParam('page', String(page - 1))}
          >
            Previous
          </Button>
          <span className="field-hint">
            Page {data.page} of {data.pages}
          </span>
          <Button
            type="button"
            variant="secondary"
            disabled={page >= data.pages}
            onClick={() => setParam('page', String(page + 1))}
          >
            Next
          </Button>
        </div>
      )}

      <Confirm
        open={Boolean(pendingArchive)}
        title={`Archive ${pendingArchive?.number}?`}
        body="It drops out of this list but is never deleted — filter by Archived to find it again, and it still opens and prints."
        confirmLabel="Archive"
        onConfirm={confirmArchive}
        onCancel={() => setPendingArchive(null)}
      />
    </div>
  );
}
