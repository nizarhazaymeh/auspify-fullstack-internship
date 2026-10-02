import { useState } from 'react';
import { profile } from '../data/profile.js';
import '../styles/contact.css';

const FORMSPREE_ID = import.meta.env.VITE_FORMSPREE_ID;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const empty = { name: '', email: '', subject: '', message: '' };

function validate(values) {
  const errors = {};
  if (values.name.trim().length < 2) errors.name = 'Please enter your name (at least 2 characters).';
  if (!EMAIL_RE.test(values.email.trim())) errors.email = 'Please enter a valid email address.';
  if (values.message.trim().length < 10) errors.message = 'Message should be at least 10 characters.';
  if (values.message.length > 1000) errors.message = 'Message must be under 1000 characters.';
  return errors;
}

export default function Contact() {
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  const onChange = (e) => {
    const next = { ...values, [e.target.name]: e.target.value };
    setValues(next);
    if (touched[e.target.name]) setErrors(validate(next));
  };

  const onBlur = (e) => {
    setTouched((t) => ({ ...t, [e.target.name]: true }));
    setErrors(validate(values));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    setTouched({ name: true, email: true, message: true });
    if (Object.keys(found).length) return;

    if (!FORMSPREE_ID) {
      // No form backend configured: hand off to the visitor's email client.
      const subject = encodeURIComponent(values.subject || `Message from ${values.name}`);
      const body = encodeURIComponent(`${values.message}\n\n— ${values.name} (${values.email})`);
      window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
      setStatus('sent');
      setValues(empty);
      setTouched({});
      return;
    }

    setStatus('sending');
    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error('Request failed');
      setStatus('sent');
      setValues(empty);
      setTouched({});
    } catch {
      setStatus('error');
    }
  };

  const field = (name) => ({
    id: name,
    name,
    value: values[name],
    onChange,
    onBlur,
    'aria-invalid': Boolean(touched[name] && errors[name]),
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  });

  const errorFor = (name) =>
    touched[name] && errors[name] ? (
      <p id={`${name}-error`} className="field__error">
        {errors[name]}
      </p>
    ) : null;

  return (
    <section className="section">
      <div className="container">
        <header className="page-head">
          <p className="eyebrow">Contact</p>
          <h1 className="page-title">Let&apos;s work together</h1>
          <p className="page-lead">
            Have a question, an opportunity, or just want to say hi? Send me a message and I&apos;ll get back to you.
          </p>
        </header>

        <div className="contact">
          <aside className="contact__info">
            <div className="contact__item">
              <h3>Email</h3>
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
            </div>
            <div className="contact__item">
              <h3>Phone</h3>
              <p>{profile.phone}</p>
            </div>
            <div className="contact__item">
              <h3>Location</h3>
              <p>{profile.location}</p>
            </div>
            <div className="contact__item">
              <h3>Elsewhere</h3>
              <ul className="contact__socials">
                {profile.socials.map((s) => (
                  <li key={s.label}>
                    <a href={s.url} target={s.url.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <form className="contact__form" onSubmit={onSubmit} noValidate>
            <div className="field-row">
              <div className="field">
                <label htmlFor="name">Name *</label>
                <input type="text" autoComplete="name" placeholder="Your name" {...field('name')} />
                {errorFor('name')}
              </div>
              <div className="field">
                <label htmlFor="email">Email *</label>
                <input type="email" autoComplete="email" placeholder="you@example.com" {...field('email')} />
                {errorFor('email')}
              </div>
            </div>
            <div className="field">
              <label htmlFor="subject">Subject</label>
              <input type="text" placeholder="What's this about?" {...field('subject')} />
            </div>
            <div className="field">
              <label htmlFor="message">Message *</label>
              <textarea rows="6" placeholder="Tell me a bit about it…" {...field('message')} />
              <div className="field__meta">
                {errorFor('message')}
                <span className="field__count">{values.message.length}/1000</span>
              </div>
            </div>

            <button type="submit" className="btn btn--primary btn--block" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : 'Send message'}
            </button>

            {status === 'sent' && (
              <p className="form-status form-status--ok" role="status">
                Thanks! Your message is on its way. I&apos;ll reply soon.
              </p>
            )}
            {status === 'error' && (
              <p className="form-status form-status--err" role="alert">
                Something went wrong. Please try again or email me directly.
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
