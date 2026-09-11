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
      .catch((error) => {
        if (cancelled) return;
        // A sleeping server is not a dead session — throwing the token away
        // here would sign the user out every time Render spins down.
        if (error.isOffline) setStatus('unreachable');
        else signOutLocally();
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

  /** Re-run the boot check after the server was unreachable. */
  const retryConnection = useCallback(() => {
    if (getToken()) setStatus('checking');
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isSignedIn: status === 'signed-in',
      signIn,
      signOut,
      retryConnection,
    }),
    [user, status, signIn, signOut, retryConnection],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
