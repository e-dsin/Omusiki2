// services/libraryService.js
// Bibliothèque côté serveur (mode api uniquement) : favoris et journal d'écoutes.
// En mode démo, les favoris restent dans le navigateur (FavoritesContext) et les écoutes ne sont pas journalisées.
import { api } from './apiClient';

export const libraryService = {
  listFavorites: () => api('/api/me/favorites'),
  addFavorite: trackId =>
    api(`/api/me/favorites/${encodeURIComponent(trackId)}`, { method: 'PUT' }),
  removeFavorite: trackId =>
    api(`/api/me/favorites/${encodeURIComponent(trackId)}`, {
      method: 'DELETE',
    }),
  // Une écoute compte à partir de 30 s (règle appliquée par le serveur)
  logPlay: (trackId, seconds) =>
    api('/api/plays', { method: 'POST', body: { trackId, seconds } }),
  listPlays: () => api('/api/me/plays'),
};

export default libraryService;
