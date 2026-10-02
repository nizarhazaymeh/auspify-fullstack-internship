import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from './AuthLayout.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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
      navigate(location.state?.from?.pathname ?? '/', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const bind = (name) => ({ id: name, name, value: values[name], onChange: (e) => setValues({ ...values, [name]: e.target.value }) });

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to see your dashboard."
      footer={
        <>
          New here? <Link to="/register">Create an account</Link>
        </>
      }
    >
      <form className="auth__form" onSubmit={submit} noValidate>
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
      </form>
    </AuthLayout>
  );
}
