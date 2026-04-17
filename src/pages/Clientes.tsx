import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Phone, Search, Plus, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { useOrdenes } from '../hooks/useOrdenes';
import type { Orden } from '../types';
import styles from './Clientes.module.css';

interface ClienteSummary {
  nombre: string;
  telefono: string;
  direccion: string;
  totalOrdenes: number;
  totalGastado: number;
  ordenes: Orden[];
}

const ESTADO_COLORS: Record<string, string> = {
  pendiente:  '#F59E0B',
  confirmado: '#3B82F6',
  entregado:  '#14B8A6',
  pagado:     '#22C55E',
  cancelado:  '#EF4444',
};

const ESTADO_LABELS: Record<string, string> = {
  pendiente:  'Pendiente',
  confirmado: 'Confirmado',
  entregado:  'Entregado',
  pagado:     'Pagado',
  cancelado:  'Cancelado',
};

function formatCurrency(amount: number): string {
  return `$ ${amount.toLocaleString('es-HN')}`;
}

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${parseInt(d)} ${months[parseInt(m) - 1]}`;
}

const Clientes: React.FC = () => {
  const navigate = useNavigate();
  const { ordenes, loading } = useOrdenes();
  const [search, setSearch] = useState('');
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  const clientes = useMemo<ClienteSummary[]>(() => {
    const map = new Map<string, ClienteSummary>();
    ordenes.forEach((o) => {
      const key = o.nombre.toLowerCase();
      if (map.has(key)) {
        const existing = map.get(key)!;
        existing.totalOrdenes++;
        existing.totalGastado += o.total;
        existing.ordenes.push(o);
        if (!existing.direccion && o.direccion) existing.direccion = o.direccion;
      } else {
        map.set(key, {
          nombre: o.nombre,
          telefono: o.telefono,
          direccion: o.direccion,
          totalOrdenes: 1,
          totalGastado: o.total,
          ordenes: [o],
        });
      }
    });
    for (const c of map.values()) {
      c.ordenes.sort((a, b) => b.fecha.localeCompare(a.fecha));
    }
    return Array.from(map.values()).sort((a, b) => b.totalGastado - a.totalGastado);
  }, [ordenes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.telefono.includes(q) ||
        c.direccion.toLowerCase().includes(q),
    );
  }, [clientes, search]);

  function handleNewOrder(c: ClienteSummary, e: React.MouseEvent) {
    e.stopPropagation();
    const params = new URLSearchParams({
      nombre: c.nombre,
      telefono: c.telefono,
      direccion: c.direccion,
    });
    navigate(`/nueva?${params.toString()}`);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Clientes</h1>
        <p className={styles.subtitle}>
          {filtered.length} de {clientes.length} clientes
        </p>
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Buscar por nombre, teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div className={styles.list}>
        {loading ? (
          <div className={styles.skeletonList}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`skeleton ${styles.skeletonCard}`} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <Users size={44} color="var(--color-border)" />
            <p>{search ? `Sin resultados para "${search}"` : 'No hay clientes aún'}</p>
          </div>
        ) : (
          <div className={`${styles.clientesList} stagger-children`}>
            {filtered.map((c, i) => {
              const isExpanded = expandedClient === c.nombre.toLowerCase();
              return (
                <div
                  key={c.nombre}
                  className={`${styles.card} ${isExpanded ? styles.cardExpanded : ''} fade-in-up`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div
                    className={styles.cardHeader}
                    onClick={() =>
                      setExpandedClient(isExpanded ? null : c.nombre.toLowerCase())
                    }
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
                    {isExpanded ? (
                      <ChevronUp size={18} color="var(--color-text-secondary)" />
                    ) : (
                      <ChevronDown size={18} color="var(--color-text-secondary)" />
                    )}
                  </div>

                  {isExpanded && (
                    <div className={styles.expanded}>
                      <div className={styles.quickActions}>
                        {c.telefono && (
                          <a
                            href={`tel:${c.telefono.replace(/\D/g, '')}`}
                            className={styles.actionBtn}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone size={15} />
                            Llamar
                          </a>
                        )}
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                          onClick={(e) => handleNewOrder(c, e)}
                        >
                          <Plus size={15} />
                          Nueva orden
                        </button>
                      </div>

                      {c.direccion && (
                        <div className={styles.addressRow}>
                          <MapPin size={13} />
                          <span>{c.direccion}</span>
                        </div>
                      )}

                      <div className={styles.ordenesHistory}>
                        <p className={styles.historyTitle}>Historial de órdenes</p>
                        {c.ordenes.map((o) => (
                          <div
                            key={o.id}
                            className={styles.ordenRow}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/ordenes/${o.id}`);
                            }}
                            role="button"
                            tabIndex={0}
                          >
                            <span
                              className={styles.ordenDot}
                              style={{ background: ESTADO_COLORS[o.estado] }}
                              title={ESTADO_LABELS[o.estado]}
                            />
                            <div className={styles.ordenInfo}>
                              <span className={styles.ordenName}>
                                {o.nombreEvento || 'Evento'}
                              </span>
                              <span className={styles.ordenDate}>{formatDate(o.fecha)}</span>
                            </div>
                            <span className={styles.ordenStatus}>
                              {ESTADO_LABELS[o.estado]}
                            </span>
                            <span className={styles.ordenTotal}>
                              {formatCurrency(o.total)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className={styles.bottomPad} />
    </div>
  );
};

export default Clientes;
