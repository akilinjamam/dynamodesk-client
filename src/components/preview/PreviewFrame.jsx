import { useEffect, useRef, useState } from 'react';

const ZOOMS = [0.5, 0.65, 0.8, 1];

/**
 * The A4 page exactly as the server rendered it. The same HTML string is what
 * Chrome prints, so what is on screen here is what lands in the PDF.
 */
export default function PreviewFrame({ html, isLoading, error }) {
  const frameRef = useRef(null);
  const [zoom, setZoom] = useState(0.65);
  const [scrollTop, setScrollTop] = useState(0);

  // Keep the reading position across re-renders while typing.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || !html) return undefined;

    const restore = () => {
      try {
        frame.contentWindow.scrollTo(0, scrollTop);
      } catch {
        /* not ready yet */
      }
    };
    frame.addEventListener('load', restore);
    return () => frame.removeEventListener('load', restore);
  }, [html, scrollTop]);

  // The frame owns the print: it is the only holder of the rendered document.
  const print = () => {
    const frame = frameRef.current;
    if (!frame?.contentWindow) return;
    frame.contentWindow.focus();
    frame.contentWindow.print();
  };

  const rememberScroll = () => {
    try {
      setScrollTop(frameRef.current?.contentWindow?.scrollY ?? 0);
    } catch {
      /* cross-origin guard, never hit for srcDoc */
    }
  };

  return (
    <div className="preview">
      <div className="preview-bar">
        <span className="preview-status">
          {error ? (
            <span className="field-error">{error}</span>
          ) : isLoading ? (
            'Rendering…'
          ) : (
            'Live preview'
          )}
        </span>
        <div className="preview-actions">
          {ZOOMS.map((value) => (
            <button
              key={value}
              type="button"
              className={`zoom-btn${zoom === value ? ' active' : ''}`}
              onClick={() => {
                rememberScroll();
                setZoom(value);
              }}
            >
              {Math.round(value * 100)}%
            </button>
          ))}
          <button type="button" className="btn btn-secondary btn-sm" onClick={print}>
            Print
          </button>
        </div>
      </div>

      <div className="preview-scroll">
        <div className="preview-scale" style={{ width: `${210 * zoom}mm` }}>
          <iframe
            ref={frameRef}
            title="Document preview"
            srcDoc={html}
            sandbox="allow-same-origin allow-modals"
            style={{
              width: '210mm',
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
            }}
          />
        </div>
      </div>
    </div>
  );
}
