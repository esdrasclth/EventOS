import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import type { Orden, OrdenFormData, AuditInfo } from '../types';
import { USE_MOCK_DATA, MOCK_ORDENES } from '../data/seed';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ── Audit helper ─────────────────────────────────────────────────────────────

function currentAudit(): AuditInfo | null {
  const user = auth.currentUser;
  if (!user) return null;
  return {
    uid: user.uid,
    nombre: user.displayName ?? user.email ?? 'Usuario',
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

export async function getOrdenes(): Promise<Orden[]> {
  if (USE_MOCK_DATA) {
    return [...mockData].sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );
  }
  const q = query(collection(db, 'ordenes'), orderBy('fecha'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Orden));
}

export async function getOrden(id: string): Promise<Orden | null> {
  if (USE_MOCK_DATA) {
    return mockData.find((o) => o.id === id) ?? null;
  }
  const snap = await getDoc(doc(db, 'ordenes', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Orden;
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

export async function deleteOrden(id: string): Promise<void> {
  if (USE_MOCK_DATA) {
    mockData = mockData.filter((o) => o.id !== id);
    return;
  }
  await deleteDoc(doc(db, 'ordenes', id));
}

export async function uploadImagen(file: File): Promise<string> {
  if (USE_MOCK_DATA) {
    return URL.createObjectURL(file);
  }
  // TODO: reemplazar con Cloudinary
  const storageRef = ref(storage, `imagenes/${Date.now()}-${file.name}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
