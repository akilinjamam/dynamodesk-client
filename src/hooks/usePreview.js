import { useEffect, useRef, useState } from 'react';
import { renderPreview } from '../api/documents.js';

/**
 * Asks the server to re-render whenever the form changes, at most once every
 * `delay` ms. Late responses are dropped so a slow render cannot overwrite a
 * newer one.
 */
export const usePreview = (payload, { delay = 400, enabled = true } = {}) => {
  const [html, setHtml] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const serialised = JSON.stringify(payload);

  useEffect(() => {
    if (!enabled) return undefined;

    const id = requestId.current + 1;
    requestId.current = id;
    setIsLoading(true);

    const timer = setTimeout(() => {
      renderPreview(JSON.parse(serialised))
        .then((result) => {
          if (requestId.current !== id) return; // a newer request has started
          setHtml(result);
          setError(null);
        })
        .catch((err) => {
          if (requestId.current !== id) return;
          setError(err.message);
        })
        .finally(() => {
          if (requestId.current === id) setIsLoading(false);
        });
    }, delay);

    return () => clearTimeout(timer);
  }, [serialised, delay, enabled]);

  return { html, isLoading, error };
};
