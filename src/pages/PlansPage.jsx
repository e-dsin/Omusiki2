// pages/PlansPage.jsx — /formules
// Choix d'une formule et paiement :
//   - carte bancaire (Stripe Checkout) : redirection vers la page de paiement hébergée, puis retour sur /paiement/retour
//   - mobile money (Aftawallet)        : saisie de l'opérateur et du numéro, validation sur le téléphone
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, Check } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';
import {
  billingService,
  formatDate,
  formatPrice,
} from '../services/billingService';
import { getErrorMessage } from '../services/authErrors';
import { config } from '../config/env';
import {
  Page,
  Card,
  Button,
  ButtonLink,
  Notice,
  Spinner,
  SectionTitle,
  fieldStyle,
  labelStyle,
} from './account/ui';

const OPERATORS = [
  { id: 'MTN', label: 'MTN Mobile Money' },
  { id: 'ORANGE', label: 'Orange Money' },
];

const PERKS = [
  'Tout le catalogue en illimité',
  'Écoute sans publicité',
  'Favoris et playlists synchronisés',
];

const PlanCard = ({ plan, children }) => (
  <Card
    data-plan={plan.id}
    style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        color: '#EC4899',
        fontWeight: 600,
      }}
    >
      {plan.provider === 'stripe' ? (
        <CreditCard size={16} />
      ) : (
        <Smartphone size={16} />
      )}
      {plan.paymentMethod}
    </div>
    <div style={{ fontSize: '20px', fontWeight: 700 }}>{plan.name}</div>
    <div style={{ fontSize: '28px', fontWeight: 800 }}>
      {formatPrice(plan.price, plan.currency)}
      <span
        style={{
          fontSize: '14px',
          fontWeight: 500,
          color: 'rgba(255,255,255,0.6)',
        }}
      >
        {plan.kind === 'subscription'
          ? ' / mois'
          : ` · ${plan.periodDays} jours`}
      </span>
    </div>
    <p
      style={{
        margin: 0,
        color: 'rgba(255,255,255,0.7)',
        fontSize: '14px',
        lineHeight: 1.5,
      }}
    >
      {plan.description}
    </p>
    <div style={{ marginTop: 'auto' }}>{children}</div>
  </Card>
);

