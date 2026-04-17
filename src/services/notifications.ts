import { savePushSubscription } from './firebase';
import { auth } from './firebase';

export function isPushSupported(): boolean {
  return (
    'PushManager' in window &&
    'serviceWorker' in navigator &&
    'Notification' in window
  );
}

export async function requestAndSubscribe(): Promise<'granted' | 'denied' | 'unsupported'> {
  console.log('[push] requestAndSubscribe: start');
  if (!isPushSupported()) {
    console.warn('[push] not supported');
    return 'unsupported';
  }

  const permission = await Notification.requestPermission();
  console.log('[push] permission:', permission);
  if (permission !== 'granted') return 'denied';

  const reg = await navigator.serviceWorker.ready;
  console.log('[push] SW ready, scope:', reg.scope);
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;
  console.log('[push] VAPID key present:', !!vapidKey, 'length:', vapidKey?.length);

  const keyBytes = urlBase64ToUint8Array(vapidKey);
  console.log('[push] decoded key bytes:', keyBytes.length, 'first byte:', '0x' + keyBytes[0].toString(16));

  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    console.log('[push] unsubscribing existing subscription first');
    await existing.unsubscribe();
  }

  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: keyBytes as unknown as BufferSource,
  });
  console.log('[push] pushManager subscription created:', subscription.endpoint);

  const userId = auth.currentUser?.uid;
  console.log('[push] auth uid:', userId);
  if (!userId) return 'denied';

  await savePushSubscription(userId, subscription.toJSON());
  console.log('[push] subscription saved to Firestore');
  return 'granted';
}

export async function getSubscriptionState(): Promise<'granted' | 'denied' | 'default' | 'unsupported'> {
  if (!isPushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';

  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();

  if (sub && Notification.permission === 'granted') return 'granted';
  return 'default';
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
