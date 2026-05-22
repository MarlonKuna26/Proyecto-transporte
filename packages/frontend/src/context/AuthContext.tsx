import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '@/services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'ADMIN';
  photoUrl?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    name: string,
    password: string,
  ) => Promise<{ verificationCode?: string; expiresInMinutes?: number }>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ code?: string; expiresInMinutes?: number }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
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
    const restoreSession = async () => {
      const stored = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (stored && token) {
        try {
          const parsedUser = JSON.parse(stored);
          setUser(parsedUser);
          
          // Obtener el perfil de la base de datos en segundo plano
          try {
            const res = await api.users.getProfile();
            if (res.data) {
              const enrichedUser = {
                ...parsedUser,
                name: res.data.name || parsedUser.name,
                photoUrl: res.data.photoUrl || null
              };
              localStorage.setItem('user', JSON.stringify(enrichedUser));
              setUser(enrichedUser);
            }
          } catch (profileError) {
            console.error('Error syncing user profile on load:', profileError);
          }
        } catch (e) {
          console.error('Error restoring session:', e);
        }
      }
      setLoading(false);
    };
    restoreSession();
  }, []);

  const refreshUser = useCallback(async () => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsedUser = JSON.parse(stored);
        const res = await api.users.getProfile();
        if (res.data) {
          const enrichedUser = {
            ...parsedUser,
            name: res.data.name || parsedUser.name,
            photoUrl: res.data.photoUrl || null
          };
          localStorage.setItem('user', JSON.stringify(enrichedUser));
          setUser(enrichedUser);
        }
      } catch (err) {
        console.error('Error refreshing user:', err);
      }
    }
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
    
    // Si login no devolvió photoUrl, podemos intentar recuperarla si existe
    let finalUserData = userData;
    try {
      const pRes = await api.users.getProfile();
      if (pRes.data && pRes.data.photoUrl) {
        finalUserData = { ...userData, photoUrl: pRes.data.photoUrl };
      }
    } catch {}

    localStorage.setItem('user', JSON.stringify(finalUserData));
    setUser(finalUserData);
  }, []);

  const register = useCallback(async (email: string, name: string, password: string) => {
    const res = await api.auth.register({ email, name, password });
    return {
      verificationCode: res.data?.verificationCode,
      expiresInMinutes: res.data?.expiresInMinutes,
    };
  }, []);

  const verifyEmail = useCallback(async (email: string, code: string) => {
    await api.auth.verifyEmail({ email, code });
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const res = await api.auth.forgotPassword(email);
    return {
      code: res.data?.code,
      expiresInMinutes: res.data?.expiresInMinutes,
    };
  }, []);

  const resetPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    await api.auth.resetPassword(email, code, newPassword);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyEmail, requestPasswordReset, resetPassword, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
