// services/homeCollections.js
// Construction des collections affichées sur l'accueil (extrait de HomeTab.jsx).
// Centraliser ces données permet à la page /collection/:id de retrouver une collection
// par son identifiant (lien partageable, rechargement de page, bouton Retour).
// Au branchement de l'API, seules ces fonctions changeront.
import {
  MusicSearchService,
  PlaylistGenerator,
  MusicAnalytics,
} from './musicDatabase';

const COVER_A =
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop';
const COVER_B =
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=300&h=300&fit=crop';

const sumStreams = songs =>
  songs.reduce((total, song) => total + song.streams, 0);
const sumSeconds = songs =>
  songs.reduce((total, song) => total + song.duration, 0);

const formatTrackDuration = seconds =>
  `${Math.floor(seconds / 60)}min ${seconds % 60}s`;

const formatMinutes = songs => `${Math.floor(sumSeconds(songs) / 60)}min`;

const formatTotalDuration = songs => {
  const minutes = Math.floor(sumSeconds(songs) / 60);
  return minutes >= 60
    ? `${Math.floor(minutes / 60)}h ${minutes % 60}min`
    : `${minutes}min`;
};

const toTrackCard = song => ({
  id: song.id,
  title: song.title,
  artist: song.artist,
  cover: song.cover,
  duration: formatTrackDuration(song.duration),
  tracks: 1,
  audioUrl: song.audioUrl,
  genre: song.genre,
  country: song.country,
  streams: song.streams,
  year: song.year,
  description: song.description,
  likes: song.likes,
  tags: song.tags,
  language: song.language,
});

// --- Classements (pays, régions, monde) ---
const CHARTS = [
  {
    id: 'chart_cameroon',
    title: 'Cameroon Hits',
    subtitle: 'Makossa • Bikutsi • Afropop moderne',
    category: 'country',
    country: 'Cameroon',
    cover: COVER_A,
  },
  {
    id: 'chart_nigeria',
    title: 'Nigerian Hits',
    subtitle: 'Afrobeats • Highlife • Afropop',
    category: 'country',
    country: 'Nigeria',
    cover: COVER_B,
  },
  {
    id: 'chart_ivory_coast',
    title: 'Ivory Coast Hits',
    subtitle: 'Coupé-Décalé • Zouglou • Afropop',
    category: 'country',
    country: 'Ivory Coast',
    cover: COVER_A,
  },
  {
    id: 'chart_congo',
    title: 'Congo Hits',
    subtitle: 'Ndombolo • Rumba • Soukous',
    category: 'country',
    country: 'Congo',
    cover: COVER_B,
  },
  {
    id: 'chart_central_africa',
    title: 'Central Africa Hits',
    subtitle: 'Cameroun • Congo • Gabon • RCA',
    category: 'region',
    region: 'central-africa',
    cover: COVER_A,
  },
  {
    id: 'chart_west_africa',
    title: 'West Africa Hits',
    subtitle: 'Nigeria • Ghana • Ivory Coast • Senegal',
    category: 'region',
    region: 'west-africa',
    cover: COVER_B,
  },
  {
    id: 'chart_east_africa',
    title: 'East Africa Hits',
    subtitle: 'Kenya • Tanzania • Uganda • Rwanda',
    category: 'region',
    region: 'east-africa',
    cover: COVER_A,
  },
  {
    id: 'chart_north_africa',
    title: 'North Africa Hits',
    subtitle: 'Maroc • Algérie • Tunisie • Égypte',
    category: 'region',
    region: 'north-africa',
    cover: COVER_B,
  },
  {
    id: 'chart_south_africa',
    title: 'South Africa Hits',
    subtitle: 'House • Gqom • Amapiano • Hip-Hop',
    category: 'country',
    country: 'South Africa',
    cover: COVER_B,
  },
  {
    id: 'chart_caribbean',
    title: 'Caribbean Hits',
    subtitle: 'Zouk • Soca • Dancehall fusion',
    category: 'region',
    region: 'caribbean',
    cover: COVER_A,
  },
  {
    id: 'chart_jamaica',
    title: 'Jamaican Hits',
    subtitle: 'Reggae • Dancehall • Roots',
    category: 'country',
    country: 'Jamaica',
    cover: COVER_B,
  },
  {
    id: 'chart_world_music',
    title: 'World Music',
    subtitle: 'Fusion Globale • Collaborations Internationales',
    category: 'world',
    region: 'world',
    cover: COVER_A,
  },
];

