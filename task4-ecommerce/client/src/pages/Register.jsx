import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { safeRedirect } from './Login.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(v) {
  const e = {};
  if (v.name.trim().length < 2) e.name = 'Enter your name (at least 2 characters).';
  if (!EMAIL_RE.test(v.email.trim())) e.email = 'Enter a valid email address.';
  if (v.password.length < 8) e.password = 'Use at least 8 characters.';
  else if (!/[A-Za-z]/.test(v.password) || !/\d/.test(v.password)) e.password = 'Include at least one letter and one number.';
  if (v.confirm !== v.password) e.confirm = 'Passwords do not match.';
  return e;
}

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = safeRedirect(params.get('redirect'));
  const [values, setValues] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={redirect} replace />;

  const set = (name, value) => {
    const next = { ...values, [name]: value };
    setValues(next);
    if (submitted) setErrors(validate(next));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setFormError('');
    try {
      await register({ name: values.name.trim(), email: values.email.trim(), password: values.password });
      navigate(redirect, { replace: true });
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      setFormError(err.message);
      setBusy(false);
    }
  };

  const bind = (name, type = 'text', autoComplete) => ({
    id: name,
    type,
    autoComplete,
    value: values[name],
    onChange: (e) => set(name, e.target.value),
    'aria-invalid': Boolean(errors[name]),
  });
  const err = (name) => errors[name] && <p className="field__error">{errors[name]}</p>;

  return (
    <div className="container section">
      <form className="card auth-card" onSubmit={submit} noValidate>
        <h1>Create an account</h1>
        <p className="muted">Track orders and check out faster.</p>
        {formError && (
          <div className="banner banner--error" role="alert">
            {formError}
          </div>
        )}
        <div className="field">
          <label htmlFor="name">Name</label>
          <input {...bind('name', 'text', 'name')} />
          {err('name')}
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input {...bind('email', 'email', 'email')} />
          {err('email')}
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input {...bind('password', 'password', 'new-password')} />
          {err('password')}
        </div>
        <div className="field">
          <label htmlFor="confirm">Confirm password</label>
          <input {...bind('confirm', 'password', 'new-password')} />
          {err('confirm')}
        </div>
        <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        <p className="auth-card__foot">
          Already have an account? <Link to={`/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}>Log in</Link>
        </p>
      </form>
    </div>
  );
}
