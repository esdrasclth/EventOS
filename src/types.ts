export interface ItemOrden {
  producto: string;
  productoId?: string;
  cantidad: number;
  precio: number;
}

export interface Producto {
  id: string;
  nombre: string;
  activo: boolean;
  creadoEn: string;
  creadoPor?: AuditInfo;
}

export type EstadoOrden = 'pendiente' | 'confirmado' | 'entregado' | 'retirado' | 'cancelado';

export interface AuditInfo {
  uid: string;
  nombre: string;
  email: string;
  en: string; // ISO timestamp
}

export interface Orden {
  id: string;
  nombreEvento?: string;
  fecha: string;
  horaInicio?: string;
  fechaFin?: string;
  horaFin?: string;
  diasRenta?: number;
  fechaRetiro?: string;
  nombre: string;
  telefono: string;
  direccion: string;
  comentarios: string;
  estado: EstadoOrden;
  pagado?: boolean;
  items: ItemOrden[];
  total: number;
  imagenUrl: string;
  creadoEn: string;
  creadoPor?: AuditInfo;
  confirmadoPor?: AuditInfo;
  entregadoPor?: AuditInfo;
  retiradoPor?: AuditInfo;
  pagadoPor?: AuditInfo;
  canceladoPor?: AuditInfo;
  modificadoPor?: AuditInfo;
  asignados?: string[];
}

export type OrdenFormData = Omit<Orden, 'id' | 'creadoEn' | 'total' | 'creadoPor' | 'modificadoPor'>;

export type UserRole = 'admin' | 'staff' | 'delivery';

export interface AppUser {
  uid: string;
  email: string;
  nombre: string;
  role: UserRole;
  activo: boolean;
  creadoEn: string;
}
