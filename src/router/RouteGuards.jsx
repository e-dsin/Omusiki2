import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import FullScreenLoader from '../components/Common/FullScreenLoader';

// Pages réservées aux utilisateurs connectés : redirige vers /connexion en mémorisant la page demandée
export const RequireAuth = ({ children }) => {
  const { user, isInitializing } = useContext(AuthContext);
  const location = useLocation();

  if (isInitializing) return <FullScreenLoader />;
  if (!user)
    return <Navigate to="/connexion" replace state={{ from: location }} />;
  return children;
};

// Pages réservées aux visiteurs (connexion) : un utilisateur connecté est renvoyé vers la page demandée.
// Pendant une connexion en cours, le formulaire reste affiché (il gère son propre état de chargement) :
// en cas d'échec, l'utilisateur garde sa saisie et voit le message d'erreur.
export const PublicOnlyRoute = ({ children }) => {
  const { user, isInitializing } = useContext(AuthContext);
  const location = useLocation();

  if (isInitializing) return <FullScreenLoader />;
  if (user) {
    const target = location.state?.from?.pathname || '/';
    return <Navigate to={target} replace />;
  }
  return children;
};
