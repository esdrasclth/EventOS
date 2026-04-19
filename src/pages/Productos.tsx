import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Check, X, Pencil, CheckCircle2, XCircle, Package } from 'lucide-react';
import { createProducto, renameProducto, setProductoActivo } from '../services/productos';
import { useProductosContext } from '../contexts/ProductosContext';
import type { Producto } from '../types';
import styles from './Productos.module.css';

const Productos: React.FC = () => {
  const navigate = useNavigate();
  const { productos, loading } = useProductosContext();
  const [search, setSearch] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [creando, setCreando] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? productos.filter((p) => p.nombre.toLowerCase().includes(q))
      : productos;
    return [...base].sort((a, b) => {
      if (a.activo !== b.activo) return a.activo ? -1 : 1;
      return a.nombre.localeCompare(b.nombre);
    });
  }, [productos, search]);

  async function handleCrear() {
    const nombre = nuevoNombre.trim();
    if (!nombre) return;
    const existe = productos.some((p) => p.nombre.toLowerCase() === nombre.toLowerCase());
    if (existe) {
      alert('Ya existe un producto con ese nombre.');
      return;
    }
    setCreando(true);
    try {
      await createProducto(nombre);
      setNuevoNombre('');
    } catch (e) {
      console.error('[productos] createProducto error:', e);
      alert('No se pudo crear el producto.');
    } finally {
      setCreando(false);
    }
  }

  function startEdit(p: Producto) {
    setEditingId(p.id);
    setEditValue(p.nombre);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue('');
  }

  async function saveEdit(p: Producto) {
    const nombre = editValue.trim();
    if (!nombre || nombre === p.nombre) {
      cancelEdit();
      return;
    }
    const existe = productos.some(
      (x) => x.id !== p.id && x.nombre.toLowerCase() === nombre.toLowerCase(),
    );
    if (existe) {
      alert('Ya existe un producto con ese nombre.');
      return;
    }
    setBusyId(p.id);
    try {
      await renameProducto(p.id, nombre);
      cancelEdit();
    } catch (e) {
      console.error('[productos] renameProducto error:', e);
      alert('No se pudo actualizar el producto.');
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActivo(p: Producto) {
    setBusyId(p.id);
    try {
      await setProductoActivo(p.id, !p.activo);
    } catch (e) {
      console.error('[productos] setProductoActivo error:', e);
      alert('No se pudo cambiar el estado.');
    } finally {
      setBusyId(null);
    }
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
        <h1 className={styles.title}>Productos</h1>
        <div style={{ width: 40 }} />
      </header>

      <div className={styles.createWrap}>
        <input
          className={styles.createInput}
          placeholder="Nombre del producto nuevo..."
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCrear(); }}
        />
        <button
          className={styles.createBtn}
          onClick={handleCrear}
          disabled={creando || !nuevoNombre.trim()}
          aria-label="Crear producto"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className={styles.searchWrap}>
        <Search size={16} className={styles.searchIcon} />
        <input
          className={styles.search}
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className={styles.skeletonList}>
          {[0, 1, 2].map((i) => (
            <div key={i} className={`skeleton ${styles.skeletonRow}`} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <Package size={40} color="var(--color-border)" />
          <p>{search ? 'Sin resultados' : 'No hay productos en el catálogo'}</p>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map((p) => {
            const busy = busyId === p.id;
            const isEditing = editingId === p.id;
            return (
              <div
                key={p.id}
                className={`${styles.card} ${!p.activo ? styles.cardInactive : ''}`}
              >
                <div className={styles.iconWrap}>
                  <Package size={18} />
                </div>

                <div className={styles.main}>
                  {isEditing ? (
                    <input
                      className={styles.editInput}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(p);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      autoFocus
                    />
                  ) : (
                    <>
                      <span className={styles.name}>{p.nombre}</span>
                      {!p.activo && <span className={styles.inactiveLabel}>Inactivo</span>}
                    </>
                  )}
                </div>

                <div className={styles.actions}>
                  {isEditing ? (
                    <>
                      <button
                        className={styles.iconBtnOk}
                        onClick={() => saveEdit(p)}
                        disabled={busy}
                        aria-label="Guardar"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        className={styles.iconBtnCancel}
                        onClick={cancelEdit}
                        disabled={busy}
                        aria-label="Cancelar"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className={styles.iconBtn}
                        onClick={() => startEdit(p)}
                        disabled={busy}
                        aria-label="Renombrar"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className={`${styles.toggleBtn} ${p.activo ? styles.toggleBtnOn : styles.toggleBtnOff}`}
                        onClick={() => toggleActivo(p)}
                        disabled={busy}
                      >
                        {p.activo ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.bottomPad} />
    </div>
  );
};

export default Productos;
