// e2e/omusiki.spec.js — parcours de bout en bout de la vue Abonné (front mode api + back-end simulé)
// Chaque test crée son propre compte : les tests sont indépendants et rejouables sans réinitialiser la base.
import { test, expect } from '@playwright/test';

const PASSWORD = 'Secret123';
const uniqueEmail = tag =>
  `${tag}.${Date.now()}.${Math.floor(Math.random() * 1e4)}@omusiki.test`;

// ------------------------------------------------------------------ outils
const lastCode = async (request, email) => {
  const mails = await (
    await request.get(`/api/dev/mailbox?to=${encodeURIComponent(email)}`)
  ).json();
  return mails.find(m => m.code)?.code;
};

const mailbox = async (request, email) =>
  (
    await request.get(`/api/dev/mailbox?to=${encodeURIComponent(email)}`)
  ).json();

// Compte confirmé créé par l'API, session ouverte dans le navigateur
const signIn = async (page, tag = 'user') => {
  const email = uniqueEmail(tag);
  const { request } = page;
  await request.post('/api/auth/signup', {
    data: { email, password: PASSWORD, name: 'Test E2E' },
  });
  const code = await lastCode(request, email);
  const session = await (
    await request.post('/api/auth/confirm', { data: { email, code } })
  ).json();
  await page.goto('/connexion');
  await page.evaluate(
    tokens => localStorage.setItem('omusiki_tokens', JSON.stringify(tokens)),
    session
  );
  await page.goto('/');
  return { email, session };
};

const token = page =>
  page.evaluate(
    () => JSON.parse(localStorage.getItem('omusiki_tokens'))?.accessToken
  );

const authGet = async (page, path) =>
  (
    await page.request.get(path, {
      headers: { Authorization: `Bearer ${await token(page)}` },
    })
  ).json();

const playerVisible = page => page.locator('audio');

const payByCard = async page => {
  await page.goto('/formules');
  await page.getByRole('button', { name: /abonner par carte/ }).click();
  await page.waitForURL(/\/api\/sim\/stripe\/checkout\//);
  await page.getByRole('button', { name: 'Payer (paiement accepté)' }).click();
  await expect(page.getByText('Paiement confirmé')).toBeVisible();
};

test.afterEach(async ({ request }) => {
  await request.put('/api/dev/settings', {
    data: { latencyMs: 0, failRate: 0 },
  });
});

// ------------------------------------------------------------------ parcours
test('L1 inscription avec code reçu par email, puis accueil', async ({
  page,
}) => {
  const email = uniqueEmail('l1');
  await page.goto('/connexion');
  await page.getByRole('button', { name: "S'inscrire" }).click();
  await page.getByLabel('Nom complet').fill('Awa Test');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mot de passe', { exact: true }).fill(PASSWORD);
  await page.getByLabel('Confirmer le mot de passe').fill(PASSWORD);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /inscrire$/ }).click();
  await expect(page.getByLabel('Code de confirmation')).toBeVisible();

  await page.getByLabel('Code de confirmation').fill('000000');
  await page.getByRole('button', { name: 'Confirmer mon compte' }).click();
  await expect(page.getByRole('alert')).toContainText('incorrect');

  await page
    .getByLabel('Code de confirmation')
    .fill(await lastCode(page.request, email));
  await page.getByRole('button', { name: 'Confirmer mon compte' }).click();
  await page.waitForURL(url => new URL(url).pathname === '/');
  await expect(
    page.getByRole('button', { name: 'Écouter maintenant' })
  ).toBeVisible();
});

test('L2 sans formule, la lecture renvoie vers le choix de formule', async ({
  page,
}) => {
  await signIn(page, 'l2');
  await page.getByRole('button', { name: 'Écouter maintenant' }).click();
  await page.waitForURL(/\/formules$/);
  await expect(page.getByText(/Pour écouter/)).toBeVisible();
  await expect(playerVisible(page)).toHaveCount(0);
  await expect(page.locator('[data-plan]')).toHaveCount(3);
});

