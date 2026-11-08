// src/components/Favorites/FavoritesSystem.jsx
// Ce fichier ne contient plus d'implémentation : il ré-exporte l'implémentation unique
// des favoris (contexts/FavoritesContext.jsx) pour que les imports existants
// (SearchTab, LibraryTab…) continuent de fonctionner sans modification.
export {
  FavoritesProvider,
  useFavorites,
  useFavoriteActions,
  FavoriteButton,
} from '../../contexts/FavoritesContext';

export { default } from '../../contexts/FavoritesContext';
