import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { studentsApi } from '../api/students.js';
import { useToast } from '../components/Toast.jsx';
import StudentForm, { toFormValues } from '../components/StudentForm.jsx';
import { Spinner, ErrorBanner, EmptyState } from '../components/States.jsx';

export default function EditStudent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useToast();
  const [student, setStudent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    studentsApi
      .get(id, ctrl.signal)
      .then(setStudent)
      .catch((err) => err.name !== 'AbortError' && setError(err));
    return () => ctrl.abort();
  }, [id]);

  const save = async (data) => {
    const s = await studentsApi.update(id, data);
    notify(`${s.fullName} was updated.`);
    navigate(`/students/${id}`);
  };

  if (error?.status === 404 || error?.status === 400) {
    return (
      <EmptyState title="Student not found">
        <Link to="/" className="btn btn--primary">
          Back to students
        </Link>
      </EmptyState>
    );
  }
  if (error) return <ErrorBanner error={error} />;
  if (!student) return <Spinner label="Loading student…" />;

  return (
    <>
      <Link to={`/students/${id}`} className="back-link">
        ← Back to {student.fullName}
      </Link>
      <div className="page-head">
        <div>
          <h1>Edit student</h1>
          <p className="muted">
            Updating <strong>{student.fullName}</strong> ({student.studentId})
          </p>
        </div>
      </div>
      <StudentForm
        initialValues={toFormValues(student)}
        submitLabel="Save changes"
        onSubmit={save}
        cancelTo={`/students/${id}`}
      />
    </>
  );
}
