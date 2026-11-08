import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { EnhancedPlayerProvider } from './contexts/EnhancedPlayerContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { ToastProvider } from './components/Toast/ToastSystem';
import AppRoutes from './router/AppRoutes';

// Ordre des providers :
// - Auth en premier (les autres dépendent de l'utilisateur : abonnement, favoris par compte)
// - Abonnement avant le lecteur : le lecteur vérifie l'accès avant de jouer un titre
// - Lecteur au-dessus du routeur de pages : la lecture continue quand on change de page
// - Toasts en dernier : ils peuvent être déclenchés depuis n'importe quel écran
function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <EnhancedPlayerProvider>
          <FavoritesProvider>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </FavoritesProvider>
        </EnhancedPlayerProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App;
