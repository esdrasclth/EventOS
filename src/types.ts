export interface ItemOrden {
  producto: string;
  cantidad: number;
  precio: number;
}

export type EstadoOrden = 'pendiente' | 'confirmado' | 'entregado' | 'pagado';

export interface AuditInfo {
  uid: string;
  nombre: string;
  email: string;
  en: string; // ISO timestamp
}

export interface Orden {
  id: string;
  fecha: string;
  diasRenta: number;
  fechaRetiro: string;
  nombre: string;
  telefono: string;
  direccion: string;
  comentarios: string;
  estado: EstadoOrden;
  items: ItemOrden[];
  total: number;
  imagenUrl: string;
  creadoEn: string;
  creadoPor?: AuditInfo;
  modificadoPor?: AuditInfo;
}

export type OrdenFormData = Omit<Orden, 'id' | 'creadoEn' | 'total' | 'creadoPor' | 'modificadoPor'>;
