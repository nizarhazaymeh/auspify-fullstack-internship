import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Header from './Header.jsx';

export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="app">
      <Header />
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="container footer__inner">
          <div>
            <strong>Storefront</strong>
            <p className="muted">A demo e-commerce store · Auspify Internship Task 4</p>
          </div>
          <nav className="footer__links" aria-label="Footer">
            <Link to="/shop">Shop</Link>
            <Link to="/orders">Orders</Link>
            <Link to="/account">Account</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