const MobileMoneyForm = ({ plan, onCancel }) => {
  const navigate = useNavigate();
  const [operator, setOperator] = useState('MTN');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submit = async event => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payment = await billingService.startMobileMoney(
        plan.id,
        phone,
        operator
      );
      navigate(
        `/paiement/retour?provider=aftawallet&payment_id=${encodeURIComponent(
          payment.id
        )}`
      );
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} aria-label={`Paiement ${plan.name}`}>
      <fieldset style={{ border: 'none', padding: 0, margin: '0 0 12px' }}>
        <legend style={labelStyle}>Opérateur</legend>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {OPERATORS.map(op => (
            <label
              key={op.id}
              style={{
                flex: '1 1 140px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                border:
                  operator === op.id
                    ? '1px solid #EC4899'
                    : '1px solid rgba(255,255,255,0.2)',
                background:
                  operator === op.id ? 'rgba(236,72,153,0.12)' : 'transparent',
              }}
            >
              <input
                type="radio"
                name={`operator-${plan.id}`}
                value={op.id}
                checked={operator === op.id}
                onChange={() => setOperator(op.id)}
              />
              {op.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label style={labelStyle} htmlFor={`phone-${plan.id}`}>
        Numéro de téléphone
      </label>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <span
          style={{
            ...fieldStyle,
            width: 'auto',
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          +237
        </span>
        <input
          id={`phone-${plan.id}`}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="6 70 00 00 00"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          required
          style={fieldStyle}
        />
      </div>
      {error && <Notice type="error">{error}</Notice>}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Button type="submit" loading={submitting}>
          Payer {formatPrice(plan.price, plan.currency)}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={submitting}>
          Annuler
        </Button>
      </div>
    </form>
  );
};

const PlansPage = () => {
  const location = useLocation();
  const { subscription, hasAccess } = useSubscription();
  const [plans, setPlans] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [openForm, setOpenForm] = useState(null);
  const [checkout, setCheckout] = useState({ planId: null, error: null });

  useEffect(() => {
    billingService
      .listPlans()
      .then(setPlans)
      .catch(err => setLoadError(getErrorMessage(err)));
  }, []);

  const payByCard = async plan => {
    setCheckout({ planId: plan.id, error: null });
    try {
      const { url } = await billingService.startCardCheckout(plan.id);
      window.location.assign(url); // page de paiement hébergée (Stripe Checkout)
    } catch (err) {
      setCheckout({ planId: null, error: getErrorMessage(err) });
    }
  };

  const blockedSong =
    location.state?.reason === 'subscription-required'
      ? location.state.songTitle
      : null;
  const hasRenewingCard = hasAccess && subscription.renews;

  return (
    <Page
      title="Choisissez votre formule"
      subtitle="Payez par carte bancaire ou par Mobile Money. Sans engagement."
    >
      {blockedSong !== null && !hasAccess && (
        <Notice type="warning">
          {blockedSong
            ? `Pour écouter « ${blockedSong} », choisissez une formule.`
            : 'Une formule est nécessaire pour écouter ce titre.'}
        </Notice>
      )}
      {hasAccess && (
        <Notice type="success">
          Votre formule <strong>{subscription.planName}</strong> est active
          {subscription.renews
            ? ` (renouvellement le ${formatDate(
                subscription.currentPeriodEnd
              )})`
            : ` jusqu'au ${formatDate(subscription.currentPeriodEnd)}`}
          .{' '}
          {subscription.kind === 'pass' &&
            'Un nouveau pass prolonge votre accès.'}
        </Notice>
      )}
      {checkout.error && <Notice type="error">{checkout.error}</Notice>}
      {loadError && <Notice type="error">{loadError}</Notice>}

      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: '0 0 24px',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          color: 'rgba(255,255,255,0.85)',
          fontSize: '14px',
        }}
      >
        {PERKS.map(perk => (
          <li
            key={perk}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Check size={16} color="#EC4899" />
            {perk}
          </li>
        ))}
      </ul>

      {!plans && !loadError && <Spinner label="Chargement des formules…" />}

      {plans && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
          }}
        >
          {plans.map(plan => (
            <PlanCard key={plan.id} plan={plan}>
              {plan.provider === 'stripe' &&
                (hasRenewingCard ? (
                  <ButtonLink to="/abonnement" variant="secondary" full>
                    Gérer mon abonnement
                  </ButtonLink>
                ) : (
                  <Button
                    full
                    loading={checkout.planId === plan.id}
                    disabled={Boolean(checkout.planId)}
                    onClick={() => payByCard(plan)}
                  >
                    S&apos;abonner par carte
                  </Button>
                ))}
              {plan.provider === 'aftawallet' && hasRenewingCard && (
                <p
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.6)',
                    lineHeight: 1.5,
                  }}
                >
                  Disponible après résiliation de votre abonnement carte.
                </p>
              )}
              {plan.provider === 'aftawallet' &&
                !hasRenewingCard &&
                (openForm === plan.id ? (
                  <MobileMoneyForm
                    plan={plan}
                    onCancel={() => setOpenForm(null)}
                  />
                ) : (
                  <Button
                    full
                    variant="secondary"
                    onClick={() => setOpenForm(plan.id)}
                  >
                    Payer par Mobile Money
                  </Button>
                ))}
            </PlanCard>
          ))}
        </div>
      )}

      {config.testHints && (
        <SectionTitleNote>
          Environnement de test : tarifs fictifs, aucun paiement réel. Mobile
          Money : un numéro se terminant par 0000 simule un refus ; la
          validation sur le téléphone est simulée après quelques secondes.
        </SectionTitleNote>
      )}
    </Page>
  );
};

const SectionTitleNote = ({ children }) => (
  <div style={{ marginTop: '24px' }}>
    <SectionTitle>Bon à savoir</SectionTitle>
    <p
      style={{
        color: 'rgba(255,255,255,0.6)',
        fontSize: '13px',
        lineHeight: 1.6,
        margin: 0,
      }}
    >
      {children}
    </p>
  </div>
);

export default PlansPage;
