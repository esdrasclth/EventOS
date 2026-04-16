import React from 'react';
import { X } from 'lucide-react';
import type { ItemOrden } from '../types';
import styles from './ItemRow.module.css';

interface Props {
  item: ItemOrden;
  index: number;
  onChange: (index: number, field: keyof ItemOrden, value: string | number) => void;
  onRemove: (index: number) => void;
}

const ItemRow: React.FC<Props> = ({ item, index, onChange, onRemove }) => {
  const subtotal = item.cantidad * item.precio;

  return (
    <div className={styles.row}>
      <div className={styles.main}>
        <input
          className={styles.input}
          placeholder="Producto"
          value={item.producto}
          onChange={(e) => onChange(index, 'producto', e.target.value)}
        />
        <button
          type="button"
          className={styles.removeBtn}
          onClick={() => onRemove(index)}
          aria-label="Eliminar producto"
        >
          <X size={16} />
        </button>
      </div>
      <div className={styles.nums}>
        <div className={styles.numField}>
          <label className={styles.numLabel}>Cant.</label>
          <input
            className={`${styles.input} ${styles.numInput}`}
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min={1}
            placeholder="0"
            value={item.cantidad || ''}
            onChange={(e) => onChange(index, 'cantidad', parseInt(e.target.value) || 0)}
            onFocus={(e) => e.target.select()}
          />
        </div>
        <div className={styles.numField}>
          <label className={styles.numLabel}>Precio</label>
          <input
            className={`${styles.input} ${styles.numInput}`}
            type="number"
            inputMode="decimal"
            pattern="[0-9]*"
            min={0}
            step="0.01"
            placeholder="0.00"
            value={item.precio || ''}
            onChange={(e) => onChange(index, 'precio', parseFloat(e.target.value) || 0)}
            onFocus={(e) => e.target.select()}
          />
        </div>
        <div className={styles.numField}>
          <label className={styles.numLabel}>Subtotal</label>
          <div className={styles.subtotal}>$ {subtotal.toLocaleString('es-HN')}</div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ItemRow);
