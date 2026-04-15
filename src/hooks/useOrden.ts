import { useState, useEffect, useCallback } from 'react';
import type { Orden } from '../types';
import { getOrden } from '../services/firebase';

interface UseOrdenResult {
  orden: Orden | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useOrden(id: string): UseOrdenResult {
  const [orden, setOrden] = useState<Orden | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getOrden(id);
      setOrden(data);
    } catch (e) {
      setError('Error al cargar la orden');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { orden, loading, error, refetch: fetch };
}
