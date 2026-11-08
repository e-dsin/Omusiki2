import React from 'react';
import { useParams, Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';

// Pages légales publiques (accessibles sans compte : nécessaires à l'inscription et au paiement).
// Le contenu juridique reste à rédiger.
const LEGAL_PAGES = {
  cgu: 'Conditions générales d’utilisation et de vente',
  confidentialite: 'Politique de confidentialité',
  cookies: 'Politique cookies',
};

const LegalPage = () => {
  const { page } = useParams();
  const title = LEGAL_PAGES[page];

  return (
    <AuthLayout title={title || 'Page introuvable'}>
      <div style={{ color: 'white', lineHeight: 1.6 }}>
        <p style={{ marginBottom: '16px', color: 'rgba(255,255,255,0.8)' }}>
          {title
            ? 'Contenu juridique à rédiger avant la mise en production.'
            : 'Cette page légale n’existe pas.'}
        </p>
        <Link to="/" style={{ color: '#EC4899', fontWeight: 600 }}>
          Retour à Ô musiki
        </Link>
      </div>
    </AuthLayout>
  );
};

export default LegalPage;
