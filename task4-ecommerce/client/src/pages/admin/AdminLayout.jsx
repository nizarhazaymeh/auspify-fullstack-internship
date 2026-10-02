import { NavLink, Outlet } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';

export default function AdminLayout() {
  return (
    <div className="container section">
      <div className="admin-head">
        <h1>Admin</h1>
        <nav className="tabs" aria-label="Admin sections">
          <NavLink to="/admin" end>
            <Icon name="chart" size={16} /> Dashboard
          </NavLink>
          <NavLink to="/admin/products">
            <Icon name="tag" size={16} /> Products
          </NavLink>
          <NavLink to="/admin/orders">
            <Icon name="box" size={16} /> Orders
          </NavLink>
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
