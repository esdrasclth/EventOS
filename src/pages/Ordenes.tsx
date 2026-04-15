import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { useOrdenes } from '../hooks/useOrdenes';
import OrdenCard from '../components/OrdenCard';
import FilterChips from '../components/FilterChips';
import type { FilterChip } from '../components/FilterChips';
import styles from './Ordenes.module.css';

const FILTERS: FilterChip[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'hoy', label: 'Hoy' },
  { id: 'semana', label: 'Esta semana' },
  { id: 'pendientes', label: 'Pendientes' },
  { id: 'confirmadas', label: 'Confirmadas' },
  { id: 'entregadas', label: 'Entregadas' },
];

function isToday(dateStr: string): boolean {
  const today = new Date();
  const d = new Date(dateStr + 'T00:00:00');
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

function isThisWeek(dateStr: string): boolean {
  const now = new Date();
  const d = new Date(dateStr + 'T00:00:00');
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return d >= startOfWeek && d < endOfWeek;
}

const Ordenes: React.FC = () => {
  const navigate = useNavigate();
  const { ordenes, loading } = useOrdenes();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todas');

  const filtered = useMemo(() => {
    let result = [...ordenes];

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.nombre.toLowerCase().includes(q) ||
          o.direccion.toLowerCase().includes(q) ||
          o.telefono.includes(q)
      );
    }

    // Filter chips
    switch (filter) {
      case 'hoy':
        result = result.filter((o) => isToday(o.fecha));
        break;
      case 'semana':
        result = result.filter((o) => isThisWeek(o.fecha));
        break;
      case 'pendientes':
        result = result.filter((o) => o.estado === 'pendiente');
        break;
      case 'confirmadas':
        result = result.filter((o) => o.estado === 'confirmado');
        break;
      case 'entregadas':
        result = result.filter((o) => o.estado === 'entregado');
        break;
    }

    return result.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
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

      {/* FAB */}
      <button
        className={styles.fab}
        onClick={() => navigate('/nueva')}
        aria-label="Nueva orden"
      >
        <Plus size={26} />
      </button>

      <div className={styles.bottomPad} />
    </div>
  );
};

export default Ordenes;
