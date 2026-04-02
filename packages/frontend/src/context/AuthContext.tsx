import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '@/services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'ADMIN';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<{ verificationCode?: string }>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restaurar sesión
  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (stored && token) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    const accessToken = res.data?.accessToken || res.data?.token;
    const refreshToken = res.data?.refreshToken;
    const userData = res.data?.user;

    if (!accessToken || !refreshToken || !userData) {
      throw new Error('Respuesta de login incompleta');
    }

    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const register = useCallback(async (email: string, name: string, password: string) => {
    const res = await api.auth.register({ email, name, password });
    return { verificationCode: res.data?.verificationCode };
  }, []);

  const verifyEmail = useCallback(async (email: string, code: string) => {
    await api.auth.verifyEmail({ email, code });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
