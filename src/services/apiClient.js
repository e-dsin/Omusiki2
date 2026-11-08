// services/apiClient.js
// Client HTTP unique vers l'API : jeton d'accès, rafraîchissement automatique, erreurs normalisées.
// Les erreurs portent le `name` renvoyé par l'API ({ error, message }), traduit par services/authErrors.js.
import { config } from '../config/env';

const TOKENS_KEY = 'omusiki_tokens';
export const SESSION_EXPIRED_EVENT = 'omusiki:session-expired';

export const tokenStore = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(TOKENS_KEY)) || null;
    } catch {
      return null;
    }
  },
  set({ accessToken, refreshToken, expiresIn }) {
    try {
      localStorage.setItem(
        TOKENS_KEY,
        JSON.stringify({ accessToken, refreshToken, expiresIn })
      );
    } catch {
      // stockage indisponible : la session ne survivra pas au rechargement
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKENS_KEY);
    } catch {
      // ignoré
    }
  },
};

export class ApiError extends Error {
  constructor(name, message, status = 0, data = null) {
    super(message || name);
    this.name = name;
    this.status = status;
    this.data = data;
  }
}

const readJson = async response => {
  if (response.status === 204) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const send = async (path, { method, body, token }) => {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    return await fetch(`${config.apiUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      'NetworkError',
      'Connexion impossible. Le serveur est-il démarré ?'
    );
  }
};

const toError = (response, data) =>
  new ApiError(
    data?.error || `Http${response.status}`,
    data?.message || response.statusText,
    response.status,
    data
  );

let refreshing = null;

const refreshTokens = () => {
  const refreshToken = tokenStore.get()?.refreshToken;
  if (!refreshToken)
    return Promise.reject(new ApiError('NotAuthenticated', 'Session absente'));
  if (!refreshing) {
    refreshing = send('/api/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    })
      .then(async response => {
        const data = await readJson(response);
        if (!response.ok) throw toError(response, data);
        tokenStore.set(data);
        return data;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
};

/**
 * Appel d'API.
 * @param {string} path  chemin commençant par /api
 * @param {{method?: string, body?: any, auth?: boolean}} options
 */
export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const token = auth ? tokenStore.get()?.accessToken : undefined;
  let response = await send(path, { method, body, token });
  let data = await readJson(response);

  // Jeton d'accès expiré : un rafraîchissement, puis une seule nouvelle tentative
  if (response.status === 401 && auth && data?.error === 'TokenExpired') {
    try {
      const fresh = await refreshTokens();
      response = await send(path, { method, body, token: fresh.accessToken });
      data = await readJson(response);
    } catch (error) {
      tokenStore.clear();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      throw error;
    }
  }

  if (!response.ok) throw toError(response, data);
  return data;
}

export default api;
