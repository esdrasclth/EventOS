import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Camera,
  X,
  Save,
  Clock,
} from 'lucide-react';
import type { ItemOrden, EstadoOrden, OrdenFormData } from '../types';
import { createOrden, updateOrden, getOrden, uploadImagen } from '../services/firebase';
import ItemRow from '../components/ItemRow';
import styles from './NuevaOrden.module.css';

const ESTADOS: { value: EstadoOrden; label: string; color: string }[] = [
  { value: 'pendiente',  label: 'Pendiente',  color: '#F59E0B' },
  { value: 'confirmado', label: 'Confirmado', color: '#3B82F6' },
  { value: 'entregado',  label: 'Entregado',  color: '#14B8A6' },
  { value: 'pagado',     label: 'Pagado',     color: '#22C55E' },
];

function formatTime12(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

function calcularDuracion(
  fecha: string, horaInicio: string,
  fechaFin: string, horaFin: string,
): string | null {
  if (!fecha || !fechaFin || !horaInicio || !horaFin) return null;
  const start = new Date(`${fecha}T${horaInicio}:00`);
  const end = new Date(`${fechaFin}T${horaFin}:00`);
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return null;

  if (fecha === fechaFin) {
    const diffMins = Math.round(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    let durStr = '';
    if (hours > 0 && mins > 0) durStr = `${hours}h ${mins}min`;
    else if (hours > 0) durStr = `${hours} hora${hours !== 1 ? 's' : ''}`;
    else durStr = `${mins} min`;
    return `Renta de ${durStr} · retiro a las ${formatTime12(horaFin)}`;
  } else {
    const DAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
    const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const endDate = new Date(fechaFin + 'T00:00:00');
    const [, m, d] = fechaFin.split('-');
    const dateStr = `${DAYS[endDate.getDay()]} ${parseInt(d)} ${MONTHS[parseInt(m) - 1]}`;
    const diffDays = Math.round(diffMs / 86400000);
    return `Renta de ${diffDays} día${diffDays !== 1 ? 's' : ''} · retiro ${dateStr}`;
  }
}

const EMPTY_ITEM: ItemOrden = { producto: '', cantidad: 0, precio: 0 };

const NuevaOrden: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const fileRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loadingOrden, setLoadingOrden] = useState(isEdit);

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState<Omit<OrdenFormData, 'total'>>({
    nombreEvento: '',
    fecha: today,
    horaInicio: '09:00',
    fechaFin: today,
    horaFin: '18:00',
    nombre: '',
    telefono: '',
    direccion: '',
    estado: 'pendiente',
    comentarios: '',
    items: [{ ...EMPTY_ITEM }],
    imagenUrl: '',
  });

  useEffect(() => {
    if (!isEdit || !id) return;
    getOrden(id).then((o) => {
      if (!o) return;
      setForm({
        nombreEvento: o.nombreEvento ?? '',
        fecha: o.fecha,
        horaInicio: o.horaInicio ?? '09:00',
        fechaFin: o.fechaFin ?? o.fechaRetiro ?? o.fecha,
        horaFin: o.horaFin ?? '18:00',
        nombre: o.nombre,
        telefono: o.telefono,
        direccion: o.direccion,
        estado: o.estado,
        comentarios: o.comentarios,
        items: o.items,
        imagenUrl: o.imagenUrl,
      });
      if (o.imagenUrl) setImagePreview(o.imagenUrl);
    }).finally(() => setLoadingOrden(false));
  }, [id, isEdit]);

  const total = form.items.reduce((sum, i) => sum + i.cantidad * i.precio, 0);

  function setField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleItemChange(index: number, field: keyof ItemOrden, value: string | number) {
    const updated = [...form.items];
    updated[index] = { ...updated[index], [field]: value };
    setField('items', updated);
  }

  function addItem() {
    setField('items', [...form.items, { ...EMPTY_ITEM }]);
  }

  function removeItem(index: number) {
    if (form.items.length === 1) return;
    setField('items', form.items.filter((_, i) => i !== index));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombreEvento?.trim()) return alert('El nombre del evento es requerido');
    if (!form.nombre.trim()) return alert('El nombre del cliente es requerido');
    if (!form.fecha) return alert('La fecha del evento es requerida');
    if (form.items.some((i) => !i.producto.trim())) return alert('Todos los productos necesitan nombre');

    setSaving(true);
    try {
      let imagenUrl = form.imagenUrl;
      if (imageFile) {
        imagenUrl = await uploadImagen(imageFile);
      }

      const startMs = new Date((form.fechaFin ?? form.fecha) + 'T00:00:00').getTime();
      const endMs = new Date(form.fecha + 'T00:00:00').getTime();
      const diasRenta = Math.max(1, Math.round((startMs - endMs) / 86400000));
      const data: OrdenFormData = {
        ...form,
        imagenUrl,
        fechaRetiro: form.fechaFin ?? form.fecha,
        diasRenta,
      };

      if (isEdit && id) {
        await updateOrden(id, data);
        navigate(`/ordenes/${id}`, { replace: true });
      } else {
        const newId = await createOrden(data);
        navigate(`/ordenes/${newId}`, { replace: true });
      }
    } catch (err) {
      console.error(err);
      alert('Error al guardar la orden');
    } finally {
      setSaving(false);
    }
  }

  function handleTelefonoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    let formatted = '';
    if (digits.length <= 3) {
      formatted = digits.length ? `(${digits}` : '';
    } else if (digits.length <= 6) {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    setField('telefono', formatted);
  }

  if (loadingOrden) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingPlaceholder}>Cargando...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.title}>{isEdit ? 'Editar Orden' : 'Nueva Orden'}</h1>
        <div style={{ width: 40 }} />
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Date & Status */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Información del evento</h2>
          <div className={styles.field}>
            <label className={styles.label}>Nombre del evento *</label>
            <input
              className={styles.input}
              placeholder="Ej: Paquete brincolin"
              value={form.nombreEvento}
              onChange={(e) => setField('nombreEvento', e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Fecha y hora del evento</label>
            <div className={styles.datetimeBlock}>
              <div className={styles.datetimeSegment}>
                <span className={styles.datetimeSegmentLabel}>Empieza</span>
                <div className={styles.datetimeInputRow}>
                  <input
                    className={styles.input}
                    type="date"
                    value={form.fecha}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        fecha: val,
                        fechaFin: prev.fechaFin && prev.fechaFin < val ? val : prev.fechaFin,
                      }));
                    }}
                    required
                  />
                  <input
                    className={`${styles.input} ${styles.timeInput}`}
                    type="time"
                    value={form.horaInicio ?? '09:00'}
                    onChange={(e) => setField('horaInicio', e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.datetimeDivider} />

              <div className={styles.datetimeSegment}>
                <span className={styles.datetimeSegmentLabel}>Termina</span>
                <div className={styles.datetimeInputRow}>
                  <input
                    className={styles.input}
                    type="date"
                    value={form.fechaFin ?? form.fecha}
                    min={form.fecha}
                    onChange={(e) => setField('fechaFin', e.target.value)}
                    required
                  />
                  <input
                    className={`${styles.input} ${styles.timeInput}`}
                    type="time"
                    value={form.horaFin ?? '18:00'}
                    onChange={(e) => setField('horaFin', e.target.value)}
                  />
                </div>
              </div>

              {(() => {
                const dur = calcularDuracion(form.fecha, form.horaInicio ?? '', form.fechaFin ?? '', form.horaFin ?? '');
                return dur ? (
                  <div className={styles.durationHint}>
                    <Clock size={13} />
                    {dur}
                  </div>
                ) : null;
              })()}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Estado</label>
            <div className={styles.estadoPills}>
              {ESTADOS.map((e) => (
                <button
                  key={e.value}
                  type="button"
                  className={`${styles.estadoPill} ${form.estado === e.value ? styles.estadoPillActive : ''}`}
                  style={form.estado === e.value ? { background: e.color, borderColor: e.color } : {}}
                  onClick={() => setField('estado', e.value)}
                >
                  <span
                    className={styles.estadoDot}
                    style={{ background: form.estado === e.value ? 'white' : e.color }}
                  />
                  {e.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Client */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Datos del cliente</h2>

          <div className={styles.field}>
            <label className={styles.label}>Nombre completo *</label>
            <input
              className={styles.input}
              placeholder="Ej: María López"
              value={form.nombre}
              onChange={(e) => setField('nombre', e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Teléfono</label>
            <input
              className={styles.input}
              type="tel"
              placeholder="(509) 555-1234"
              value={form.telefono}
              onChange={handleTelefonoChange}
              maxLength={14}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Dirección del evento</label>
            <input
              className={styles.input}
              placeholder="123 Main St, Wenatchee, WA 98801"
              value={form.direccion}
              onChange={(e) => setField('direccion', e.target.value)}
            />
          </div>
        </div>

        {/* Products */}
        <div className={styles.card}>
          <div className={styles.cardTitleRow}>
            <h2 className={styles.cardTitle}>Productos</h2>
            <span className={styles.totalBadge}>
              $ {total.toLocaleString('es-HN')}
            </span>
          </div>

          <div className={styles.itemsList}>
            {form.items.map((item, i) => (
              <ItemRow
                key={i}
                item={item}
                index={i}
                onChange={handleItemChange}
                onRemove={removeItem}
              />
            ))}
          </div>

          <button
            type="button"
            className={styles.addItemBtn}
            onClick={addItem}
          >
            <Plus size={18} />
            Agregar producto
          </button>
        </div>

        {/* Comments */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Comentarios</h2>
          <textarea
            className={styles.textarea}
            placeholder="Instrucciones especiales, notas de entrega..."
            value={form.comentarios}
            onChange={(e) => setField('comentarios', e.target.value)}
            rows={3}
          />
        </div>

        {/* Image */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Imagen</h2>
          {imagePreview ? (
            <div className={styles.imagePreview}>
              <img src={imagePreview} alt="Preview" className={styles.previewImg} />
              <button
                type="button"
                className={styles.removeImageBtn}
                onClick={() => { setImagePreview(''); setImageFile(null); setField('imagenUrl', ''); }}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.uploadBtn}
              onClick={() => fileRef.current?.click()}
            >
              <Camera size={22} />
              <span>Seleccionar imagen</span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageChange}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={saving}
        >
          <Save size={20} />
          {saving ? 'Guardando...' : isEdit ? 'Actualizar Orden' : 'Guardar Orden'}
        </button>

        <div className={styles.bottomPad} />
      </form>
    </div>
  );
};

export default NuevaOrden;
