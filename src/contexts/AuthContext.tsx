import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, setCurrentAppUserNombre } from '../services/firebase';
import { getAppUser } from '../services/users';
import type { AppUser, UserRole } from '../types';

interface AuthContextValue {
  user: User | null;
  appUser: AppUser | null;
  role: UserRole | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAppUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const profile = await getAppUser(u.uid);
          setAppUser(profile);
          setCurrentAppUserNombre(profile?.nombre ?? null);
        } catch (e) {
          console.error('[auth] failed to load user profile', e);
          setAppUser(null);
          setCurrentAppUserNombre(null);
        }
      } else {
        setAppUser(null);
        setCurrentAppUserNombre(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const refreshAppUser = useCallback(async () => {
    const current = auth.currentUser;
    if (!current) return;
    try {
      const profile = await getAppUser(current.uid);
      setAppUser(profile);
      setCurrentAppUserNombre(profile?.nombre ?? null);
    } catch (e) {
      console.error('[auth] refreshAppUser failed', e);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      appUser,
      role: appUser?.role ?? null,
      loading,
      login,
      logout,
      refreshAppUser,
    }),
    [user, appUser, loading, login, logout, refreshAppUser],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
