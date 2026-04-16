/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope;

// Precache all build assets (manifest injected by vite-plugin-pwa)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
precacheAndRoute((self as any).__WB_MANIFEST);
cleanupOutdatedCaches();

// Skip waiting when UpdateBanner calls updateServiceWorker(true)
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// Firestore — NetworkFirst (fresh data when online, cache when offline)
registerRoute(
  ({ url }) => url.hostname === 'firestore.googleapis.com',
  new NetworkFirst({
    cacheName: 'firestore-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 86400 })],
  })
);

// Firebase Storage — CacheFirst
registerRoute(
  ({ url }) => url.hostname === 'firebasestorage.googleapis.com',
  new CacheFirst({
    cacheName: 'firebase-storage-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 604800 })],
  })
);

// ── Push notification handler ─────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;
  const { title, body, tag, data } = event.data.json() as {
    title: string;
    body: string;
    tag: string;
    data?: Record<string, unknown>;
  };
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag,
      data,
      vibrate: [200, 100, 200],
    })
  );
});

// Open the order when the user taps the notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const d = event.notification.data as { ordenId?: string } | undefined;
  const url = d?.ordenId ? `/ordenes/${d.ordenId}` : '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          return (client as WindowClient).navigate(url);
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
