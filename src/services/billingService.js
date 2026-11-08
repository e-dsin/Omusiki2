// services/billingService.js
// Formules et paiements. Deux implémentations, même interface :
//   api  -> back-end (simulé en local : contrats Stripe Checkout et Aftawallet)
//   demo -> tout simulé dans le navigateur, sans serveur
//
//   listPlans()                                  -> Plan[]
//   getSubscription(user)                        -> Subscription
//   startCardCheckout(planId)                    -> { sessionId, url }   (url : page de paiement hébergée)
//   getCheckout(sessionId)                       -> { status, payment, subscription }
//   startMobileMoney(planId, phone, operator)    -> Payment (status 'pending')
//   getPayment(paymentId)                        -> Payment + { subscription }
//   cancelRenewal() / resumeRenewal()            -> Subscription
//   listPayments()                               -> Payment[]
//
// Subscription : { status: 'none'|'active'|'canceled'|'expired', hasAccess, planId, planName, kind,
//                  provider, currentPeriodEnd (ISO), cancelAtPeriodEnd, renews }
import { isApiMode } from '../config/env';
import { api } from './apiClient';

// ------------------------------------------------------------------ API
const apiBilling = {
  listPlans: () => api('/api/plans', { auth: false }),
  getSubscription: () => api('/api/me/subscription'),
  startCardCheckout: planId =>
    api('/api/checkout/stripe', { method: 'POST', body: { planId } }),
  getCheckout: sessionId =>
    api(`/api/checkout/stripe/${encodeURIComponent(sessionId)}`),
  startMobileMoney: (planId, phone, operator) =>
    api('/api/payments/aftawallet', {
      method: 'POST',
      body: { planId, phone, operator },
    }),
  getPayment: paymentId =>
    api(`/api/payments/${encodeURIComponent(paymentId)}`),
  cancelRenewal: () => api('/api/me/subscription/cancel', { method: 'POST' }),
  resumeRenewal: () => api('/api/me/subscription/resume', { method: 'POST' }),
  listPayments: () => api('/api/me/payments'),
};

// ------------------------------------------------------------------ Démo
// Tarifs FICTIFS, identiques à ceux du back-end simulé
export const DEMO_PLANS = [
  {
    id: 'premium_mensuel',
    name: 'Premium mensuel',
    provider: 'stripe',
    kind: 'subscription',
    price: 4.99,
    currency: 'EUR',
    periodDays: 30,
    paymentMethod: 'Carte bancaire',
    description:
      'Renouvellement automatique chaque mois, résiliable à tout moment.',
  },
  {
    id: 'pass_30j',
    name: 'Pass 30 jours',
    provider: 'aftawallet',
    kind: 'pass',
    price: 2000,
    currency: 'XAF',
    periodDays: 30,
    paymentMethod: 'Mobile Money (MTN, Orange)',
    description:
      'Accès illimité pendant 30 jours, sans renouvellement automatique.',
  },
  {
    id: 'pass_90j',
    name: 'Pass 90 jours',
    provider: 'aftawallet',
    kind: 'pass',
    price: 5000,
    currency: 'XAF',
    periodDays: 90,
    paymentMethod: 'Mobile Money (MTN, Orange)',
    description: 'Accès illimité pendant 90 jours, le plus avantageux.',
  },
];

const DAY_MS = 24 * 3600 * 1000;
const DEMO_KEY = 'omusiki_demo_billing';
const DEMO_AFTA_DELAY_MS = 4000;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const plan = id => DEMO_PLANS.find(p => p.id === id);

const demoError = (name, message) => {
  const error = new Error(message);
  error.name = name;
  error.status = 400;
  return error;
};

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(DEMO_KEY)) || {};
  } catch {
    return {};
  }
};
const save = state => {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(state));
  } catch {
    // ignoré
  }
};

let demoUser = null; // compte courant (renseigné par getSubscription)

// Après une redirection (retour de paiement), le compte est relu dans la session démo
const currentDemoUser = () => {
  if (demoUser) return demoUser;
  try {
    return JSON.parse(localStorage.getItem('omusiki_demo_session'));
  } catch {
    return null;
  }
};

const userState = () => {
  const all = load();
  const user = currentDemoUser();
  const key = user?.email || 'anonyme';
  if (!all[key]) {
    // Comptes démo : « Premium » à la connexion, sans formule après inscription
    all[key] = {
      subscription:
        user?.subscription === 'Premium'
          ? {
              planId: 'premium_mensuel',
              status: 'active',
              end: Date.now() + 30 * DAY_MS,
              cancelAtPeriodEnd: false,
            }
          : null,
      payments: [],
      checkouts: {},
    };
    save(all);
  }
  return [all, all[key]];
};

