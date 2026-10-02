import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Only allow same-site relative redirects (prevents open-redirects via ?redirect=).
export const safeRedirect = (r) => (r && r.startsWith('/') && !r.startsWith('//') ? r : '/');

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = safeRedirect(params.get('redirect'));
  const [values, setValues] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={redirect} replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (!values.email.trim() || !values.password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await login({ email: values.email.trim(), password: values.password });
      navigate(redirect, { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const bind = (name) => ({ id: name, value: values[name], onChange: (e) => setValues({ ...values, [name]: e.target.value }) });

  return (
    <div className="container section">
      <form className="card auth-card" onSubmit={submit} noValidate>
        <h1>Welcome back</h1>
        <p className="muted">{redirect === '/checkout' ? 'Log in to complete your order. Your cart will be kept.' : 'Log in to your account.'}</p>
        {error && (
          <div className="banner banner--error" role="alert">
            {error}
          </div>
        )}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input type="email" autoComplete="email" {...bind('email')} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input type="password" autoComplete="current-password" {...bind('password')} />
        </div>
        <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
        <p className="auth-card__foot">
          New customer? <Link to={`/register${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}>Create an account</Link>
        </p>
      </form>
    </div>
  );
}
