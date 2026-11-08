// components/Search/SearchSystem.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, Music, User, Disc, MapPin, Clock, Play } from 'lucide-react';
import { MusicSearchService } from '../../services/musicDatabase';
import { usePlayer } from '../../contexts/EnhancedPlayerContext';

const SearchSystem = ({ isExpanded = false, _onToggle }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const { openPlayer } = usePlayer();
  const searchRef = useRef(null);
  const resultsRef = useRef(null);

  // Recherche en temps réel avec debounce
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (query.trim().length >= 2) {
        setIsLoading(true);
        const searchResults = MusicSearchService.searchGlobal(query);
        setResults(searchResults.slice(0, 8)); // Limiter à 8 résultats
        setIsOpen(true);
        setIsLoading(false);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [query]);

  // Gestion du clavier
  const handleKeyDown = e => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSongPlay(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Fermer les résultats en cliquant ailleurs
  useEffect(() => {
    const handleClickOutside = event => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSongPlay = song => {
    openPlayer(song, results);
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  const formatDuration = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const highlightText = (text, search) => {
    if (!search.trim()) return text;

    const regex = new RegExp(
      `(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
      'gi'
    );
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span
          key={index}
          style={{
            background: 'linear-gradient(45deg, #8B5CF6, #EC4899)',
            color: 'white',
            padding: '2px 4px',
            borderRadius: '3px',
            fontWeight: '600',
          }}
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const searchContainerStyle = {
    position: 'relative',
    width: isExpanded ? '500px' : '400px',
    transition: 'width 0.3s ease',
  };

  const searchInputStyle = {
    width: '100%',
    padding: '12px 16px 12px 48px',
    background: 'rgba(255,255,255,0.1)',
    border: `2px solid ${
      isOpen ? 'rgba(139, 92, 246, 0.5)' : 'rgba(255,255,255,0.2)'
    }`,
    borderRadius: '24px',
    color: 'white',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    fontFamily: 'Montserrat, sans-serif',
  };

  const searchIconStyle = {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'rgba(255,255,255,0.6)',
  };

  const resultsContainerStyle = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '8px',
    background: 'rgba(0, 0, 0, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
    maxHeight: '400px',
    overflowY: 'auto',
    zIndex: 1000,
    opacity: isOpen ? 1 : 0,
    visibility: isOpen ? 'visible' : 'hidden',
    transform: isOpen ? 'translateY(0)' : 'translateY(-10px)',
    transition: 'all 0.3s ease',
  };

  const resultItemStyle = index => ({
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 16px',
    cursor: 'pointer',
    borderBottom:
      index < results.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
    background:
      selectedIndex === index ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
    transition: 'all 0.2s ease',
  });

  const resultImageStyle = {
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    objectFit: 'cover',
    border: '1px solid rgba(255,255,255,0.1)',
  };

  const resultInfoStyle = {
    flex: 1,
    minWidth: 0,
  };

  const resultTitleStyle = {
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    marginBottom: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const resultMetaStyle = {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.7)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const resultActionsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const playButtonStyle = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'linear-gradient(45deg, #8B5CF6, #EC4899)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    opacity:
      selectedIndex ===
      results.indexOf(results.find((_, i) => i === selectedIndex))
        ? 1
        : 0.7,
    transition: 'all 0.2s ease',
  };

  const noResultsStyle = {
    padding: '24px',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '14px',
  };

  const loadingStyle = {
    padding: '16px',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  };

  return (
    <div ref={searchRef} style={searchContainerStyle}>
      <div style={searchIconStyle}>
        <Search size={20} />
      </div>

      <input
        type="text"
        placeholder="Rechercher des artistes, titres, albums..."
        style={searchInputStyle}
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (results.length > 0) setIsOpen(true);
        }}
      />

      <div ref={resultsRef} style={resultsContainerStyle}>
        {isLoading ? (
          <div style={loadingStyle}>
            <div
              style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(139, 92, 246, 0.3)',
                borderTop: '2px solid #8B5CF6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            ></div>
            Recherche en cours...
          </div>
        ) : results.length > 0 ? (
          <>
            <div
              style={{
                padding: '12px 16px 8px 16px',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.5)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              {results.length} résultat{results.length > 1 ? 's' : ''} trouvé
              {results.length > 1 ? 's' : ''}
            </div>

            {results.map((song, index) => (
              <div
                key={song.id}
                style={resultItemStyle(index)}
                onClick={() => handleSongPlay(song)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <img
                  src={song.cover}
                  alt={song.title}
                  style={resultImageStyle}
                />

                <div style={resultInfoStyle}>
                  <div style={resultTitleStyle}>
                    {highlightText(song.title, query)}
                  </div>
                  <div style={resultMetaStyle}>
                    <User size={12} />
                    <span>{highlightText(song.artist, query)}</span>
                    <span>•</span>
                    <Disc size={12} />
                    <span>{song.genre}</span>
                    <span>•</span>
                    <MapPin size={12} />
                    <span>{song.country}</span>
                    <span>•</span>
                    <Clock size={12} />
                    <span>{formatDuration(song.duration)}</span>
                  </div>
                </div>

                <div style={resultActionsStyle}>
                  <button
                    style={playButtonStyle}
                    onMouseEnter={e => {
                      e.target.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={e => {
                      e.target.style.transform = 'scale(1)';
                    }}
                  >
                    <Play size={16} fill="white" />
                  </button>
                </div>
              </div>
            ))}
          </>
        ) : query.length >= 2 ? (
          <div style={noResultsStyle}>
            <Music size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
            <div>
              Aucun résultat pour &laquo;&nbsp;<strong>{query}</strong>&nbsp;&raquo;
            </div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              Essayez avec des mots-clés différents
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SearchSystem;
