import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useMeta } from '../hooks/useMeta.js';
import { useToast } from '../components/Toast.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { formatDate } from '../utils/format.js';

function ProfileForm() {
  const { user, setUser } = useAuth();
  const { currencies } = useMeta();
  const notify = useToast();
  const [values, setValues] = useState({ name: user.name, currency: user.currency });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const dirty = values.name !== user.name || values.currency !== user.currency;

  const submit = async (e) => {
    e.preventDefault();
    if (values.name.trim().length < 2) {
      setErrors({ name: 'Name must be at least 2 characters.' });
      return;
    }
    setBusy(true);
    setErrors({});
    try {
      const { user: u } = await authApi.updateProfile({ name: values.name.trim(), currency: values.currency });
      setUser(u);
      notify('Profile updated.');
    } catch (err) {
      setErrors(err.errors ?? {});
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card panel form-card" onSubmit={submit} noValidate>
      <h2>Profile</h2>
      <p className="muted">
        {user.email} · member since {formatDate(user.createdAt, { month: 'long', year: 'numeric' })}
      </p>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="p-name">Name</label>
          <input id="p-name" value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} aria-invalid={Boolean(errors.name)} />
          {errors.name && <p className="field__error">{errors.name}</p>}
        </div>
        <div className="field">
          <label htmlFor="p-currency">Currency</label>
          <select id="p-currency" value={values.currency} onChange={(e) => setValues({ ...values, currency: e.target.value })}>
            {currencies.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="form__actions">
        <button type="submit" className="btn btn--primary" disabled={!dirty || busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const notify = useToast();
  const empty = { currentPassword: '', newPassword: '', confirm: '' };
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!values.currentPassword) found.currentPassword = 'Enter your current password.';
    if (values.newPassword.length < 8 || !/[A-Za-z]/.test(values.newPassword) || !/\d/.test(values.newPassword))
      found.newPassword = 'Use 8+ characters with at least one letter and one number.';
    if (values.confirm !== values.newPassword) found.confirm = 'Passwords do not match.';
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await authApi.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      setValues(empty);
      notify('Password changed.');
    } catch (err) {
      setErrors(err.errors ?? {});
      if (!err.errors) notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const bind = (name) => ({
    id: `pw-${name}`,
    type: 'password',
    value: values[name],
    onChange: (e) => setValues({ ...values, [name]: e.target.value }),
    'aria-invalid': Boolean(errors[name]),
  });
  const err = (name) => errors[name] && <p className="field__error">{errors[name]}</p>;

  return (
    <form className="card panel form-card" onSubmit={submit} noValidate>
      <h2>Change password</h2>
      <div className="form-grid">
        <div className="field field--full">
          <label htmlFor="pw-currentPassword">Current password</label>
          <input autoComplete="current-password" {...bind('currentPassword')} />
          {err('currentPassword')}
        </div>
        <div className="field">
          <label htmlFor="pw-newPassword">New password</label>
          <input autoComplete="new-password" {...bind('newPassword')} />
          {err('newPassword')}
        </div>
        <div className="field">
          <label htmlFor="pw-confirm">Confirm new password</label>
          <input autoComplete="new-password" {...bind('confirm')} />
          {err('confirm')}
        </div>
      </div>
      <div className="form__actions">
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? 'Updating…' : 'Update password'}
        </button>
      </div>
    </form>
  );
}

function DangerZone() {
  const { setUser } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      await authApi.deleteAccount();
      setUser(null);
      navigate('/register', { replace: true });
    } catch (err) {
      notify(err.message, 'error');
      setBusy(false);
    }
  };

  return (
    <section className="card panel form-card danger-zone">
      <h2>Delete account</h2>
      <p className="muted">Permanently delete your account and all of your transactions.</p>
      <div className="form__actions">
        <button type="button" className="btn btn--danger" onClick={() => setOpen(true)}>
          Delete account
        </button>
      </div>
      <ConfirmModal
        open={open}
        title="Delete your account?"
        message="All your transactions will be permanently deleted. This cannot be undone."
        confirmLabel="Delete account"
        busy={busy}
        onConfirm={remove}
        onCancel={() => setOpen(false)}
      />
    </section>
  );
}

export default function Profile() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Profile &amp; settings</h1>
          <p className="muted">Manage your account details and security.</p>
        </div>
      </div>
      <div className="settings">
        <ProfileForm />
        <PasswordForm />
        <DangerZone />
      </div>
    </>
  );
}
