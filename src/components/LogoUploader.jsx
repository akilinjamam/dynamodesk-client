import { useRef, useState } from 'react';
import { fileUrl } from '../api/axios.js';
import { useRemoveLogo, useUploadLogo } from '../hooks/useSettings.js';
import { Button } from './ui/Field.jsx';

export default function LogoUploader({ settings }) {
  const inputRef = useRef(null);
  const [error, setError] = useState(null);
  const upload = useUploadLogo();
  const remove = useRemoveLogo();

  const logoUrl = fileUrl(settings?.logo?.url);
  const busy = upload.isPending || remove.isPending;

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // let the same file be chosen again after an error
    if (!file) return;
    setError(null);
    upload.mutate(file, { onError: (err) => setError(err.message) });
  };

  return (
    <div className="logo-row">
      <div className="logo-preview">
        {logoUrl ? (
          <img src={logoUrl} alt="Company logo" />
        ) : (
          <span className="logo-empty">No logo</span>
        )}
      </div>

      <div className="logo-actions">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={handleFile}
          hidden
        />
        <div className="row-buttons">
          <Button
            type="button"
            variant="secondary"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            {upload.isPending ? 'Uploading…' : logoUrl ? 'Replace logo' : 'Upload logo'}
          </Button>
          {logoUrl && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setError(null);
                remove.mutate(undefined, { onError: (err) => setError(err.message) });
              }}
              disabled={busy}
            >
              Remove
            </Button>
          )}
        </div>
        <p className="field-hint">
          PNG, JPG, WEBP or SVG, up to 2 MB. It prints at the top of every document.
        </p>
        {error && <p className="field-error">{error}</p>}
      </div>
    </div>
  );
}
