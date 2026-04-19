import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useOrdenes } from '../hooks/useOrdenes';
import OrdenCard from '../components/OrdenCard';
import FilterChips from '../components/FilterChips';
import type { FilterChip } from '../components/FilterChips';
import styles from './Ordenes.module.css';

const FILTERS: FilterChip[] = [
  { id: 'todas',      label: 'Todas' },
  { id: 'hoy',        label: 'Hoy' },
  { id: 'semana',     label: 'Esta semana' },
  { id: 'pendientes', label: 'Pendientes' },
  { id: 'confirmadas',label: 'Confirmadas' },
  { id: 'entregadas', label: 'Entregadas' },
  { id: 'retiradas',  label: 'Retiradas' },
  { id: 'pagadas',    label: 'Pagadas' },
  { id: 'canceladas', label: 'Canceladas' },
];

// Pre-compute today/week boundaries once per render cycle (not per order)
function getTodayMs(): number {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime();
}
function getWeekBounds(): [number, number] {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return [start.getTime(), end.getTime()];
}

const Ordenes: React.FC = () => {
  const { ordenes, loading } = useOrdenes();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todas');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const todayMs = q || filter === 'hoy' || filter === 'semana' ? getTodayMs() : 0;
    const weekBounds = filter === 'semana' ? getWeekBounds() : null;

    // Single pass: search + filter + collect startMs for sorting
    const result: Array<{ orden: typeof ordenes[0]; startMs: number }> = [];

    for (const o of ordenes) {
      // Text search
      if (q) {
        const hit =
          o.nombre.toLowerCase().includes(q) ||
          (o.nombreEvento ?? '').toLowerCase().includes(q) ||
          o.direccion.toLowerCase().includes(q) ||
          o.telefono.includes(q);
        if (!hit) continue;
      }

      // Filter chip
      if (filter !== 'todas') {
        const fechaMs = new Date(o.fecha + 'T00:00:00').getTime();
        if (filter === 'hoy' && fechaMs !== todayMs) continue;
        if (filter === 'semana' && weekBounds && (fechaMs < weekBounds[0] || fechaMs >= weekBounds[1])) continue;
        if (filter === 'pendientes'  && o.estado !== 'pendiente')  continue;
        if (filter === 'confirmadas' && o.estado !== 'confirmado') continue;
        if (filter === 'entregadas'  && o.estado !== 'entregado')  continue;
        if (filter === 'retiradas'   && o.estado !== 'retirado')   continue;
        if (filter === 'pagadas'     && !o.pagado)                 continue;
        if (filter === 'canceladas'  && o.estado !== 'cancelado')  continue;
      }

      const startMs = new Date(`${o.fecha}T${o.horaInicio ?? '00:00'}:00`).getTime();
      result.push({ orden: o, startMs });
    }

    return result
      .sort((a, b) => a.startMs - b.startMs)
      .map(({ orden }) => orden);
  }, [ordenes, search, filter]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Mis Órdenes</h1>
        <p className={styles.subtitle}>{ordenes.length} órdenes en total</p>

        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Buscar por nombre, dirección..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <FilterChips chips={FILTERS} activeId={filter} onChange={setFilter} />

      <div className={styles.list}>
        {loading ? (
          <div className={styles.skeletonList}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`skeleton ${styles.skeletonCard}`} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <Search size={44} color="var(--color-border)" />
            <p className={styles.emptyTitle}>Sin resultados</p>
            <p className={styles.emptyText}>
              {search ? `No hay órdenes para "${search}"` : 'No hay órdenes en esta categoría'}
            </p>
          </div>
        ) : (
          <div className={`${styles.ordensList} stagger-children`}>
            {filtered.map((orden, i) => (
              <OrdenCard key={orden.id} orden={orden} animationDelay={i * 50} />
            ))}
          </div>
        )}
      </div>

      <div className={styles.bottomPad} />
    </div>
  );
};

export default Ordenes;
