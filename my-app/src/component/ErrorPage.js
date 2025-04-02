import React from 'react';
import { Link } from 'react-router-dom';

function ErrorPage() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>404 - Page Not Found</h1>
      <p>Oops! The page you're looking for doesn't exist.</p>
      <Link to="/" style={{ color: '#007bff' }}>Go back to the homepage</Link>
    </div>
  );
}

export default ErrorPage;
