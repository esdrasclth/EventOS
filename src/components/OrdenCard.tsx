import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Package } from 'lucide-react';
import type { Orden } from '../types';
import styles from './OrdenCard.module.css';

interface Props {
  orden: Orden;
  animationDelay?: number;
}

const ESTADO_MAP = {
  pendiente: { label: 'Pendiente', color: '#F59E0B' },
  confirmado: { label: 'Confirmado', color: '#386641' },
  entregado: { label: 'Entregado', color: '#22C55E' },
  pagado: { label: 'Pagado', color: '#6366F1' },
};

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}`;
}

function formatCurrency(amount: number): string {
  return `$ ${amount.toLocaleString('es-HN')}`;
}

const OrdenCard: React.FC<Props> = ({ orden, animationDelay = 0 }) => {
  const navigate = useNavigate();
  const estado = ESTADO_MAP[orden.estado] ?? ESTADO_MAP.pendiente;
  const totalItems = orden.items.reduce((sum, i) => sum + i.cantidad, 0);

  return (
    <article
      className={`${styles.card} fade-in-up`}
      style={{ animationDelay: `${animationDelay}ms` }}
      onClick={() => navigate(`/ordenes/${orden.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/ordenes/${orden.id}`)}
    >
      <div className={styles.body}>
        <div className={styles.top}>
          <div className={styles.clientInfo}>
            <h3 className={styles.clientName}>{orden.nombre}</h3>
            <span className={styles.datePill}>{formatDate(orden.fecha)}</span>
          </div>
          <span
            className={styles.statusDot}
            style={{ background: estado.color }}
            title={estado.label}
          />
        </div>

        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <MapPin size={12} />
            {orden.direccion}
          </span>
        </div>

        <div className={styles.footer}>
          <span className={styles.metaItem}>
            <Package size={12} />
            {totalItems} productos
          </span>
          <span className={styles.total}>{formatCurrency(orden.total)}</span>
        </div>
      </div>
    </article>
  );
};

export default OrdenCard;
