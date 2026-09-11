import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider.jsx';
import { useWaking } from '../hooks/useWaking.js';
import { Button, Field } from '../components/ui/Field.jsx';

export default function Login() {
  const { signIn, status } = useAuth();
  const waking = useWaking();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState(null);

  const { register, handleSubmit, formState } = useForm({
    defaultValues: { email: '', password: '' },
  });

  if (status === 'signed-in') {
    return <Navigate to={location.state?.from?.pathname ?? '/'} replace />;
  }

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      await signIn(values);
      navigate(location.state?.from?.pathname ?? '/', { replace: true });
    } catch (error) {
      setFormError(error.message);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit(onSubmit)}>
        <h1 className="brand">
          Dynamo<span>Desk</span>
        </h1>
        <p className="tagline">Sign in to your document studio.</p>

        {waking && (
          <div className="alert info" role="status">
            <span className="waking-spinner" aria-hidden="true" />
            Waking the server — the first sign-in after a quiet spell can take a minute.
          </div>
        )}

        {formError && <div className="alert error">{formError}</div>}

        <Field label="Email" error={formState.errors.email?.message}>
          <input
            type="email"
            autoComplete="username"
            autoFocus
            {...register('email', { required: 'Email is required' })}
          />
        </Field>

        <Field label="Password" error={formState.errors.password?.message}>
          <input
            type="password"
            autoComplete="current-password"
            {...register('password', { required: 'Password is required' })}
          />
        </Field>

        <Button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting && waking
            ? 'Waking the server…'
            : formState.isSubmitting
              ? 'Signing in…'
              : 'Sign in'}
        </Button>
      </form>
    </div>
  );
}
