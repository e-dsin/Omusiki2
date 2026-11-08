// contexts/SubscriptionContext.jsx
// État d'abonnement de l'utilisateur connecté : qui a accès à l'écoute, jusqu'à quand.
// Le serveur reste la référence (il recalcule renouvellements et expirations) ; ce contexte n'en est qu'une copie.
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AuthContext } from './AuthContext';
import { billingService } from '../services/billingService';

const NONE = { status: 'none', hasAccess: false };
const RECHECK_MS = 60 * 1000; // revérification périodique (fin de pass, résiliation échue)

const SubscriptionContext = createContext(null);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context)
    throw new Error(
      'useSubscription doit être utilisé dans un SubscriptionProvider'
    );
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [subscription, setSubscription] = useState(NONE);
  const [loading, setLoading] = useState(Boolean(user));
  const pending = useRef(null);

  const refresh = useCallback(() => {
    if (!user) {
      setSubscription(NONE);
      setLoading(false);
      return Promise.resolve(NONE);
    }
    const request = billingService
      .getSubscription(user)
      .then(sub => {
        if (pending.current === request) setSubscription(sub);
        return sub;
      })
      .catch(() => NONE) // serveur injoignable : on garde l'état connu
      .finally(() => {
        if (pending.current === request) {
          pending.current = null;
          setLoading(false);
        }
      });
    pending.current = request;
    setLoading(true);
    return request;
  }, [user]);

  useEffect(() => {
    refresh();
    if (!user) return undefined;
    const timer = setInterval(refresh, RECHECK_MS);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [user, refresh]);

  // Accès à l'écoute, en attendant la réponse du serveur si elle est en cours
  const checkAccess = useCallback(async () => {
    if (pending.current) return (await pending.current).hasAccess;
    return subscription.hasAccess;
  }, [subscription]);

  const cancelRenewal = useCallback(async () => {
    const sub = await billingService.cancelRenewal();
    setSubscription(sub);
    return sub;
  }, []);

  const resumeRenewal = useCallback(async () => {
    const sub = await billingService.resumeRenewal();
    setSubscription(sub);
    return sub;
  }, []);

  const value = useMemo(
    () => ({
      subscription,
      hasAccess: subscription.hasAccess,
      loading,
      refresh,
      checkAccess,
      cancelRenewal,
      resumeRenewal,
      setSubscription,
    }),
    [subscription, loading, refresh, checkAccess, cancelRenewal, resumeRenewal]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionContext;
