import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { Settings, LogOut, Calendar, Crown } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { formatDate } from '../../services/billingService';
import SearchSystem from '../Search/SearchSystem';

const TopNavBar = () => {
  const { user, logout } = useContext(AuthContext);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const navigate = useNavigate();
  const { subscription, hasAccess } = useSubscription();

  const navbarStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '80px',
    background:
      'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 40px',
    zIndex: 1000,
    transition: 'all 0.3s ease',
  };

  const logoStyle = {
    fontSize: '32px',
    fontWeight: '800',
    background: 'linear-gradient(45deg, #8B5CF6, #EC4899)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  const rightSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  };

  const avatarContainerStyle = {
    position: 'relative',
  };

  const avatarStyle = {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(45deg, #8B5CF6, #EC4899)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer',
    border: '2px solid rgba(255,255,255,0.2)',
    transition: 'all 0.3s ease',
  };

  const popupStyle = {
    position: 'absolute',
    top: '60px',
    right: 0,
    width: '320px',
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.2)',
    padding: '24px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    opacity: showProfilePopup ? 1 : 0,
    visibility: showProfilePopup ? 'visible' : 'hidden',
    transform: showProfilePopup ? 'translateY(0)' : 'translateY(-10px)',
    transition: 'all 0.3s ease',
  };

  const userInfoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
    paddingBottom: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  };

  const userAvatarStyle = {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'linear-gradient(45deg, #8B5CF6, #EC4899)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '24px',
    fontWeight: '600',
  };

  const userDetailsStyle = {
    flex: 1,
  };

  const userNameStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: 'white',
    marginBottom: '4px',
  };

  const userEmailStyle = {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.7)',
  };

  const subscriptionCardStyle = {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
    border: '1px solid rgba(255,255,255,0.1)',
  };

  const subscriptionHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  };

  const subscriptionTitleStyle = {
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
  };

  const subscriptionInfoStyle = {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.8)',
    lineHeight: '1.5',
  };

  const renewalDateStyle = {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.6)',
    marginTop: '8px',
  };

  const actionButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '8px',
  };

  const statsContainerStyle = {
    display: 'flex',
    gap: '24px',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.6)',
    marginTop: '16px',
  };

  const statItemStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  };

  const statValueStyle = {
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
  };

  // Libellés de la carte abonnement (état réel, fourni par SubscriptionContext)
  const getSubscriptionLabel = () => {
    const end = formatDate(subscription.currentPeriodEnd);
    if (!hasAccess) {
      return {
        title: 'Aucune formule active',
        info:
          subscription.status === 'none'
            ? 'Choisissez une formule pour écouter tout le catalogue.'
            : 'Votre accès a pris fin. Renouvelez pour continuer à écouter.',
        date: null,
      };
    }
    return {
      title: subscription.planName,
      info: 'Accès illimité à tout le catalogue, sans publicité',
      date: subscription.renews
        ? `Renouvellement le ${end}`
        : `Accès jusqu'au ${end}`,
    };
  };

  const getUserStats = () => {
    // Statistiques simulées basées sur l'utilisateur
    return {
      songsPlayed: Math.floor(Math.random() * 500) + 100,
      hoursListened: Math.floor(Math.random() * 50) + 20,
      favoriteGenre: ['Afrobeats', 'Makossa', 'Amapiano', 'Highlife'][
        Math.floor(Math.random() * 4)
      ],
    };
  };

  const stats = getUserStats();
  const subscriptionLabel = getSubscriptionLabel();

  // Navigation principale sur bureau (sur mobile : barre d'onglets BottomNav)
  const desktopLinks = [
    { to: '/', label: 'Accueil', end: true },
    { to: '/recherche', label: 'Recherche' },
    { to: '/bibliotheque', label: 'Bibliothèque' },
  ];

  const desktopLinkStyle = isActive => ({
    fontSize: '15px',
    fontWeight: 600,
    color: isActive ? 'white' : 'rgba(255,255,255,0.65)',
    borderBottom: isActive ? '2px solid #EC4899' : '2px solid transparent',
    paddingBottom: '4px',
    transition: 'color 0.2s ease',
  });

  return (
    <nav style={navbarStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <div
          style={logoStyle}
          onClick={() => navigate('/')}
          onMouseEnter={e => {
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={e => {
            e.target.style.transform = 'scale(1)';
          }}
        >
          Ô musiki
        </div>

        <div className="om-desktop-only" style={{ gap: '24px' }}>
          {desktopLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              style={({ isActive }) => desktopLinkStyle(isActive)}
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Système de recherche intégré */}
      <div className="om-desktop-only">
        <SearchSystem />
      </div>

      <div style={rightSectionStyle}>
        <div style={avatarContainerStyle}>
          <div
            style={avatarStyle}
            onClick={() => setShowProfilePopup(!showProfilePopup)}
            onMouseEnter={e => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 8px 32px rgba(139, 92, 246, 0.4)';
            }}
            onMouseLeave={e => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = 'none';
            }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>

          <div style={popupStyle}>
            <div style={userInfoStyle}>
              <div style={userAvatarStyle}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div style={userDetailsStyle}>
                <div style={userNameStyle}>{user?.name}</div>
                <div style={userEmailStyle}>{user?.email}</div>
              </div>
            </div>

            <div style={subscriptionCardStyle}>
              <div style={subscriptionHeaderStyle}>
                <Crown size={20} color="#EC4899" />
                <span style={subscriptionTitleStyle}>
                  {subscriptionLabel.title}
                </span>
              </div>
              <div style={subscriptionInfoStyle}>{subscriptionLabel.info}</div>
              {subscriptionLabel.date && (
                <div style={renewalDateStyle}>
                  <Calendar
                    size={14}
                    style={{ display: 'inline', marginRight: '6px' }}
                  />
                  {subscriptionLabel.date}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowProfilePopup(false);
                  navigate(hasAccess ? '/abonnement' : '/formules');
                }}
                style={{
                  marginTop: '12px',
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: 'white',
                  background: 'linear-gradient(45deg, #8B5CF6, #EC4899)',
                }}
              >
                {hasAccess ? 'Gérer mon abonnement' : 'Choisir une formule'}
              </button>
            </div>

            {/* Statistiques utilisateur */}
            <div style={statsContainerStyle}>
              <div style={statItemStyle}>
                <div style={statValueStyle}>{stats.songsPlayed}</div>
                <div>Titres écoutés</div>
              </div>
              <div style={statItemStyle}>
                <div style={statValueStyle}>{stats.hoursListened}h</div>
                <div>Temps d&apos;écoute</div>
              </div>
              <div style={statItemStyle}>
                <div style={statValueStyle}>{stats.favoriteGenre}</div>
                <div>Genre favori</div>
              </div>
            </div>

            <button
              style={actionButtonStyle}
              onClick={() => {
                setShowProfilePopup(false);
                navigate('/compte');
              }}
              onMouseEnter={e => {
                e.target.style.background = 'rgba(255,255,255,0.1)';
              }}
              onMouseLeave={e => {
                e.target.style.background = 'rgba(255,255,255,0.05)';
              }}
            >
              <Settings size={16} />
              Paramètres du compte
            </button>

            <button
              style={{ ...actionButtonStyle, marginBottom: 0 }}
              onClick={logout}
              onMouseEnter={e => {
                e.target.style.background = 'rgba(220, 38, 38, 0.2)';
                e.target.style.color = '#ef4444';
              }}
              onMouseLeave={e => {
                e.target.style.background = 'rgba(255,255,255,0.05)';
                e.target.style.color = 'white';
              }}
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Overlay pour fermer le popup */}
      {showProfilePopup && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: -1,
          }}
          onClick={() => setShowProfilePopup(false)}
        />
      )}
    </nav>
  );
};

export default TopNavBar;
