import React from 'react';

// Écran de chargement plein écran (repris de l'ancien App.jsx)
const FullScreenLoader = ({ label = 'Chargement...' }) => (
  <div
    role="status"
    aria-live="polite"
    style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background:
        'linear-gradient(135deg, #1a365d 0%, #2d3748 50%, #1a202c 100%)',
      fontFamily: 'Montserrat, sans-serif',
    }}
  >
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          width: '64px',
          height: '64px',
          border: '4px solid rgba(139, 92, 246, 0.3)',
          borderTop: '4px solid #8B5CF6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px auto',
        }}
      />
      <p style={{ color: 'white', fontSize: '18px' }}>{label}</p>
    </div>
  </div>
);

export default FullScreenLoader;