const chartPlaylist = chart => {
  if (chart.category === 'country')
    return MusicSearchService.searchByCountry(chart.country);
  if (chart.category === 'region')
    return PlaylistGenerator.generateByRegion(chart.region);
  return PlaylistGenerator.generateWorldFusion();
};

const buildCharts = () =>
  CHARTS.map(({ subtitle, ...chart }) => {
    const playlist = chartPlaylist(chart);
    return {
      ...chart,
      artist: subtitle,
      duration: formatTotalDuration(playlist),
      tracks: playlist.length,
      audioUrl: playlist[0]?.audioUrl,
      playlist,
      type: 'chart',
      streams: sumStreams(playlist),
    };
  });

// --- Playlists générées ---
const buildPlaylist = (id, title, tagline, playlist, fallbackCover) => ({
  id,
  title,
  artist: `${playlist.length} titres • ${tagline}`,
  cover: playlist[0]?.cover || fallbackCover,
  duration: formatMinutes(playlist),
  tracks: playlist.length,
  audioUrl: playlist[0]?.audioUrl,
  playlist,
  type: 'playlist',
  streams: sumStreams(playlist),
});

// --- Artistes vedettes (identifiants du catalogue) ---
const FEATURED_IDS = [
  'cmr_makossa_002',
  'nga_afrobeats_001',
  'cmr_hit_001',
  'nga_afrobeats_002',
  'civ_coupe_001',
  'cog_amapiano_001',
];

const DISCOVERY_COUNTRIES = ['Cameroon', 'Nigeria', 'Ivory Coast', 'Congo'];

export function buildHomeCollections() {
  const trendingData = MusicSearchService.getPopular(10).map(toTrackCard);
  const newReleasesData = MusicSearchService.getNewReleases(8).map(toTrackCard);
  const featuredArtistsData = FEATURED_IDS.map(id =>
    MusicSearchService.getSongById(id)
  )
    .filter(Boolean)
    .map(toTrackCard);

  const madeForYouData = [
    buildPlaylist(
      'playlist_afrobeats',
      'Mix Afrobeats Essentiel',
      'Hits incontournables',
      PlaylistGenerator.generateAfrobeatsHits(),
      COVER_B
    ),
    buildPlaylist(
      'playlist_traditional',
      'Trésors Traditionnels',
      'Patrimoine musical',
      PlaylistGenerator.generateTraditionalMix(),
      COVER_A
    ),
    buildPlaylist(
      'playlist_modern',
      'Afrique Moderne',
      'Sons contemporains',
      PlaylistGenerator.generateModernAfricanMix(),
      COVER_B
    ),
    buildPlaylist(
      'playlist_fusion',
      'World Fusion',
      'Mélange global',
      PlaylistGenerator.generateWorldFusion(),
      COVER_B
    ),
  ];

  const topChartsData = buildCharts();

  const genresData = MusicAnalytics.getTopGenres(8).map(
    ({ genre, streams }) => {
      const songs = MusicSearchService.searchByGenre(genre);
      return {
        id: `genre_${genre}`,
        title: `${genre.charAt(0).toUpperCase() + genre.slice(1)} Collection`,
        artist: `${songs.length} titres • ${[
          ...new Set(songs.map(s => s.country)),
        ]
          .slice(0, 3)
          .join(', ')}`,
        cover: songs[0]?.cover || COVER_B,
        duration: formatMinutes(songs),
        tracks: songs.length,
        audioUrl: songs[0]?.audioUrl,
        playlist: songs,
        type: 'genre',
        genre,
        streams,
        country: songs[0]?.country,
      };
    }
  );

  const discoveryData = DISCOVERY_COUNTRIES.map(country => {
    const songs = MusicSearchService.searchByCountry(country).slice(0, 6);
    return {
      id: `discovery_${country.toLowerCase()}`,
      title: `Découvertes ${country}`,
      artist: `${songs.length} artistes • Talents émergents`,
      cover: songs[0]?.cover || COVER_A,
      duration: formatMinutes(songs),
      tracks: songs.length,
      audioUrl: songs[0]?.audioUrl,
      playlist: songs,
      type: 'discovery',
      country,
      streams: sumStreams(songs),
    };
  });

  return {
    topChartsData,
    trendingData,
    featuredArtistsData,
    newReleasesData,
    madeForYouData,
    genresData,
    discoveryData,
  };
}

// Recherche d'une collection par identifiant (utilisée par /collection/:collectionId)
export function findCollectionById(id) {
  const { topChartsData, madeForYouData, genresData, discoveryData } =
    buildHomeCollections();
  return (
    [...topChartsData, ...madeForYouData, ...genresData, ...discoveryData].find(
      collection => collection.id === id
    ) || null
  );
}
