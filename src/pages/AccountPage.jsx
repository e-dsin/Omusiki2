// pages/AccountPage.jsx — /compte
// Informations personnelles, déconnexion, suppression du compte (droit à l'effacement, RGPD).
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { getErrorMessage } from '../services/authErrors';
import {
  Page,
  Card,
  Button,
  ButtonLink,
  Notice,
  SectionTitle,
  fieldStyle,
  labelStyle,
} from './account/ui';

const CONFIRM_WORD = 'SUPPRIMER';

const PROVIDERS = {
  password: 'Email et mot de passe',
  google: 'Compte Google',
  apple: 'Compte Apple',
};

const AccountPage = () => {
  const navigate = useNavigate();
  const { user, updateProfile, deleteAccount, logout } =
    useContext(AuthContext);
  const { subscription, hasAccess } = useSubscription();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const saveProfile = async event => {
    event.preventDefault();
    setSaving(true);
    setProfileMessage(null);
    try {
      await updateProfile(name.trim());
      setProfileMessage({
        type: 'success',
        text: 'Modifications enregistrées.',
      });
    } catch (err) {
      setProfileMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const removeAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      navigate('/connexion', { replace: true });
    } catch (err) {
      setDeleteError(getErrorMessage(err));
      setDeleting(false);
    }
  };

  const signOut = async () => {
    await logout();
    navigate('/connexion', { replace: true });
  };

  const unchanged = name.trim() === (user?.name || '') || !name.trim();

  return (
    <Page title="Mon compte" width={640}>
      <Card style={{ marginBottom: '16px' }}>
        <SectionTitle>Informations personnelles</SectionTitle>
        <form onSubmit={saveProfile}>
          <label style={labelStyle} htmlFor="account-name">
            Nom affiché
          </label>
          <input
            id="account-name"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={80}
            autoComplete="name"
            style={{ ...fieldStyle, marginBottom: '16px' }}
          />
          <label style={labelStyle} htmlFor="account-email">
            Email
          </label>
          <input
            id="account-email"
            value={user?.email || ''}
            readOnly
            style={{
              ...fieldStyle,
              marginBottom: '8px',
              color: 'rgba(255,255,255,0.6)',
            }}
          />
          <p
            style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.55)',
              margin: '0 0 16px',
            }}
          >
            Connexion : {PROVIDERS[user?.provider] || PROVIDERS.password}
          </p>
          {profileMessage && (
            <Notice type={profileMessage.type}>{profileMessage.text}</Notice>
          )}
          <Button type="submit" loading={saving} disabled={unchanged}>
            Enregistrer
          </Button>
        </form>
      </Card>

      <Card style={{ marginBottom: '16px' }}>
        <SectionTitle>Abonnement</SectionTitle>
        <p style={{ color: 'rgba(255,255,255,0.75)', margin: '0 0 16px' }}>
          {hasAccess
            ? `Formule active : ${subscription.planName}.`
            : 'Aucune formule active.'}
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <ButtonLink to="/abonnement" variant="secondary">
            Gérer mon abonnement
          </ButtonLink>
          {!hasAccess && (
            <ButtonLink to="/formules">Voir les formules</ButtonLink>
          )}
        </div>
      </Card>

      <Card style={{ marginBottom: '16px' }}>
        <SectionTitle>Session</SectionTitle>
        <Button variant="secondary" onClick={signOut}>
          Se déconnecter
        </Button>
      </Card>

      <Card style={{ borderColor: 'rgba(220,38,38,0.4)' }}>
        <SectionTitle>Supprimer mon compte</SectionTitle>
        <p
          style={{
            color: 'rgba(255,255,255,0.75)',
            lineHeight: 1.6,
            margin: '0 0 12px',
          }}
        >
          Vos favoris, playlists et historique d’écoute seront définitivement
          effacés. Un abonnement carte en cours est résilié. Les justificatifs
          de paiement sont conservés de façon anonyme (obligation comptable).
        </p>
        <label style={labelStyle} htmlFor="account-delete-confirm">
          Pour confirmer, saisissez {CONFIRM_WORD}
        </label>
        <input
          id="account-delete-confirm"
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          autoComplete="off"
          style={{ ...fieldStyle, marginBottom: '12px' }}
        />
        {deleteError && <Notice type="error">{deleteError}</Notice>}
        <Button
          variant="danger"
          loading={deleting}
          disabled={confirmText.trim() !== CONFIRM_WORD}
          onClick={removeAccount}
        >
          Supprimer définitivement mon compte
        </Button>
      </Card>
    </Page>
  );
};

export default AccountPage;
