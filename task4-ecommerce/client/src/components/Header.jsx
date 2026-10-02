import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import Icon from './Icon.jsx';

function AccountMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <Link to="/login" className="hdr__icon" aria-label="Log in">
        <Icon name="user" size={20} />
        <span className="hdr__label">Log in</span>
      </Link>
    );
  }

  return (
    <div className="menu" ref={ref}>
      <button type="button" className="hdr__icon" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Icon name="user" size={20} />
        <span className="hdr__label">{user.name.split(' ')[0]}</span>
      </button>
      {open && (
        <div className="menu__panel" role="menu">
          <div className="menu__who">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
          {user.role === 'admin' && (
            <Link to="/admin" role="menuitem">
              <Icon name="chart" size={16} /> Admin dashboard
            </Link>
          )}
          <Link to="/orders" role="menuitem">
            <Icon name="box" size={16} /> My orders
          </Link>
          <Link to="/account" role="menuitem">
            <Icon name="user" size={16} /> Account
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              await logout();
              navigate('/');
            }}
          >
            <Icon name="logout" size={16} /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const { count } = useCart();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  const [q, setQ] = useState(params.get('search') ?? '');

  useEffect(() => {
    if (pathname === '/shop') setQ(params.get('search') ?? '');
  }, [pathname, params]);

  const submit = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/shop?search=${encodeURIComponent(q.trim())}` : '/shop');
  };

  return (
    <header className="hdr">
      <div className="container hdr__inner">
        <Link to="/" className="brand">
          <img src="/favicon.svg" alt="" width="30" height="30" />
          <span>Storefront</span>
        </Link>
        <nav className="hdr__nav" aria-label="Main">
          <NavLink to="/shop">Shop</NavLink>
        </nav>
        <form className="hdr__search" role="search" onSubmit={submit}>
          <Icon name="search" />
          <input type="search" placeholder="Search products…" aria-label="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
        </form>
        <div className="hdr__actions">
          <AccountMenu />
          <Link to="/cart" className="hdr__icon hdr__cart" aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}>
            <Icon name="cart" size={20} />
            {count > 0 && <span className="badge-count">{count > 99 ? '99+' : count}</span>}
            <span className="hdr__label">Cart</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
