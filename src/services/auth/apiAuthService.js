// services/auth/apiAuthService.js
// Implémentation de l'authentification via l'API (back-end simulé local, contrat calqué sur Cognito).
// Même interface que demoAuthService.js ; l'implémentation Cognito (Amplify) suivra la même.
import { api, tokenStore } from '../apiClient';

const post = (path, body) => api(path, { method: 'POST', body, auth: false });

const openSession = session => {
  tokenStore.set(session);
  return session.user;
};

export const apiAuthService = {
  provider: 'api',

  async getCurrentUser() {
    if (!tokenStore.get()) return null;
    try {
      const me = await api('/api/me');
      return me.user;
    } catch (error) {
      if (error.status === 401) tokenStore.clear();
      return null; // serveur arrêté : l'utilisateur se reconnectera
    }
  },

  async signIn(email, password) {
    return openSession(await post('/api/auth/login', { email, password }));
  },

  async signUp(email, password, name) {
    return post('/api/auth/signup', { email, password, name }); // { status: 'confirm', email }
  },

  async confirmSignUp(email, code) {
    const session = await post('/api/auth/confirm', { email, code });
    return { status: 'signed-in', user: openSession(session) };
  },

  async resendSignUpCode(email) {
    return post('/api/auth/resend-code', { email });
  },

  async signInWithProvider(provider) {
    // Cognito : signInWithRedirect({ provider }) ; ici, retour fédéré simulé
    return openSession(await post(`/api/auth/oauth/${provider.toLowerCase()}`));
  },

  async requestPasswordReset(email) {
    return post('/api/auth/forgot', { email });
  },

  async confirmPasswordReset(email, code, newPassword) {
    return post('/api/auth/reset', { email, code, newPassword });
  },

  async updateProfile(name) {
    const me = await api('/api/me', { method: 'PATCH', body: { name } });
    return me.user;
  },

  async deleteAccount() {
    await api('/api/me', { method: 'DELETE' });
    tokenStore.clear();
  },

  async signOut() {
    const refreshToken = tokenStore.get()?.refreshToken;
    tokenStore.clear();
    if (refreshToken) {
      await post('/api/auth/logout', { refreshToken }).catch(() => {});
    }
  },
};

export default apiAuthService;
