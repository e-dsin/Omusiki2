import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Library, User } from 'lucide-react';

// Barre d'onglets mobile (< 768 px), conforme à la maquette Figma (accueil, recherche, bibliothèque, compte).
// L'affichage conditionnel est porté par la classe om-mobile-only (src/index.css).
const ITEMS = [
  { to: '/', label: 'Accueil', icon: Home, end: true },
  { to: '/recherche', label: 'Recherche', icon: Search },
  { to: '/bibliotheque', label: 'Bibliothèque', icon: Library },
  { to: '/compte', label: 'Compte', icon: User },
];

const navStyle = {
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  height: 'var(--om-bottom-nav-h)',
  paddingBottom: 'env(safe-area-inset-bottom)',
  boxSizing: 'content-box',
  background: 'rgba(10,10,10,0.95)',
  backdropFilter: 'blur(20px)',
  borderTop: '1px solid rgba(255,255,255,0.1)',
  justifyContent: 'space-around',
  alignItems: 'center',
  zIndex: 1500,
};

const itemStyle = isActive => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px',
  padding: '8px 0',
  fontSize: '11px',
  fontWeight: 600,
  fontFamily: 'Montserrat, sans-serif',
  color: isActive ? '#EC4899' : 'rgba(255,255,255,0.65)',
});

const BottomNav = () => (
  <nav
    className="om-mobile-only"
    style={navStyle}
    aria-label="Navigation principale"
  >
    {ITEMS.map(({ to, label, icon: Icon, end }) => (
      <NavLink
        key={to}
        to={to}
        end={end}
        style={({ isActive }) => itemStyle(isActive)}
      >
        <Icon size={22} aria-hidden="true" />
        <span>{label}</span>
      </NavLink>
    ))}
  </nav>
);

export default BottomNav;
