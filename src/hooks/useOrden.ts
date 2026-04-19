import { useEffect, useState } from 'react';
import type { Orden } from '../types';
import { subscribeToOrden } from '../services/firebase';
import { useOrdenesContext } from '../contexts/OrdenesContext';

interface UseOrdenResult {
  orden: Orden | null;
  loading: boolean;
  error: string | null;
}

export function useOrden(id: string): UseOrdenResult {
  const { ordenes, loading: listLoading } = useOrdenesContext();
  const fromList = ordenes.find((o) => o.id === id) ?? null;

  const [fallback, setFallback] = useState<Orden | null>(null);
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsFallback = !listLoading && !fromList && !!id;

  useEffect(() => {
    if (!needsFallback) return;
    setFallbackLoading(true);
    const unsub = subscribeToOrden(
      id,
      (data) => {
        setFallback(data);
        setFallbackLoading(false);
      },
      (e) => {
        setError('Error al cargar la orden');
        setFallbackLoading(false);
        console.error(e);
      },
    );
    return unsub;
  }, [id, needsFallback]);

  return {
    orden: fromList ?? fallback,
    loading: fromList ? false : listLoading || fallbackLoading,
    error,
  };
}
