import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = ({
  message = 'Cette page n’existe pas ou a été déplacée.',
}) => (
  <div style={{ textAlign: 'center', padding: '80px 20px', color: 'white' }}>
    <div style={{ fontSize: '64px', fontWeight: 800, opacity: 0.4 }}>404</div>
    <p style={{ margin: '16px 0 24px', color: 'rgba(255,255,255,0.75)' }}>
      {message}
    </p>
    <Link
      to="/"
      style={{
        padding: '10px 18px',
        borderRadius: '10px',
        background: 'linear-gradient(45deg, #8B5CF6, #EC4899)',
        color: 'white',
        fontWeight: 600,
      }}
    >
      Retour à l&apos;accueil
    </Link>
  </div>
);

export default NotFoundPage;
