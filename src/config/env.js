// Point d'accès unique aux variables d'environnement (Vite : préfixe VITE_, lues via import.meta.env).
// Aucune de ces valeurs n'est secrète : tout ce qui est exposé ici est visible dans le navigateur.
const env = import.meta.env;

export const config = {
  // 'demo' : tout est simulé dans le navigateur (aucun serveur)
  // 'api'  : le front appelle l'API (back-end simulé local, puis services réels)
  backend: env.VITE_BACKEND === 'api' ? 'api' : 'demo',
  // Vide en local : les appels /api passent par le proxy Vite (pas de CORS)
  apiUrl: (env.VITE_API_URL ?? '').replace(/\/$/, ''),
  cognito: {
    region: env.VITE_COGNITO_REGION ?? '',
    userPoolId: env.VITE_COGNITO_USER_POOL_ID ?? '',
    clientId: env.VITE_COGNITO_CLIENT_ID ?? '',
    domain: env.VITE_COGNITO_DOMAIN ?? '',
  },
  muxEnvKey: env.VITE_MUX_ENV_KEY ?? '',
  stripePublishableKey: env.VITE_STRIPE_PUBLISHABLE_KEY ?? '',
  mixpanelToken: env.VITE_MIXPANEL_TOKEN ?? '',
  // Aides de test affichées dans l'interface (règles de simulation) ; VITE_TEST_HINTS=0 pour les masquer
  testHints: env.VITE_TEST_HINTS !== '0',
};

export const isApiMode = config.backend === 'api';

export default config;
