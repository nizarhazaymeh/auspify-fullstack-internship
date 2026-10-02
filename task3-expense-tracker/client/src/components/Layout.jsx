import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Icon from './Icon.jsx';

const nav = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/transactions', label: 'Transactions', icon: 'list' },
  { to: '/reports', label: 'Reports', icon: 'chart' },
  { to: '/profile', label: 'Profile', icon: 'user' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <img src="/favicon.svg" alt="" width="32" height="32" />
          <span>Expense Tracker</span>
        </div>
        <nav className="sidebar__nav" aria-label="Main">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className="sidebar__link">
              <Icon name={n.icon} />
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__user">
          <span className="avatar" aria-hidden="true">
            {user.name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </span>
          <div className="sidebar__who">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
          <button type="button" className="icon-btn" onClick={onLogout} aria-label="Log out" title="Log out">
            <Icon name="logout" />
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
