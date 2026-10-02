import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { studentsApi } from '../api/students.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { useMeta } from '../hooks/useMeta.js';
import { useToast } from '../components/Toast.jsx';
import StatCards from '../components/StatCards.jsx';
import Pagination from '../components/Pagination.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { Spinner, ErrorBanner, EmptyState } from '../components/States.jsx';

const LIMIT = 10;
const SORTS = [
  { value: '-createdAt', label: 'Newest first' },
  { value: 'createdAt', label: 'Oldest first' },
  { value: 'firstName', label: 'First name A–Z' },
  { value: 'lastName', label: 'Last name A–Z' },
  { value: 'studentId', label: 'Student ID' },
  { value: '-gpa', label: 'GPA high → low' },
  { value: 'gpa', label: 'GPA low → high' },
];

export default function StudentList() {
  const [params, setParams] = useSearchParams();
  const { courses } = useMeta();
  const notify = useToast();
  const navigate = useNavigate();

  const page = Number(params.get('page')) || 1;
  const course = params.get('course') ?? '';
  const year = params.get('year') ?? '';
  const sort = params.get('sort') ?? '-createdAt';
  const [search, setSearch] = useState(params.get('search') ?? '');
  const debouncedSearch = useDebounce(search.trim());

  const [result, setResult] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const update = useCallback(
    (changes) => {
      const next = new URLSearchParams(params);
      for (const [k, v] of Object.entries(changes)) {
        if (v === '' || v == null) next.delete(k);
        else next.set(k, v);
      }
      if (!('page' in changes)) next.delete('page');
      setParams(next, { replace: true });
    },
    [params, setParams]
  );

  // Sync debounced search box into the URL.
  useEffect(() => {
    if (debouncedSearch !== (params.get('search') ?? '')) update({ search: debouncedSearch });
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    Promise.all([
      studentsApi.list({ search: params.get('search') ?? '', course, year, sort, page, limit: LIMIT }, ctrl.signal),
      studentsApi.stats(ctrl.signal),
    ])
      .then(([list, s]) => {
        // Deleting the last row of the last page: step back a page.
        if (list.data.length === 0 && page > 1 && list.pagination.total > 0) {
          update({ page: list.pagination.pages });
          return;
        }
        setResult(list);
        setStats(s);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err);
        setLoading(false);
      });
    return () => ctrl.abort();
  }, [params, course, year, sort, page, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await studentsApi.remove(toDelete.id);
      notify(`${toDelete.fullName} was deleted.`);
      setToDelete(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filtersActive = Boolean(params.get('search') || course || year);
  const students = result?.data ?? [];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Students</h1>
          <p className="muted">Manage student records: add, view, update and delete.</p>
        </div>
        <Link to="/students/new" className="btn btn--primary">
          + Add student
        </Link>
      </div>

      <StatCards stats={stats} />

      <div className="card">
        <div className="toolbar">
          <div className="search">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              placeholder="Search by name, email or ID…"
              aria-label="Search students"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select aria-label="Filter by course" value={course} onChange={(e) => update({ course: e.target.value })}>
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select aria-label="Filter by year" value={year} onChange={(e) => update({ year: e.target.value })}>
            <option value="">All years</option>
            {[1, 2, 3, 4, 5].map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
          <select aria-label="Sort" value={sort} onChange={(e) => update({ sort: e.target.value === '-createdAt' ? '' : e.target.value })}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          {filtersActive && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                setSearch('');
                setParams({}, { replace: true });
              }}
            >
              Clear
            </button>
          )}
        </div>

        {error && <ErrorBanner error={error} onRetry={() => setReloadKey((k) => k + 1)} />}

        {loading && !result && <Spinner label="Loading students…" />}

        {!error && result && students.length === 0 && (
          <EmptyState title={filtersActive ? 'No students match your filters' : 'No students yet'}>
            {filtersActive ? (
              <p className="muted">Try a different search or clear the filters.</p>
            ) : (
              <Link to="/students/new" className="btn btn--primary">
                Add your first student
              </Link>
            )}
          </EmptyState>
        )}

        {!error && students.length > 0 && (
          <div className={`table-wrap ${loading ? 'is-loading' : ''}`}>
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>ID</th>
                  <th>Course</th>
                  <th>Year</th>
                  <th>GPA</th>
                  <th className="table__actions-head">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} onClick={() => navigate(`/students/${s.id}`)} className="table__row">
                    <td data-label="Student">
                      <div className="person">
                        <span className="avatar" aria-hidden="true">
                          {s.firstName[0]}
                          {s.lastName[0]}
                        </span>
                        <div>
                          <Link to={`/students/${s.id}`} className="person__name" onClick={(e) => e.stopPropagation()}>
                            {s.fullName}
                          </Link>
                          <span className="person__email">{s.email}</span>
                        </div>
                      </div>
                    </td>
                    <td data-label="ID">
                      <code>{s.studentId}</code>
                    </td>
                    <td data-label="Course">{s.course}</td>
                    <td data-label="Year">{s.year}</td>
                    <td data-label="GPA">
                      <span className={`gpa ${s.gpa >= 3.5 ? 'gpa--high' : s.gpa != null && s.gpa < 2.5 ? 'gpa--low' : ''}`}>
                        {s.gpa != null ? s.gpa.toFixed(2) : '—'}
                      </span>
                    </td>
                    <td className="table__actions" onClick={(e) => e.stopPropagation()}>
                      <Link to={`/students/${s.id}`} className="btn btn--ghost btn--sm">
                        View
                      </Link>
                      <Link to={`/students/${s.id}/edit`} className="btn btn--ghost btn--sm">
                        Edit
                      </Link>
                      <button type="button" className="btn btn--danger-ghost btn--sm" onClick={() => setToDelete(s)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!error && result && (
          <Pagination {...result.pagination} onChange={(p) => update({ page: p > 1 ? p : '' })} />
        )}
      </div>

      <ConfirmModal
        open={Boolean(toDelete)}
        title="Delete student?"
        message={toDelete && `This will permanently delete ${toDelete.fullName} (${toDelete.studentId}). This cannot be undone.`}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
