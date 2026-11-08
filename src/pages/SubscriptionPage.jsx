// pages/SubscriptionPage.jsx — /abonnement
// État de l'abonnement, résiliation / reprise (carte), prolongation (pass), historique des paiements.
import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';
import {
  billingService,
  formatDate,
  formatPrice,
} from '../services/billingService';
import { getErrorMessage } from '../services/authErrors';
import {
  Page,
  Card,
  Badge,
  Button,
  ButtonLink,
  Notice,
  Spinner,
  SectionTitle,
} from './account/ui';

const STATUS = {
  active: ['success', 'Active'],
  canceled: ['neutral', 'Résiliée'],
  expired: ['neutral', 'Expirée'],
  none: ['neutral', 'Aucune formule'],
};

const PAYMENT_STATUS = {
  succeeded: ['success', 'Payé'],
  pending: ['warning', 'En attente'],
  failed: ['error', 'Refusé'],
  canceled: ['neutral', 'Annulé'],
};

const PROVIDER = { stripe: 'Carte bancaire', aftawallet: 'Mobile Money' };

const statusLine = sub => {
  const end = formatDate(sub.currentPeriodEnd);
  if (sub.status === 'none') return 'Vous n’avez pas encore choisi de formule.';
  if (!sub.hasAccess) return `Votre accès a pris fin le ${end}.`;
  if (sub.renews) return `Prochain renouvellement automatique le ${end}.`;
  if (sub.cancelAtPeriodEnd)
    return `Résiliation programmée : vous gardez l’accès jusqu’au ${end}.`;
  return `Accès jusqu’au ${end}, sans renouvellement automatique.`;
};

const PaymentHistory = ({ refreshKey }) => {
  const [payments, setPayments] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    billingService
      .listPayments()
      .then(setPayments)
      .catch(err => setError(getErrorMessage(err)));
  }, [refreshKey]);

  if (error) return <Notice type="error">{error}</Notice>;
  if (!payments) return <Spinner label="Chargement de l’historique…" />;
  if (payments.length === 0)
    return (
      <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>
        Aucun paiement pour l’instant.
      </p>
    );

  return (
    <ul
      aria-label="Historique des paiements"
      style={{ listStyle: 'none', margin: 0, padding: 0 }}
    >
      {payments.map(payment => {
        const [tone, label] = PAYMENT_STATUS[payment.status] || [
          'neutral',
          payment.status,
        ];
        return (
          <li
            key={payment.id}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '8px 16px',
              padding: '12px 0',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              fontSize: '14px',
            }}
          >
            <span style={{ minWidth: '110px', color: 'rgba(255,255,255,0.6)' }}>
              {formatDate(payment.createdAt)}
            </span>
            <span style={{ flex: '1 1 160px' }}>
              {payment.planName}
              {payment.reason === 'renewal' && ' · renouvellement'}
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                {' '}
                · {PROVIDER[payment.provider]}
              </span>
            </span>
            <strong>{formatPrice(payment.amount, payment.currency)}</strong>
            <Badge tone={tone}>{label}</Badge>
          </li>
        );
      })}
    </ul>
  );
};

const SubscriptionPage = () => {
  const { subscription, loading, cancelRenewal, resumeRenewal, refresh } =
    useSubscription();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [historyKey, setHistoryKey] = useState(0);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const act = async (action, success) => {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      setMessage({ type: 'success', text: success });
      setConfirming(false);
      setHistoryKey(k => k + 1);
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const [tone, label] =
    subscription.cancelAtPeriodEnd && subscription.hasAccess
      ? ['warning', 'Résiliation programmée']
      : STATUS[subscription.status] || STATUS.none;
  const isCard = subscription.provider === 'stripe';

  return (
    <Page title="Mon abonnement" width={720}>
      {message && <Notice type={message.type}>{message.text}</Notice>}

      <Card style={{ marginBottom: '24px' }} data-testid="subscription-card">
        {loading && subscription.status === 'none' ? (
          <Spinner label="Chargement…" />
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap',
                marginBottom: '8px',
              }}
            >
              <div style={{ fontSize: '22px', fontWeight: 700 }}>
                {subscription.planName || 'Aucune formule'}
              </div>
              <Badge tone={tone}>{label}</Badge>
            </div>
            <p
              style={{
                color: 'rgba(255,255,255,0.75)',
                margin: '0 0 16px',
                lineHeight: 1.6,
              }}
            >
              {statusLine(subscription)}
              {subscription.provider && (
                <>
                  <br />
                  Moyen de paiement : {PROVIDER[subscription.provider]}
                </>
              )}
            </p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {isCard && subscription.renews && !confirming && (
                <Button variant="danger" onClick={() => setConfirming(true)}>
                  Résilier l&apos;abonnement
                </Button>
              )}
              {isCard &&
                subscription.hasAccess &&
                subscription.cancelAtPeriodEnd && (
                  <Button
                    loading={busy}
                    onClick={() =>
                      act(resumeRenewal, 'Votre abonnement est réactivé.')
                    }
                  >
                    Réactiver le renouvellement
                  </Button>
                )}
              {(!subscription.hasAccess || subscription.kind === 'pass') && (
                <ButtonLink to="/formules">
                  {subscription.kind === 'pass' && subscription.hasAccess
                    ? 'Prolonger mon pass'
                    : 'Choisir une formule'}
                </ButtonLink>
              )}
            </div>

            {confirming && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(220,38,38,0.08)',
                  border: '1px solid rgba(220,38,38,0.3)',
                }}
              >
                <p style={{ margin: '0 0 12px', lineHeight: 1.6 }}>
                  Confirmer la résiliation ? Vous gardez l’accès jusqu’au{' '}
                  {formatDate(subscription.currentPeriodEnd)}, puis vous ne
                  serez plus débité.
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Button
                    variant="danger"
                    loading={busy}
                    onClick={() =>
                      act(
                        cancelRenewal,
                        'Résiliation enregistrée. Vous gardez l’accès jusqu’à la fin de la période payée.'
                      )
                    }
                  >
                    Confirmer la résiliation
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setConfirming(false)}
                    disabled={busy}
                  >
                    Garder mon abonnement
                  </Button>
                </div>
              </div>
            )}

            {subscription.hasAccess && (
              <p
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  color: 'rgba(255,255,255,0.55)',
                  fontSize: '13px',
                  margin: '16px 0 0',
                }}
              >
                <Bell size={14} />
                Un rappel vous est envoyé par email 2 jours avant l’échéance.
              </p>
            )}
          </>
        )}
      </Card>

      <Card>
        <SectionTitle>Historique des paiements</SectionTitle>
        <PaymentHistory refreshKey={historyKey} />
      </Card>
    </Page>
  );
};

export default SubscriptionPage;
