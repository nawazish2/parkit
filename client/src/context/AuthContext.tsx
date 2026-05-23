import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, AuthContextType } from '../types';
import api from '../api/axios';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const syncProfile = async () => {
    const activeToken = token || localStorage.getItem('parkit_token');
    if (!activeToken) return;
    try {
      const res = await api.get('/auth/profile');
      setUser(res.data);
      localStorage.setItem('parkit_user', JSON.stringify(res.data));
    } catch (err) {
      console.error('Failed to sync profile', err);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('parkit_token');
    const savedUser = localStorage.getItem('parkit_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        // Corrupted localStorage — clear and continue as logged out
        localStorage.removeItem('parkit_user');
        localStorage.removeItem('parkit_token');
        return;
      }

      // Async sync profile details on mount
      api.get('/auth/profile')
        .then(res => {
          setUser(res.data);
          localStorage.setItem('parkit_user', JSON.stringify(res.data));
        })
        .catch(err => console.error('Failed to sync profile on mount', err));
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('parkit_token', newToken);
    localStorage.setItem('parkit_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('parkit_token');
    localStorage.removeItem('parkit_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, syncProfile, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
