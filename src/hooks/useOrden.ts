import { useState, useEffect } from 'react';
import type { Orden } from '../types';
import { subscribeToOrden } from '../services/firebase';

interface UseOrdenResult {
  orden: Orden | null;
  loading: boolean;
  error: string | null;
}

export function useOrden(id: string): UseOrdenResult {
  const [orden, setOrden] = useState<Orden | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const unsub = subscribeToOrden(
      id,
      (data) => {
        setOrden(data);
        setLoading(false);
      },
      (e) => {
        setError('Error al cargar la orden');
        setLoading(false);
        console.error(e);
      },
    );
    return unsub;
  }, [id]);

  return { orden, loading, error };
}
