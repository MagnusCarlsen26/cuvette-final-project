import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getToken, clearToken, setToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken());

  const login = (t) => {
    setToken(t);
    setTokenState(t);
  };
  const logout = () => {
    clearToken();
    setTokenState(null);
  };

  const value = useMemo(() => ({ token, isAuthenticated: !!token, login, logout }), [token]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    // simple redirect without dependency on router hooks
    if (typeof window !== 'undefined') window.location.href = '/auth/login';
    return null;
  }
  return children;
}


