import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Truck,
  Package,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useOrdenes } from '../hooks/useOrdenes';
import { useProductosContext } from '../contexts/ProductosContext';
import type { Orden } from '../types';
import styles from './CargaDelDia.module.css';

const EXCLUDED_ESTADOS = new Set(['cancelado', 'retirado']);

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-HN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/s\b/g, ''); // drop trailing "s" for simple plural collapse
}

interface AggregatedProduct {
  key: string;
  nombre: string;
  productoId?: string;
  catalogado: boolean;
  totalUnidades: number;
  lineas: Array<{ ordenId: string; ordenNombre: string; evento: string; cantidad: number }>;
}

function aggregate(ordenes: Orden[]): AggregatedProduct[] {
  const map = new Map<string, AggregatedProduct>();

  for (const o of ordenes) {
    for (const item of o.items) {
      if (!item.producto.trim() || !item.cantidad) continue;

      const key = item.productoId
        ? `id:${item.productoId}`
        : `name:${normalize(item.producto)}`;

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
          nombre: item.producto,
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

const CargaDelDia: React.FC = () => {
  const navigate = useNavigate();
  const { ordenes, loading } = useOrdenes();
  const { productos } = useProductosContext();
  const [fecha, setFecha] = useState<string>(todayStr());
  const [expandido, setExpandido] = useState<Set<string>>(new Set());

  const ordenesDia = useMemo(
    () =>
      ordenes
        .filter((o) => o.fecha === fecha && !EXCLUDED_ESTADOS.has(o.estado))
        .sort((a, b) => (a.horaInicio ?? '').localeCompare(b.horaInicio ?? '')),
    [ordenes, fecha],
  );

  // Use current catalog names for catalogued products (renames reflect here).
  const productoNombreMap = useMemo(() => {
    const m = new Map<string, string>();
    productos.forEach((p) => m.set(p.id, p.nombre));
    return m;
  }, [productos]);

  const aggregated = useMemo(() => {
    const raw = aggregate(ordenesDia);
    return raw.map((p) => ({
      ...p,
      nombre: p.productoId ? productoNombreMap.get(p.productoId) ?? p.nombre : p.nombre,
    }));
  }, [ordenesDia, productoNombreMap]);

  const totalUnidades = aggregated.reduce((sum, p) => sum + p.totalUnidades, 0);
  const totalProductos = aggregated.length;
  const sinCatalogar = aggregated.filter((p) => !p.catalogado).length;

  function toggleExpand(key: string) {
    setExpandido((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() => navigate(-1)}
          aria-label="Volver"
        >
          <ArrowLeft size={20} />
        </button>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Carga del día</h1>
          <span className={styles.subtitle}>Productos a cargar al camión</span>
        </div>
        <div style={{ width: 40 }} />
      </header>

      <div className={styles.dateBar}>
        <button
          className={styles.dateNavBtn}
          onClick={() => setFecha(shiftDate(fecha, -1))}
          aria-label="Día anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <div className={styles.dateCenter}>
          <span className={styles.dateLabel}>{formatDateLong(fecha)}</span>
          <input
            type="date"
            className={styles.dateInput}
            value={fecha}
            onChange={(e) => setFecha(e.target.value || todayStr())}
          />
          {fecha !== todayStr() && (
            <button className={styles.todayBtn} onClick={() => setFecha(todayStr())}>
              Hoy
            </button>
          )}
        </div>
        <button
          className={styles.dateNavBtn}
          onClick={() => setFecha(shiftDate(fecha, 1))}
          aria-label="Día siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {loading ? (
        <div className={styles.skeletonList}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`skeleton ${styles.skeletonRow}`} />
          ))}
        </div>
      ) : ordenesDia.length === 0 ? (
        <div className={styles.empty}>
          <Truck size={44} color="var(--color-border)" />
          <p className={styles.emptyTitle}>Sin órdenes para este día</p>
          <p className={styles.emptyText}>No hay nada que cargar en esta fecha.</p>
        </div>
      ) : (
        <>
          <div className={styles.summary}>
            <div className={styles.summaryCard}>
              <span className={styles.summaryValue}>{ordenesDia.length}</span>
              <span className={styles.summaryLabel}>Órdenes</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryValue}>{totalProductos}</span>
              <span className={styles.summaryLabel}>Productos</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryValue}>{totalUnidades}</span>
              <span className={styles.summaryLabel}>Unidades</span>
            </div>
          </div>

          {sinCatalogar > 0 && (
            <div className={styles.warning}>
              <AlertCircle size={16} />
              <span>
                {sinCatalogar} producto{sinCatalogar !== 1 ? 's' : ''} sin catalogar — podrían
                ser duplicados de otros. Pedile a un admin que los vincule al catálogo.
              </span>
            </div>
          )}

          <div className={styles.list}>
            {aggregated.map((p) => {
              const open = expandido.has(p.key);
              return (
                <div key={p.key} className={`${styles.card} ${!p.catalogado ? styles.cardUnlinked : ''}`}>
                  <button
                    className={styles.cardHeader}
                    onClick={() => toggleExpand(p.key)}
                    aria-expanded={open}
                  >
                    <div className={styles.cardIcon}>
                      {p.catalogado ? <Package size={18} /> : <AlertCircle size={18} />}
                    </div>
                    <div className={styles.cardMain}>
                      <span className={styles.cardName}>{p.nombre}</span>
                      {!p.catalogado && (
                        <span className={styles.cardTagUnlinked}>Sin catálogo</span>
                      )}
                    </div>
                    <div className={styles.cardQty}>
                      <span className={styles.qtyNumber}>{p.totalUnidades}</span>
                      <span className={styles.qtyLabel}>uds.</span>
                    </div>
                    <span className={styles.chevron}>
                      {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </button>

                  {open && (
                    <div className={styles.breakdown}>
                      {p.lineas.map((l, i) => (
                        <button
                          key={`${l.ordenId}-${i}`}
                          className={styles.breakdownRow}
                          onClick={() => navigate(`/ordenes/${l.ordenId}`)}
                        >
                          <div className={styles.breakdownInfo}>
                            <span className={styles.breakdownEvento}>{l.evento}</span>
                            <span className={styles.breakdownCliente}>{l.ordenNombre}</span>
                          </div>
                          <span className={styles.breakdownQty}>{l.cantidad} uds.</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className={styles.bottomPad} />
    </div>
  );
};

export default CargaDelDia;
