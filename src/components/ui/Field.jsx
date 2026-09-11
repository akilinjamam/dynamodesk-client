export function Field({ label, hint, error, children, wide = false }) {
  return (
    <label className={`field${wide ? ' field-wide' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
      {error && <span className="field-error">{error}</span>}
      {!error && hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function Button({ variant = 'primary', children, ...props }) {
  // variants: primary | secondary | ghost | danger
  return (
    <button className={`btn btn-${variant}`} {...props}>
      {children}
    </button>
  );
}

export function Section({ title, description, children }) {
  return (
    <section className="section">
      <div className="section-head">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      <div className="section-body">{children}</div>
    </section>
  );
}
