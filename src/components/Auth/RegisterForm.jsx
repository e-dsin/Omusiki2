import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import {
  getAuthErrorMessage,
  getPasswordIssues,
  isValidEmail,
  PASSWORD_RULES,
} from '../../services/authErrors';
import AuthFeedback from './AuthFeedback';
import SocialButtons from './SocialButtons';
import {
  inputStyle,
  actionButtonStyle,
  actionButtonHover,
  footerTextStyle,
  linkButtonStyle,
  linkButtonHover,
  descriptionStyle,
  hintStyle,
  checkboxLabelStyle,
  inlineLinkStyle,
} from './authStyles';

// Inscription en deux étapes :
//  1. formulaire (nom, email, mot de passe, acceptation des CGU)
//  2. si le service le demande (Cognito), saisie du code de confirmation reçu par email
const RegisterForm = ({ onSwitchToLogin }) => {
  const { signup, confirmSignUp, resendSignUpCode } = useContext(AuthContext);
  const [step, setStep] = useState('form'); // 'form' | 'confirm'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    if (!name.trim() || !email || !password || !confirmPassword)
      return 'Tous les champs sont obligatoires.';
    if (!isValidEmail(email.trim())) return 'Adresse email invalide.';
    const issues = getPasswordIssues(password);
    if (issues.length)
      return `Le mot de passe doit contenir : ${issues.join(', ')}.`;
    if (password !== confirmPassword)
      return 'Les mots de passe ne correspondent pas.';
    if (!acceptTerms)
      return 'Vous devez accepter les conditions d’utilisation pour créer un compte.';
    return '';
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (submitting) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const result = await signup(email.trim(), password, name.trim());
      if (result.status === 'confirm') {
        setStep('confirm');
        setSubmitting(false);
      }
      // status 'signed-in' : la route redirige automatiquement
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setSubmitting(false);
    }
  };

  const handleConfirm = async e => {
    e.preventDefault();
    if (submitting) return;
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Saisissez le code à 6 chiffres reçu par email.');
      return;
    }
    setError('');
    setInfo('');
    setSubmitting(true);
    try {
      await confirmSignUp(email.trim(), code.trim());
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      await resendSignUpCode(email.trim());
      setInfo('Un nouveau code vient de vous être envoyé.');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  };

  if (step === 'confirm') {
    return (
      <div>
        <p style={descriptionStyle}>
          Un code de confirmation a été envoyé à <strong>{email}</strong>.
          Saisissez-le pour activer votre compte.
        </p>
        <form onSubmit={handleConfirm} noValidate>
          <AuthFeedback>{error}</AuthFeedback>
          <AuthFeedback tone="success">{info}</AuthFeedback>
          <input
            type="text"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            aria-label="Code de confirmation"
            placeholder="Code à 6 chiffres"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            style={{
              ...inputStyle,
              letterSpacing: code ? '6px' : 'normal',
              textAlign: 'center',
            }}
          />
          <button
            type="submit"
            disabled={submitting}
            style={actionButtonStyle('primary', submitting)}
            {...actionButtonHover('primary', submitting)}
          >
            {submitting ? 'Vérification…' : 'Confirmer mon compte'}
          </button>
        </form>
        <p style={footerTextStyle}>
          Code non reçu ?
          <button
            type="button"
            onClick={handleResend}
            style={linkButtonStyle}
            {...linkButtonHover}
          >
            Renvoyer le code
          </button>
        </p>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} noValidate>
        <AuthFeedback>{error}</AuthFeedback>

        <input
          type="text"
          name="name"
          autoComplete="name"
          aria-label="Nom complet"
          placeholder="Nom complet"
          value={name}
          onChange={e => setName(e.target.value)}
          style={inputStyle}
        />
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
          name="new-password"
          autoComplete="new-password"
          aria-label="Mot de passe"
          aria-describedby="password-rules"
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={inputStyle}
        />
        <p id="password-rules" style={hintStyle}>
          {PASSWORD_RULES.map(rule => rule.label).join(' · ')}
        </p>
        <input
          type="password"
          name="confirm-password"
          autoComplete="new-password"
          aria-label="Confirmer le mot de passe"
          placeholder="Confirmer le mot de passe"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          style={inputStyle}
        />

        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={e => setAcceptTerms(e.target.checked)}
            style={{ marginTop: '3px', accentColor: '#EC4899' }}
          />
          <span>
            J&apos;accepte les{' '}
            <Link to="/legal/cgu" target="_blank" style={inlineLinkStyle}>
              conditions d&apos;utilisation
            </Link>{' '}
            et la{' '}
            <Link
              to="/legal/confidentialite"
              target="_blank"
              style={inlineLinkStyle}
            >
              politique de confidentialité
            </Link>
            .
          </span>
        </label>

        <button
          type="submit"
          disabled={submitting}
          style={actionButtonStyle('primary', submitting)}
          {...actionButtonHover('primary', submitting)}
        >
          {submitting ? 'Création du compte…' : 'S’inscrire'}
        </button>
      </form>

      <SocialButtons
        mode="register"
        onError={setError}
        disabled={!acceptTerms}
      />
      {!acceptTerms && (
        <p style={{ ...hintStyle, margin: '8px 0 0', textAlign: 'center' }}>
          Acceptez les conditions pour vous inscrire avec Google ou Apple.
        </p>
      )}

      <p style={footerTextStyle}>
        Déjà un compte ?
        <button
          type="button"
          onClick={onSwitchToLogin}
          style={linkButtonStyle}
          {...linkButtonHover}
        >
          Se connecter
        </button>
      </p>
    </div>
  );
};

export default RegisterForm;
