import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, LOGIN_URL, type Me } from '../api';
import { UNAUTHORIZED_EVENT } from '../api/client';

interface Session {
  /** null = chua dang nhap; undefined = dang kiem tra */
  me: Me | null | undefined;
  isAdmin: boolean;
  cartCount: number;
  balance: number | null;
  login: () => void;
  refreshCart: () => Promise<void>;
  setCartCount: (n: number) => void;
  refreshBalance: () => Promise<void>;
}

const SessionContext = createContext<Session | null>(null);

/**
 * Dang nhap do auth-service dam nhan (OAuth2 + PKCE qua gateway).
 * Frontend chi can: chuyen huong toi /oauth2/authorization/microshop va hoi /api/me xem ai dang dang nhap.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [cartCount, setCartCount] = useState(0);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    api.me().then(setMe, () => setMe(null));
    const onUnauthorized = () => setMe(null);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const refreshCart = useCallback(async () => {
    try {
      const cart = await api.cart();
      setCartCount(cart.items.reduce((n, i) => n + i.quantity, 0));
    } catch {
      /* hien thi badge khong quan trong bang trang chinh */
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    try {
      setBalance(Number((await api.wallet()).balance));
    } catch {
      setBalance(null);
    }
  }, []);

  useEffect(() => {
    if (me) {
      void refreshCart();
      void refreshBalance();
    } else {
      setCartCount(0);
      setBalance(null);
    }
  }, [me, refreshCart, refreshBalance]);

  const value = useMemo<Session>(
    () => ({
      me,
      isAdmin: !!me?.roles.includes('ADMIN'),
      cartCount,
      balance,
      login: () => {
        window.location.href = LOGIN_URL;
      },
      refreshCart,
      setCartCount,
      refreshBalance,
    }),
    [me, cartCount, balance, refreshCart, refreshBalance],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
