// src/components/Player/OMusikiPlayer.jsx
import React, { useRef, useEffect, Suspense, lazy } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Share2,
  X,
  Mic2,
  Sliders,
  Plus,
  MoveUp,
  Shuffle,
  Repeat,
  Maximize2,
  Minimize2,
  Clock,
  Music,
  Users,
  Heart,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { usePlayer } from '../../contexts/EnhancedPlayerContext';
// Chargé à la demande : le lecteur Mux représente l'essentiel du poids du bundle
const MuxPlayer = lazy(() => import('@mux/mux-player-react'));


const OMUsikiPlayer = ({ isVisible, onClose }) => {
  // Utiliser le contexte au lieu d'états locaux
  const {
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
    togglePlay,
    playNext,
    playPrevious,
    toggleMute,
    changeVolume,
    seekTo,
    toggleShuffle,
    cycleRepeatMode,
    setShowLyrics,
    setShowEqualizer,
    playFromPlaylist,
    addToPlaylist,
    setCurrentTime,
    setDuration,
    formatTime,
  } = usePlayer();

  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [showQueue, setShowQueue] = React.useState(true);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const audioRef = useRef(null);
  const muxRef = useRef(null);

  const handleSongEnd = () => {
    playNext(); // or more logic later, e.g. if (repeatMode === 'one') { ... }
  };

  // Données exemple pour les suggestions améliorées
  const suggestions = [
    {
      id: 'suggest_1',
      title: 'Lagos Vibes',
      artist: 'Burna Boy',
      cover:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=60&h=60&fit=crop',
      duration: '3:24',
      genre: 'afrobeats',
      streams: 2500000,
    },
    {
      id: 'suggest_2',
      title: 'Makossa Flow',
      artist: 'Manu Dibango',
      cover:
        'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=60&h=60&fit=crop',
      duration: '4:12',
      genre: 'makossa',
      streams: 1200000,
    },
    {
      id: 'suggest_3',
      title: 'Amapiano Dreams',
      artist: 'Kabza De Small',
      cover:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=60&h=60&fit=crop',
      duration: '3:45',
      genre: 'amapiano',
      streams: 3100000,
    },
    {
      id: 'suggest_4',
      title: 'Highlife Classic',
      artist: 'E.T. Mensah',
      cover:
        'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=60&h=60&fit=crop',
      duration: '4:01',
      genre: 'highlife',
      streams: 890000,
    },
  ];


  // Gestion du volume via ref
  useEffect(() => {
    if (audioRef.current) {
     
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Simulation du player audio
  useEffect(() => {
    if (currentSong && audioRef.current) {
      audioRef.current.src = currentSong.audioUrl || '';
      setDuration(currentSong.duration || 240);
    }
  }, [currentSong, setDuration]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Simulation du temps de lecture
  useEffect(() => {
    if (isPlaying && duration > 0) {
      const interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          if (newTime >= duration) {
            playNext();
            return 0;
          }
          return newTime;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, duration, playNext, setCurrentTime]);

  const handleVolumeChange = e => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    changeVolume(Math.max(0, Math.min(1, percentage)));
  };

  const handleSeek = e => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    seekTo(newTime);
  };

  const handleShare = () => {
    if (currentSong) {
      navigator.clipboard.writeText(
        `Écoute "${currentSong.title}" par ${currentSong.artist} sur Ô musiki !`
      );
    }
  };

  const formatStreams = streams => {
    if (streams >= 1000000) {
      return `${(streams / 1000000).toFixed(1)}M`;
    } else if (streams >= 1000) {
      return `${Math.floor(streams / 1000)}K`;
    }
    return streams?.toString() || '0';
  };

  if (!isVisible) return null;

  // Mode réduit - Barre compacte en bas
  if (isMinimized) {
    const minimizedStyle = {
      position: 'fixed',
      bottom: 'var(--om-bottom-nav-h, 0px)', // au-dessus de la barre d'onglets mobile
      left: 0,
      right: 0,
      height: '80px',
      background: 'rgba(0,0,0,0.9)',
      backdropFilter: 'blur(20px)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      color: 'white',
      fontFamily: 'Montserrat, sans-serif',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
    };

    const songInfoMinimizedStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      minWidth: '200px',
      maxWidth: '300px',
    };

    const miniCoverStyle = {
      width: '50px',
      height: '50px',
      borderRadius: '8px',
      objectFit: 'cover',
    };

    const miniTextStyle = {
      overflow: 'hidden',
    };

    const miniTitleStyle = {
      fontSize: '14px',
      fontWeight: '600',
      color: 'white',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      marginBottom: '2px',
    };

    const miniArtistStyle = {
      fontSize: '12px',
      color: 'rgba(255,255,255,0.7)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    };

    const progressMinimizedStyle = {
      flex: 1,
      margin: '0 20px',
    };

    const progressBarMinimizedStyle = {
      width: '100%',
      height: '4px',
      background: 'rgba(255,255,255,0.2)',
      borderRadius: '2px',
      cursor: 'pointer',
      marginBottom: '8px',
    };

    const progressFillMinimizedStyle = {
      height: '100%',
      background: 'linear-gradient(45deg, #8B5CF6, #EC4899)',
      borderRadius: '2px',
      width: `${(currentTime / duration) * 100 || 0}%`,
      transition: 'width 0.1s ease',
    };

    const timeMinimizedStyle = {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '11px',
      color: 'rgba(255,255,255,0.6)',
    };

    const controlsMinimizedStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    };

    const controlButtonMinimizedStyle = {
      background: 'rgba(255,255,255,0.1)',
      border: 'none',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    };

    const playButtonMinimizedStyle = {
      background: 'linear-gradient(45deg, #8B5CF6, #EC4899)',
      width: '45px',
      height: '45px',
    };

    const volumeContainerMinimizedStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginRight: '12px',
    };

    const volumeSliderMinimizedStyle = {
      width: '80px',
      height: '4px',
      background: 'rgba(255,255,255,0.2)',
      borderRadius: '2px',
      cursor: 'pointer',
    };

    const actionsMinimizedStyle = {
      display: 'flex',
      gap: '8px',
    };

    return (
      <div style={minimizedStyle}>
        {/* Info chanson */}
        <div style={songInfoMinimizedStyle}>
          <img
            src={
              currentSong?.cover ||
              'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=50&h=50&fit=crop'
            }
            alt="Cover"
            style={miniCoverStyle}
          />
          <div style={miniTextStyle}>
            <div style={miniTitleStyle}>
              {currentSong?.title || 'Afrobeats Sensation'}
            </div>
            <div style={miniArtistStyle}>
              {currentSong?.artist || 'Burna Boy'}
            </div>
          </div>
        </div>

        {/* Barre de progression */}
        <div style={progressMinimizedStyle}>
          <div style={progressBarMinimizedStyle} onClick={handleSeek}>
            <div style={progressFillMinimizedStyle}></div>
          </div>
          <div style={timeMinimizedStyle}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration || 240)}</span>
          </div>
        </div>

        {/* Contrôles */}
        <div style={controlsMinimizedStyle}>
          <button style={controlButtonMinimizedStyle} onClick={playPrevious}>
            <SkipBack size={18} />
          </button>

          <button
            style={{
              ...controlButtonMinimizedStyle,
              ...playButtonMinimizedStyle,
            }}
            onClick={togglePlay}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <button style={controlButtonMinimizedStyle} onClick={playNext}>
            <SkipForward size={18} />
          </button>
        </div>

        {/* Volume */}
        <div style={volumeContainerMinimizedStyle}>
          <button style={controlButtonMinimizedStyle} onClick={toggleMute}>
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <div style={volumeSliderMinimizedStyle} onClick={handleVolumeChange}>
            <div
              style={{
                ...progressFillMinimizedStyle,
                width: `${volume * 100}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Actions */}
        <div style={actionsMinimizedStyle}>
          <button
            style={controlButtonMinimizedStyle}
            onClick={() => setIsMinimized(false)}
            title="Agrandir"
          >
            <ChevronUp size={18} />
          </button>
          <button
            style={controlButtonMinimizedStyle}
            onClick={onClose}
            title="Fermer"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  // Styles pour le mode normal (plein écran)
  const containerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(20px)',
    zIndex: 2000,
    display: 'flex',
    flexDirection: 'column',
    color: 'white',
    fontFamily: 'Montserrat, sans-serif',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 40px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(0,0,0,0.3)',
  };

  const logoStyle = {
    fontSize: '24px',
    fontWeight: '800',
    background: 'linear-gradient(45deg, #8B5CF6, #EC4899)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  const headerControlsStyle = {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  };

  const headerButtonStyle = {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '8px',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  const mainContentStyle = {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: isFullscreen
      ? '1fr'
      : showQueue
      ? '2fr 1fr 1fr'
      : '3fr 1fr',
    gap: '30px',
    padding: '40px',
    overflow: 'hidden',
  };

  const playerZoneStyle = {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(15px)',
    borderRadius: '20px',
    padding: '40px',
    border: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
  };

  const albumCoverStyle = {
    width: isFullscreen ? '400px' : '300px',
    height: isFullscreen ? '400px' : '300px',
    borderRadius: '20px',
    objectFit: 'cover',
    marginBottom: '30px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    transition: 'all 0.3s ease',
  };

  const songInfoStyle = {
    textAlign: 'center',
    marginBottom: '30px',
    maxWidth: '100%',
  };

  const songTitleStyle = {
    fontSize: isFullscreen ? '36px' : '28px',
    fontWeight: '700',
    marginBottom: '8px',
    background: 'linear-gradient(45deg, #ffffff, #e0e7ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  const artistNameStyle = {
    fontSize: '18px',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: '16px',
  };

  const songMetaStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: '20px',
  };

  const progressContainerStyle = {
    width: '100%',
    marginBottom: '30px',
  };

  const progressBarStyle = {
    width: '100%',
    height: '6px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '3px',
    marginBottom: '10px',
    cursor: 'pointer',
    position: 'relative',
  };

  const progressFillStyle = {
    height: '100%',
    background: 'linear-gradient(45deg, #8B5CF6, #EC4899)',
    borderRadius: '3px',
    width: `${(currentTime / duration) * 100 || 0}%`,
    transition: 'width 0.1s ease',
  };

  const timeInfoStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.7)',
  };

  const controlsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '30px',
  };

  const controlButtonStyle = {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  const playButtonStyle = {
    background: 'linear-gradient(45deg, #8B5CF6, #EC4899)',
    width: '70px',
    height: '70px',
  };

  const secondaryControlsStyle = {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  };

  const volumeContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const volumeSliderStyle = {
    width: '100px',
    height: '4px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '2px',
    cursor: 'pointer',
  };

  const sideZoneStyle = {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(15px)',
    borderRadius: '20px',
    padding: '30px',
    border: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '100%',
    overflow: 'hidden',
  };

  const zoneTitleStyle = {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const suggestionItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '12px',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '8px',
    position: 'relative',
  };

  const trackCoverStyle = {
    width: '50px',
    height: '50px',
    borderRadius: '8px',
    objectFit: 'cover',
  };

  const trackInfoStyle = {
    flex: 1,
    minWidth: 0,
  };

  const trackTitleStyle = {
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const trackArtistStyle = {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.7)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const actionButtonsStyle = {
    display: 'flex',
    gap: '8px',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  };

  const smallActionButtonStyle = {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    borderRadius: '6px',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  const source = currentSong?.mux?.playbackId
    ? { playbackId: currentSong.mux.playbackId }
    : { src: currentSong?.audioUrl || '' };

  // Favorite Button Simple
  const FavoriteButtonSimple = ({ size = 20 }) => {
    const [isLiked, setIsLiked] = React.useState(false);

    const buttonStyle = {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: isLiked ? '#EC4899' : 'rgba(255,255,255,0.7)',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4px',
      borderRadius: '50%',
    };

    const handleClick = e => {
      e.stopPropagation();
      setIsLiked(!isLiked);
    };

    return (
      <button
        style={buttonStyle}
        onClick={handleClick}
        title={isLiked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        onMouseEnter={e => {
          e.target.style.color = '#EC4899';
          e.target.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={e => {
          e.target.style.color = isLiked ? '#EC4899' : 'rgba(255,255,255,0.7)';
          e.target.style.transform = 'scale(1)';
        }}
      >
        <Heart size={size} fill={isLiked ? 'currentColor' : 'none'} />
      </button>
    );
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={logoStyle}>Ô musiki Player</div>

        <div style={headerControlsStyle}>
          <button
            style={headerButtonStyle}
            onClick={() => setIsMinimized(true)}
            title="Réduire"
          >
            <ChevronDown size={20} />
          </button>

          <button
            style={{
              ...headerButtonStyle,
              color: isShuffled ? '#8B5CF6' : 'white',
            }}
            onClick={toggleShuffle}
            title="Lecture aléatoire"
          >
            <Shuffle size={20} />
          </button>

          <button
            style={{
              ...headerButtonStyle,
              color: repeatMode !== 'none' ? '#EC4899' : 'white',
            }}
            onClick={cycleRepeatMode}
            title={`Répétition: ${repeatMode}`}
          >
            <Repeat size={20} />
          </button>

          <button
            style={headerButtonStyle}
            onClick={() => setShowQueue(!showQueue)}
            title="Afficher/Masquer la file d'attente"
          >
            <Music size={20} />
          </button>

          <button
            style={headerButtonStyle}
            onClick={() => setIsFullscreen(!isFullscreen)}
            title="Mode plein écran"
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>

          <button style={headerButtonStyle} onClick={onClose} title="Fermer">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div style={mainContentStyle}>
        {/* Zone 1: Lecteur principal */}
        <div style={playerZoneStyle}>
          <img
            src={
              currentSong?.cover ||
              'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
            }
            alt="Album cover"
            style={albumCoverStyle}
          />

          <div style={songInfoStyle}>
            <h2 style={songTitleStyle}>
              {currentSong?.title || 'Afrobeats Sensation'}
            </h2>
            <p style={artistNameStyle}>{currentSong?.artist || 'Burna Boy'}</p>

            <div style={songMetaStyle}>
              <span>🎵 {currentSong?.genre || 'Afrobeats'}</span>
              <span>🌍 {currentSong?.country || 'Nigeria'}</span>
              <span>🔥 {formatStreams(currentSong?.streams)} écoutes</span>
            </div>
          </div>

          {/* Barre de progression */}
          <div style={progressContainerStyle}>
            <div style={progressBarStyle} onClick={handleSeek}>
              <div style={progressFillStyle}></div>
            </div>
            <div style={timeInfoStyle}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration || 240)}</span>
            </div>
          </div>

          {/* Contrôles principaux */}
          <div style={controlsStyle}>
            <button style={controlButtonStyle} onClick={playPrevious}>
              <SkipBack size={20} />
            </button>

            <button
              style={{ ...controlButtonStyle, ...playButtonStyle }}
              onClick={togglePlay}
            >
              {isPlaying ? <Pause size={28} /> : <Play size={28} />}
            </button>

            <button style={controlButtonStyle} onClick={playNext}>
              <SkipForward size={20} />
            </button>
          </div>

          {/* Contrôles secondaires */}
          <div style={secondaryControlsStyle}>
            <FavoriteButtonSimple size={18} />

            <button style={controlButtonStyle} onClick={handleShare}>
              <Share2 size={18} />
            </button>

            <button
              style={controlButtonStyle}
              onClick={() => setShowLyrics(!showLyrics)}
            >
              <Mic2 size={18} />
            </button>

            <button
              style={controlButtonStyle}
              onClick={() => setShowEqualizer(!showEqualizer)}
            >
              <Sliders size={18} />
            </button>

            <div style={volumeContainerStyle}>
              <button style={controlButtonStyle} onClick={toggleMute}>
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <div style={volumeSliderStyle} onClick={handleVolumeChange}>
                <div
                  style={{
                    ...progressFillStyle,
                    width: `${volume * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Zone 2: Playlist en cours */}
        {showQueue && (
          <div style={sideZoneStyle}>
            <h3 style={zoneTitleStyle}>
              <Users size={20} />
              File d&apos;attente ({currentPlaylist.length})
            </h3>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {currentPlaylist.length > 0 ? (
                currentPlaylist.map((track, index) => (
                  <div
                    key={track.id}
                    style={{
                      ...suggestionItemStyle,
                      background:
                        index === currentIndex
                          ? 'rgba(139, 92, 246, 0.2)'
                          : 'transparent',
                      border:
                        index === currentIndex
                          ? '1px solid rgba(139, 92, 246, 0.5)'
                          : 'none',
                    }}
                    onClick={() => playFromPlaylist(index)}
                    onMouseEnter={e => {
                      e.currentTarget.style.background =
                        'rgba(255,255,255,0.1)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background =
                        index === currentIndex
                          ? 'rgba(139, 92, 246, 0.2)'
                          : 'transparent';
                    }}
                  >
                    <img src={track.cover} alt="" style={trackCoverStyle} />
                    <div style={trackInfoStyle}>
                      <div style={trackTitleStyle}>{track.title}</div>
                      <div style={trackArtistStyle}>{track.artist}</div>
                    </div>
                    {index === currentIndex && (
                      <Clock size={16} color="#8B5CF6" />
                    )}
                  </div>
                ))
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    color: 'rgba(255,255,255,0.5)',
                    padding: '20px',
                  }}
                >
                  Aucune chanson dans la playlist
                </div>
              )}
            </div>
          </div>
        )}

        {/* Zone 3: Suggestions */}
        <div style={sideZoneStyle}>
          <h3 style={zoneTitleStyle}>🔥 Suggestions</h3>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {suggestions.map(suggestion => (
              <div
                key={suggestion.id}
                style={suggestionItemStyle}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.querySelector(
                    '.action-buttons'
                  ).style.opacity = '1';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.querySelector(
                    '.action-buttons'
                  ).style.opacity = '0';
                }}
              >
                <img src={suggestion.cover} alt="" style={trackCoverStyle} />
                <div style={trackInfoStyle}>
                  <div style={trackTitleStyle}>{suggestion.title}</div>
                  <div style={trackArtistStyle}>
                    {suggestion.artist} • {formatStreams(suggestion.streams)}{' '}
                    écoutes
                  </div>
                </div>

                <div className="action-buttons" style={actionButtonsStyle}>
                  <button
                    style={smallActionButtonStyle}
                    title="Lecture directe"
                    onClick={() => playFromPlaylist(0)}
                  >
                    <Play size={14} />
                  </button>
                  <button
                    style={smallActionButtonStyle}
                    title="Lire après"
                    onClick={() => addToPlaylist(suggestion, 'next')}
                  >
                    <MoveUp size={14} />
                  </button>
                  <button
                    style={smallActionButtonStyle}
                    title="Ajouter à la playlist"
                    onClick={() => addToPlaylist(suggestion, 'end')}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audio element caché */}
      <audio
        ref={audioRef}
        style={{ display: 'none' }}
        onTimeUpdate={e => setCurrentTime(e.target.currentTime)}
        onLoadedMetadata={e => setDuration(e.target.duration)}
        onEnded={handleSongEnd}
      />

      {currentSong?.mux?.playbackId && (
        <div style={{ display: 'none' }}>
          <Suspense fallback={null}>
          <MuxPlayer
            {...source}
            ref={muxRef}
            streamType="on-demand" // ou "live"
            playbackId={currentSong.mux.playbackId}
            metadata={{
              video_id: currentSong.id,
              video_title: `${currentSong.title} - ${currentSong.artist}`,
              viewer_user_id: 'user-anonymous', // ou récup via auth si tu as
            }}
            volume={isMuted ? 0 : volume}
            muted={isMuted}
            // Important pour ton usage audio-only
            preferPlayback="mse" // ou "native" selon besoins
            nohotkeys // évite conflits clavier
            hidden // masque complètement le player vidéo
            style={{ display: 'none', height: 0 }}
            onTimeUpdate={e => {
              setCurrentTime(e.target.currentTime);
            }}
            onLoadedMetadata={e => {
              setDuration(e.target.duration);
            }}
            onEnded={() => handleSongEnd()}
            playing={isPlaying}
            // Tu peux aussi écouter play/pause/error etc.
          />
          </Suspense>
        </div>
      )}
    </div>
  );
};

export default OMUsikiPlayer;
