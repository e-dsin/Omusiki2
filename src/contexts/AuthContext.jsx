import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { authService } from '../services/authService';
import { SESSION_EXPIRED_EVENT } from '../services/apiClient';

export const AuthContext = createContext();

// Les erreurs ne sont pas interceptées ici : chaque formulaire les affiche (voir services/authErrors.js).
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // Action d'authentification en cours (connexion, inscription, code…)
  const [isLoading, setIsLoading] = useState(false);
  // Restauration de la session au démarrage
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let active = true;
    authService
      .getCurrentUser()
      .then(currentUser => {
        if (active) setUser(currentUser);
      })
      .finally(() => {
        if (active) setIsInitializing(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Session expirée côté serveur (rafraîchissement impossible) : retour à la connexion
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  // Exécute une action d'authentification et met à jour l'utilisateur si elle connecte
  const run = useCallback(async (action, pickUser) => {
    setIsLoading(true);
    try {
      const result = await action();
      const signedInUser = pickUser(result);
      if (signedInUser) setUser(signedInUser);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    (email, password) =>
      run(
        () => authService.signIn(email, password),
        u => u
      ),
    [run]
  );

  // Renvoie { status: 'signed-in', user } ou { status: 'confirm', email }
  const signup = useCallback(
    (email, password, name) =>
      run(
        () => authService.signUp(email, password, name),
        r => (r.status === 'signed-in' ? r.user : null)
      ),
    [run]
  );

  const confirmSignUp = useCallback(
    (email, code) =>
      run(
        () => authService.confirmSignUp(email, code),
        r => r.user
      ),
    [run]
  );

  const resendSignUpCode = useCallback(
    email => authService.resendSignUpCode(email),
    []
  );

  const signInWithProvider = useCallback(
    provider =>
      run(
        () => authService.signInWithProvider(provider),
        u => u
      ),
    [run]
  );

  const requestPasswordReset = useCallback(
    email => authService.requestPasswordReset(email),
    []
  );

  const confirmPasswordReset = useCallback(
    (email, code, newPassword) =>
      authService.confirmPasswordReset(email, code, newPassword),
    []
  );

  const updateProfile = useCallback(async name => {
    const updated = await authService.updateProfile(name);
    setUser(current => ({ ...current, ...updated }));
    return updated;
  }, []);

  const deleteAccount = useCallback(async () => {
    await authService.deleteAccount();
    setUser(null);
  }, []);

  const logout = useCallback(async () => {
    await authService.signOut();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isInitializing,
      login,
      signup,
      confirmSignUp,
      resendSignUpCode,
      signInWithProvider,
      requestPasswordReset,
      confirmPasswordReset,
      updateProfile,
      deleteAccount,
      logout,
    }),
    [
      user,
      isLoading,
      isInitializing,
      login,
      signup,
      confirmSignUp,
      resendSignUpCode,
      signInWithProvider,
      requestPasswordReset,
      confirmPasswordReset,
      updateProfile,
      deleteAccount,
      logout,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
