import { useState, useEffect, useCallback } from 'react';
import type { Orden } from '../types';
import { getOrdenes } from '../services/firebase';

interface UseOrdenesResult {
  ordenes: Orden[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useOrdenes(): UseOrdenesResult {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrdenes();
      setOrdenes(data);
    } catch (e) {
      setError('Error al cargar las órdenes');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ordenes, loading, error, refetch: fetch };
}
