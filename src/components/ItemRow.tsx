import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import type { ItemOrden, Producto } from '../types';
import styles from './ItemRow.module.css';

interface Props {
  item: ItemOrden;
  index: number;
  productos: Producto[];
  onChange: (index: number, field: keyof ItemOrden, value: string | number) => void;
  onPatch: (index: number, patch: Partial<ItemOrden>) => void;
  onAddToCatalog: (nombre: string) => Promise<string | null>;
  onRemove: (index: number) => void;
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

const ItemRow: React.FC<Props> = ({
  item,
  index,
  productos,
  onChange,
  onPatch,
  onAddToCatalog,
  onRemove,
}) => {
  const subtotal = item.cantidad * item.precio;
  const [focused, setFocused] = useState(false);
  const [adding, setAdding] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const activos = useMemo(() => productos.filter((p) => p.activo), [productos]);

  const suggestions = useMemo(() => {
    const q = normalize(item.producto);
    if (!q) return activos.slice(0, 6);
    return activos
      .filter((p) => normalize(p.nombre).includes(q))
      .slice(0, 6);
  }, [activos, item.producto]);

  const exactMatch = useMemo(() => {
    const q = normalize(item.producto);
    if (!q) return null;
    return activos.find((p) => normalize(p.nombre) === q) ?? null;
  }, [activos, item.producto]);

  function handleProductoChange(value: string) {
    const match = activos.find((p) => normalize(p.nombre) === normalize(value));
    onPatch(index, { producto: value, productoId: match?.id });
  }

  function pickSuggestion(p: Producto) {
    onPatch(index, { producto: p.nombre, productoId: p.id });
    setFocused(false);
  }

  async function handleAddToCatalog() {
    const nombre = item.producto.trim();
    if (!nombre) return;
    setAdding(true);
    try {
      const newId = await onAddToCatalog(nombre);
      if (newId) {
        onPatch(index, { producto: nombre, productoId: newId });
      }
      setFocused(false);
    } finally {
      setAdding(false);
    }
  }

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const showDropdown = focused && (suggestions.length > 0 || (item.producto.trim() && !exactMatch));

  return (
    <div className={styles.row}>
      <div className={styles.main}>
        <div className={styles.autocomplete} ref={wrapRef}>
          <input
            className={styles.input}
            placeholder="Producto"
            value={item.producto}
            onChange={(e) => handleProductoChange(e.target.value)}
            onFocus={() => setFocused(true)}
            autoComplete="off"
          />
          {item.productoId && (
            <span className={styles.linkedBadge} title="Vinculado al catálogo">
              <Check size={12} />
            </span>
          )}
          {showDropdown && (
            <div className={styles.dropdown}>
              {suggestions.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={styles.suggestion}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickSuggestion(p)}
                >
                  <span>{p.nombre}</span>
                  {item.productoId === p.id && <Check size={14} color="var(--color-primary)" />}
                </button>
              ))}
              {item.producto.trim() && !exactMatch && (
                <button
                  type="button"
                  className={styles.addToCatalog}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleAddToCatalog}
                  disabled={adding}
                >
                  <Plus size={14} />
                  {adding ? 'Agregando…' : `Agregar "${item.producto.trim()}" al catálogo`}
                </button>
              )}
            </div>
          )}
        </div>
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
