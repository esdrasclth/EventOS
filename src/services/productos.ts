import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import type { Producto, AuditInfo } from '../types';

function currentAudit(): AuditInfo | null {
  const user = auth.currentUser;
  if (!user) return null;
  return {
    uid: user.uid,
    nombre: user.displayName || user.email || 'Usuario',
    email: user.email ?? '',
    en: new Date().toISOString(),
  };
}

export function subscribeToProductos(
  callback: (productos: Producto[]) => void,
  onError?: (e: Error) => void,
): () => void {
  const q = query(collection(db, 'productos'), orderBy('nombre'));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Producto))),
    onError,
  );
}

export async function createProducto(nombre: string): Promise<string> {
  const audit = currentAudit();
  const docRef = await addDoc(collection(db, 'productos'), {
    nombre: nombre.trim(),
    activo: true,
    creadoEn: Timestamp.now(),
    ...(audit ? { creadoPor: audit } : {}),
  });
  return docRef.id;
}

export async function renameProducto(id: string, nombre: string): Promise<void> {
  await updateDoc(doc(db, 'productos', id), { nombre: nombre.trim() });
}

export async function setProductoActivo(id: string, activo: boolean): Promise<void> {
  await updateDoc(doc(db, 'productos', id), { activo });
}
