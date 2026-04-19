import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import type { UserRole } from '../types';
import { getAuth } from 'firebase/auth';
import type { Orden, OrdenFormData, AuditInfo } from '../types';
import { USE_MOCK_DATA, MOCK_ORDENES } from '../data/seed';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Persistent cache: shows cached data instantly on app open,
// then syncs with server in the background.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// ── Audit helper ─────────────────────────────────────────────────────────────

let currentAppUserNombre: string | null = null;

export function setCurrentAppUserNombre(nombre: string | null): void {
  currentAppUserNombre = nombre;
}

function currentAudit(): AuditInfo | null {
  const user = auth.currentUser;
  if (!user) return null;
  return {
    uid: user.uid,
    nombre: currentAppUserNombre || user.displayName || user.email || 'Usuario',
    email: user.email ?? '',
    en: new Date().toISOString(),
  };
}

// ── Mock helpers ──────────────────────────────────────────────────────────────
let mockData: Orden[] = [...MOCK_ORDENES];

function nextMockId(): string {
  return `orden-${Date.now()}`;
}

// ── Service functions ─────────────────────────────────────────────────────────

// Legacy docs stored `estado: 'pagado'`. In the new model `pagado` is a separate
// boolean and the terminal state is `retirado`. Normalize on read.
function normalizeOrden(raw: Record<string, unknown>): Record<string, unknown> {
  if (raw.estado === 'pagado') {
    return { ...raw, estado: 'retirado', pagado: true };
  }
  return raw;
}

export async function getOrdenes(): Promise<Orden[]> {
  if (USE_MOCK_DATA) {
    return [...mockData].sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );
  }
  const q = query(collection(db, 'ordenes'), orderBy('fecha'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...normalizeOrden(d.data()) } as Orden));
}

export async function getOrden(id: string): Promise<Orden | null> {
  if (USE_MOCK_DATA) {
    return mockData.find((o) => o.id === id) ?? null;
  }
  const snap = await getDoc(doc(db, 'ordenes', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...normalizeOrden(snap.data()) } as Orden;
}

export function subscribeToOrdenes(
  callback: (ordenes: Orden[]) => void,
  onError?: (e: Error) => void,
  opts?: { role: UserRole; uid: string },
): () => void {
  if (USE_MOCK_DATA) {
    callback([...mockData].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()));
    return () => {};
  }

  let q;
  if (!opts || opts.role === 'admin') {
    q = query(collection(db, 'ordenes'), orderBy('fecha'));
  } else if (opts.role === 'staff') {
    q = query(
      collection(db, 'ordenes'),
      where('estado', 'in', ['confirmado', 'entregado', 'retirado', 'pagado', 'cancelado']),
      orderBy('fecha'),
    );
  } else {
    q = query(
      collection(db, 'ordenes'),
      where('asignados', 'array-contains', opts.uid),
      orderBy('fecha'),
    );
  }

  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...normalizeOrden(d.data()) } as Orden))),
    onError,
  );
}

export function subscribeToOrden(
  id: string,
  callback: (orden: Orden | null) => void,
  onError?: (e: Error) => void,
): () => void {
  if (USE_MOCK_DATA) {
    callback(mockData.find((o) => o.id === id) ?? null);
    return () => {};
  }
  return onSnapshot(
    doc(db, 'ordenes', id),
    (snap) => callback(snap.exists() ? ({ id: snap.id, ...normalizeOrden(snap.data()) } as Orden) : null),
    onError,
  );
}

export async function createOrden(data: OrdenFormData): Promise<string> {
  const total = data.items.reduce((sum, item) => sum + item.cantidad * item.precio, 0);
  const audit = currentAudit();

  if (USE_MOCK_DATA) {
    const id = nextMockId();
    mockData.push({
      ...data,
      id,
      total,
      creadoEn: new Date().toISOString(),
      ...(audit ? { creadoPor: audit } : {}),
    });
    return id;
  }
  const docRef = await addDoc(collection(db, 'ordenes'), {
    ...data,
    total,
    creadoEn: Timestamp.now(),
    ...(audit ? { creadoPor: audit } : {}),
  });
  return docRef.id;
}

