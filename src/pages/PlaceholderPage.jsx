import React from 'react';
import { Link } from 'react-router-dom';
import { Construction } from 'lucide-react';

// Page d'attente pour les écrans du MVP 1 pas encore construits.
// La route existe déjà : la navigation, les liens et les redirections peuvent être branchés dès maintenant.
const PlaceholderPage = ({ title, sprint, userStories = [] }) => (
  <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 20px' }}>
    <div
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        padding: '32px',
        color: 'white',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: '#EC4899',
          marginBottom: '12px',
        }}
      >
        <Construction size={16} />
        Page à construire{sprint ? ` · ${sprint}` : ''}
      </div>
      <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>
        {title}
      </h1>
      {userStories.length > 0 && (
        <>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
            User stories couvertes :
          </p>
          <ul
            style={{
              paddingLeft: '20px',
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.7,
            }}
          >
            {userStories.map(us => (
              <li key={us}>{us}</li>
            ))}
          </ul>
        </>
      )}
      <Link
        to="/"
        style={{
          display: 'inline-block',
          marginTop: '24px',
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
  </div>
);

export default PlaceholderPage;
