import { useState } from 'react';
import { authApi } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import AddressFields, { emptyAddress, trimAddress, validateAddress } from '../components/AddressFields.jsx';

function ProfileForm() {
  const { user, setUser } = useAuth();
  const notify = useToast();
  const [name, setName] = useState(user.name);
  const [address, setAddress] = useState({ ...emptyAddress, ...(user.address ?? {}) });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const hasAddress = Object.values(address).some((v) => v?.trim());
    const found = hasAddress ? validateAddress(address) : {};
    if (name.trim().length < 2) found.name = 'Name must be at least 2 characters.';
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const { user: u } = await authApi.updateProfile({ name: name.trim(), ...(hasAddress ? { address: trimAddress(address) } : {}) });
      setUser(u);
      notify('Account updated.');
    } catch (err) {
      setErrors(Object.fromEntries(Object.entries(err.errors ?? {}).map(([k, v]) => [k.replace('address.', ''), v])));
      notify(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card panel form-card" onSubmit={submit} noValidate>
      <h2>Profile</h2>
      <p className="muted">{user.email}</p>
      <div className="field">
        <label htmlFor="acc-name">Name</label>
        <input id="acc-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={Boolean(errors.name)} />
        {errors.name && <p className="field__error">{errors.name}</p>}
      </div>
      <h3>Default shipping address</h3>
      <AddressFields value={address} onChange={setAddress} errors={errors} idPrefix="acc" />
      <div className="form__actions">
        <button type="submit" className="btn btn--primary" disabled={busy}>
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

  const bind = (name, autoComplete) => ({
    id: `pw-${name}`,
    type: 'password',
    autoComplete,
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
          <input {...bind('currentPassword', 'current-password')} />
          {err('currentPassword')}
        </div>
        <div className="field">
          <label htmlFor="pw-newPassword">New password</label>
          <input {...bind('newPassword', 'new-password')} />
          {err('newPassword')}
        </div>
        <div className="field">
          <label htmlFor="pw-confirm">Confirm new password</label>
          <input {...bind('confirm', 'new-password')} />
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

export default function Account() {
  return (
    <div className="container section narrow">
      <h1>My account</h1>
      <div className="stack">
        <ProfileForm />
        <PasswordForm />
      </div>
    </div>
  );
}
