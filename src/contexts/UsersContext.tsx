import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { AppUser } from '../types';
import { subscribeToUsers } from '../services/users';
import { useAuth } from './AuthContext';

interface UsersContextValue {
  users: AppUser[];
  loading: boolean;
  error: string | null;
  updateLocal: (uid: string, patch: Partial<AppUser>) => void;
}

const UsersContext = createContext<UsersContextValue | null>(null);

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsub = subscribeToUsers(
      (data) => {
        setUsers(data);
        setLoading(false);
      },
      (e) => {
        setError('Error al cargar los usuarios');
        setLoading(false);
        console.error(e);
      },
    );
    return unsub;
  }, [authLoading, user]);

  const updateLocal = useCallback((uid: string, patch: Partial<AppUser>) => {
    setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, ...patch } : u)));
  }, []);

  return (
    <UsersContext.Provider value={{ users, loading, error, updateLocal }}>
      {children}
    </UsersContext.Provider>
  );
}

export function useUsersContext(): UsersContextValue {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error('useUsersContext must be used inside UsersProvider');
  return ctx;
}
