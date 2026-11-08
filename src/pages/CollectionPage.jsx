import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ChartDetailPage from '../components/Tabs/ChartDetailPage';
import NotFoundPage from './NotFoundPage';
import { findCollectionById } from '../services/homeCollections';

// Détail d'une collection (classement, playlist, genre, découverte) accessible par URL :
// /collection/chart_cameroon — le lien peut être partagé, rechargé, et le bouton Retour fonctionne.
const CollectionPage = () => {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const collection = useMemo(
    () => findCollectionById(collectionId),
    [collectionId]
  );

  if (!collection) {
    return <NotFoundPage message="Cette collection est introuvable." />;
  }

  return (
    <ChartDetailPage
      key={collection.id}
      chart={collection}
      onBack={() => navigate('/')}
    />
  );
};

export default CollectionPage;
