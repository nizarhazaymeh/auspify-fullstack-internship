import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, setUnauthorizedHandler } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    authApi
      .session(ctrl.signal)
      .then(({ user: u }) => setUser(u))
      .catch(() => {})
      .finally(() => !ctrl.signal.aborted && setChecking(false));
    return () => ctrl.abort();
  }, []);

  // Any 401 from the API (expired session) drops the user back to the login page.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
  }, []);

  const login = useCallback(async (creds) => {
    const { user: u } = await authApi.login(creds);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (data) => {
    const { user: u } = await authApi.register(data);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {});
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, checking, login, register, logout, setUser }),
    [user, checking, login, register, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
