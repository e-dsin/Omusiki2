// components/Auth/authStyles.js
// Styles communs aux formulaires d'authentification (valeurs reprises à l'identique
// des formulaires d'origine, qui les dupliquaient chacun).

const FONT = 'Montserrat, sans-serif';

export const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  marginBottom: '16px',
  background: 'rgba(255, 255, 255, 0.2)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  color: 'white',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  borderRadius: '8px',
  outline: 'none',
  fontFamily: FONT,
  fontSize: '16px', // 16 px : évite le zoom automatique sur iOS
  transition: 'all 0.3s ease',
  boxSizing: 'border-box',
};

const baseButton = {
  width: '100%',
  padding: '12px',
  color: 'white',
  borderRadius: '8px',
  fontWeight: '600',
  fontFamily: FONT,
  border: 'none',
  cursor: 'pointer',
  fontSize: '16px',
  transition: 'all 0.3s ease',
  marginTop: '16px',
};

const GRADIENTS = {
  primary: [
    'linear-gradient(to right, #8B5CF6, #EC4899)',
    'linear-gradient(to right, #7C3AED, #DB2777)',
    'rgba(139, 92, 246, 0.5)',
  ],
  success: [
    'linear-gradient(to right, #10B981, #059669)',
    'linear-gradient(to right, #059669, #047857)',
    'rgba(16, 185, 129, 0.5)',
  ],
};

export const actionButtonStyle = (variant = 'primary', disabled = false) => ({
  ...baseButton,
  background: GRADIENTS[variant][0],
  opacity: disabled ? 0.6 : 1,
  cursor: disabled ? 'wait' : 'pointer',
});

// Effet de survol des boutons principaux (désactivé pendant un envoi)
export const actionButtonHover = (variant = 'primary', disabled = false) => ({
  onMouseEnter: e => {
    if (disabled) return;
    const [, hover, shadow] = GRADIENTS[variant];
    e.currentTarget.style.background = hover;
    e.currentTarget.style.transform = 'translateY(-1px)';
    e.currentTarget.style.boxShadow = `0 10px 20px -5px ${shadow}`;
  },
  onMouseLeave: e => {
    e.currentTarget.style.background = GRADIENTS[variant][0];
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = 'none';
  },
});

export const separatorContainerStyle = {
  margin: '24px 0',
  position: 'relative',
  textAlign: 'center',
};

export const separatorLineStyle = {
  position: 'absolute',
  top: '50%',
  left: 0,
  right: 0,
  height: '1px',
  background: 'rgba(255, 255, 255, 0.3)',
};

export const separatorTextStyle = {
  background: 'rgba(255, 255, 255, 0.1)',
  color: 'rgba(255, 255, 255, 0.6)',
  padding: '0 8px',
  fontSize: '14px',
  position: 'relative',
  zIndex: 1,
};

export const socialButtonsContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
  marginTop: '24px',
};

const socialBase = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  padding: '12px 16px',
  color: 'white',
  borderRadius: '8px',
  fontWeight: '500',
  fontFamily: FONT,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  maxWidth: '280px',
  width: '100%',
  fontSize: '14px',
};

export const googleButtonStyle = {
  ...socialBase,
  background: 'rgba(255, 255, 255, 0.2)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
};

export const appleButtonStyle = {
  ...socialBase,
  background: 'rgba(0, 0, 0, 0.8)',
  border: 'none',
};

export const footerTextStyle = {
  textAlign: 'center',
  marginTop: '24px',
  color: 'rgba(255, 255, 255, 0.6)',
  fontSize: '14px',
  lineHeight: '1.5',
};

export const linkButtonStyle = {
  color: 'white',
  marginLeft: '8px',
  textDecoration: 'underline',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontFamily: FONT,
  fontSize: '14px',
  padding: 0,
};

export const linkButtonHover = {
  onMouseEnter: e => {
    e.currentTarget.style.textDecoration = 'none';
  },
  onMouseLeave: e => {
    e.currentTarget.style.textDecoration = 'underline';
  },
};

export const descriptionStyle = {
  color: 'rgba(255, 255, 255, 0.8)',
  fontSize: '14px',
  lineHeight: '1.5',
  marginBottom: '24px',
  textAlign: 'center',
};

export const hintStyle = {
  color: 'rgba(255, 255, 255, 0.6)',
  fontSize: '12px',
  lineHeight: '1.4',
  margin: '-8px 0 16px 2px',
};

export const checkboxLabelStyle = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  color: 'rgba(255, 255, 255, 0.85)',
  fontSize: '13px',
  lineHeight: '1.5',
  cursor: 'pointer',
  margin: '4px 0 4px 0',
};

export const inlineLinkStyle = {
  color: 'white',
  textDecoration: 'underline',
};
