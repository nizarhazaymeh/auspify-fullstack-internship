import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useMeta } from '../hooks/useMeta.js';
import AuthLayout from './AuthLayout.jsx';

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
  const { register } = useAuth();
  const { currencies } = useMeta();
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: '', email: '', password: '', confirm: '', currency: 'USD' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

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
      const { confirm, ...data } = values; // eslint-disable-line no-unused-vars
      await register({ ...data, name: data.name.trim(), email: data.email.trim() });
      navigate('/', { replace: true });
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      setFormError(err.message);
      setBusy(false);
    }
  };

  const bind = (name) => ({
    id: name,
    value: values[name],
    onChange: (e) => set(name, e.target.value),
    'aria-invalid': Boolean(errors[name]),
  });
  const err = (name) => errors[name] && <p className="field__error">{errors[name]}</p>;

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start tracking your income and expenses in minutes."
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    >
      <form className="auth__form" onSubmit={submit} noValidate>
        {formError && (
          <div className="banner banner--error" role="alert">
            {formError}
          </div>
        )}
        <div className="field">
          <label htmlFor="name">Name</label>
          <input type="text" autoComplete="name" {...bind('name')} />
          {err('name')}
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input type="email" autoComplete="email" {...bind('email')} />
          {err('email')}
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="password">Password</label>
            <input type="password" autoComplete="new-password" {...bind('password')} />
            {err('password')}
          </div>
          <div className="field">
            <label htmlFor="confirm">Confirm password</label>
            <input type="password" autoComplete="new-password" {...bind('confirm')} />
            {err('confirm')}
          </div>
        </div>
        <div className="field">
          <label htmlFor="currency">Currency</label>
          <select {...bind('currency')}>
            {currencies.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}
