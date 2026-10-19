import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, refreshSession, setAccessToken, User } from '../lib/api';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
const Ctx = createContext<AuthState>(null as unknown as AuthState);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshSession().then((s) => setUser(s.user)).catch(() => undefined).finally(() => setLoading(false));
  }, []);

  const start = (d: { accessToken: string; user: User }) => { setAccessToken(d.accessToken); setUser(d.user); };
  const login = useCallback(async (email: string, password: string) => start((await api.post('/auth/login', { email, password })).data), []);
  const register = useCallback(async (name: string, email: string, password: string) => start((await api.post('/auth/register', { name, email, password })).data), []);
  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } finally { setAccessToken(null); setUser(null); }
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
