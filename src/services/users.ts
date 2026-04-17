import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { initializeApp, getApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, auth } from './firebase';
import type { AppUser, UserRole } from '../types';

export async function getAppUser(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as AppUser;
}

export async function listUsers(): Promise<AppUser[]> {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as AppUser));
}

export async function listUsersByRole(role: UserRole): Promise<AppUser[]> {
  const q = query(
    collection(db, 'users'),
    where('role', '==', role),
    where('activo', '==', true),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as AppUser));
}

export function subscribeToUsers(
  callback: (users: AppUser[]) => void,
  onError?: (e: Error) => void,
): () => void {
  return onSnapshot(
    collection(db, 'users'),
    (snap) => callback(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as AppUser))),
    onError,
  );
}

export async function createAppUser(
  uid: string,
  data: Omit<AppUser, 'uid' | 'creadoEn'>,
): Promise<void> {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    creadoEn: new Date().toISOString(),
  });
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { role });
}

export async function setUserActive(uid: string, activo: boolean): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { activo });
}

export async function ensureSelfUserDoc(): Promise<AppUser | null> {
  const current = auth.currentUser;
  if (!current) return null;
  return getAppUser(current.uid);
}

// Crea usuario de Auth + doc de Firestore sin desloguear al admin.
// Usa una app secundaria para que el nuevo usuario no reemplace la sesión actual.
export async function createUserWithAccount(
  email: string,
  password: string,
  data: { nombre: string; role: UserRole; activo: boolean },
): Promise<string> {
  const mainApp = getApp();
  const tempAppName = `temp-create-user-${Date.now()}`;
  const tempApp = initializeApp(mainApp.options, tempAppName);
  const tempAuth = getAuth(tempApp);
  try {
    const cred = await createUserWithEmailAndPassword(tempAuth, email, password);
    const uid = cred.user.uid;
    await createAppUser(uid, {
      email,
      nombre: data.nombre,
      role: data.role,
      activo: data.activo,
    });
    await signOut(tempAuth);
    return uid;
  } finally {
    await deleteApp(tempApp);
  }
}
