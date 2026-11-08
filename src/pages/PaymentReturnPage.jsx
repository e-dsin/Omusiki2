// pages/PaymentReturnPage.jsx — /paiement/retour
// Page de retour après paiement :
//   ?provider=stripe&session_id=…            retour de Stripe Checkout (succès)
//   ?provider=stripe&session_id=…&status=cancel  paiement abandonné
//   ?provider=aftawallet&payment_id=…        attente de la validation sur le téléphone (interrogation toutes les 2 s)
// Le serveur reste la référence : l'accès n'est ouvert qu'une fois le paiement confirmé par le PSP (webhook).
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PartyPopper, Smartphone, XCircle } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';
import {
  billingService,
  formatDate,
  formatPrice,
} from '../services/billingService';
import { getErrorMessage } from '../services/authErrors';
import { Page, Card, ButtonLink, Notice, Spinner } from './account/ui';

const POLL_MS = 2000;
// Au-delà, on invite l'abonné à revenir plus tard (le webhook carte arrive en quelques secondes)
const MAX_WAIT_MS = { stripe: 30 * 1000, aftawallet: 3 * 60 * 1000 };

const FAILURE_MESSAGES = {
  CustomerDeclined: 'Le paiement a été refusé sur votre téléphone.',
  ProviderFailed: 'Le paiement a échoué chez l’opérateur.',
  InsufficientFunds: 'Solde insuffisant.',
};

const usePaymentStatus = (provider, sessionId, paymentId, canceled) => {
  const [state, setState] = useState({ phase: 'loading' });

  useEffect(() => {
    if (canceled) {
      setState({ phase: 'canceled' });
      return undefined;
    }
    let stopped = false;
    let timer = null;
    const started = Date.now();

    const check = async () => {
      try {
        const result =
          provider === 'stripe'
            ? await billingService.getCheckout(sessionId)
            : await billingService.getPayment(paymentId);
        if (stopped) return;
        const payment = provider === 'stripe' ? result.payment : result;
        const status =
          provider === 'stripe' && result.status === 'complete'
            ? 'succeeded'
            : payment.status;
        if (status === 'succeeded') {
          setState({
            phase: 'success',
            payment,
            subscription: result.subscription,
          });
          return;
        }
        if (status === 'failed' || status === 'canceled') {
          setState({ phase: status, payment });
          return;
        }
        if (Date.now() - started > MAX_WAIT_MS[provider]) {
          setState({ phase: 'timeout', payment });
          return;
        }
        setState({ phase: 'pending', payment });
        timer = setTimeout(check, POLL_MS);
      } catch (error) {
        if (!stopped)
          setState({ phase: 'error', message: getErrorMessage(error) });
      }
    };

    if (!sessionId && !paymentId) {
      setState({ phase: 'error', message: 'Référence de paiement absente.' });
    } else {
      check();
    }
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [provider, sessionId, paymentId, canceled]);

  return state;
};

const Icon = ({ children, color }) => (
  <div
    style={{
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `${color}22`,
      color,
      margin: '0 auto 16px',
    }}
  >
    {children}
  </div>
);

const PaymentReturnPage = () => {
  const [params] = useSearchParams();
  const provider =
    params.get('provider') === 'aftawallet' ? 'aftawallet' : 'stripe';
  const state = usePaymentStatus(
    provider,
    params.get('session_id'),
    params.get('payment_id'),
    params.get('status') === 'cancel'
  );
  const { setSubscription } = useSubscription();

  // L'accès vient d'être ouvert : mise à jour immédiate de l'état d'abonnement
  useEffect(() => {
    if (state.phase === 'success' && state.subscription) {
      setSubscription(state.subscription);
    }
  }, [state, setSubscription]);

  const { payment, subscription } = state;
  const amount = payment ? formatPrice(payment.amount, payment.currency) : '';

  return (
    <Page title="Paiement" width={560}>
      <Card style={{ textAlign: 'center' }} data-phase={state.phase}>
        {state.phase === 'loading' && (
          <Spinner label="Vérification du paiement…" />
        )}

        {state.phase === 'pending' && provider === 'stripe' && (
          <Spinner label="Confirmation de votre paiement par carte en cours…" />
        )}

        {state.phase === 'pending' && provider === 'aftawallet' && (
          <>
            <Icon color="#EC4899">
              <Smartphone size={28} />
            </Icon>
            <h2 style={{ fontSize: '20px', margin: '0 0 8px' }}>
              Validez le paiement sur votre téléphone
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
              {payment?.planName} · {amount}
              <br />
              Vous allez recevoir une demande de confirmation de votre
              opérateur. Saisissez votre code secret pour valider.
            </p>
            <Spinner label="En attente de confirmation…" />
          </>
        )}

        {state.phase === 'success' && (
          <>
            <Icon color="#22c55e">
              <PartyPopper size={28} />
            </Icon>
            <h2 style={{ fontSize: '22px', margin: '0 0 8px' }}>
              Paiement confirmé
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
              {subscription?.planName} est active
              {subscription?.renews
                ? ` — prochain renouvellement le ${formatDate(
                    subscription.currentPeriodEnd
                  )}`
                : ` jusqu'au ${formatDate(subscription?.currentPeriodEnd)}`}
              .<br />
              Un email de confirmation vous a été envoyé.
            </p>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginTop: '16px',
              }}
            >
              <ButtonLink to="/">Commencer l&apos;écoute</ButtonLink>
              <ButtonLink to="/abonnement" variant="secondary">
                Mon abonnement
              </ButtonLink>
            </div>
          </>
        )}

        {(state.phase === 'failed' ||
          state.phase === 'canceled' ||
          state.phase === 'timeout' ||
          state.phase === 'error') && (
          <>
            <Icon color="#ef4444">
              <XCircle size={28} />
            </Icon>
            <h2 style={{ fontSize: '20px', margin: '0 0 8px' }}>
              {state.phase === 'canceled'
                ? 'Paiement annulé'
                : state.phase === 'timeout'
                ? 'Paiement toujours en attente'
                : 'Paiement non abouti'}
            </h2>
            {state.phase === 'failed' && (
              <Notice type="error">
                {FAILURE_MESSAGES[payment?.failureReason] ||
                  'Le paiement n’a pas pu être effectué.'}
              </Notice>
            )}
            {state.phase === 'timeout' && (
              <Notice type="warning">
                Nous n’avons pas encore reçu la confirmation de votre opérateur.
                Votre accès sera ouvert dès sa réception.
              </Notice>
            )}
            {state.phase === 'error' && (
              <Notice type="error">{state.message}</Notice>
            )}
            {state.phase === 'canceled' && (
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>
                Aucun montant n’a été débité.
              </p>
            )}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginTop: '8px',
              }}
            >
              <ButtonLink to="/formules">Choisir une formule</ButtonLink>
              <ButtonLink to="/" variant="secondary">
                Retour à l&apos;accueil
              </ButtonLink>
            </div>
          </>
        )}
      </Card>
    </Page>
  );
};

export default PaymentReturnPage;
