import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as authApi from '../api/auth.js';
import { clearToken, getToken, setToken, setUnauthorizedHandler } from '../api/axios.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  // 'checking' until the stored token has been confirmed with the server.
  const [status, setStatus] = useState(getToken() ? 'checking' : 'signed-out');

  const signOutLocally = useCallback(() => {
    clearToken();
    setUser(null);
    setStatus('signed-out');
    queryClient.clear(); // never leave one session's data for the next
  }, [queryClient]);

  // A 401 on any request means the session is gone.
  useEffect(() => {
    setUnauthorizedHandler(signOutLocally);
    return () => setUnauthorizedHandler(null);
  }, [signOutLocally]);

  // Confirm a stored token on boot instead of trusting it.
  useEffect(() => {
    if (status !== 'checking') return undefined;
    let cancelled = false;

    authApi
      .fetchMe()
      .then(({ user: me }) => {
        if (cancelled) return;
        setUser(me);
        setStatus('signed-in');
      })
      .catch(() => {
        if (!cancelled) signOutLocally();
      });

    return () => {
      cancelled = true;
    };
  }, [status, signOutLocally]);

  const signIn = useCallback(async (credentials) => {
    const { token, user: signedIn } = await authApi.login(credentials);
    setToken(token);
    setUser(signedIn);
    setStatus('signed-in');
    return signedIn;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // the local session is cleared either way
    }
    signOutLocally();
  }, [signOutLocally]);

  const value = useMemo(
    () => ({ user, status, isSignedIn: status === 'signed-in', signIn, signOut }),
    [user, status, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
