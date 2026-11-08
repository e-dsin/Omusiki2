import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import {
  getAuthErrorMessage,
  getPasswordIssues,
  isValidEmail,
  PASSWORD_RULES,
} from '../../services/authErrors';
import AuthFeedback from './AuthFeedback';
import {
  inputStyle,
  actionButtonStyle,
  actionButtonHover,
  footerTextStyle,
  linkButtonStyle,
  linkButtonHover,
  descriptionStyle,
  hintStyle,
} from './authStyles';

// Réinitialisation du mot de passe en trois étapes (parcours Cognito) :
//  1. 'request' : saisie de l'email -> envoi d'un code
//  2. 'reset'   : saisie du code et du nouveau mot de passe
//  3. 'done'    : confirmation, retour à la connexion
const ForgotPasswordForm = ({ onSwitchToLogin }) => {
  const { requestPasswordReset, confirmPasswordReset } =
    useContext(AuthContext);
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [destination, setDestination] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const sendCode = async () => {
    const result = await requestPasswordReset(email.trim());
    setDestination(result?.destination || email.trim());
  };

  const handleRequest = async e => {
    e.preventDefault();
    if (submitting) return;
    if (!isValidEmail(email.trim())) {
      setError('Saisissez une adresse email valide.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await sendCode();
      setStep('reset');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async e => {
    e.preventDefault();
    if (submitting) return;
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Saisissez le code à 6 chiffres reçu par email.');
      return;
    }
    const issues = getPasswordIssues(password);
    if (issues.length) {
      setError(`Le mot de passe doit contenir : ${issues.join(', ')}.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setError('');
    setInfo('');
    setSubmitting(true);
    try {
      await confirmPasswordReset(email.trim(), code.trim(), password);
      setStep('done');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      await sendCode();
      setInfo('Un nouveau code vient de vous être envoyé.');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  };

  const backToLogin = (
    <p style={footerTextStyle}>
      {step === 'done'
        ? 'Retour à la connexion ?'
        : 'Vous vous souvenez de votre mot de passe ?'}
      <button
        type="button"
        onClick={onSwitchToLogin}
        style={linkButtonStyle}
        {...linkButtonHover}
      >
        Se connecter
      </button>
    </p>
  );

  if (step === 'done') {
    return (
      <div>
        <AuthFeedback tone="success">
          <strong>Mot de passe modifié.</strong>
          <br />
          Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
        </AuthFeedback>
        <button
          type="button"
          onClick={onSwitchToLogin}
          style={actionButtonStyle('success')}
          {...actionButtonHover('success')}
        >
          Se connecter
        </button>
      </div>
    );
  }

  if (step === 'reset') {
    return (
      <div>
        <p style={descriptionStyle}>
          Si un compte existe pour cet email, un code a été envoyé à{' '}
          <strong>{destination}</strong>. Saisissez-le avec votre nouveau mot de
          passe.
        </p>
        <form onSubmit={handleReset} noValidate>
          <AuthFeedback>{error}</AuthFeedback>
          <AuthFeedback tone="success">{info}</AuthFeedback>
          <input
            type="text"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            aria-label="Code reçu par email"
            placeholder="Code à 6 chiffres"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            style={{
              ...inputStyle,
              letterSpacing: code ? '6px' : 'normal',
              textAlign: 'center',
            }}
          />
          <input
            type="password"
            name="new-password"
            autoComplete="new-password"
            aria-label="Nouveau mot de passe"
            aria-describedby="reset-password-rules"
            placeholder="Nouveau mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={inputStyle}
          />
          <p id="reset-password-rules" style={hintStyle}>
            {PASSWORD_RULES.map(rule => rule.label).join(' · ')}
          </p>
          <input
            type="password"
            name="confirm-password"
            autoComplete="new-password"
            aria-label="Confirmer le nouveau mot de passe"
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={submitting}
            style={actionButtonStyle('primary', submitting)}
            {...actionButtonHover('primary', submitting)}
          >
            {submitting ? 'Enregistrement…' : 'Changer mon mot de passe'}
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
        {backToLogin}
      </div>
    );
  }

  return (
    <div>
      <p style={descriptionStyle}>
        Entrez votre adresse email : nous vous enverrons un code pour
        réinitialiser votre mot de passe.
      </p>

      <form onSubmit={handleRequest} noValidate>
        <AuthFeedback>{error}</AuthFeedback>
        <input
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          aria-label="Votre adresse email"
          placeholder="Votre adresse email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={inputStyle}
        />

        <button
          type="submit"
          disabled={submitting}
          style={actionButtonStyle('primary', submitting)}
          {...actionButtonHover('primary', submitting)}
        >
          {submitting ? 'Envoi…' : 'Recevoir un code'}
        </button>
      </form>

      {backToLogin}
    </div>
  );
};

export default ForgotPasswordForm;