test('L3 abonnement carte : refus, puis paiement accepté et écoute', async ({
  page,
}) => {
  await signIn(page, 'l3');
  await page.goto('/formules');
  await page.getByRole('button', { name: /abonner par carte/ }).click();
  await page.waitForURL(/\/api\/sim\/stripe\/checkout\//);
  await expect(page.getByText('Simulation locale')).toBeVisible();

  await page.getByRole('button', { name: 'Simuler une carte refusée' }).click();
  await expect(page.getByText('Votre carte a été refusée')).toBeVisible();

  await page.getByRole('button', { name: 'Payer (paiement accepté)' }).click();
  await page.waitForURL(/\/paiement\/retour\?provider=stripe/);
  await expect(page.getByText('Paiement confirmé')).toBeVisible();
  await expect(page.getByText(/prochain renouvellement/)).toBeVisible();

  await page.getByRole('link', { name: /Commencer l.écoute/ }).click();
  await page.getByRole('button', { name: 'Écouter maintenant' }).click();
  await expect(playerVisible(page)).toHaveCount(1);
  expect(new URL(page.url()).pathname).toBe('/');
});

test('L4 gestion de l’abonnement : résiliation, reprise, historique', async ({
  page,
}) => {
  await signIn(page, 'l4');
  await payByCard(page);
  await page.goto('/abonnement');
  const card = page.getByTestId('subscription-card');
  await expect(card).toContainText('Premium mensuel');
  await expect(card).toContainText('Active');

  await page.getByRole('button', { name: /Résilier/ }).click();
  await page.getByRole('button', { name: 'Confirmer la résiliation' }).click();
  await expect(card).toContainText('Résiliation programmée');
  await expect(card).toContainText('vous gardez l’accès');

  await page
    .getByRole('button', { name: 'Réactiver le renouvellement' })
    .click();
  await expect(card).toContainText('Prochain renouvellement automatique');

  const history = page.getByRole('list', { name: 'Historique des paiements' });
  await expect(history).toContainText('Premium mensuel');
  await expect(history).toContainText('Payé');
});

test('L5 pass mobile money : numéro invalide, refus, puis validation', async ({
  page,
}) => {
  await signIn(page, 'l5');
  await page.goto('/formules');
  const pass = page.locator('[data-plan="pass_30j"]');

  await pass.getByRole('button', { name: 'Payer par Mobile Money' }).click();
  await pass.getByLabel('Numéro de téléphone').fill('12345');
  await pass.getByRole('button', { name: /^Payer 2/ }).click();
  await expect(pass.getByRole('alert')).toContainText('Numéro invalide');

  // Un numéro finissant par 0000 simule un refus sur le téléphone
  await pass.getByLabel('Numéro de téléphone').fill('6 90 00 00 00');
  await pass.getByRole('button', { name: /^Payer 2/ }).click();
  await page.waitForURL(/provider=aftawallet/);
  await expect(
    page.getByText('Validez le paiement sur votre téléphone')
  ).toBeVisible();
  await expect(page.getByText('Paiement non abouti')).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('refusé');

  await page.getByRole('link', { name: 'Choisir une formule' }).click();
  await pass.getByRole('button', { name: 'Payer par Mobile Money' }).click();
  await pass.getByLabel('Orange Money').check();
  await pass.getByLabel('Numéro de téléphone').fill('677123456');
  await pass.getByRole('button', { name: /^Payer 2/ }).click();
  await expect(page.getByText('Paiement confirmé')).toBeVisible();
  await expect(
    page.getByText(/Pass 30 jours est active jusqu'au/)
  ).toBeVisible();

  const sub = await authGet(page, '/api/me/subscription');
  expect(sub).toMatchObject({ hasAccess: true, planId: 'pass_30j' });
});

test('L6 fin d’accès : le lecteur s’arrête et la lecture est bloquée', async ({
  page,
}) => {
  const { email } = await signIn(page, 'l6');
  await payByCard(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Écouter maintenant' }).click();
  await expect(playerVisible(page)).toHaveCount(1);

  // Résiliation, puis échéance avancée dans le passé : l'accès prend fin
  await page.request.post('/api/me/subscription/cancel', {
    headers: { Authorization: `Bearer ${await token(page)}` },
  });
  await page.request.post(`/api/dev/users/${email}/subscription/expire`);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(playerVisible(page)).toHaveCount(0);

  await page.getByRole('button', { name: 'Écouter maintenant' }).click();
  await page.waitForURL(/\/formules$/);
});

test('L7 favoris conservés sur le serveur (autre appareil)', async ({
  page,
  browser,
}) => {
  const { email } = await signIn(page, 'l7');
  const [track] = await (await page.request.get('/api/tracks?limit=1')).json();

  await page.goto('/recherche');
  await page
    .getByPlaceholder('Rechercher des artistes, titres, albums, genres...')
    .fill(track.title);
  await page
    .getByRole('button', { name: 'Ajouter aux favoris' })
    .first()
    .click();
  await expect
    .poll(async () => (await authGet(page, '/api/me/favorites')).length)
    .toBe(1);

  // Second appareil : nouvelle session, connexion par le formulaire
  const other = await browser.newContext();
  const page2 = await other.newPage();
  await page2.goto('/connexion');
  await page2.getByLabel('Email').fill(email);
  await page2.getByLabel('Mot de passe').fill(PASSWORD);
  await page2.getByRole('button', { name: 'Se connecter' }).click();
  await page2.waitForURL(url => new URL(url).pathname === '/');
  await page2.goto('/bibliotheque');
  await expect(page2.getByText(track.title).first()).toBeVisible();
  await other.close();
});

test('L8 une écoute de 30 s est journalisée', async ({ page }) => {
  test.setTimeout(120 * 1000);
  await signIn(page, 'l8');
  await payByCard(page);
  const [track] = await (await page.request.get('/api/tracks?limit=1')).json();
  await page.goto('/recherche');
  await page
    .getByPlaceholder('Rechercher des artistes, titres, albums, genres...')
    .fill(track.title);
  await page.locator('main').getByText(track.title, { exact: true }).click();
  await expect(playerVisible(page)).toHaveCount(1);
  await expect
    .poll(async () => (await authGet(page, '/api/me/plays')).length, {
      timeout: 45 * 1000,
      intervals: [5000],
    })
    .toBe(1);
  const [play] = await authGet(page, '/api/me/plays');
  expect(play.track.id).toBe(track.id);
});

test('L9 compte : modification du nom, suppression du compte', async ({
  page,
}) => {
  const { email } = await signIn(page, 'l9');
  await page.goto('/compte');
  await page.getByLabel('Nom affiché').fill('Nouveau Nom');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByText('Modifications enregistrées.')).toBeVisible();
  expect((await authGet(page, '/api/me')).user.name).toBe('Nouveau Nom');

  const del = page.getByRole('button', {
    name: 'Supprimer définitivement mon compte',
  });
  await expect(del).toBeDisabled();
  await page.getByLabel(/Pour confirmer/).fill('SUPPRIMER');
  await del.click();
  await page.waitForURL(/\/connexion$/);

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mot de passe').fill(PASSWORD);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page.getByRole('alert')).toContainText('incorrect');
});

test('L10 panne simulée du serveur : message clair', async ({ page }) => {
  await signIn(page, 'l10');
  await page.goto('/formules');
  const pass = page.locator('[data-plan="pass_90j"]');
  await pass.getByRole('button', { name: 'Payer par Mobile Money' }).click();
  await pass.getByLabel('Numéro de téléphone').fill('677123456');
  await page.request.put('/api/dev/settings', {
    data: { latencyMs: 0, failRate: 1 },
  });
  await pass.getByRole('button', { name: /^Payer 5/ }).click();
  await expect(pass.getByRole('alert')).toContainText(
    'Service momentanément indisponible'
  );
  expect(new URL(page.url()).pathname).toBe('/formules');
});

test('L11 rappel J-2 avant renouvellement', async ({ page }) => {
  const { email } = await signIn(page, 'l11');
  await payByCard(page);
  await page.request.post(`/api/dev/users/${email}/subscription/ends-in`, {
    data: { days: 1 },
  });
  await page.request.post('/api/dev/reminders/run');
  const mails = await mailbox(page.request, email);
  expect(mails.map(m => m.subject)).toContain(
    'Votre abonnement Ô musiki sera renouvelé'
  );
});

test('@mobile pages Formules, Abonnement et Compte sans débordement', async ({
  page,
}) => {
  await signIn(page, 'mob');
  for (const path of ['/formules', '/abonnement', '/compte']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() =>
      [document.documentElement, document.querySelector('main')].some(
        el => el && el.scrollWidth > el.clientWidth + 1
      )
    );
    expect(overflow, `débordement horizontal sur ${path}`).toBe(false);
  }
});
