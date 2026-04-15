import React, { useMemo } from 'react';
import {
  TrendingUp,
  CheckCircle2,
  DollarSign,
  FileSpreadsheet,
  Clock,
} from 'lucide-react';
import { useOrdenes } from '../hooks/useOrdenes';
import { exportToExcel } from '../services/exportExcel';
import styles from './Actividad.module.css';

const ESTADO_MAP = {
  pendiente: { label: 'Pendiente', color: '#F59E0B', bg: '#FEF3C7' },
  confirmado: { label: 'Confirmado', color: '#386641', bg: '#EBF3EC' },
  entregado: { label: 'Entregado', color: '#22C55E', bg: '#DCFCE7' },
};

function formatCurrency(amount: number): string {
  return `L. ${amount.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
}

const Actividad: React.FC = () => {
  const { ordenes, loading } = useOrdenes();

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const stats = useMemo(() => {
    const thisMonth = ordenes.filter((o) => {
      const d = new Date(o.fecha);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const completadas = thisMonth.filter((o) => o.estado === 'entregado');
    const pendientes = ordenes.filter((o) => o.estado === 'pendiente');
    const ingresos = completadas.reduce((sum, o) => sum + o.total, 0);
    const ingresosEsperados = pendientes.reduce((sum, o) => sum + o.total, 0);

    const recientes = [...ordenes]
      .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())
      .slice(0, 10);

    return {
      totalMes: thisMonth.length,
      completadas: completadas.length,
      pendientes: pendientes.length,
      ingresos,
      ingresosEsperados,
      recientes,
    };
  }, [ordenes, currentMonth, currentYear]);

  const monthName = new Date().toLocaleDateString('es-HN', { month: 'long', year: 'numeric' });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Actividad</h1>
        <p className={styles.subtitle}>Resumen de {monthName}</p>
      </header>

      <div className={styles.content}>
        {/* Stats grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIconWrapper} style={{ background: '#EBF3EC' }}>
              <TrendingUp size={20} color="#386641" />
            </div>
            <span className={styles.statValue}>{stats.totalMes}</span>
            <span className={styles.statLabel}>Órdenes del mes</span>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper} style={{ background: '#DCFCE7' }}>
              <CheckCircle2 size={20} color="#22C55E" />
            </div>
            <span className={styles.statValue}>{stats.completadas}</span>
            <span className={styles.statLabel}>Entregadas</span>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper} style={{ background: '#FEF3C7' }}>
              <Clock size={20} color="#F59E0B" />
            </div>
            <span className={styles.statValue}>{stats.pendientes}</span>
            <span className={styles.statLabel}>Pendientes</span>
          </div>

          <div className={`${styles.statCard} ${styles.statCardWide}`}>
            <div className={styles.statIconWrapper} style={{ background: '#EBF3EC' }}>
              <DollarSign size={20} color="#386641" />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{formatCurrency(stats.ingresos)}</span>
              <span className={styles.statLabel}>Ingresos confirmados</span>
            </div>
          </div>

          <div className={`${styles.statCard} ${styles.statCardWide}`}>
            <div className={styles.statIconWrapper} style={{ background: '#FEF3C7' }}>
              <DollarSign size={20} color="#F59E0B" />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{formatCurrency(stats.ingresosEsperados)}</span>
              <span className={styles.statLabel}>Ingresos esperados</span>
            </div>
          </div>
        </div>

        {/* Export button */}
        <button
          className={styles.exportBtn}
          onClick={() => exportToExcel(ordenes)}
          disabled={loading || ordenes.length === 0}
        >
          <FileSpreadsheet size={20} />
          Exportar todo a Excel
        </button>

        {/* Recent orders */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Últimas 10 órdenes</h2>
          {loading ? (
            <div className={styles.skeletonList}>
              {[0,1,2,3].map((i) => <div key={i} className={`skeleton ${styles.skeletonItem}`} />)}
            </div>
          ) : (
            <div className={`${styles.recentList} stagger-children`}>
              {stats.recientes.map((orden, i) => {
                const estado = ESTADO_MAP[orden.estado];
                return (
                  <div
                    key={orden.id}
                    className={`${styles.recentItem} fade-in-up`}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div className={styles.recentLeft}>
                      <span className={styles.recentName}>{orden.nombre}</span>
                      <span className={styles.recentDate}>{formatDate(orden.fecha)}</span>
                    </div>
                    <div className={styles.recentRight}>
                      <span className={styles.recentTotal}>{formatCurrency(orden.total)}</span>
                      <span
                        className={styles.estadoBadge}
                        style={{ background: estado.bg, color: estado.color }}
                      >
                        {estado.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className={styles.bottomPad} />
    </div>
  );
};

export default Actividad;
