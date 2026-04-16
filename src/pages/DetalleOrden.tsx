import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Package,
  MessageSquare,
  Image,
  Phone,
  MapPin,
  Calendar,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit3,
  Clock,
  Camera,
} from 'lucide-react';
import { useRef, useCallback } from 'react';
import { useOrden } from '../hooks/useOrden';
import { deleteOrden, avanzarEstadoOrden, updateOrden, uploadImagen } from '../services/firebase';
import { exportToExcel } from '../services/exportExcel';
import { exportToPdf } from '../services/exportPdf';
import HeroImage from '../components/HeroImage';
import CollapseSection from '../components/CollapseSection';
import styles from './DetalleOrden.module.css';

const ESTADO_LABELS: Record<string, string> = {
  pendiente:  'Pendiente',
  confirmado: 'Confirmado',
  entregado:  'Entregado',
  pagado:     'Pagado',
  cancelado:  'Cancelado',
};

const ESTADO_COLORS: Record<string, string> = {
  pendiente:  '#F59E0B',
  confirmado: '#3B82F6',
  entregado:  '#14B8A6',
  pagado:     '#22C55E',
  cancelado:  '#EF4444',
};

const SIGUIENTE_ESTADO: Record<string, { estado: string; label: string } | null> = {
  pendiente:  { estado: 'confirmado', label: 'Confirmar orden' },
  confirmado: { estado: 'entregado',  label: 'Marcar como entregado' },
  entregado:  { estado: 'pagado',     label: 'Marcar como pagado' },
  pagado:     null,
  cancelado:  null,
};

// Puede eliminarse solo si está pendiente
const puedeEliminar = (estado: string) => estado === 'pendiente';
// Puede editarse solo si no está pagado ni cancelado
const puedeEditar = (estado: string) => estado !== 'pagado' && estado !== 'cancelado';
// Puede cancelarse si está confirmado o entregado
const puedeCancelar = (estado: string) => estado === 'confirmado' || estado === 'entregado';

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  const months = [
    'enero','febrero','marzo','abril','mayo','junio',
    'julio','agosto','septiembre','octubre','noviembre','diciembre',
  ];
  return `${parseInt(d)} de ${months[parseInt(m) - 1]} de ${y}`;
}

function formatCurrency(amount: number): string {
  return `$ ${amount.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`;
}

