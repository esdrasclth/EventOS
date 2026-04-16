import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Calendar, DollarSign, ChevronRight, LogOut } from 'lucide-react';
import { useOrdenes } from '../hooks/useOrdenes';
import { useAuth } from '../contexts/AuthContext';
import OrdenCard from '../components/OrdenCard';
import styles from './Home.module.css';

function formatDate(): string {
  return new Date().toLocaleDateString('es-HN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return `$ ${amount.toLocaleString('es-HN')}`;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { ordenes, loading } = useOrdenes();
  const userName = user?.displayName ?? 'equipo';

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const stats = useMemo(() => {
    const thisMonth = ordenes.filter((o) => {
      const d = new Date(o.fecha);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const ingresos = thisMonth
      .filter((o) => o.estado === 'pagado')
      .reduce((sum, o) => sum + o.total, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = [...ordenes]
      .filter((o) => {
        const d = new Date(o.fecha + 'T00:00:00');
        return d >= today && !['entregado', 'pagado', 'cancelado'].includes(o.estado);
      })
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    return {
      totalMes: thisMonth.length,
      ingresosMes: ingresos,
      proximoEvento: upcoming[0],
      proximasOrdenes: upcoming.slice(0, 3),
    };
  }, [ordenes, currentMonth, currentYear]);

  return (
    <div className={styles.page}>
      {/* Header hero */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <p className={styles.greeting}>Hola, {userName} 👋</p>
            <p className={styles.date}>{formatDate()}</p>
          </div>
          <button className={styles.logoutBtn} onClick={logout} aria-label="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </div>

        {/* Stats row */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(255,255,255,0.2)' }}>
              <TrendingUp size={18} color="white" />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.totalMes}</span>
              <span className={styles.statLabel}>Órdenes del mes</span>
            </div>
          </div>

          <div className={styles.statDivider} />

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'rgba(255,255,255,0.2)' }}>
              <DollarSign size={18} color="white" />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{formatCurrency(stats.ingresosMes)}</span>
              <span className={styles.statLabel}>Ingresos del mes</span>
            </div>
          </div>
        </div>
      </header>

      {/* Próximo evento card */}
      {stats.proximoEvento && (
        <section className={styles.section}>
          <div className={styles.nextEventCard}>
            <div className={styles.nextEventIcon}>
              <Calendar size={20} color="var(--color-primary)" />
            </div>
            <div className={styles.nextEventInfo}>
              <span className={styles.nextEventLabel}>Próximo evento</span>
              <span className={styles.nextEventName}>{stats.proximoEvento.nombre}</span>
              <span className={styles.nextEventDate}>
                {new Date(stats.proximoEvento.fecha + 'T00:00:00').toLocaleDateString('es-HN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </div>
            <button
              className={styles.nextEventArrow}
              onClick={() => navigate(`/ordenes/${stats.proximoEvento!.id}`)}
            >
              <ChevronRight size={20} color="var(--color-text-secondary)" />
            </button>
          </div>
        </section>
      )}

      {/* Próximas órdenes */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Próximas órdenes</h2>
          <button
            className={styles.seeAll}
            onClick={() => navigate('/ordenes')}
          >
            Ver todas
          </button>
        </div>

        {loading ? (
          <div className={styles.skeletonList}>
            {[0, 1, 2].map((i) => (
              <div key={i} className={`skeleton ${styles.skeletonCard}`} />
            ))}
          </div>
        ) : stats.proximasOrdenes.length === 0 ? (
          <div className={styles.empty}>
            <Calendar size={40} color="var(--color-border)" />
            <p>No hay órdenes próximas</p>
          </div>
        ) : (
          <div className={`${styles.ordensList} stagger-children`}>
            {stats.proximasOrdenes.map((orden, i) => (
              <OrdenCard key={orden.id} orden={orden} animationDelay={i * 60} />
            ))}
          </div>
        )}
      </section>

      <div className={styles.bottomPad} />
    </div>
  );
};

export default Home;
