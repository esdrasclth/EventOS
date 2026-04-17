import { useState, useEffect } from 'react';
import type { Orden } from '../types';
import { subscribeToOrdenes } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

interface UseOrdenesResult {
  ordenes: Orden[];
  loading: boolean;
  error: string | null;
}

export function useOrdenes(): UseOrdenesResult {
  const { user, role, loading: authLoading } = useAuth();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !role) {
      setLoading(false);
      return;
    }

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

  return { ordenes, loading, error };
}
