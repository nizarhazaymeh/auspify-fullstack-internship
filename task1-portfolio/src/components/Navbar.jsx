import { useEffect, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.jsx';
import { profile } from '../data/profile.js';
import '../styles/navbar.css';

const links = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/projects', label: 'Projects' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__brand">
          <span className="navbar__logo">{profile.initials}</span>
          <span className="navbar__name">{profile.name}</span>
        </Link>

        <nav id="primary-nav" className={`navbar__links ${open ? 'is-open' : ''}`} aria-label="Primary">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className="navbar__link">
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar__actions">
          <ThemeToggle />
          <button
            type="button"
            className="icon-btn navbar__burger"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="primary-nav"
            onClick={() => setOpen((o) => !o)}
          >
            <span className={`burger ${open ? 'is-open' : ''}`} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