function formatDatetime(date: string, time?: string): string {
  const [y, m, d] = date.split('-');
  const MONTHS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const dateStr = `${parseInt(d)} ${MONTHS[parseInt(m)-1]} ${y}`;
  if (!time) return dateStr;
  const [h, min] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${dateStr} · ${hour}:${String(min).padStart(2,'0')} ${period}`;
}

function calcularDuracionDetalle(orden: { fecha: string; horaInicio?: string; fechaFin?: string; horaFin?: string; diasRenta?: number; fechaRetiro?: string }): string | null {
  const fechaFin = orden.fechaFin ?? orden.fechaRetiro;
  if (!fechaFin) return null;

  if (orden.horaInicio && orden.horaFin) {
    const start = new Date(`${orden.fecha}T${orden.horaInicio}:00`);
    const end = new Date(`${fechaFin}T${orden.horaFin}:00`);
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return null;

    if (orden.fecha === fechaFin) {
      const diffMins = Math.round(diffMs / 60000);
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
      if (hours > 0) return `${hours} hora${hours !== 1 ? 's' : ''}`;
      return `${mins} min`;
    } else {
      const diffDays = Math.round(diffMs / 86400000);
      return `${diffDays} día${diffDays !== 1 ? 's' : ''}`;
    }
  }

  if (orden.diasRenta && orden.diasRenta > 1) {
    return `${orden.diasRenta} día${orden.diasRenta !== 1 ? 's' : ''}`;
  }
  return null;
}

const DetalleOrden: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orden, loading, error } = useOrden(id ?? '');
  const [marking, setMarking] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orden) return;
    setUploadingImg(true);
    try {
      const url = await uploadImagen(file);
      await updateOrden(orden.id, { imagenUrl: url } as never);
    } catch (err) {
      console.error(err);
      alert('Error al subir la imagen');
    } finally {
      setUploadingImg(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }, [orden]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={`skeleton ${styles.heroSkeleton}`} />
        <div className={styles.content}>
          {[0, 1, 2].map((i) => (
            <div key={i} className={`skeleton ${styles.sectionSkeleton}`} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !orden) {
    return (
      <div className={styles.errorPage}>
        <p>Orden no encontrada</p>
        <button onClick={() => navigate(-1)}>Volver</button>
      </div>
    );
  }

  async function handleAvanzarEstado() {
    if (!orden) return;
    const siguiente = SIGUIENTE_ESTADO[orden.estado];
    if (!siguiente) return;
    setMarking(true);
    try {
      await avanzarEstadoOrden(orden.id, siguiente.estado);
    } finally {
      setMarking(false);
    }
  }

  async function handleCancelar() {
    if (!orden) return;
    if (!confirm(`¿Cancelar la orden de ${orden.nombre}? Quedará registrada como cancelada.`)) return;
    setCancelling(true);
    try {
      await avanzarEstadoOrden(orden.id, 'cancelado');
    } finally {
      setCancelling(false);
    }
  }

  async function handleDelete() {
    if (!orden) return;
    if (!confirm(`¿Eliminar la orden de ${orden.nombre}?`)) return;
    setDeleting(true);
    try {
      await deleteOrden(orden.id);
      navigate('/ordenes', { replace: true });
    } finally {
      setDeleting(false);
    }
  }

  async function handleExportPdf() {
    if (!orden) return;
    setPdfLoading(true);
    try {
      await exportToPdf(orden);
    } finally {
      setPdfLoading(false);
    }
  }

  function handleExportExcel() {
    if (!orden) return;
    exportToExcel([orden]);
  }

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.heroWrapper}>
        <HeroImage
          imageUrl={orden.imagenUrl || undefined}
          title={orden.nombreEvento || orden.nombre}
          subtitle={orden.nombreEvento ? `${orden.nombre} · ${formatDate(orden.fecha)}` : `Evento · ${formatDate(orden.fecha)}`}
        />
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div className={styles.heroActions}>
          {puedeEditar(orden.estado) && (
            <button
              className={styles.heroActionBtn}
              onClick={() => navigate(`/ordenes/${orden.id}/editar`)}
              aria-label="Editar"
            >
              <Edit3 size={18} />
            </button>
          )}
          {puedeEliminar(orden.estado) && (
            <button
              className={`${styles.heroActionBtn} ${styles.heroActionDanger}`}
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Eliminar"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>

        {/* Estado badge */}
        <div
          className={styles.estadoBadge}
          style={{ background: ESTADO_COLORS[orden.estado] }}
        >
          {ESTADO_LABELS[orden.estado]}
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Client data */}
        <CollapseSection
          title="Datos del cliente"
          icon={<User size={16} />}
          defaultOpen
        >
          <div className={styles.infoList}>
            <div className={styles.infoRow}>
              <span className={styles.infoIcon}><Phone size={14} /></span>
              <div className={styles.infoRowContent}>
                <p className={styles.infoLabel}>Teléfono</p>
                <div className={styles.telefonoRow}>
                  <p className={styles.infoValue}>{orden.telefono}</p>
                  {orden.telefono && (
                    <a
                      href={`tel:${orden.telefono.replace(/\D/g, '')}`}
                      className={styles.callBtn}
                      aria-label="Llamar"
                    >
                      <Phone size={15} />
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoIcon}><MapPin size={14} /></span>
              <div>
                <p className={styles.infoLabel}>Dirección</p>
                <p className={styles.infoValue}>{orden.direccion}</p>
              </div>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoIcon}><Calendar size={14} /></span>
              <div>
                <p className={styles.infoLabel}>Empieza</p>
                <p className={styles.infoValue}>{formatDatetime(orden.fecha, orden.horaInicio)}</p>
              </div>
            </div>
            {(orden.fechaFin || orden.fechaRetiro) && (
              <div className={styles.infoRow}>
                <span className={styles.infoIcon}><Calendar size={14} /></span>
                <div>
                  <p className={styles.infoLabel}>Termina</p>
                  <p className={styles.infoValue}>{formatDatetime(orden.fechaFin ?? orden.fechaRetiro!, orden.horaFin)}</p>
                </div>
              </div>
            )}
            {(() => {
              const dur = calcularDuracionDetalle(orden);
              return dur ? (
                <div className={styles.infoRow}>
                  <span className={styles.infoIcon}><Clock size={14} /></span>
                  <div>
                    <p className={styles.infoLabel}>Duración</p>
                    <p className={styles.infoValue}>{dur}</p>
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        </CollapseSection>

        {/* Products */}
        <CollapseSection
          title="Productos"
          icon={<Package size={16} />}
          defaultOpen
        >
          <div className={styles.productsTable}>
            <div className={styles.tableHeader}>
              <span className={styles.thProducto}>Producto</span>
              <span className={styles.thNum}>Cant.</span>
              <span className={styles.thNum}>P.U.</span>
              <span className={styles.thNum}>Sub.</span>
            </div>
            {orden.items.map((item, i) => (
              <div
                key={i}
                className={`${styles.tableRow} ${i % 2 === 1 ? styles.tableRowAlt : ''}`}
              >
                <span className={styles.tdProducto}>{item.producto}</span>
                <span className={styles.tdNum}>{item.cantidad}</span>
                <span className={styles.tdNum}>{formatCurrency(item.precio)}</span>
                <span className={`${styles.tdNum} ${styles.tdSubtotal}`}>
                  {formatCurrency(item.cantidad * item.precio)}
                </span>
              </div>
            ))}
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>TOTAL</span>
              <span className={styles.totalValue}>{formatCurrency(orden.total)}</span>
            </div>
          </div>
        </CollapseSection>

        {/* Comments */}
        <CollapseSection
          title="Comentarios"
          icon={<MessageSquare size={16} />}
          defaultOpen={!!orden.comentarios}
        >
          {orden.comentarios ? (
            <p className={styles.comentarios}>{orden.comentarios}</p>
          ) : (
            <p className={styles.noComentarios}>Sin comentarios</p>
          )}
        </CollapseSection>

        {/* Image */}
        <CollapseSection
          title="Imagen"
          icon={<Image size={16} />}
          defaultOpen={false}
        >
          {orden.imagenUrl && (
            <img
              src={orden.imagenUrl.includes('cloudinary.com')
                ? orden.imagenUrl.replace('/upload/', '/upload/w_800,q_auto,f_auto/')
                : orden.imagenUrl}
              alt="Imagen"
              className={styles.tarimImage}
              loading="lazy"
              decoding="async"
            />
          )}
          <button
            className={styles.uploadImgBtn}
            onClick={() => fileRef.current?.click()}
            disabled={uploadingImg}
          >
            <Camera size={18} />
            {uploadingImg ? 'Subiendo...' : orden.imagenUrl ? 'Cambiar imagen' : 'Agregar imagen'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />
        </CollapseSection>

        {/* Audit log */}
        <div className={styles.auditBox}>
          <Clock size={13} className={styles.auditIcon} />
          <div className={styles.auditLines}>
            {orden.creadoPor ? (
              <p className={styles.auditLine}>
                <span className={styles.auditVerb}>Creado por</span>
                <span className={styles.auditUser}>{orden.creadoPor.nombre}</span>
                <span className={styles.auditDate}>
                  {new Date(orden.creadoPor.en).toLocaleString('es-HN', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </p>
            ) : (
              <p className={styles.auditLine}>
                <span className={styles.auditVerb}>Creado el</span>
                <span className={styles.auditDate}>
                  {new Date(orden.creadoEn).toLocaleString('es-HN', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </p>
            )}
            {orden.confirmadoPor && (
              <p className={styles.auditLine}>
                <span className={styles.auditVerb}>Confirmado por</span>
                <span className={styles.auditUser}>{orden.confirmadoPor.nombre}</span>
                <span className={styles.auditDate}>
                  {new Date(orden.confirmadoPor.en).toLocaleString('es-HN', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </p>
            )}
            {orden.entregadoPor && (
              <p className={styles.auditLine}>
                <span className={styles.auditVerb}>Entregado por</span>
                <span className={styles.auditUser}>{orden.entregadoPor.nombre}</span>
                <span className={styles.auditDate}>
                  {new Date(orden.entregadoPor.en).toLocaleString('es-HN', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </p>
            )}
            {orden.pagadoPor && (
              <p className={styles.auditLine}>
                <span className={styles.auditVerb}>Pagado por</span>
                <span className={styles.auditUser}>{orden.pagadoPor.nombre}</span>
                <span className={styles.auditDate}>
                  {new Date(orden.pagadoPor.en).toLocaleString('es-HN', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </p>
            )}
            {orden.canceladoPor && (
              <p className={styles.auditLine}>
                <span className={styles.auditVerb} style={{ color: '#EF4444' }}>Cancelado por</span>
                <span className={styles.auditUser}>{orden.canceladoPor.nombre}</span>
                <span className={styles.auditDate}>
                  {new Date(orden.canceladoPor.en).toLocaleString('es-HN', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className={styles.actions}>
        <div className={styles.actionsSecondary}>
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={handleExportPdf}
            disabled={pdfLoading}
          >
            <FileText size={16} />
            {pdfLoading ? 'Generando...' : 'PDF'}
          </button>
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={handleExportExcel}
          >
            <FileSpreadsheet size={16} />
            Excel
          </button>
        </div>

        {puedeCancelar(orden.estado) && (
          <button
            className={`${styles.btn} ${styles.btnDanger}`}
            onClick={handleCancelar}
            disabled={cancelling}
          >
            <XCircle size={18} />
            {cancelling ? 'Cancelando...' : 'Cancelar orden'}
          </button>
        )}

        {SIGUIENTE_ESTADO[orden.estado] ? (
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleAvanzarEstado}
            disabled={marking}
          >
            <CheckCircle2 size={18} />
            {marking ? 'Guardando...' : SIGUIENTE_ESTADO[orden.estado]!.label}
          </button>
        ) : orden.estado === 'pagado' ? (
          <button className={`${styles.btn} ${styles.btnDone}`} disabled>
            <CheckCircle2 size={18} />
            Orden pagada ✓
          </button>
        ) : (
          <button className={`${styles.btn} ${styles.btnCancelled}`} disabled>
            <XCircle size={18} />
            Orden cancelada
          </button>
        )}
      </div>
    </div>
  );
};

export default DetalleOrden;
