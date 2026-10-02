import { Link } from 'react-router-dom';
import { EmptyState } from '../components/States.jsx';

export default function NotFound() {
  return (
    <EmptyState title="Page not found">
      <Link to="/" className="btn btn--primary">
        Back to dashboard
      </Link>
    </EmptyState>
  );
}
