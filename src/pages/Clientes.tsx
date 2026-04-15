import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Phone, ChevronRight } from 'lucide-react';
import { useOrdenes } from '../hooks/useOrdenes';
import styles from './Clientes.module.css';

interface ClienteSummary {
  nombre: string;
  telefono: string;
  totalOrdenes: number;
  totalGastado: number;
  ultimaOrden: string;
  ultimaOrdenId: string;
}

function formatCurrency(amount: number): string {
  return `L. ${amount.toLocaleString('es-HN')}`;
}

const Clientes: React.FC = () => {
  const navigate = useNavigate();
  const { ordenes, loading } = useOrdenes();

  const clientes = useMemo<ClienteSummary[]>(() => {
    const map = new Map<string, ClienteSummary>();
    ordenes.forEach((o) => {
      const key = o.nombre.toLowerCase();
      if (map.has(key)) {
        const existing = map.get(key)!;
        existing.totalOrdenes++;
        existing.totalGastado += o.total;
        if (o.fecha > existing.ultimaOrden) {
          existing.ultimaOrden = o.fecha;
          existing.ultimaOrdenId = o.id;
        }
      } else {
        map.set(key, {
          nombre: o.nombre,
          telefono: o.telefono,
          totalOrdenes: 1,
          totalGastado: o.total,
          ultimaOrden: o.fecha,
          ultimaOrdenId: o.id,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.totalGastado - a.totalGastado);
  }, [ordenes]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Clientes</h1>
        <p className={styles.subtitle}>{clientes.length} clientes registrados</p>
      </header>

      <div className={styles.list}>
        {loading ? (
          <div className={styles.skeletonList}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`skeleton ${styles.skeletonCard}`} />
            ))}
          </div>
        ) : clientes.length === 0 ? (
          <div className={styles.empty}>
            <Users size={44} color="var(--color-border)" />
            <p>No hay clientes aún</p>
          </div>
        ) : (
          <div className={`${styles.clientesList} stagger-children`}>
            {clientes.map((c, i) => (
              <div
                key={c.nombre}
                className={`${styles.card} fade-in-up`}
                style={{ animationDelay: `${i * 50}ms` }}
                onClick={() => navigate(`/ordenes/${c.ultimaOrdenId}`)}
                role="button"
                tabIndex={0}
              >
                <div className={styles.avatar}>
                  {c.nombre.charAt(0).toUpperCase()}
                </div>
                <div className={styles.info}>
                  <h3 className={styles.name}>{c.nombre}</h3>
                  <div className={styles.meta}>
                    <span className={styles.metaItem}>
                      <Phone size={11} />
                      {c.telefono}
                    </span>
                    <span className={styles.badge}>
                      {c.totalOrdenes} {c.totalOrdenes === 1 ? 'orden' : 'órdenes'}
                    </span>
                  </div>
                  <span className={styles.total}>{formatCurrency(c.totalGastado)}</span>
                </div>
                <ChevronRight size={18} color="var(--color-text-secondary)" />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className={styles.bottomPad} />
    </div>
  );
};

export default Clientes;
