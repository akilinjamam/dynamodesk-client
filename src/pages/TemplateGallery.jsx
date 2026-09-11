import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Field.jsx';
import { useTemplates } from '../hooks/useTemplates.js';
import { useCreateDocument } from '../hooks/useDocuments.js';
import { fetchTemplateSample } from '../api/templates.js';
import { api } from '../api/axios.js';

/** Each card shows the template's own sample, rendered by the server. */
function SamplePreview({ templateKey }) {
  const { data: html, isError } = useQuery({
    queryKey: ['template-sample-html', templateKey],
    queryFn: () =>
      api
        .get(`/templates/${templateKey}/sample`, { params: { format: 'html' } })
        .then((response) => response.data),
    staleTime: Infinity,
  });

  if (isError) return <div className="thumb-empty">Preview unavailable</div>;
  if (!html) return <div className="thumb-empty">Rendering…</div>;

  return (
    <iframe
      className="thumb-frame"
      title={`${templateKey} sample`}
      srcDoc={html}
      sandbox="allow-same-origin"
      scrolling="no"
    />
  );
}

export default function TemplateGallery() {
  const { data: templates = [], isLoading } = useTemplates();
  const create = useCreateDocument();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(null);

  const start = async (template, withSample) => {
    setBusy(`${template.key}:${withSample}`);
    try {
      let payload = { type: template.type, templateKey: template.key, data: {} };
      if (withSample) {
        const { sample } = await fetchTemplateSample(template.key);
        payload = { ...payload, title: sample.title ?? '', client: sample.client ?? {}, data: sample.data ?? {} };
      }
      const document = await create.mutateAsync(payload);
      navigate(`/documents/${document._id}`);
    } finally {
      setBusy(null);
    }
  };

  if (isLoading) return <div className="page-state">Loading templates…</div>;

  return (
    <div className="gallery-page">
      <header className="page-head">
        <div>
          <h1>Templates</h1>
          <p>
            {templates.length} templates. Each is a folder on the server — adding one needs
            no change to the editor.
          </p>
        </div>
      </header>

      {create.isError && <div className="alert error">{create.error.message}</div>}

      <div className="gallery">
        {templates.map((template) => (
          <article className="gallery-card" key={template.key}>
            <div className="thumb">
              <div className="thumb-inner">
                <SamplePreview templateKey={template.key} />
              </div>
            </div>
            <div className="gallery-body">
              <h2>{template.name}</h2>
              <p>{template.description}</p>
              <div className="gallery-meta">
                <span className="pill-sm">{template.type}</span>
                <span className="field-hint">{template.fields.length} field groups</span>
              </div>
              <div className="row-buttons">
                <Button type="button" onClick={() => start(template, false)} disabled={Boolean(busy)}>
                  {busy === `${template.key}:false` ? 'Creating…' : 'Start blank'}
                </Button>
                {template.hasSample && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => start(template, true)}
                    disabled={Boolean(busy)}
                  >
                    {busy === `${template.key}:true` ? 'Creating…' : 'Use sample'}
                  </Button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
