import { createContext, useContext, useEffect, useState } from 'react';
import { api, setAuthToken } from '../api/client';

const AuthContext = createContext(null);

const STORAGE_KEY = 'digital_workforce_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setAuthToken(data.token);
        setUser(data.user);
      } catch { /* corrupted storage - ignore */ }
    }
    setInitializing(false);
  }, []);

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    setAuthToken(data.token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: data.token, user: data.user }));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    setAuthToken(null);
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, initializing, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function hasRole(user, ...roles) {
  return user && (roles.includes(user.role) || user.role === 'admin');
}