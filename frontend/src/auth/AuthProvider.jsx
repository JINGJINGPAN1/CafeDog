import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/api';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }) {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    try {
      const data = await apiFetch('/api/me');
      setMe(data.user || null);
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const register = useCallback(async ({ email, username, password }) => {
    const data = await apiFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password }),
    });
    setMe(data.user || null);
    return data.user;
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    setMe(data.user || null);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    setMe(null);
  }, []);

  const updateMe = useCallback(async (payload) => {
    const data = await apiFetch('/api/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    });
    if (data?.user) setMe(data.user);
    return data?.user;
  }, []);

  const value = useMemo(
    () => ({
      me,
      loading,
      refreshMe,
      updateMe,
      register,
      login,
      logout,
      isLoggedIn: Boolean(me),
    }),
    [me, loading, refreshMe, updateMe, register, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
