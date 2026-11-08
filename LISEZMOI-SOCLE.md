# Ô musiki — Socle de la vue Abonné (MVP 1) — v1.2

La v1.2 relie le front à un **back-end simulé en Python** (FastAPI + SQLite) qui reproduit les services
managés du MVP 1 : identité (contrat Cognito), API cœur (catalogue, favoris, écoutes), paiement carte
(contrat Stripe Checkout) et mobile money (contrat Aftawallet). Les pages Formules, Paiement, Abonnement
et Compte sont construites. Tout se lance et se débogue depuis **VS Code sous Windows**.

> Développement uniquement : tarifs fictifs, aucun paiement réel, aucune donnée envoyée à l'extérieur.

## Nouveautés de la v1.2

| Sujet | Avant (v1.1) | Après (v1.2) |
|---|---|---|
| Back-end | Aucun : tout simulé dans le navigateur | `backend/` : API FastAPI locale, base SQLite, 22 tests pytest |
| Modes du front | Démo uniquement | `VITE_BACKEND=demo` (inchangé) ou `api` (`npm run dev:api`) |
| Authentification | Démo | Mode api : vrais comptes, mot de passe chiffré (bcrypt), code par email, jetons JWT renouvelés automatiquement |
| Accès à l'écoute | Libre | Réservé aux abonnés : sans formule active, la lecture renvoie vers `/formules` ; le lecteur s'arrête quand l'accès prend fin |
| `/formules` | Page d'attente | 3 formules : Premium mensuel (carte), Pass 30 et 90 jours (MTN / Orange Money) |
| `/paiement/retour` | Page d'attente | Retour Stripe (succès, annulation), attente de validation mobile money (interrogation toutes les 2 s) |
| `/abonnement` | Page d'attente | État réel, résiliation avec confirmation, reprise, prolongation du pass, historique des paiements |
| `/compte` | Page d'attente | Modification du nom, déconnexion, suppression du compte (saisie de « SUPPRIMER ») |
| Favoris | Navigateur uniquement | Mode api : enregistrés sur le serveur (retrouvés sur un autre appareil), mise à jour immédiate et annulée en cas d'échec |
| Écoutes | Non comptées | Mode api : une écoute est enregistrée après 30 s (base du compteur artiste et des royalties) |
| Profil (barre du haut) | « Plan Premium » et date fictifs | Formule et échéance réelles, bouton « Gérer mon abonnement » ou « Choisir une formule » |
| Tests | Scripts ponctuels | `e2e/` : 11 parcours Playwright rejouables (`npm run e2e`) |
| VS Code | — | Tâches, débogage back + front, extensions recommandées, scripts PowerShell |

## Tester en local sous Windows avec VS Code

### Prérequis (une fois)

- **Python 3.11 à 3.13** depuis python.org (cocher « Add python.exe to PATH ») ;
- **Node.js 20.19 ou plus** (version LTS) ;
- **VS Code** ; à l'ouverture du dossier, accepter l'installation des extensions recommandées
  (Python, débogueur Python, ESLint, Prettier, Tailwind, Playwright, REST Client).

### Installation

1. Copier le contenu de ce dossier à la racine du dépôt (voir aussi « Installation du socle » plus bas
   pour les fichiers à supprimer).
