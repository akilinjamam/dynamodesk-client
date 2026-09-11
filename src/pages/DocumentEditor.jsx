import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import ClientPicker from '../components/ClientPicker.jsx';
import FieldRenderer from '../components/form/FieldRenderer.jsx';
import PreviewFrame from '../components/preview/PreviewFrame.jsx';
import { Button, Field, Section } from '../components/ui/Field.jsx';
import { useDocument, useDuplicateDocument, useUpdateDocument } from '../hooks/useDocuments.js';
import { useTemplate } from '../hooks/useTemplates.js';
import { usePreview } from '../hooks/usePreview.js';
import { downloadDocumentPdf } from '../api/documents.js';
import { useToast } from '../context/ToastProvider.jsx';

const STATUSES = ['draft', 'issued', 'paid', 'archived'];
const asDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

const toFormValues = (document) => ({
  title: document.title ?? '',
  status: document.status ?? 'draft',
  issuedAt: asDateInput(document.issuedAt),
  dueAt: asDateInput(document.dueAt),
  client: {
    name: document.client?.name ?? '',
    attn: document.client?.attn ?? '',
    email: document.client?.email ?? '',
    phone: document.client?.phone ?? '',
    address: document.client?.address ?? '',
  },
  data: document.data ?? {},
});

const toPatch = (values) => ({
  title: values.title,
  status: values.status,
  issuedAt: values.issuedAt || undefined,
  dueAt: values.dueAt || null,
  client: values.client,
  data: values.data,
});

export default function DocumentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: document, isLoading, isError, error } = useDocument(id);
  const { data: template } = useTemplate(document?.templateKey);
  const save = useUpdateDocument();
  const duplicate = useDuplicateDocument();
  const toast = useToast();

  const [savedAt, setSavedAt] = useState(null);
  const [downloadError, setDownloadError] = useState(null);

  const form = useForm({ defaultValues: document ? toFormValues(document) : undefined });
  const { reset, handleSubmit, register, watch, formState } = form;

  useEffect(() => {
    if (document) reset(toFormValues(document), { keepDirtyValues: formState.isDirty });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reload when the document identity changes
  }, [document?._id, reset]);

  const values = watch();

  const previewPayload = useMemo(
    () => ({
      templateKey: document?.templateKey,
      number: document?.number,
      title: values.title,
      issuedAt: values.issuedAt || undefined,
      dueAt: values.dueAt || undefined,
      client: values.client,
      data: values.data ?? {},
    }),
    [document?.templateKey, document?.number, values],
  );

  const { html, isLoading: previewLoading, error: previewError } = usePreview(previewPayload, {
    enabled: Boolean(document?.templateKey),
  });

  const persist = useCallback(
    (formValues) =>
      save.mutateAsync({ id, patch: toPatch(formValues) }).then((fresh) => {
        reset(toFormValues(fresh));
        setSavedAt(new Date());
        return fresh;
      }),
    [id, reset, save],
  );

  // Autosave a dirty draft; anything issued is saved deliberately.
  const isDraft = document?.status === 'draft';
  useEffect(() => {
    if (!isDraft || !formState.isDirty || save.isPending) return undefined;
    const timer = setTimeout(() => {
      handleSubmit(persist)();
    }, 1500);
    return () => clearTimeout(timer);
  }, [isDraft, formState.isDirty, save.isPending, handleSubmit, persist, values]);

  // Typing then closing the tab (or navigating away) inside the debounce window
  // would otherwise lose the edit, so flush it.
  //
  // Both the dirty flag and the submit function are held in refs, and the effect
  // has no dependencies: `persist` changes identity on every render, so a
  // dependency on it would re-run this effect — and its cleanup — every render,
  // firing a save each time.
  const dirtyRef = useRef(false);
  const flushRef = useRef(() => {});
  dirtyRef.current = formState.isDirty;
  flushRef.current = () => {
    if (dirtyRef.current) handleSubmit(persist)();
  };

  useEffect(() => {
    const warn = (event) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => {
      window.removeEventListener('beforeunload', warn);
      flushRef.current(); // flush once, on unmount
    };
  }, []);

  const handleDownload = async () => {
    setDownloadError(null);
    try {
      if (formState.isDirty) await handleSubmit(persist)();
      await downloadDocumentPdf(document);
      toast.success(`${document.number} downloaded`);
    } catch (err) {
      setDownloadError(err.message);
      toast.error(err.message);
    }
  };

  if (isLoading) return <div className="page-state">Loading document…</div>;
  if (isError) return <div className="page-state error">{error.message}</div>;

  return (
    <FormProvider {...form}>
      <div className="editor">
        <header className="editor-head">
          <div>
            <span className="doc-number">{document.number}</span>
            <h1>{values.title || 'Untitled document'}</h1>
            <p className="editor-sub">
              {template?.name ?? document.templateKey}
              {' · '}
              <span className={`status-pill ${values.status}`}>{values.status}</span>
              {save.isPending
                ? ' · saving…'
                : formState.isDirty
                  ? ' · unsaved changes'
                  : savedAt
                    ? ` · saved ${savedAt.toLocaleTimeString()}`
                    : ''}
            </p>
          </div>
          <div className="editor-actions">
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                duplicate.mutate(id, {
                  onSuccess: (copy) => {
                    toast.success(`Duplicated as ${copy.number}`);
                    navigate(`/documents/${copy._id}`);
                  },
                  onError: (err) => toast.error(err.message),
                })
              }
            >
              Duplicate
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSubmit(persist)}
              disabled={!formState.isDirty || save.isPending}
            >
              {save.isPending ? 'Saving…' : 'Save'}
            </Button>
            <Button type="button" onClick={handleDownload}>
              Download PDF
            </Button>
          </div>
        </header>

        {(save.isError || downloadError) && (
          <div className="alert error">{downloadError ?? save.error?.message}</div>
        )}

        <div className="editor-split">
          <div className="editor-form">
            <Section title="Document" description="Numbering, dates and status.">
              <div className="grid">
                <Field label="Title" wide>
                  <input {...register('title')} />
                </Field>
                <Field label="Issued">
                  <input type="date" {...register('issuedAt')} />
                </Field>
                <Field label="Due">
                  <input type="date" {...register('dueAt')} />
                </Field>
                <Field
                  label="Status"
                  hint={
                    isDraft
                      ? 'Leaving draft freezes the brand details onto this document.'
                      : 'Brand details are frozen as of issue.'
                  }
                >
                  <select {...register('status')}>
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </Section>

            <Section title="Client" description="Stored with the document, not linked to it.">
              <ClientPicker template={template} />
              <div className="grid">
                <Field label="Client name">
                  <input {...register('client.name')} />
                </Field>
                <Field label="Attention of">
                  <input {...register('client.attn')} />
                </Field>
                <Field label="Email">
                  <input type="email" {...register('client.email')} />
                </Field>
                <Field label="Phone">
                  <input {...register('client.phone')} />
                </Field>
                <Field label="Address" wide>
                  <textarea rows={2} {...register('client.address')} />
                </Field>
              </div>
            </Section>

            {(template?.fields ?? []).map((field) => (
              <Section key={field.name} title={field.label} description={field.hint}>
                {field.kind === 'group' || field.kind === 'list' ? (
                  <FieldRenderer field={{ ...field, label: '' }} path="data" />
                ) : (
                  <div className="grid">
                    <FieldRenderer field={field} path="data" />
                  </div>
                )}
              </Section>
            ))}
          </div>

          <div className="editor-preview">
            <PreviewFrame html={html} isLoading={previewLoading} error={previewError} />
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
