import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { changePassword } from '../api/auth.js';
import { Button, Field } from './ui/Field.jsx';

export default function ChangePassword() {
  const [result, setResult] = useState(null);
  const { register, handleSubmit, reset, formState } = useForm({
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  const onSubmit = async (values) => {
    setResult(null);
    try {
      await changePassword(values);
      reset();
      setResult({ ok: true, message: 'Password changed.' });
    } catch (error) {
      setResult({
        ok: false,
        message: error.details?.[0]?.message ?? error.message,
      });
    }
  };

  return (
    <form className="grid" onSubmit={handleSubmit(onSubmit)}>
      <Field label="Current password">
        <input type="password" autoComplete="current-password" {...register('currentPassword')} />
      </Field>
      <Field label="New password" hint="At least 8 characters.">
        <input type="password" autoComplete="new-password" {...register('newPassword')} />
      </Field>
      <div className="field-wide row-buttons">
        <Button type="submit" variant="secondary" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? 'Changing…' : 'Change password'}
        </Button>
        {result && (
          <span className={result.ok ? 'saved-flag' : 'field-error'}>{result.message}</span>
        )}
      </div>
    </form>
  );
}
