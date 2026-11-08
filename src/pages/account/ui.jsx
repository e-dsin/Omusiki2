// pages/account/ui.jsx
// Petits composants partagés par les pages Formules, Paiement, Abonnement et Compte
// (même langage visuel que le reste de l'application : fond sombre, dégradé violet → rose).
import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';

export const GRADIENT = 'linear-gradient(45deg, #8B5CF6, #EC4899)';

export const Page = ({ title, subtitle, children, width = 880 }) => (
  <div
    style={{
      maxWidth: `${width}px`,
      margin: '0 auto',
      padding: '32px 16px 48px',
      color: 'white',
    }}
  >
    <h1
      style={{
        fontSize: 'clamp(24px, 4vw, 32px)',
        fontWeight: 700,
        margin: '0 0 8px',
      }}
    >
      {title}
    </h1>
    {subtitle && (
      <p
        style={{
          color: 'rgba(255,255,255,0.7)',
          margin: '0 0 24px',
          lineHeight: 1.6,
        }}
      >
        {subtitle}
      </p>
    )}
    {children}
  </div>
);

export const Card = ({ children, style, ...rest }) => (
  <div
    style={{
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '16px',
      padding: '24px',
      ...style,
    }}
    {...rest}
  >
    {children}
  </div>
);

export const SectionTitle = ({ children }) => (
  <h2
    style={{
      fontSize: '18px',
      fontWeight: 700,
      margin: '0 0 16px',
      color: 'white',
    }}
  >
    {children}
  </h2>
);

const VARIANTS = {
  primary: { background: GRADIENT, color: 'white', border: 'none' },
  secondary: {
    background: 'rgba(255,255,255,0.08)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.2)',
  },
  danger: {
    background: 'rgba(220,38,38,0.15)',
    color: '#fca5a5',
    border: '1px solid rgba(220,38,38,0.5)',
  },
  ghost: {
    background: 'transparent',
    color: 'rgba(255,255,255,0.8)',
    border: 'none',
  },
};

const buttonStyle = (variant, disabled, full) => ({
  ...VARIANTS[variant],
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '12px 20px',
  borderRadius: '10px',
  fontSize: '15px',
  fontWeight: 600,
  fontFamily: 'inherit',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.55 : 1,
  width: full ? '100%' : 'auto',
  textDecoration: 'none',
  transition: 'opacity 0.2s ease, transform 0.2s ease',
});

export const Button = ({
  variant = 'primary',
  loading = false,
  disabled = false,
  full = false,
  children,
  type = 'button',
  ...rest
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    style={buttonStyle(variant, disabled || loading, full)}
    {...rest}
  >
    {loading && <Loader2 size={16} className="om-spin" />}
    {children}
  </button>
);

export const ButtonLink = ({ to, variant = 'primary', children, full }) => (
  <Link to={to} style={buttonStyle(variant, false, full)}>
    {children}
  </Link>
);

const NOTICE = {
  info: { color: '#93c5fd', bg: 'rgba(59,130,246,0.12)', Icon: Info },
  success: { color: '#86efac', bg: 'rgba(34,197,94,0.12)', Icon: CheckCircle2 },
  error: { color: '#fca5a5', bg: 'rgba(220,38,38,0.14)', Icon: AlertCircle },
  warning: { color: '#fcd34d', bg: 'rgba(245,158,11,0.14)', Icon: AlertCircle },
};

export const Notice = ({ type = 'info', children, style }) => {
  const { color, bg, Icon } = NOTICE[type];
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      style={{
        display: 'flex',
        gap: '10px',
        alignItems: 'flex-start',
        padding: '12px 14px',
        borderRadius: '10px',
        background: bg,
        color,
        fontSize: '14px',
        lineHeight: 1.5,
        marginBottom: '16px',
        ...style,
      }}
    >
      <Icon size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
      <div>{children}</div>
    </div>
  );
};

export const Spinner = ({ label }) => (
  <div
    role="status"
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      color: 'rgba(255,255,255,0.8)',
      padding: '16px 0',
    }}
  >
    <Loader2 size={20} className="om-spin" />
    {label}
  </div>
);

export const Badge = ({ tone = 'neutral', children }) => {
  const tones = {
    success: ['rgba(34,197,94,0.15)', '#86efac'],
    warning: ['rgba(245,158,11,0.15)', '#fcd34d'],
    error: ['rgba(220,38,38,0.15)', '#fca5a5'],
    neutral: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.8)'],
  };
  const [bg, color] = tones[tone];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 600,
        background: bg,
        color,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
};

export const fieldStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(0,0,0,0.25)',
  color: 'white',
  fontSize: '15px',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
};

export const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: 'rgba(255,255,255,0.8)',
  marginBottom: '6px',
};
