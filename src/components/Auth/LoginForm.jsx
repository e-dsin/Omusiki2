import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { getAuthErrorMessage, isValidEmail } from '../../services/authErrors';
import AuthFeedback from './AuthFeedback';
import SocialButtons from './SocialButtons';
import {
  inputStyle,
  actionButtonStyle,
  actionButtonHover,
  footerTextStyle,
  linkButtonStyle,
  linkButtonHover,
  inlineLinkStyle,
} from './authStyles';

const LoginForm = ({ onSwitchToRegister, onSwitchToForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useContext(AuthContext);

  const handleSubmit = async e => {
    e.preventDefault();
    if (submitting) return;
    if (!email || !password) {
      setError('Renseignez votre email et votre mot de passe.');
      return;
    }
    if (!isValidEmail(email.trim())) {
      setError('Adresse email invalide.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      // En cas de succès, la route redirige vers la page demandée
      await login(email.trim(), password);
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} noValidate>
        <AuthFeedback>{error}</AuthFeedback>

        <input
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          aria-label="Email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          aria-label="Mot de passe"
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={inputStyle}
        />

        <button
          type="submit"
          disabled={submitting}
          style={actionButtonStyle('primary', submitting)}
          {...actionButtonHover('primary', submitting)}
        >
          {submitting ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      <SocialButtons mode="login" onError={setError} />

      <div style={footerTextStyle}>
        <p style={{ margin: '0 0 8px 0' }}>
          Mot de passe oublié ?
          <button
            type="button"
            onClick={onSwitchToForgotPassword}
            style={linkButtonStyle}
            {...linkButtonHover}
          >
            Réinitialiser
          </button>
        </p>
        <p style={{ margin: 0 }}>
          Pas encore de compte ?
          <button
            type="button"
            onClick={onSwitchToRegister}
            style={linkButtonStyle}
            {...linkButtonHover}
          >
            S&apos;inscrire
          </button>
        </p>
        <p style={{ margin: '16px 0 0 0', fontSize: '12px' }}>
          En continuant, vous acceptez nos{' '}
          <Link to="/legal/cgu" target="_blank" style={inlineLinkStyle}>
            conditions d&apos;utilisation
          </Link>{' '}
          et notre{' '}
          <Link
            to="/legal/confidentialite"
            target="_blank"
            style={inlineLinkStyle}
          >
            politique de confidentialité
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
