import { useFieldArray, useFormContext } from 'react-hook-form';
import { Field } from '../ui/Field.jsx';

/**
 * Renders a form from a template's field schema (PLAN.md §3.3).
 * Every kind the schema vocabulary defines is handled here, so adding a template
 * needs no new form code at all.
 */
export default function FieldRenderer({ field, path }) {
  const name = path ? `${path}.${field.name}` : field.name;

  switch (field.kind) {
    case 'group':
      return <GroupField field={field} name={name} />;
    case 'list':
      return <ListField field={field} name={name} />;
    default:
      return <ScalarField field={field} name={name} />;
  }
}

function ScalarField({ field, name }) {
  const { register, formState } = useFormContext();
  const error = name.split('.').reduce((node, key) => node?.[key], formState.errors)?.message;
  const rules = field.required ? { required: `${field.label} is required` } : {};

  const wide = field.kind === 'textarea';
  const input = (() => {
    switch (field.kind) {
      case 'textarea':
        return <textarea rows={field.rows ?? 3} {...register(name, rules)} />;
      case 'date':
        return <input type="date" {...register(name, rules)} />;
      case 'number':
      case 'money':
        return (
          <input
            type="number"
            step={field.kind === 'money' ? '0.01' : '1'}
            {...register(name, { ...rules, valueAsNumber: true })}
          />
        );
      case 'boolean':
        return (
          <label className="checkbox">
            <input type="checkbox" {...register(name)} />
            <span>{field.checkboxLabel ?? 'Yes'}</span>
          </label>
        );
      case 'select':
        return (
          <select {...register(name, rules)}>
            <option value="">—</option>
            {(field.options ?? []).map((option) => {
              const value = typeof option === 'string' ? option : option.value;
              const label = typeof option === 'string' ? option : option.label;
              return (
                <option key={value} value={value}>
                  {label}
                </option>
              );
            })}
          </select>
        );
      default:
        return <input type="text" {...register(name, rules)} />;
    }
  })();

  return (
    <Field label={field.label} hint={field.hint} error={error} wide={wide}>
      {input}
    </Field>
  );
}

function GroupField({ field, name }) {
  return (
    <fieldset className="group-field">
      <legend>{field.label}</legend>
      <div className="grid">
        {field.fields.map((child) => (
          <FieldRenderer key={child.name} field={child} path={name} />
        ))}
      </div>
    </fieldset>
  );
}

/** Blank row shaped like the schema, so a new item has every key the template expects. */
const emptyItem = (fields) =>
  Object.fromEntries(
    fields.map((child) => {
      if (child.kind === 'list') return [child.name, []];
      if (child.kind === 'group') return [child.name, emptyItem(child.fields)];
      if (child.kind === 'boolean') return [child.name, false];
      if (child.kind === 'number' || child.kind === 'money') return [child.name, ''];
      return [child.name, ''];
    }),
  );

function ListField({ field, name }) {
  const { control } = useFormContext();
  const { fields, append, remove, move } = useFieldArray({ control, name });
  const itemLabel = field.itemLabel ?? 'Item';

  return (
    <div className="list-field">
      <div className="list-head">
        <span className="section-label">{field.label}</span>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => append(emptyItem(field.fields))}
        >
          Add {itemLabel.toLowerCase()}
        </button>
      </div>

      {fields.length === 0 && <p className="field-hint">No {itemLabel.toLowerCase()} yet.</p>}

      {fields.map((item, index) => (
        <div className="list-item" key={item.id}>
          <div className="list-item-head">
            <span className="list-item-title">
              {itemLabel} {index + 1}
            </span>
            <div className="list-item-actions">
              <button
                type="button"
                className="icon-btn"
                title="Move up"
                disabled={index === 0}
                onClick={() => move(index, index - 1)}
              >
                ↑
              </button>
              <button
                type="button"
                className="icon-btn"
                title="Move down"
                disabled={index === fields.length - 1}
                onClick={() => move(index, index + 1)}
              >
                ↓
              </button>
              <button
                type="button"
                className="icon-btn danger"
                title={`Remove ${itemLabel.toLowerCase()}`}
                onClick={() => remove(index)}
              >
                ✕
              </button>
            </div>
          </div>

          <div className="grid">
            {field.fields
              .filter((child) => child.kind !== 'list')
              .map((child) => (
                <FieldRenderer key={child.name} field={child} path={`${name}.${index}`} />
              ))}
          </div>

          {field.fields
            .filter((child) => child.kind === 'list')
            .map((child) => (
              <FieldRenderer key={child.name} field={child} path={`${name}.${index}`} />
            ))}
        </div>
      ))}
    </div>
  );
}
