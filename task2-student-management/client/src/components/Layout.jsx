import { Link, NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="container topbar__inner">
          <Link to="/" className="brand">
            <img src="/favicon.svg" alt="" width="32" height="32" />
            <span>
              Student<strong>MS</strong>
            </span>
          </Link>
          <nav className="topbar__nav">
            <NavLink to="/" end>
              Students
            </NavLink>
            <NavLink to="/students/new" className="btn btn--primary btn--sm">
              + Add student
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="container main">
        <Outlet />
      </main>
      <footer className="footer container">Student Management System · Auspify Internship Task 2</footer>
    </div>
  );
}
