import React from 'react';
import {
  Music,
  Heart,
  Globe,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Github,
  ExternalLink,
  Download,
  Shield,
  HelpCircle,
} from 'lucide-react';

const FooterSection = () => {
  const containerStyle = {
    background:
      'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 50%, transparent 100%)',
    backdropFilter: 'blur(20px)',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    padding: '60px 40px 40px 40px',
    marginTop: '80px',
  };

  const contentStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
  };

  const mainContentStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '40px',
    marginBottom: '40px',
  };

  const sectionStyle = {
    color: 'white',
  };

  const sectionTitleStyle = {
    fontSize: '18px',
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Montserrat, sans-serif',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const linkStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'rgba(255,255,255,0.7)',
    textDecoration: 'none',
    fontSize: '14px',
    marginBottom: '12px',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  };

  const socialLinksStyle = {
    display: 'flex',
    gap: '16px',
    marginTop: '16px',
  };

  const socialIconStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  };

  const aboutTextStyle = {
    fontSize: '14px',
    lineHeight: '1.6',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: '16px',
  };

  const brandSectionStyle = {
    marginBottom: '20px',
  };

  const logoStyle = {
    fontSize: '32px',
    fontWeight: '800',
    background: 'linear-gradient(45deg, #8B5CF6, #EC4899)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '12px',
    fontFamily: 'Montserrat, sans-serif',
  };

  const bottomSectionStyle = {
    borderTop: '1px solid rgba(255,255,255,0.1)',
    paddingTop: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  };

  const copyrightStyle = {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
  };

  const bottomLinksStyle = {
    display: 'flex',
    gap: '24px',
    fontSize: '12px',
  };

  const statsStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    marginTop: '16px',
  };

  const statItemStyle = {
    background: 'rgba(255,255,255,0.05)',
    padding: '12px',
    borderRadius: '8px',
    textAlign: 'center',
  };

  const statValueStyle = {
    fontSize: '20px',
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Montserrat, sans-serif',
  };

  const statLabelStyle = {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.6)',
    marginTop: '4px',
  };

  const currentYear = new Date().getFullYear();

  const socialPlatforms = [
    { icon: Facebook, name: 'Facebook', color: '#1877F2' },
    { icon: Twitter, name: 'Twitter', color: '#1DA1F2' },
    { icon: Instagram, name: 'Instagram', color: '#E4405F' },
    { icon: Youtube, name: 'YouTube', color: '#FF0000' },
    { icon: Linkedin, name: 'LinkedIn', color: '#0A66C2' },
    { icon: Github, name: 'GitHub', color: '#333' },
  ];

  return (
    <footer style={containerStyle}>
      <div style={contentStyle}>
        <div style={mainContentStyle}>
          {/* Section À Propos */}
          <div style={sectionStyle}>
            <div style={brandSectionStyle}>
              <div style={logoStyle}>Ô musiki</div>
              <p style={aboutTextStyle}>
                La première plateforme dédiée à la musique africaine. Découvrez,
                écoutez et partagez les sons qui font vibrer l&apos;Afrique.
              </p>
            </div>

            <div style={statsStyle}>
              <div style={statItemStyle}>
                <div style={statValueStyle}>50K+</div>
                <div style={statLabelStyle}>Utilisateurs</div>
              </div>
              <div style={statItemStyle}>
                <div style={statValueStyle}>15+</div>
                <div style={statLabelStyle}>Pays</div>
              </div>
            </div>

            <div style={socialLinksStyle}>
              {socialPlatforms.map((platform, index) => {
                const IconComponent = platform.icon;
                return (
                  <div
                    key={index}
                    style={socialIconStyle}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = platform.color;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background =
                        'rgba(255,255,255,0.1)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    title={platform.name}
                  >
                    <IconComponent size={20} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section Navigation */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>
              <Music size={20} />
              Musique
            </h3>
            <div
              style={linkStyle}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#8B5CF6';
                e.currentTarget.style.paddingLeft = '8px';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                e.currentTarget.style.paddingLeft = '0';
              }}
            >
              <span>Genres musicaux</span>
            </div>
            <div
              style={linkStyle}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#8B5CF6';
                e.currentTarget.style.paddingLeft = '8px';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                e.currentTarget.style.paddingLeft = '0';
              }}
            >
              <span>Artistes africains</span>
            </div>
            <div
              style={linkStyle}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#8B5CF6';
                e.currentTarget.style.paddingLeft = '8px';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                e.currentTarget.style.paddingLeft = '0';
              }}
            >
              <span>Nouvelles sorties</span>
            </div>
            <div
              style={linkStyle}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#8B5CF6';
                e.currentTarget.style.paddingLeft = '8px';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                e.currentTarget.style.paddingLeft = '0';
              }}
            >
              <span>Playlists curées</span>
            </div>
            <div
              style={linkStyle}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#8B5CF6';
                e.currentTarget.style.paddingLeft = '8px';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                e.currentTarget.style.paddingLeft = '0';
              }}
            >
              <Download size={16} />
              <span>Mode offline</span>
            </div>
          </div>

          {/* Section Support */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>
              <HelpCircle size={20} />
              Support
            </h3>
            <div
              style={linkStyle}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#EC4899';
                e.currentTarget.style.paddingLeft = '8px';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                e.currentTarget.style.paddingLeft = '0';
              }}
            >
              <HelpCircle size={16} />
              <span>Centre d&apos;aide</span>
            </div>
            <div
              style={linkStyle}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#EC4899';
                e.currentTarget.style.paddingLeft = '8px';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                e.currentTarget.style.paddingLeft = '0';
              }}
            >
              <Mail size={16} />
              <span>support@omusiki.com</span>
            </div>
            <div
              style={linkStyle}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#EC4899';
                e.currentTarget.style.paddingLeft = '8px';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                e.currentTarget.style.paddingLeft = '0';
              }}
            >
              <Phone size={16} />
              <span>+33 1 23 45 67 89</span>
            </div>
            <div
              style={linkStyle}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#EC4899';
                e.currentTarget.style.paddingLeft = '8px';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                e.currentTarget.style.paddingLeft = '0';
              }}
            >
              <Shield size={16} />
              <span>Signaler un contenu</span>
            </div>
          </div>

          {/* Section Légal */}
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>
              <Globe size={20} />À Propos
            </h3>
            <div
              style={linkStyle}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#10B981';
                e.currentTarget.style.paddingLeft = '8px';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                e.currentTarget.style.paddingLeft = '0';
              }}
            >
              <Heart size={16} />
              <span>Notre mission</span>
            </div>
            <div
              style={linkStyle}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#10B981';
                e.currentTarget.style.paddingLeft = '8px';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                e.currentTarget.style.paddingLeft = '0';
              }}
            >
              <MapPin size={16} />
              <span>Paris, France</span>
            </div>
            <div
              style={linkStyle}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#10B981';
                e.currentTarget.style.paddingLeft = '8px';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                e.currentTarget.style.paddingLeft = '0';
              }}
            >
              <ExternalLink size={16} />
              <span>Partenaires</span>
            </div>
            <div
              style={linkStyle}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#10B981';
                e.currentTarget.style.paddingLeft = '8px';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                e.currentTarget.style.paddingLeft = '0';
              }}
            >
              <span>Carrières</span>
            </div>

            <div
              style={{
                marginTop: '20px',
                padding: '12px',
                background: 'rgba(139, 92, 246, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  color: '#8B5CF6',
                  fontWeight: '600',
                  marginBottom: '4px',
                }}
              >
                💡 Open Source
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: '1.4',
                }}
              >
                OMusiki utilise des musiques libres sous licence Creative
                Commons
              </div>
            </div>
          </div>
        </div>

        {/* Section Bottom */}
        <div style={bottomSectionStyle}>
          <div style={copyrightStyle}>
            © {currentYear} Ô musiki. Tous droits réservés.
            <span style={{ marginLeft: '8px' }}>
              Fait avec{' '}
              <Heart
                size={12}
                style={{ display: 'inline', color: '#EC4899' }}
              />{' '}
              pour la musique africaine
            </span>
          </div>

          <div style={bottomLinksStyle}>
            <span
              style={linkStyle}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
              }}
            >
              Conditions d&apos;utilisation
            </span>
            <span
              style={linkStyle}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
              }}
            >
              Politique de confidentialité
            </span>
            <span
              style={linkStyle}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
              }}
            >
              Cookies
            </span>
            <span
              style={linkStyle}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
              }}
            >
              Licences
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
