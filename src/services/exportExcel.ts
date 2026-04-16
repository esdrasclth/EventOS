import * as XLSX from 'xlsx';
import type { Orden } from '../types';

export function exportToExcel(ordenes: Orden[]): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1 — Órdenes summary
  const ordenesData = ordenes.map((o) => ({
    'Inicio': o.horaInicio ? `${o.fecha} ${o.horaInicio}` : o.fecha,
    'Termina': o.horaFin ? `${o.fechaFin ?? o.fechaRetiro ?? ''} ${o.horaFin}` : (o.fechaFin ?? o.fechaRetiro ?? ''),
    Cliente: o.nombre,
    Teléfono: o.telefono,
    Dirección: o.direccion,
    'Total ($)': o.total,
    Estado: o.estado.charAt(0).toUpperCase() + o.estado.slice(1),
  }));
  const ws1 = XLSX.utils.json_to_sheet(ordenesData);
  ws1['!cols'] = [
    { wch: 18 }, { wch: 18 }, { wch: 30 }, { wch: 18 }, { wch: 35 }, { wch: 12 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Órdenes');

  // Sheet 2 — Products detail
  const productosData: Record<string, unknown>[] = [];
  ordenes.forEach((o) => {
    o.items.forEach((item) => {
      productosData.push({
        'Orden ID': o.id,
        Cliente: o.nombre,
        Fecha: o.fecha,
        Producto: item.producto,
        Cantidad: item.cantidad,
        'Precio Unit. ($)': item.precio,
        'Subtotal ($)': item.cantidad * item.precio,
      });
    });
  });
  const ws2 = XLSX.utils.json_to_sheet(productosData);
  ws2['!cols'] = [
    { wch: 16 }, { wch: 28 }, { wch: 12 }, { wch: 22 },
    { wch: 10 }, { wch: 16 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Productos');

  // File name with current month-year
  const now = new Date();
  const monthNames = [
    'enero','febrero','marzo','abril','mayo','junio',
    'julio','agosto','septiembre','octubre','noviembre','diciembre',
  ];
  const fileName = `ordenes-${monthNames[now.getMonth()]}-${now.getFullYear()}.xlsx`;

  XLSX.writeFile(wb, fileName);
}
