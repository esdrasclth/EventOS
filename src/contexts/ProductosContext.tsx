import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Producto } from '../types';
import { subscribeToProductos } from '../services/productos';
import { useAuth } from './AuthContext';

interface ProductosContextValue {
  productos: Producto[];
  loading: boolean;
  error: string | null;
}

const ProductosContext = createContext<ProductosContextValue | null>(null);

export function ProductosProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setProductos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsub = subscribeToProductos(
      (data) => {
        setProductos(data);
        setLoading(false);
      },
      (e) => {
        setError('Error al cargar los productos');
        setLoading(false);
        console.error(e);
      },
    );
    return unsub;
  }, [authLoading, user]);

  return (
    <ProductosContext.Provider value={{ productos, loading, error }}>
      {children}
    </ProductosContext.Provider>
  );
}

export function useProductosContext(): ProductosContextValue {
  const ctx = useContext(ProductosContext);
  if (!ctx) throw new Error('useProductosContext must be used inside ProductosProvider');
  return ctx;
}