2. Ouvrir le dossier dans VS Code, puis **Terminal > Exécuter une tâche… > Installation (première fois)**.
   La tâche crée `backend\.venv`, installe les dépendances Python et npm, télécharge Chromium pour les tests
   et lance les tests du back-end. Équivalent en ligne de commande :
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
   ```

### Démarrer

| Besoin | VS Code | Ligne de commande |
|---|---|---|
| Back + front (mode api) | **Ctrl+Maj+B** (« Tout démarrer ») | `powershell -ExecutionPolicy Bypass -File scripts/dev.ps1` |
| Front seul, sans serveur (mode démo) | Tâche « Front : démarrer (mode démo, sans back-end) » | `scripts/dev.ps1 -Mode demo` |
| Déboguer back + front | **F5** sur « Pile complète : back + front (débogage) » (Chrome) ou « (Edge) » | — |

- Application : <http://127.0.0.1:3000>
- Documentation interactive de l'API : <http://127.0.0.1:3001/docs>
- Requêtes prêtes à l'emploi : `backend/api.http` (bouton « Send Request » de REST Client)
- Base locale : `backend/data/omusiki.db` ; tâche « Base locale : réinitialiser » pour repartir de zéro.

Le front appelle `/api/...` sur son propre port ; Vite relaie vers `127.0.0.1:3001` (`vite.config.mjs`).
L'adresse `127.0.0.1` est utilisée plutôt que `localhost`, qui vise parfois l'IPv6 (`::1`) sous Windows.

### Tester

| Tests | VS Code | Ligne de commande |
|---|---|---|
| Back-end (22 tests) | Tâche « Back-end : tests (pytest) » ou panneau Tests | `cd backend; .venv\Scripts\python -m pytest` |
| Bout en bout (11 parcours) | Tâche « E2E : tests de bout en bout » ou extension Playwright | `npm run e2e` |
| Rapport E2E | Tâche « E2E : rapport du dernier passage » | `npx playwright show-report` |

`npm run e2e` démarre lui-même le back-end et le front s'ils ne tournent pas déjà.

## Règles de la simulation

**Comptes (mode api)** : créer un compte depuis `/connexion`. Le code à 6 chiffres s'affiche dans le terminal
du back-end (`📧 … [code : 123456]`) et dans la boîte mail simulée (tâche « Boîte mail simulée »).
Google et Apple ouvrent un compte de démonstration (`demo.google@omusiki.test`).
Mot de passe : 8 caractères minimum, une majuscule, une minuscule, un chiffre.

**Paiement carte** : la page de paiement hébergée est simulée (aucune saisie de carte). Trois boutons :
paiement accepté, carte refusée (on reste sur la page), annuler (retour sans débit).

**Mobile money** : numéro camerounais à 9 chiffres commençant par 6. Le paiement reste « en attente »
6 secondes (validation sur le téléphone simulée), puis il est validé. Un numéro **se terminant par 0000**
simule un refus. Un nouveau pass prolonge le pass en cours. Un pass n'est pas proposé tant qu'un abonnement
carte se renouvelle (évite un double prélèvement).

**Outils de test** (désactivés avec `OMUSIKI_DEV=0`, voir `backend/api.http`) : faire expirer un accès,
rapprocher l'échéance puis envoyer les rappels J-2, latence et pannes réseau simulées, remise à zéro.

**Mode démo** (sans serveur, inchangé) : à la connexion, compte « Premium » avec accès ; à l'inscription,
compte sans formule. Paiement carte accepté immédiatement ; mobile money validé après 4 s (0000 : refus).

## Parcours vérifiés de bout en bout

Exécutés sur le build en mode api **et** sur le serveur de développement démarré par `npm run e2e`
(Chromium, bureau 1366 px ; contrôle mobile Pixel 7) : **13 tests passants sur 13**.

| # | Parcours |
|---|---|
| L1 | Inscription, code faux refusé, code reçu par email accepté, arrivée sur l'accueil |
| L2 | Sans formule, « Écouter » renvoie vers `/formules` avec le titre demandé ; le lecteur ne s'ouvre pas |
| L3 | Abonnement carte : carte refusée, puis paiement accepté, retour, confirmation, lecture autorisée |
| L4 | `/abonnement` : résiliation confirmée (accès conservé jusqu'à l'échéance), reprise, historique « Payé » |
| L5 | Pass mobile money : numéro invalide, refus sur le téléphone (0000), puis paiement Orange validé |
| L6 | Fin d'accès pendant l'écoute : le lecteur s'arrête, la lecture suivante renvoie vers `/formules` |
| L7 | Favori ajouté, retrouvé dans la Bibliothèque depuis une autre session (autre appareil) |
| L8 | Une écoute de 30 s est enregistrée par le serveur, sur le bon titre |
| L9 | Modification du nom ; suppression du compte, puis connexion refusée |
| L10 | Panne du serveur pendant un paiement : message « Service momentanément indisponible », page conservée |
| L11 | Rappel par email deux jours avant le renouvellement |
| — | Formules, Abonnement, Compte sans débordement horizontal, sur bureau et sur mobile |

Mode démo, revérifié : connexion et lecture, inscription sans formule renvoyée vers `/formules`,
paiements carte et mobile money, **aucun appel au serveur**, aucune erreur JavaScript.

## Comment c'est construit

```
navigateur ──> front Vite :3000 ──/api──> back-end FastAPI :3001 ──> SQLite (backend/data)
                 │                              ├─ /api/auth/*      contrat Cognito (codes, jetons)
                 │                              ├─ /api/me, /api/tracks, /api/collections, /api/plays
                 │                              ├─ /api/checkout/stripe + page de paiement simulée + webhook
                 │                              ├─ /api/payments/aftawallet + webhook
                 │                              └─ /api/dev/*       outils de test
                 └─ services/*.js : une implémentation « demo » et une « api », même interface
```

- `src/services/apiClient.js` : appel unique à l'API, jeton d'accès, renouvellement automatique du jeton
  expiré, erreurs normalisées (`{ error, message }`, noms d'erreurs Cognito traduits dans `authErrors.js`).
- `src/services/authService.js` choisit `auth/demoAuthService.js` ou `auth/apiAuthService.js` ;
  `billingService.js` et `libraryService.js` suivent le même principe.
- `src/contexts/SubscriptionContext.jsx` : copie de l'état d'abonnement (le serveur reste la référence),
  revérifiée toutes les minutes et au retour sur l'onglet.
- Le catalogue du back-end est lu dans `src/services/musicDatabase.js` (variable `OMUSIKI_CATALOG_JS`).
- **Passage aux services réels** : remplacer l'URL (`VITE_API_URL`) et les implémentations « api » par Cognito
  (Amplify), Stripe Checkout et Aftawallet. Les contrats d'API (routes, champs, noms d'erreurs, webhooks
  signés) ont été calqués sur ces services pour limiter les changements côté front.

## Plan des routes

| URL | Page | Accès | État |
|---|---|---|---|
| `/connexion` | Authentification | Public | Finalisée (v1.1) |
| `/legal/cgu`, `/legal/confidentialite`, `/legal/cookies` | Pages légales | Public | À rédiger |
| `/` | Accueil | Abonné | Existante |
| `/recherche` | Recherche | Abonné | Existante |
| `/bibliotheque` | Bibliothèque | Abonné | Existante ; favoris synchronisés en mode api |
| `/collection/:id` | Détail de classement ou collection | Abonné | Existante |
| `/formules` | Choix de formule et paiement | Abonné | **Nouvelle (v1.2)** |
| `/paiement/retour` | Confirmation de paiement | Abonné | **Nouvelle (v1.2)** |
| `/abonnement` | Mon abonnement | Abonné | **Nouvelle (v1.2)** |
| `/compte` | Mon compte | Abonné | **Nouvelle (v1.2)** |
| toute autre URL | 404 | Abonné | Existante |

## Fichiers de la v1.2

**Nouveaux (front)** : `.env.api`, `playwright.config.js`, `e2e/omusiki.spec.js`,
`src/services/apiClient.js`, `src/services/auth/apiAuthService.js`, `src/services/auth/demoAuthService.js`
(ancien `authService.js`), `src/services/billingService.js`, `src/services/libraryService.js`,
`src/contexts/SubscriptionContext.jsx`, `src/hooks/usePlayLogger.js`, `src/pages/PlansPage.jsx`,
`src/pages/PaymentReturnPage.jsx`, `src/pages/SubscriptionPage.jsx`, `src/pages/AccountPage.jsx`,
`src/pages/account/ui.jsx`.

**Nouveaux (back-end et outillage)** : `backend/` (application, tests, `api.http`), `.vscode/` (tâches,
débogage, réglages, extensions), `scripts/setup.ps1`, `scripts/dev.ps1`, `scripts/setup.sh`, `.gitignore`.

**Modifiés** : `src/services/authService.js` (sélection démo / api), `src/services/authErrors.js` (erreurs de
l'API), `src/contexts/AuthContext.jsx` (modification du profil, suppression du compte, session expirée),
`src/contexts/FavoritesContext.jsx` (synchronisation serveur), `src/contexts/EnhancedPlayerContext.jsx`
(contrôle d'accès avant lecture), `src/components/UI/TopNavBar.jsx` (abonnement réel), `src/App.jsx`,
`src/router/AppRoutes.jsx`, `src/layouts/MainLayout.jsx`, `src/config/env.js`, `src/index.css`,
`vite.config.mjs`, `package.json` (scripts `dev:api`, `build:api`, `e2e`), `.env.example`.

## Points restant ouverts

- **Titres de la bannière d'accueil** (`HeroSection.jsx`) : codés en dur, hors catalogue et d'artistes réels.
  Leurs écoutes ne sont pas comptées (titre inconnu du serveur). À alimenter depuis le catalogue (console CMS).
- **Protection des flux audio** : le contrôle d'accès est fait dans l'interface. En production, le serveur
  devra délivrer des URL de lecture signées (Mux) aux seuls abonnés ; la route `/api/tracks/{id}/stream`
  (refus 403 sans formule) en pose le principe.
- **Serveur injoignable au démarrage** : l'utilisateur voit l'écran de connexion (ses jetons sont conservés).
  Prévoir un écran « service indisponible, réessayer ».
- **Changement de formule** (carte vers pass, mensuel vers annuel) : non géré au-delà de la règle « résilier
  d'abord ». À définir avec le comité, comme les **tarifs** (fictifs ici).
- **Après inscription**, l'utilisateur arrive sur l'accueil et découvre les formules au premier « Écouter ».
  Décider s'il doit plutôt être dirigé directement vers `/formules`.
- **Déploiement** : la v1.2 couvre le poste de développement. Hébergement du front (S3 + CloudFront ou
  Amplify Hosting), de l'API et branchement des vrais services : étape suivante.
- **Compte non confirmé** : à la connexion, `UserNotConfirmedException` affiche un message mais ne renvoie
  pas encore vers la saisie du code.
- **Lecteur sur mobile** : la vue plein écran déborde à 390 px (inchangé depuis la v1.0).
- **Dépendances** : `@mui/material`, `@emotion/*` et `hls.js` semblent inutilisés ; `npm run lint` signale
  des erreurs anciennes dans des fichiers d'origine (imports inutilisés), aucune dans les fichiers du socle.
- Les liens légaux du pied de page ne sont pas encore reliés à `/legal/*`.

## Historique

### v1.1 : authentification finalisée

| Écran | Avant | Après |
|---|---|---|
| Connexion | Aucun message d'erreur ; pendant l'envoi, le formulaire était remplacé par un écran de chargement (saisie perdue en cas d'échec) | Message d'erreur en français, saisie conservée, bouton « Connexion… » pendant l'envoi |
| Google / Apple | Boutons sans action | Branchés (`signInWithProvider`) ; à l'inscription, bloqués tant que les CGU ne sont pas acceptées |
| Inscription | `alert()` si les mots de passe diffèrent ; aucune règle de mot de passe ; pas de CGU | Messages dans le formulaire, règles affichées et vérifiées, **case CGU / confidentialité obligatoire** |
| Confirmation du compte | Inexistante | Étape « code à 6 chiffres » avec renvoi du code (parcours Cognito par défaut) |
| Mot de passe oublié | Simulation : affichait toujours « email envoyé », sans rien appeler | Parcours en 3 étapes : email, puis code et nouveau mot de passe, puis confirmation |
| Formulaires | Pas de balise `<form>`, `onKeyPress` (déprécié), styles copiés dans chaque fichier | Vrais formulaires (Entrée, gestionnaires de mots de passe, `autocomplete`), libellés accessibles, styles mutualisés dans `authStyles.js` |

L'apparence est inchangée : les valeurs de style d'origine sont reprises à l'identique.

**Tester sans back-end (mode démo)** :
- mot de passe `mauvais` à la connexion : erreur « Email ou mot de passe incorrect » ;
- email contenant `+code` à l'inscription (ex. `marcel+code@test.fr`) : étape de confirmation ;
- code de confirmation ou de réinitialisation : `123456`.

### Changements de la v1.0

| Sujet | Avant | Après |
|---|---|---|
| Build | `react-scripts` (Create React App, abandonné) ; `index.js` n'importait pas `index.css` | **Vite 7**, point d'entrée unique `src/main.jsx` |
| Navigation | `MainLayout` n'affichait que `HomeTab` ; Recherche et Bibliothèque inaccessibles | **Routeur** (`react-router-dom` 7) avec une URL par page |
| Lecteur | Monté dans `HomeTab` | Monté dans le layout : **la musique continue quand on change de page** |
| Providers | Toasts et favoris non montés (Recherche/Bibliothèque plantaient) | Auth, lecteur, favoris, toasts montés dans `App.jsx` |
| Favoris | Deux implémentations sur la même clé de stockage | Une seule (`contexts/FavoritesContext`) ; `FavoritesSystem` la ré-exporte |
| Session | Perdue au rechargement | Restaurée au démarrage (`services/authService.js`, interface prête pour Cognito) |
| Mobile | Aucune navigation mobile ; mini-lecteur collé au bas de l'écran | Barre d'onglets en bas d'écran (< 768 px) ; mini-lecteur placé au-dessus |
| Classements | Détail affiché par un état interne de `HomeTab` | Vraie page `/collection/:id` (lien partageable, bouton Retour) |
| Poids initial | Bundle unique d'environ 430 Ko compressés | Environ 100 Ko compressés ; lecteur Mux chargé à la demande |
| Variables d'env. | `REACT_APP_*` | `VITE_*`, lues dans `src/config/env.js` |
| Corrections | Textes `` `&apos;` `` visibles (pied de page, profil), « aucun résultat » mal échappé | Corrigés |

### Installation du socle dans le dépôt (v1.0)

1. Copier le contenu de ce dossier à la racine du dépôt (les fichiers existants sont remplacés).
2. **Supprimer** les fichiers devenus inutiles :
   - `src/index.js` (point d'entrée CRA) et `src/App.css` (gabarit Vite inutilisé) ;
   - `vite.config.js` (remplacé par `vite.config.mjs`) ;
   - `public/index.html` (Vite utilise `index.html` à la racine ; garder `public/` pour les médias `/biblio/...` et le favicon) ;
   - `src/services/AudioDeviceService.js` et `src/contexts/AudioSettingsContext.jsx` (demandaient l'accès au micro) ;
   - `.env` : recréer un `.env.local` à partir de `.env.example`.
3. Réinstaller puis lancer :
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run dev        # http://localhost:3000
   npm run build      # production, dans build/
   ```
   Node 20.19 ou supérieur est requis.

### Vérifications des versions précédentes

- `vite build` sans erreur ; lint sans erreur sur tous les fichiers du socle.
- Parcours testés dans Chromium, sur bureau (1366 px) et mobile (390 px) :
  redirection vers `/connexion` puis retour à la page demandée, session conservée au rechargement,
  accueil, clic sur un classement, lecture puis changement de page (la lecture continue),
  recherche, ajout d'un favori puis affichage dans la Bibliothèque, pages d'attente, 404,
  page légale sans connexion.
- v1.1 : 19 vérifications d'authentification passantes sur bureau et sur mobile (champs vides,
  mauvais mot de passe avec saisie conservée, connexion, Google, règles de mot de passe,
  confirmation différente, CGU obligatoires, code faux, renvoi du code, bon code, inscription
  directe, mot de passe oublié de bout en bout, page légale publique, aucune boîte `alert()`).
- Les tests ont utilisé un catalogue réduit (14 titres) à la place de `musicDatabase.js`.
