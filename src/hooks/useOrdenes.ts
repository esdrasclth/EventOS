import { useState, useEffect } from 'react';
import type { Orden } from '../types';
import { subscribeToOrdenes } from '../services/firebase';

interface UseOrdenesResult {
  ordenes: Orden[];
  loading: boolean;
  error: string | null;
}

export function useOrdenes(): UseOrdenesResult {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
    );
    return unsub;
  }, []);

  return { ordenes, loading, error };
}
