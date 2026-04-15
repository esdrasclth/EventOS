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
} from 'lucide-react';
import { useOrden } from '../hooks/useOrden';
import { deleteOrden, avanzarEstadoOrden } from '../services/firebase';
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

const DetalleOrden: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orden, loading, error, refetch } = useOrden(id ?? '');
  const [marking, setMarking] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

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
      await refetch();
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
      await refetch();
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
              <div>
                <p className={styles.infoLabel}>Teléfono</p>
                <p className={styles.infoValue}>{orden.telefono}</p>
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
                <p className={styles.infoLabel}>Fecha del evento</p>
                <p className={styles.infoValue}>{formatDate(orden.fecha)}</p>
              </div>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoIcon}><Calendar size={14} /></span>
              <div>
                <p className={styles.infoLabel}>Fecha de retiro ({orden.diasRenta ?? 1} día{(orden.diasRenta ?? 1) !== 1 ? 's' : ''} de renta)</p>
                <p className={styles.infoValue}>{orden.fechaRetiro ? formatDate(orden.fechaRetiro) : '—'}</p>
              </div>
            </div>
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
          title="Imagen de tarima"
          icon={<Image size={16} />}
          defaultOpen={false}
        >
          {orden.imagenUrl ? (
            <img
              src={orden.imagenUrl}
              alt="Tarima"
              className={styles.tarimImage}
            />
          ) : (
            <p className={styles.noComentarios}>No hay imagen adjunta</p>
          )}
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