const view = sub => {
  if (!sub) return { status: 'none', hasAccess: false };
  const p = plan(sub.planId);
  let { status } = sub;
  if (status === 'active' && sub.end <= Date.now())
    status = p.kind === 'pass' ? 'expired' : 'canceled';
  const hasAccess = status === 'active';
  return {
    status,
    hasAccess,
    planId: p.id,
    planName: p.name,
    kind: p.kind,
    provider: p.provider,
    currentPeriodEnd: new Date(sub.end).toISOString(),
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    renews: p.provider === 'stripe' && !sub.cancelAtPeriodEnd && hasAccess,
  };
};

const activate = (state, planId) => {
  const p = plan(planId);
  const current = state.subscription;
  const extend =
    p.kind === 'pass' &&
    current?.status === 'active' &&
    plan(current.planId).kind === 'pass' &&
    current.end > Date.now();
  const start = extend ? current.end : Date.now();
  state.subscription = {
    planId,
    status: 'active',
    end: start + p.periodDays * DAY_MS,
    cancelAtPeriodEnd: false,
  };
};

const paymentView = payment => ({
  ...payment,
  planName: plan(payment.planId)?.name,
  createdAt: new Date(payment.createdAt).toISOString(),
});

const demoBilling = {
  async listPlans() {
    await wait(200);
    return DEMO_PLANS;
  },

  async getSubscription(user) {
    demoUser = user || demoUser;
    return view(userState()[1].subscription);
  },

  // Démo : pas de page de paiement, le paiement carte est accepté immédiatement
  async startCardCheckout(planId) {
    await wait(500);
    const [all, state] = userState();
    const p = plan(planId);
    const sessionId = `cs_demo_${Date.now()}`;
    const payment = {
      id: `pay_demo_${Date.now()}`,
      planId,
      provider: 'stripe',
      amount: p.price,
      currency: p.currency,
      status: 'succeeded',
      createdAt: Date.now(),
    };
    state.payments.unshift(payment);
    state.checkouts[sessionId] = payment.id;
    activate(state, planId);
    save(all);
    return {
      sessionId,
      url: `/paiement/retour?provider=stripe&session_id=${sessionId}`,
    };
  },

  async getCheckout(sessionId) {
    const [, state] = userState();
    const payment = state.payments.find(
      p => p.id === state.checkouts[sessionId]
    );
    if (!payment) throw demoError('SessionNotFound', 'Session introuvable.');
    return {
      sessionId,
      status: 'complete',
      payment: paymentView(payment),
      subscription: view(state.subscription),
    };
  },

  // Démo : validation automatique après 4 s ; un numéro finissant par 0000 est refusé
  async startMobileMoney(planId, phone, operator) {
    await wait(500);
    const digits = phone.replace(/\D/g, '').replace(/^237/, '');
    if (!/^6\d{8}$/.test(digits))
      throw demoError(
        'InvalidPhoneNumber',
        'Numéro de téléphone camerounais invalide (9 chiffres, commençant par 6).'
      );
    const [all, state] = userState();
    const p = plan(planId);
    const payment = {
      id: `pay_demo_${Date.now()}`,
      planId,
      provider: 'aftawallet',
      operator,
      phone: `237${digits}`,
      amount: p.price,
      currency: p.currency,
      status: 'pending',
      createdAt: Date.now(),
    };
    state.payments.unshift(payment);
    save(all);
    return paymentView(payment);
  },

  async getPayment(paymentId) {
    const [all, state] = userState();
    const payment = state.payments.find(p => p.id === paymentId);
    if (!payment) throw demoError('PaymentNotFound', 'Paiement introuvable.');
    if (
      payment.status === 'pending' &&
      Date.now() - payment.createdAt >= DEMO_AFTA_DELAY_MS
    ) {
      if (payment.phone.endsWith('0000')) {
        payment.status = 'failed';
        payment.failureReason = 'CustomerDeclined';
      } else {
        payment.status = 'succeeded';
        activate(state, payment.planId);
      }
      save(all);
    }
    return { ...paymentView(payment), subscription: view(state.subscription) };
  },

  async cancelRenewal() {
    const [all, state] = userState();
    if (state.subscription) state.subscription.cancelAtPeriodEnd = true;
    save(all);
    return view(state.subscription);
  },

  async resumeRenewal() {
    const [all, state] = userState();
    if (state.subscription) state.subscription.cancelAtPeriodEnd = false;
    save(all);
    return view(state.subscription);
  },

  async listPayments() {
    return userState()[1].payments.map(paymentView);
  },
};

export const billingService = isApiMode ? apiBilling : demoBilling;

// ------------------------------------------------------------------ Formatage
export const formatPrice = (amount, currency) =>
  currency === 'XAF'
    ? `${Math.round(amount).toLocaleString('fr-FR')} FCFA`
    : amount.toLocaleString('fr-FR', { style: 'currency', currency });

export const formatDate = iso =>
  iso
    ? new Date(iso).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

export default billingService;
