import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Section } from '../components/ui/Field.jsx';
import { useTemplates } from '../hooks/useTemplates.js';
import { useCreateDocument } from '../hooks/useDocuments.js';
import { fetchTemplateSample } from '../api/templates.js';

export default function NewDocument() {
  const { data: templates = [], isLoading } = useTemplates();
  const create = useCreateDocument();
  const navigate = useNavigate();
  const [busyKey, setBusyKey] = useState(null);

  const start = async (template, withSample) => {
    setBusyKey(`${template.key}:${withSample}`);
    try {
      let payload = {
        type: template.type,
        templateKey: template.key,
        title: '',
        data: {},
      };

      if (withSample) {
        const { sample } = await fetchTemplateSample(template.key);
        payload = {
          ...payload,
          title: sample.title ?? '',
          client: sample.client ?? {},
          data: sample.data ?? {},
        };
      }

      const document = await create.mutateAsync(payload);
      navigate(`/documents/${document._id}`);
    } finally {
      setBusyKey(null);
    }
  };

  if (isLoading) return <div className="page-state">Loading templates…</div>;

  return (
    <div className="page-form">
      <header className="page-head">
        <div>
          <h1>New document</h1>
          <p>
            Pick a template. The number is assigned when the document is created — or
            see them all in the <Link to="/templates">gallery</Link>.
          </p>
        </div>
      </header>

      {create.isError && <div className="alert error">{create.error.message}</div>}

      {templates.map((template) => (
        <Section key={template.key} title={template.name} description={template.description}>
          <div className="row-buttons">
            <Button
              type="button"
              onClick={() => start(template, false)}
              disabled={Boolean(busyKey)}
            >
              {busyKey === `${template.key}:false` ? 'Creating…' : 'Start blank'}
            </Button>
            {template.hasSample && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => start(template, true)}
                disabled={Boolean(busyKey)}
              >
                {busyKey === `${template.key}:true` ? 'Creating…' : 'Start from sample'}
              </Button>
            )}
          </div>
        </Section>
      ))}
    </div>
  );
}
