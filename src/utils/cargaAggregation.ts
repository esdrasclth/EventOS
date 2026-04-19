import type { Orden, Producto } from '../types';

export const EXCLUDED_ESTADOS_CARGA = new Set(['cancelado', 'retirado']);

export interface AggregatedProduct {
  key: string;
  nombre: string;
  productoId?: string;
  catalogado: boolean;
  totalUnidades: number;
  lineas: Array<{ ordenId: string; ordenNombre: string; evento: string; cantidad: number }>;
}

export function normalizeProductName(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/s\b/g, '');
}

export function aggregateCarga(
  ordenes: Orden[],
  productos: Producto[],
): AggregatedProduct[] {
  const productoNombreMap = new Map<string, string>();
  productos.forEach((p) => productoNombreMap.set(p.id, p.nombre));

  const map = new Map<string, AggregatedProduct>();

  for (const o of ordenes) {
    for (const item of o.items) {
      if (!item.producto.trim() || !item.cantidad) continue;

      const key = item.productoId
        ? `id:${item.productoId}`
        : `name:${normalizeProductName(item.producto)}`;

      const existing = map.get(key);
      if (existing) {
        existing.totalUnidades += item.cantidad;
        existing.lineas.push({
          ordenId: o.id,
          ordenNombre: o.nombre,
          evento: o.nombreEvento || o.nombre,
          cantidad: item.cantidad,
        });
      } else {
        map.set(key, {
          key,
          nombre: item.productoId
            ? productoNombreMap.get(item.productoId) ?? item.producto
            : item.producto,
          productoId: item.productoId,
          catalogado: !!item.productoId,
          totalUnidades: item.cantidad,
          lineas: [
            {
              ordenId: o.id,
              ordenNombre: o.nombre,
              evento: o.nombreEvento || o.nombre,
              cantidad: item.cantidad,
            },
          ],
        });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.catalogado !== b.catalogado) return a.catalogado ? -1 : 1;
    return b.totalUnidades - a.totalUnidades;
  });
}

export function filterOrdenesDelDia(ordenes: Orden[], fecha: string): Orden[] {
  return ordenes
    .filter((o) => o.fecha === fecha && !EXCLUDED_ESTADOS_CARGA.has(o.estado))
    .sort((a, b) => (a.horaInicio ?? '').localeCompare(b.horaInicio ?? ''));
}
