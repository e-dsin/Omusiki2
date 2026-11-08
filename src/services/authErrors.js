// services/authErrors.js
// Traduction des erreurs d'authentification (noms d'erreurs Amazon Cognito / Amplify) en messages français.

const MESSAGES = {
  // Connexion : même message pour « utilisateur inconnu » et « mot de passe faux »
  // afin de ne pas révéler quels emails possèdent un compte.
  NotAuthorizedException: 'Email ou mot de passe incorrect.',
  UserNotFoundException: 'Email ou mot de passe incorrect.',
  UserNotConfirmedException:
    'Votre compte n’est pas encore confirmé : saisissez le code reçu par email.',
  UsernameExistsException: 'Un compte existe déjà avec cet email.',
  InvalidPasswordException:
    'Le mot de passe ne respecte pas les règles de sécurité.',
  InvalidParameterException: 'Certaines informations saisies sont invalides.',
  CodeMismatchException: 'Code incorrect. Vérifiez le code reçu par email.',
  ExpiredCodeException: 'Ce code a expiré. Demandez-en un nouveau.',
  LimitExceededException:
    'Trop de tentatives. Réessayez dans quelques minutes.',
  TooManyRequestsException:
    'Trop de tentatives. Réessayez dans quelques minutes.',
  NetworkError:
    'Connexion impossible. Vérifiez votre réseau (ou que le serveur local est démarré).',
  // Erreurs de l'API (back-end simulé puis réel)
  TokenExpired: 'Votre session a expiré. Reconnectez-vous.',
  InvalidToken: 'Votre session a expiré. Reconnectez-vous.',
  NotAuthenticated: 'Votre session a expiré. Reconnectez-vous.',
  ServiceUnavailable: 'Service momentanément indisponible. Réessayez.',
  SubscriptionRequired: 'Un abonnement est nécessaire pour écouter ce titre.',
  InvalidPhoneNumber:
    'Numéro invalide : 9 chiffres commençant par 6 (ex. 6 70 00 00 00).',
  AlreadySubscribed: 'Vous avez déjà un abonnement carte actif.',
  InvalidPlan: 'Cette formule n’est pas disponible avec ce moyen de paiement.',
};

// Message traduit ; à défaut, le message en français renvoyé par l'API ; à défaut, un message générique
export const getAuthErrorMessage = error =>
  MESSAGES[error?.name] ||
  (error?.status && error?.message) ||
  'Une erreur est survenue. Réessayez.';

export const getErrorMessage = getAuthErrorMessage;

// Règles de mot de passe : à aligner sur la politique configurée dans le User Pool Cognito.
export const PASSWORD_RULES = [
  { test: pw => pw.length >= 8, label: '8 caractères minimum' },
  { test: pw => /[A-Z]/.test(pw), label: 'une majuscule' },
  { test: pw => /[a-z]/.test(pw), label: 'une minuscule' },
  { test: pw => /\d/.test(pw), label: 'un chiffre' },
];

export const getPasswordIssues = password =>
  PASSWORD_RULES.filter(rule => !rule.test(password)).map(rule => rule.label);

export const isValidEmail = email =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
