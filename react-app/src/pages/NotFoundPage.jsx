import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="content__placeholder" style={{ minHeight: '60vh' }}>
      <span style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--color-primary)', opacity: 0.25 }}>
        404
      </span>
      <h2>Page not found</h2>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn btn--primary" style={{ marginTop: 8 }}>
        <span className="material-icons">arrow_back</span>
        Back to Dashboard
      </Link>
    </div>
  );
}
