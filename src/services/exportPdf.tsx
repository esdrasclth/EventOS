import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';
import type { Orden } from '../types';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontSize: 10,
    color: '#111111',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#386641',
  },
  headerLeft: {
    flex: 1,
  },
  companyName: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#386641',
    marginBottom: 2,
  },
  companySubtitle: {
    fontSize: 9,
    color: '#6B6B6B',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  ordenLabel: {
    fontSize: 9,
    color: '#6B6B6B',
    marginBottom: 2,
  },
  ordenId: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#386641',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#EBF3EC',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 90,
    color: '#6B6B6B',
    fontSize: 9,
  },
  value: {
    flex: 1,
    color: '#111111',
    fontSize: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#386641',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  tableHeaderText: {
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F7',
  },
  tableRowAlt: {
    backgroundColor: '#FAFAFA',
  },
  colProducto: { flex: 3 },
  colCantidad: { flex: 1, textAlign: 'center' },
  colPrecio: { flex: 1.5, textAlign: 'right' },
  colSubtotal: { flex: 1.5, textAlign: 'right' },
  tableText: { fontSize: 9, color: '#111111' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#386641',
  },
  totalLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#6B6B6B',
    marginRight: 16,
  },
  totalValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#386641',
  },
  comentariosText: {
    fontSize: 10,
    color: '#6B6B6B',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E8E8EC',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: '#6B6B6B',
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
});

const ESTADO_COLORS: Record<string, string> = {
  pendiente:  '#F59E0B',
  confirmado: '#3B82F6',
  entregado:  '#14B8A6',
  pagado:     '#22C55E',
  cancelado:  '#EF4444',
};

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

interface OrdenDocumentProps {
  orden: Orden;
}

const OrdenDocument: React.FC<OrdenDocumentProps> = ({ orden }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.companyName}>Pancho's Rentals</Text>
          <Text style={styles.companySubtitle}>Alquiler de Mobiliario para Eventos</Text>
          <Text style={styles.companySubtitle}>Honduras · eventoshn@gmail.com</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.ordenLabel}>COTIZACIÓN / ORDEN</Text>
          <Text style={styles.ordenId}>#{orden.id.slice(-6).toUpperCase()}</Text>
          <Text style={[styles.ordenLabel, { marginTop: 4 }]}>{formatDate(orden.fecha)}</Text>
          <Text
            style={[
              styles.estadoBadge,
              { color: ESTADO_COLORS[orden.estado] ?? '#111', marginTop: 6 },
            ]}
          >
            {orden.estado.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Client info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Datos del Cliente</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Cliente:</Text>
          <Text style={styles.value}>{orden.nombre}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Teléfono:</Text>
          <Text style={styles.value}>{orden.telefono}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Dirección:</Text>
          <Text style={styles.value}>{orden.direccion}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Empieza:</Text>
          <Text style={styles.value}>{formatDate(orden.fecha)}{orden.horaInicio ? ` · ${orden.horaInicio}` : ''}</Text>
        </View>
        {(orden.fechaFin || orden.fechaRetiro) ? (
          <View style={styles.row}>
            <Text style={styles.label}>Termina:</Text>
            <Text style={styles.value}>{formatDate(orden.fechaFin ?? orden.fechaRetiro!)}{orden.horaFin ? ` · ${orden.horaFin}` : ''}</Text>
          </View>
        ) : null}
      </View>

      {/* Products table */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detalle de Productos</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colProducto]}>Producto</Text>
          <Text style={[styles.tableHeaderText, styles.colCantidad]}>Cant.</Text>
          <Text style={[styles.tableHeaderText, styles.colPrecio]}>Precio Unit.</Text>
          <Text style={[styles.tableHeaderText, styles.colSubtotal]}>Subtotal</Text>
        </View>
        {orden.items.map((item, i) => (
          <View key={i} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
            <Text style={[styles.tableText, styles.colProducto]}>{item.producto}</Text>
            <Text style={[styles.tableText, styles.colCantidad]}>{item.cantidad}</Text>
            <Text style={[styles.tableText, styles.colPrecio]}>{formatCurrency(item.precio)}</Text>
            <Text style={[styles.tableText, styles.colSubtotal]}>
              {formatCurrency(item.cantidad * item.precio)}
            </Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL GENERAL:</Text>
          <Text style={styles.totalValue}>{formatCurrency(orden.total)}</Text>
        </View>
      </View>

      {/* Comments */}
      {orden.comentarios ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comentarios y Notas</Text>
          <Text style={styles.comentariosText}>{orden.comentarios}</Text>
        </View>
      ) : null}

      {/* Footer */}
      <View style={styles.footer} fixed>
        <Text style={styles.footerText}>Pancho's Rentals — Alquiler de Mobiliario para Eventos</Text>
        <Text style={styles.footerText}>Generado el {new Date().toLocaleDateString('es-HN')}</Text>
      </View>
    </Page>
  </Document>
);

export async function exportToPdf(orden: Orden): Promise<void> {
  const blob = await pdf(<OrdenDocument orden={orden} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orden-${orden.nombre.replace(/\s+/g, '-').toLowerCase()}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
