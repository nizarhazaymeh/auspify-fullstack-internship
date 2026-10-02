import { Link } from 'react-router-dom';
import { EmptyState } from '../components/States.jsx';

export default function NotFound() {
  return (
    <div className="container section">
      <EmptyState title="Page not found">
        <Link to="/" className="btn btn--primary">
          Back to the store
        </Link>
      </EmptyState>
    </div>
  );
}