export async function updateOrden(id: string, data: Partial<OrdenFormData>): Promise<void> {
  const total =
    data.items != null
      ? data.items.reduce((sum, item) => sum + item.cantidad * item.precio, 0)
      : undefined;
  const audit = currentAudit();

  if (USE_MOCK_DATA) {
    mockData = mockData.map((o) =>
      o.id === id
        ? {
            ...o,
            ...data,
            ...(total != null ? { total } : {}),
            ...(audit ? { modificadoPor: audit } : {}),
          }
        : o
    );
    return;
  }
  await updateDoc(doc(db, 'ordenes', id), {
    ...data,
    ...(total != null ? { total } : {}),
    ...(audit ? { modificadoPor: audit } : {}),
  });
}

export async function avanzarEstadoOrden(
  id: string,
  nuevoEstado: string,
  extra?: { asignados?: string[] },
): Promise<void> {
  const audit = currentAudit();
  const auditKey: Record<string, string> = {
    confirmado: 'confirmadoPor',
    entregado: 'entregadoPor',
    retirado: 'retiradoPor',
    cancelado: 'canceladoPor',
  };
  if (USE_MOCK_DATA) {
    const orden = mockData.find((o) => o.id === id);
    if (orden) {
      (orden as unknown as Record<string, unknown>).estado = nuevoEstado;
      if (audit && auditKey[nuevoEstado]) (orden as unknown as Record<string, unknown>)[auditKey[nuevoEstado]] = audit;
      if (extra?.asignados) (orden as unknown as Record<string, unknown>).asignados = extra.asignados;
    }
    return;
  }
  await updateDoc(doc(db, 'ordenes', id), {
    estado: nuevoEstado,
    ...(audit ? { modificadoPor: audit } : {}),
    ...(audit && auditKey[nuevoEstado] ? { [auditKey[nuevoEstado]]: audit } : {}),
    ...(extra?.asignados ? { asignados: extra.asignados } : {}),
  });
}

export async function setOrdenPagado(id: string, pagado: boolean): Promise<void> {
  const audit = currentAudit();
  if (USE_MOCK_DATA) {
    const orden = mockData.find((o) => o.id === id);
    if (orden) {
      (orden as unknown as Record<string, unknown>).pagado = pagado;
      if (pagado && audit) (orden as unknown as Record<string, unknown>).pagadoPor = audit;
    }
    return;
  }
  await updateDoc(doc(db, 'ordenes', id), {
    pagado,
    ...(audit ? { modificadoPor: audit } : {}),
    ...(pagado && audit ? { pagadoPor: audit } : {}),
  });
}

export async function updateAsignados(id: string, asignados: string[]): Promise<void> {
  const audit = currentAudit();
  if (USE_MOCK_DATA) {
    const orden = mockData.find((o) => o.id === id);
    if (orden) (orden as unknown as Record<string, unknown>).asignados = asignados;
    return;
  }
  await updateDoc(doc(db, 'ordenes', id), {
    asignados,
    ...(audit ? { modificadoPor: audit } : {}),
  });
}

export async function deleteOrden(id: string): Promise<void> {
  if (USE_MOCK_DATA) {
    mockData = mockData.filter((o) => o.id !== id);
    return;
  }
  await deleteDoc(doc(db, 'ordenes', id));
}

export async function savePushSubscription(
  userId: string,
  subscription: PushSubscriptionJSON,
): Promise<void> {
  if (USE_MOCK_DATA) return;
  await setDoc(doc(db, 'pushSubscriptions', userId), {
    userId,
    subscription,
    updatedAt: Timestamp.now(),
  });
}

// ── Per-order notification preferences ───────────────────────────────────────

export async function setOrderNotification(
  ordenId: string,
  enabled: boolean,
): Promise<void> {
  const userId = auth.currentUser?.uid;
  if (!userId || USE_MOCK_DATA) return;
  const docId = `${userId}_${ordenId}`;
  if (enabled) {
    await setDoc(doc(db, 'orderNotifications', docId), {
      userId,
      ordenId,
      enabled: true,
      updatedAt: Timestamp.now(),
    });
  } else {
    await deleteDoc(doc(db, 'orderNotifications', docId));
  }
}

export async function getOrderNotification(ordenId: string): Promise<boolean> {
  const userId = auth.currentUser?.uid;
  if (!userId || USE_MOCK_DATA) return false;
  const docId = `${userId}_${ordenId}`;
  const snap = await getDoc(doc(db, 'orderNotifications', docId));
  return snap.exists() && snap.data()?.enabled === true;
}

export async function uploadImagen(file: File): Promise<string> {
  if (USE_MOCK_DATA) {
    return URL.createObjectURL(file);
  }
  const cloudName   = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) throw new Error('Error al subir imagen a Cloudinary');

  const data = await res.json();
  return data.secure_url as string;
}
