// services/auth/demoAuthService.js
// Implémentation DÉMO de l'authentification : tout est simulé dans le navigateur, sans serveur.
// Interface commune aux trois implémentations (démo, API locale, Cognito) :
//
//   getCurrentUser()                              -> user | null
//   signIn(email, password)                       -> user
//   signUp(email, password, name)                 -> { status: 'signed-in', user } | { status: 'confirm', email }
//   confirmSignUp(email, code)                    -> { status: 'signed-in', user }
//   resendSignUpCode(email)                       -> { sent: true }
//   signInWithProvider('Google' | 'Apple')        -> user (démo) ; redirection Cognito en production
//   requestPasswordReset(email)                   -> { status: 'code-sent', destination }
//   confirmPasswordReset(email, code, newPassword)-> { status: 'done' }
//   updateProfile(name)                           -> user
//   deleteAccount()
//   signOut()
//
// Les erreurs portent un `name` identique à ceux de Cognito (NotAuthorizedException, CodeMismatchException…),
// traduits en français par services/authErrors.js.
//
// Règles de la démo, pour tester tous les parcours sans back-end :
//   - mot de passe « mauvais » à la connexion     -> erreur « Email ou mot de passe incorrect »
//   - email contenant « +code » à l'inscription   -> étape de confirmation par code
//   - code de confirmation ou de réinitialisation -> 123456

const SESSION_KEY = 'omusiki_demo_session';
const DEMO_CODE = '123456';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const authError = name => {
  const error = new Error(name);
  error.name = name;
  return error;
};

const readSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeSession = user => {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch {
    // Stockage indisponible (navigation privée) : la session restera en mémoire
  }
};

const clearSession = () => {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignoré
  }
};

const demoUser = (email, name, subscription) => ({
  id: `demo:${email}`,
  name: name || email,
  email,
  subscription,
});

const pendingSignUps = new Map();

const maskEmail = email => {
  const [local, domain] = email.split('@');
  return `${local.slice(0, 1)}***@${domain || ''}`;
};

export const demoAuthService = {
  provider: 'demo',

  async getCurrentUser() {
    return readSession();
  },

  async signIn(email, password) {
    await wait(600);
    if (password === 'mauvais') throw authError('NotAuthorizedException');
    const user = demoUser(email, 'Utilisateur Demo', 'Premium');
    writeSession(user);
    return user;
  },

  async signUp(email, _password, name) {
    await wait(600);
    if (email.includes('+code')) {
      pendingSignUps.set(email, name);
      return { status: 'confirm', email };
    }
    const user = demoUser(email, name, 'Basic');
    writeSession(user);
    return { status: 'signed-in', user };
  },

  async confirmSignUp(email, code) {
    await wait(500);
    if (code !== DEMO_CODE) throw authError('CodeMismatchException');
    const user = demoUser(email, pendingSignUps.get(email), 'Basic');
    pendingSignUps.delete(email);
    writeSession(user);
    return { status: 'signed-in', user };
  },

  async resendSignUpCode(/* email */) {
    await wait(400);
    return { sent: true };
  },

  async signInWithProvider(provider) {
    await wait(600);
    const user = demoUser(
      `demo.${provider.toLowerCase()}@omusiki.test`,
      `Utilisateur ${provider}`,
      'Basic'
    );
    writeSession(user);
    return user;
  },

  async requestPasswordReset(email) {
    await wait(500);
    return { status: 'code-sent', destination: maskEmail(email) };
  },

  async confirmPasswordReset(_email, code /* , newPassword */) {
    await wait(500);
    if (code !== DEMO_CODE) throw authError('CodeMismatchException');
    return { status: 'done' };
  },

  async updateProfile(name) {
    const user = { ...readSession(), name };
    writeSession(user);
    return user;
  },

  async deleteAccount() {
    clearSession();
  },

  async signOut() {
    clearSession();
  },
};

export default demoAuthService;
