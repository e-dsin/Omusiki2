import React, {
  createContext,
  useState,
  useContext,
  useRef,
  useMemo,
  useCallback,
  useEffect,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from './SubscriptionContext';

const EnhancedPlayerContext = createContext();

export const usePlayer = () => {
  const context = useContext(EnhancedPlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

export const EnhancedPlayerProvider = ({ children }) => {
  // États principaux
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // États playlist
  const [currentPlaylist, setCurrentPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState('none'); // none, one, all

  // États UI
  const [showLyrics, setShowLyrics] = useState(false);
  const [showEqualizer, setShowEqualizer] = useState(false);

  const audioRef = useRef(null);

  // Contrôle d'accès : l'écoute est réservée aux abonnés (formule active)
  const navigate = useNavigate();
  const { checkAccess, hasAccess, loading: accessLoading } = useSubscription();

  // Démarre la lecture (sans contrôle d'accès)
  const startPlayback = useCallback((song, playlist = []) => {
    setCurrentSong(song);
    if (playlist.length > 0) {
      setCurrentPlaylist(playlist);
      const songIndex = playlist.findIndex(item => item.id === song.id);
      setCurrentIndex(songIndex >= 0 ? songIndex : 0);
    } else {
      // Si pas de playlist fournie, créer une playlist avec juste cette chanson
      setCurrentPlaylist([song]);
      setCurrentIndex(0);
    }
    setIsPlayerVisible(true);
    setIsPlaying(true);
  }, []);

  // Ouvre le lecteur si l'abonné a accès ; sinon, renvoie vers le choix de formule
  const openPlayer = useCallback(
    (song, playlist = []) => {
      checkAccess().then(allowed => {
        if (allowed) {
          startPlayback(song, playlist);
        } else {
          navigate('/formules', {
            state: { reason: 'subscription-required', songTitle: song?.title },
          });
        }
      });
    },
    [checkAccess, navigate, startPlayback]
  );

  // Accès perdu (pass expiré, résiliation échue, déconnexion) : arrêt de la lecture
  useEffect(() => {
    if (!accessLoading && !hasAccess && isPlayerVisible) {
      setIsPlaying(false);
      setIsPlayerVisible(false);
    }
  }, [accessLoading, hasAccess, isPlayerVisible]);

  // Fonction pour fermer le player
  const closePlayer = useCallback(() => {
    setIsPlayerVisible(false);
    setIsPlaying(false);
  }, []);

  // Contrôles de lecture
  const togglePlay = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const playNext = useCallback(() => {
    if (currentPlaylist.length === 0) return;

    let nextIndex;
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * currentPlaylist.length);
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= currentPlaylist.length) {
        if (repeatMode === 'all') {
          nextIndex = 0;
        } else {
          return; // Arrêter si pas de repeat
        }
      }
    }

    setCurrentIndex(nextIndex);
    setCurrentSong(currentPlaylist[nextIndex]);
    setCurrentTime(0);

    setIsPlaying(true);
  }, [currentPlaylist, currentIndex, isShuffled, repeatMode]);

  const playPrevious = useCallback(() => {
    if (currentPlaylist.length === 0) return;

    let prevIndex;
    if (currentTime > 3) {
      // Si on est à plus de 3 secondes, recommencer la chanson
      setCurrentTime(0);
      return;
    }

    prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      if (repeatMode === 'all') {
        prevIndex = currentPlaylist.length - 1;
      } else {
        prevIndex = 0;
      }
    }

    setCurrentIndex(prevIndex);
    setCurrentSong(currentPlaylist[prevIndex]);
    setCurrentTime(0);
    setIsPlaying(true);
  }, [currentPlaylist, currentIndex, currentTime, repeatMode]);

  // Gestion de la playlist
  const addToPlaylist = useCallback(
    (song, position = 'end') => {
      const newPlaylist = [...currentPlaylist];

      if (position === 'next') {
        // Ajouter après la chanson actuelle
        newPlaylist.splice(currentIndex + 1, 0, song);
      } else if (position === 'end') {
        // Ajouter à la fin
        newPlaylist.push(song);
      }

      setCurrentPlaylist(newPlaylist);
    },
    [currentPlaylist, currentIndex]
  );

  const removeFromPlaylist = useCallback(
    songId => {
      const newPlaylist = currentPlaylist.filter(song => song.id !== songId);
      const removedIndex = currentPlaylist.findIndex(
        song => song.id === songId
      );

      if (removedIndex < currentIndex) {
        setCurrentIndex(currentIndex - 1);
      } else if (removedIndex === currentIndex) {
        // Si on supprime la chanson actuelle
        if (newPlaylist.length > 0) {
          const newIndex = Math.min(currentIndex, newPlaylist.length - 1);
          setCurrentIndex(newIndex);
          setCurrentSong(newPlaylist[newIndex]);
        } else {
          setCurrentSong(null);
          setCurrentIndex(0);
        }
      }

      setCurrentPlaylist(newPlaylist);
    },
    [currentPlaylist, currentIndex]
  );

  const playFromPlaylist = useCallback(
    index => {
      if (index >= 0 && index < currentPlaylist.length) {
        setCurrentIndex(index);
        setCurrentSong(currentPlaylist[index]);
        setIsPlaying(true);
        setCurrentTime(0);
      }
    },
    [currentPlaylist]
  );

  // Gestion du volume
  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  const changeVolume = useCallback(newVolume => {
    setVolume(Math.max(0, Math.min(1, newVolume)));
    if (newVolume > 0) {
      setIsMuted(false);
    }
  }, []);

  // Gestion des modes
  const toggleShuffle = useCallback(() => {
    setIsShuffled(!isShuffled);
  }, [isShuffled]);

  const cycleRepeatMode = useCallback(() => {
    const modes = ['none', 'one', 'all'];
    const currentModeIndex = modes.indexOf(repeatMode);
    const nextModeIndex = (currentModeIndex + 1) % modes.length;
    setRepeatMode(modes[nextModeIndex]);
  }, [repeatMode]);

  // Fonctions utilitaires
  const formatTime = useCallback(seconds => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const seekTo = useCallback(time => {
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  // Gestionnaire de fin de chanson
  const handleSongEnd = useCallback(() => {
    if (repeatMode === 'one') {
      setCurrentTime(0);
      setIsPlaying(true);
    } else {
      playNext();
    }
  }, [repeatMode, playNext]);

  // Valeurs du contexte avec useMemo pour optimisation
  const contextValue = useMemo(
    () => ({
      // États
      isPlayerVisible,
      currentSong,
      isPlaying,
      currentTime,
      duration,
      volume,
      isMuted,
      currentPlaylist,
      currentIndex,
      isShuffled,
      repeatMode,
      showLyrics,
      showEqualizer,
      audioRef,

      // Actions principales
      openPlayer,
      closePlayer,
      togglePlay,
      playNext,
      playPrevious,

      // Gestion playlist
      addToPlaylist,
      removeFromPlaylist,
      playFromPlaylist,

      // Contrôles audio
      toggleMute,
      changeVolume,
      seekTo,
      handleSongEnd,

      // Modes
      toggleShuffle,
      cycleRepeatMode,

      // UI
      setShowLyrics,
      setShowEqualizer,

      // États setters (pour contrôles directs)
      setCurrentTime,
      setDuration,
      setIsPlaying,

      // Utilitaires
      formatTime,
    }),
    [
      isPlayerVisible,
      currentSong,
      isPlaying,
      currentTime,
      duration,
      volume,
      isMuted,
      currentPlaylist,
      currentIndex,
      isShuffled,
      repeatMode,
      showLyrics,
      showEqualizer,
      openPlayer,
      closePlayer,
      togglePlay,
      playNext,
      playPrevious,
      addToPlaylist,
      removeFromPlaylist,
      playFromPlaylist,
      toggleMute,
      changeVolume,
      seekTo,
      handleSongEnd,
      toggleShuffle,
      cycleRepeatMode,
      formatTime,
    ]
  );

  return (
    <EnhancedPlayerContext.Provider value={contextValue}>
      {children}
    </EnhancedPlayerContext.Provider>
  );
};

export default EnhancedPlayerContext;
