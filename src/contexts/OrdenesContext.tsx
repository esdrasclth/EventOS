import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Orden } from '../types';
import { subscribeToOrdenes } from '../services/firebase';
import { useAuth } from './AuthContext';

interface OrdenesContextValue {
  ordenes: Orden[];
  loading: boolean;
  error: string | null;
}

const OrdenesContext = createContext<OrdenesContextValue | null>(null);

export function OrdenesProvider({ children }: { children: React.ReactNode }) {
  const { user, role, loading: authLoading } = useAuth();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !role) {
      setOrdenes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsub = subscribeToOrdenes(
      (data) => {
        setOrdenes(data);
        setLoading(false);
      },
      (e) => {
        setError('Error al cargar las órdenes');
        setLoading(false);
        console.error(e);
      },
      { role, uid: user.uid },
    );
    return unsub;
  }, [authLoading, user, role]);

  return (
    <OrdenesContext.Provider value={{ ordenes, loading, error }}>
      {children}
    </OrdenesContext.Provider>
  );
}

export function useOrdenesContext(): OrdenesContextValue {
  const ctx = useContext(OrdenesContext);
  if (!ctx) throw new Error('useOrdenesContext must be used inside OrdenesProvider');
  return ctx;
}
