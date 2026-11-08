import React from 'react';

// Message d'erreur ou d'information affiché dans les formulaires d'authentification
const TONES = {
  error: {
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.45)',
  },
  success: {
    background: 'rgba(16, 185, 129, 0.2)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
  },
  info: {
    background: 'rgba(139, 92, 246, 0.2)',
    border: '1px solid rgba(139, 92, 246, 0.4)',
  },
};

const AuthFeedback = ({ tone = 'error', children }) => {
  if (!children) return null;
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      style={{
        ...TONES[tone],
        color: 'rgba(255, 255, 255, 0.95)',
        fontSize: '14px',
        lineHeight: '1.5',
        padding: '12px 14px',
        borderRadius: '8px',
        marginBottom: '16px',
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  );
};

export default AuthFeedback;
