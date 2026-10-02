import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMeta } from '../hooks/useMeta.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+\d][\d\s()-]{6,19}$/;
const ID_RE = /^[A-Za-z0-9-]{3,20}$/;

export const emptyStudent = {
  studentId: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  course: '',
  year: '',
  gpa: '',
  address: '',
};

// Converts an API student into form values (all strings).
export function toFormValues(s) {
  return {
    ...emptyStudent,
    ...Object.fromEntries(Object.keys(emptyStudent).map((k) => [k, s[k] ?? ''])),
    dateOfBirth: s.dateOfBirth ? s.dateOfBirth.slice(0, 10) : '',
    year: s.year != null ? String(s.year) : '',
    gpa: s.gpa != null ? String(s.gpa) : '',
  };
}

function validate(v) {
  const e = {};
  if (!ID_RE.test(v.studentId.trim())) e.studentId = 'Use 3–20 letters, numbers or dashes (e.g. STU-1001).';
  if (!v.firstName.trim()) e.firstName = 'First name is required.';
  if (!v.lastName.trim()) e.lastName = 'Last name is required.';
  if (!EMAIL_RE.test(v.email.trim())) e.email = 'Enter a valid email address.';
  if (!v.course) e.course = 'Select a course.';
  if (!v.year) e.year = 'Select a year.';
  if (v.phone.trim() && !PHONE_RE.test(v.phone.trim())) e.phone = 'Enter a valid phone number.';
  if (v.gpa !== '' && (Number.isNaN(Number(v.gpa)) || Number(v.gpa) < 0 || Number(v.gpa) > 4))
    e.gpa = 'GPA must be between 0 and 4.';
  if (v.dateOfBirth && new Date(v.dateOfBirth) > new Date()) e.dateOfBirth = 'Date of birth cannot be in the future.';
  if (v.address.length > 200) e.address = 'Address must be under 200 characters.';
  return e;
}

function toPayload(v) {
  return {
    ...v,
    studentId: v.studentId.trim(),
    firstName: v.firstName.trim(),
    lastName: v.lastName.trim(),
    email: v.email.trim(),
    phone: v.phone.trim(),
    address: v.address.trim(),
    year: Number(v.year),
    gpa: v.gpa === '' ? '' : Number(v.gpa),
  };
}

export default function StudentForm({ initialValues = emptyStudent, submitLabel, onSubmit, cancelTo }) {
  const { courses, genders } = useMeta();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const onChange = (e) => {
    const next = { ...values, [e.target.name]: e.target.value };
    setValues(next);
    if (submitted) setErrors(validate(next));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setFormError('');
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }
    setSaving(true);
    try {
      await onSubmit(toPayload(values));
    } catch (err) {
      // Server-side field errors (e.g. duplicate email) are shown next to the field.
      if (err.errors && Object.keys(err.errors).length) setErrors(err.errors);
      setFormError(err.message);
      setSaving(false);
    }
  };

  const f = (name) => ({
    id: name,
    name,
    value: values[name],
    onChange,
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `${name}-err` : undefined,
  });

  const err = (name) => errors[name] && <p id={`${name}-err`} className="field__error">{errors[name]}</p>;

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
      {formError && (
        <div className="banner banner--error" role="alert">
          {formError}
        </div>
      )}

      <fieldset>
        <legend>Personal information</legend>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="firstName">First name *</label>
            <input type="text" autoComplete="off" {...f('firstName')} />
            {err('firstName')}
          </div>
          <div className="field">
            <label htmlFor="lastName">Last name *</label>
            <input type="text" autoComplete="off" {...f('lastName')} />
            {err('lastName')}
          </div>
          <div className="field">
            <label htmlFor="dateOfBirth">Date of birth</label>
            <input type="date" max={new Date().toISOString().slice(0, 10)} {...f('dateOfBirth')} />
            {err('dateOfBirth')}
          </div>
          <div className="field">
            <label htmlFor="gender">Gender</label>
            <select {...f('gender')}>
              <option value="">Prefer not to say</option>
              {genders.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
            {err('gender')}
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Contact</legend>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="email">Email *</label>
            <input type="email" autoComplete="off" placeholder="name@example.com" {...f('email')} />
            {err('email')}
          </div>
          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input type="tel" autoComplete="off" placeholder="+962 79 123 4567" {...f('phone')} />
            {err('phone')}
          </div>
          <div className="field field--full">
            <label htmlFor="address">Address</label>
            <input type="text" autoComplete="off" {...f('address')} />
            {err('address')}
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Academic</legend>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="studentId">Student ID *</label>
            <input type="text" autoComplete="off" placeholder="STU-1001" {...f('studentId')} />
            {err('studentId')}
          </div>
          <div className="field">
            <label htmlFor="course">Course *</label>
            <select {...f('course')}>
              <option value="">Select a course</option>
              {courses.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            {err('course')}
          </div>
          <div className="field">
            <label htmlFor="year">Year *</label>
            <select {...f('year')}>
              <option value="">Select year</option>
              {[1, 2, 3, 4, 5].map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
            {err('year')}
          </div>
          <div className="field">
            <label htmlFor="gpa">GPA (0–4)</label>
            <input type="number" step="0.01" min="0" max="4" inputMode="decimal" {...f('gpa')} />
            {err('gpa')}
          </div>
        </div>
      </fieldset>

      <div className="form__actions">
        <Link to={cancelTo} className="btn btn--ghost">
          Cancel
        </Link>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
