import { useOrdenesContext } from '../contexts/OrdenesContext';
import type { Orden } from '../types';

interface UseOrdenesResult {
  ordenes: Orden[];
  loading: boolean;
  error: string | null;
}

export function useOrdenes(): UseOrdenesResult {
  return useOrdenesContext();
}
