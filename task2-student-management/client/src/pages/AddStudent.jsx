import { Link, useNavigate } from 'react-router-dom';
import { studentsApi } from '../api/students.js';
import { useToast } from '../components/Toast.jsx';
import StudentForm from '../components/StudentForm.jsx';

export default function AddStudent() {
  const navigate = useNavigate();
  const notify = useToast();

  const create = async (data) => {
    const s = await studentsApi.create(data);
    notify(`${s.fullName} was added.`);
    navigate(`/students/${s.id}`);
  };

  return (
    <>
      <Link to="/" className="back-link">
        ← All students
      </Link>
      <div className="page-head">
        <div>
          <h1>Add student</h1>
          <p className="muted">Fields marked * are required.</p>
        </div>
      </div>
      <StudentForm submitLabel="Add student" onSubmit={create} cancelTo="/" />
    </>
  );
}
