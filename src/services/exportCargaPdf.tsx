import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';
import type { Orden } from '../types';
import type { AggregatedProduct } from '../utils/cargaAggregation';

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
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#386641',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerLogo: {
    width: 56,
    height: 56,
    objectFit: 'contain',
  },
  headerInfo: { flex: 1 },
  companyName: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#386641',
    marginBottom: 2,
  },
  companySubtitle: { fontSize: 9, color: '#6B6B6B' },
  headerRight: { alignItems: 'flex-end' },
  docLabel: { fontSize: 9, color: '#6B6B6B', marginBottom: 2 },
  docTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
  },
  docDate: {
    fontSize: 10,
    color: '#386641',
    fontFamily: 'Helvetica-Bold',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  summary: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#EBF3EC',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#386641',
  },
  summaryLabel: {
    fontSize: 8,
    color: '#6B6B6B',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  section: { marginBottom: 20 },
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
    alignItems: 'center',
  },
  tableRowAlt: { backgroundColor: '#FAFAFA' },
  colProducto: { flex: 4 },
  colTag: { flex: 1.5, fontSize: 8, color: '#B45309' },
  colTotal: { flex: 1, textAlign: 'right' },
  tableText: { fontSize: 10, color: '#111111' },
  totalBold: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#386641',
  },
  ordenBlock: {
    marginBottom: 14,
    borderLeftWidth: 2,
    borderLeftColor: '#386641',
    paddingLeft: 10,
  },
  ordenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  ordenEvento: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#111111',
  },
  ordenHora: {
    fontSize: 9,
    color: '#6B6B6B',
    fontFamily: 'Helvetica-Bold',
  },
  ordenCliente: { fontSize: 9, color: '#6B6B6B', marginBottom: 2 },
  ordenDireccion: { fontSize: 9, color: '#6B6B6B', marginBottom: 6 },
  ordenItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  ordenItemName: { fontSize: 9, color: '#111111', flex: 1 },
  ordenItemQty: { fontSize: 9, color: '#386641', fontFamily: 'Helvetica-Bold' },
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
  footerText: { fontSize: 8, color: '#6B6B6B' },
});

function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-HN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime12(time?: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

interface CargaDocumentProps {
  fecha: string;
  ordenes: Orden[];
  aggregated: AggregatedProduct[];
}

const CargaDocument: React.FC<CargaDocumentProps> = ({ fecha, ordenes, aggregated }) => {
  const totalUnidades = aggregated.reduce((sum, p) => sum + p.totalUnidades, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image src="/logo.png" style={styles.headerLogo} />
            <View style={styles.headerInfo}>
              <Text style={styles.companyName}>Pancho's Rentals</Text>
              <Text style={styles.companySubtitle}>Alquiler de Mobiliario para Eventos</Text>
              <Text style={styles.companySubtitle}>627 King St, Wenatchee, WA 98801</Text>
              <Text style={styles.companySubtitle}>+1 (509) 415-8523 · +1 (469) 977-5522</Text>
              <Text style={styles.companySubtitle}>panchosrentals@hotmail.com</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.docLabel}>DOCUMENTO</Text>
            <Text style={styles.docTitle}>CARGA DEL DÍA</Text>
            <Text style={styles.docDate}>{formatDateLong(fecha)}</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{ordenes.length}</Text>
            <Text style={styles.summaryLabel}>Órdenes</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{aggregated.length}</Text>
            <Text style={styles.summaryLabel}>Productos</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{totalUnidades}</Text>
            <Text style={styles.summaryLabel}>Unidades</Text>
          </View>
        </View>

        {/* Aggregated products table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Totales a cargar</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colProducto]}>Producto</Text>
            <Text style={[styles.tableHeaderText, styles.colTag]}></Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
          </View>
          {aggregated.map((p, i) => (
            <View
              key={p.key}
              style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
            >
              <Text style={[styles.tableText, styles.colProducto]}>{p.nombre}</Text>
              <Text style={styles.colTag}>
                {!p.catalogado ? 'sin catálogo' : ''}
              </Text>
              <Text style={[styles.totalBold, styles.colTotal]}>
                {p.totalUnidades} uds.
              </Text>
            </View>
          ))}
        </View>

        {/* Per-order breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Desglose por orden</Text>
          {ordenes.map((o) => (
            <View key={o.id} style={styles.ordenBlock} wrap={false}>
              <View style={styles.ordenHeader}>
                <Text style={styles.ordenEvento}>{o.nombreEvento || o.nombre}</Text>
                <Text style={styles.ordenHora}>{formatTime12(o.horaInicio)}</Text>
              </View>
              <Text style={styles.ordenCliente}>
                Cliente: {o.nombre}
                {o.telefono ? ` · ${o.telefono}` : ''}
              </Text>
              {o.direccion ? (
                <Text style={styles.ordenDireccion}>{o.direccion}</Text>
              ) : null}
              {o.items.map((item, i) => (
                <View key={i} style={styles.ordenItem}>
                  <Text style={styles.ordenItemName}>• {item.producto}</Text>
                  <Text style={styles.ordenItemQty}>{item.cantidad} uds.</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Pancho's Rentals — Carga del día</Text>
          <Text style={styles.footerText}>
            Generado el {new Date().toLocaleDateString('es-HN')}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export async function exportCargaToPdf(
  fecha: string,
  ordenes: Orden[],
  aggregated: AggregatedProduct[],
): Promise<void> {
  const blob = await pdf(
    <CargaDocument fecha={fecha} ordenes={ordenes} aggregated={aggregated} />,
  ).toBlob();
  const filename = `carga-${fecha}.pdf`;

  const file = new File([blob], filename, { type: 'application/pdf' });
  if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      console.error('[carga-pdf] share failed, falling back:', e);
    }
  }

  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (!win) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
