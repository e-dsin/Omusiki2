import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../UI/HeroSection';
import MusicCarousel from '../UI/MusicCarousel';
import QuickStats from '../UI/QuickStats';
import { buildHomeCollections } from '../../services/homeCollections';

// Accueil abonné.
// La barre de navigation, le pied de page et le lecteur sont désormais portés par MainLayout ;
// le détail d'un classement est une vraie page (/collection/:id) et non plus un état interne.
const HomeTab = () => {
  const navigate = useNavigate();

  const {
    topChartsData,
    trendingData,
    featuredArtistsData,
    newReleasesData,
    madeForYouData,
    genresData,
    discoveryData,
  } = useMemo(() => buildHomeCollections(), []);

  const handleChartClick = chartItem => navigate(`/collection/${chartItem.id}`);

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <HeroSection />

      <div>
        <MusicCarousel
          title="📊 Classements Régionaux"
          items={topChartsData}
          description="Les hits par régions africaines • Basé sur les écoutes"
          type="default"
          onChartClick={handleChartClick}
        />

        <MusicCarousel
          title="🔥 Tendances Afro"
          items={trendingData}
          description="Les sons qui font vibrer l'Afrique en ce moment • Mis à jour quotidiennement"
          type="default"
        />

        <MusicCarousel
          title="⭐ Artistes Vedettes"
          items={featuredArtistsData}
          description="Charlotte Dipanda, Burna Boy et les stars qui illuminent la scène africaine"
          type="default"
        />

        <MusicCarousel
          title="🆕 Nouvelles Sorties"
          items={newReleasesData}
          description="Les dernières créations musicales africaines • 2023-2024"
          type="compact"
        />

        <MusicCarousel
          title="🎯 Créé pour Vous"
          items={madeForYouData}
          description="Playlists personnalisées selon vos goûts musicaux"
          type="default"
        />

        <MusicCarousel
          title="🎵 Genres Populaires"
          items={genresData}
          description="Explorez la diversité musicale africaine par genre"
          type="compact"
        />

        <MusicCarousel
          title="🌍 Découvertes Pays"
          items={discoveryData}
          description="Talents émergents et perles cachées par pays"
          type="default"
        />
      </div>

      <QuickStats />
    </div>
  );
};

export default HomeTab;
