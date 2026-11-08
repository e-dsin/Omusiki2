// hooks/usePlayLogger.js
// Journal d'écoutes (mode api) : une écoute est envoyée au serveur après 30 s de lecture d'un titre.
// Ce journal alimente le compteur d'écoutes des artistes et, au MVP 2, le calcul des royalties.
import { useEffect, useRef } from 'react';
import { usePlayer } from '../contexts/EnhancedPlayerContext';
import { isApiMode } from '../config/env';
import { libraryService } from '../services/libraryService';

export const MIN_PLAY_SECONDS = 30;

export default function usePlayLogger() {
  const { currentSong, isPlaying } = usePlayer();
  const seconds = useRef(0);
  const logged = useRef(false);
  const songId = useRef(null);

  // Nouveau titre : compteur remis à zéro
  useEffect(() => {
    if (currentSong?.id !== songId.current) {
      songId.current = currentSong?.id ?? null;
      seconds.current = 0;
      logged.current = false;
    }
  }, [currentSong]);

  useEffect(() => {
    if (!isApiMode || !isPlaying || !currentSong) return undefined;
    const timer = setInterval(() => {
      seconds.current += 1;
      if (!logged.current && seconds.current >= MIN_PLAY_SECONDS) {
        logged.current = true;
        libraryService.logPlay(currentSong.id, seconds.current).catch(error => {
          // Titre absent du catalogue serveur (ex. titres codés en dur dans HeroSection) : pas de nouvel essai
          if (error.status === 404) return;
          logged.current = false; // serveur indisponible : nouvel essai dans 10 s
          seconds.current = MIN_PLAY_SECONDS - 10;
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, currentSong]);
}
