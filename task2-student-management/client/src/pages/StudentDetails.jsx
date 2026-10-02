import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { studentsApi } from '../api/students.js';
import { useToast } from '../components/Toast.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { Spinner, ErrorBanner, EmptyState } from '../components/States.jsx';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : '—';

function age(dob) {
  if (!dob) return null;
  const b = new Date(dob);
  const now = new Date();
  let a = now.getUTCFullYear() - b.getUTCFullYear();
  if (now.getUTCMonth() < b.getUTCMonth() || (now.getUTCMonth() === b.getUTCMonth() && now.getUTCDate() < b.getUTCDate())) a -= 1;
  return a;
}

export default function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useToast();
  const [student, setStudent] = useState(null);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    (signal) => {
      setError(null);
      studentsApi
        .get(id, signal)
        .then(setStudent)
        .catch((err) => err.name !== 'AbortError' && setError(err));
    },
    [id]
  );

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  const remove = async () => {
    setDeleting(true);
    try {
      await studentsApi.remove(id);
      notify(`${student.fullName} was deleted.`);
      navigate('/', { replace: true });
    } catch (err) {
      notify(err.message, 'error');
      setDeleting(false);
    }
  };

  if (error?.status === 404 || error?.status === 400) {
    return (
      <EmptyState title="Student not found">
        <p className="muted">This record may have been deleted.</p>
        <Link to="/" className="btn btn--primary">
          Back to students
        </Link>
      </EmptyState>
    );
  }
  if (error) return <ErrorBanner error={error} onRetry={() => load()} />;
  if (!student) return <Spinner label="Loading student…" />;

  const a = age(student.dateOfBirth);
  const rows = [
    ['Student ID', <code key="id">{student.studentId}</code>],
    ['Email', <a key="e" href={`mailto:${student.email}`}>{student.email}</a>],
    ['Phone', student.phone || '—'],
    ['Date of birth', student.dateOfBirth ? `${fmtDate(student.dateOfBirth)}${a != null ? ` (age ${a})` : ''}` : '—'],
    ['Gender', student.gender || '—'],
    ['Address', student.address || '—'],
    ['Course', student.course],
    ['Year', `Year ${student.year}`],
    ['GPA', student.gpa != null ? student.gpa.toFixed(2) : '—'],
    ['Added', fmtDate(student.createdAt)],
    ['Last updated', fmtDate(student.updatedAt)],
  ];

  return (
    <>
      <Link to="/" className="back-link">
        ← All students
      </Link>
      <div className="card profile">
        <div className="profile__head">
          <span className="avatar avatar--lg" aria-hidden="true">
            {student.firstName[0]}
            {student.lastName[0]}
          </span>
          <div className="profile__title">
            <h1>{student.fullName}</h1>
            <p className="muted">
              {student.course} · Year {student.year}
            </p>
          </div>
          <div className="profile__actions">
            <Link to={`/students/${id}/edit`} className="btn btn--primary">
              Edit
            </Link>
            <button type="button" className="btn btn--danger-ghost" onClick={() => setConfirming(true)}>
              Delete
            </button>
          </div>
        </div>
        <dl className="details">
          {rows.map(([label, value]) => (
            <div key={label} className="details__row">
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <ConfirmModal
        open={confirming}
        title="Delete student?"
        message={`This will permanently delete ${student.fullName} (${student.studentId}). This cannot be undone.`}
        busy={deleting}
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
