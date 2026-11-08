// services/authService.js
// Sélection de l'implémentation d'authentification selon VITE_BACKEND :
//   demo -> tout simulé dans le navigateur (services/auth/demoAuthService.js)
//   api  -> API locale ou distante (services/auth/apiAuthService.js)
// Le passage à Cognito ajoutera une troisième implémentation avec la même interface.
import { isApiMode } from '../config/env';
import { demoAuthService } from './auth/demoAuthService';
import { apiAuthService } from './auth/apiAuthService';

export const authService = isApiMode ? apiAuthService : demoAuthService;

export default authService;
