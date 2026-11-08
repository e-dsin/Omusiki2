import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { RequireAuth, PublicOnlyRoute } from './RouteGuards';
import MainLayout from '../layouts/MainLayout';
import AuthPage from '../components/Auth/AuthPage';
import HomeTab from '../components/Tabs/HomeTab';
import SearchTab from '../components/Tabs/SearchTab';
import LibraryTab from '../components/Tabs/LibraryTab';
import CollectionPage from '../pages/CollectionPage';
import PlansPage from '../pages/PlansPage';
import PaymentReturnPage from '../pages/PaymentReturnPage';
import SubscriptionPage from '../pages/SubscriptionPage';
import AccountPage from '../pages/AccountPage';
import LegalPage from '../pages/LegalPage';
import NotFoundPage from '../pages/NotFoundPage';

// Plan de navigation de la vue Abonné (MVP 1).
// PlaceholderPage (pages/PlaceholderPage.jsx) reste disponible pour les écrans à venir.
const AppRoutes = () => (
  <Routes>
    {/* Pages publiques */}
    <Route
      path="/connexion"
      element={
        <PublicOnlyRoute>
          <AuthPage />
        </PublicOnlyRoute>
      }
    />
    <Route path="/legal/:page" element={<LegalPage />} />

    {/* Pages réservées aux abonnés connectés, dans le layout principal */}
    <Route
      element={
        <RequireAuth>
          <MainLayout />
        </RequireAuth>
      }
    >
      <Route index element={<HomeTab />} />
      <Route path="recherche" element={<SearchTab />} />
      <Route path="bibliotheque" element={<LibraryTab />} />
      <Route path="collection/:collectionId" element={<CollectionPage />} />

      <Route path="formules" element={<PlansPage />} />
      <Route path="paiement/retour" element={<PaymentReturnPage />} />
      <Route path="abonnement" element={<SubscriptionPage />} />
      <Route path="compte" element={<AccountPage />} />

      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>
);

export default AppRoutes;
