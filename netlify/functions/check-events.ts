/**
 * Netlify Scheduled Function — runs every 15 minutes
 * Checks upcoming orders and sends push notifications
 * only to users who enabled notifications for each specific order.
 * Windows: 30 minutes, 2 hours, and 1 day before the event.
 */
import type { Config } from '@netlify/functions';
import webpush from 'web-push';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldPath } from 'firebase-admin/firestore';

// ── Init ─────────────────────────────────────────────────────────────────────

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!)),
  });
}
const db = getFirestore();

// ── Notification windows ──────────────────────────────────────────────────────
const WINDOWS = [
  { minutes: 30,   label: '30 minutos' },
  { minutes: 120,  label: '2 horas'    },
  { minutes: 1440, label: '1 día'      },
];

// Half the cron interval (7.5 min)
const TOLERANCE_MS = 7.5 * 60 * 1000;

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler() {
  const now = Date.now();

  // Load all per-order notification preferences (enabled)
  const notifPrefsSnap = await db.collection('orderNotifications')
    .where('enabled', '==', true)
    .get();

  if (notifPrefsSnap.empty) return new Response('no notification preferences', { status: 200 });

  // Build a map: ordenId → Set<userId>
  const orderUsers = new Map<string, Set<string>>();
  for (const doc of notifPrefsSnap.docs) {
    const { ordenId, userId } = doc.data() as { ordenId: string; userId: string };
    if (!orderUsers.has(ordenId)) orderUsers.set(ordenId, new Set());
    orderUsers.get(ordenId)!.add(userId);
  }

  // Load push subscriptions for those users
  const subsSnap = await db.collection('pushSubscriptions').get();
  const userSubs = new Map<string, webpush.PushSubscription[]>();
  for (const subDoc of subsSnap.docs) {
    const { userId, subscription } = subDoc.data() as {
      userId: string;
      subscription: webpush.PushSubscription;
    };
    if (!userSubs.has(userId)) userSubs.set(userId, []);
    userSubs.get(userId)!.push(subscription);
  }

  // Load relevant orders
  const orderIds = [...orderUsers.keys()];
  const sends: Promise<unknown>[] = [];

  // Firestore 'in' queries are limited to 30 items
  for (let i = 0; i < orderIds.length; i += 30) {
    const batch = orderIds.slice(i, i + 30);
    const ordersSnap = await db
      .collection('ordenes')
      .where(FieldPath.documentId(), 'in', batch)
      .get();

    for (const orderDoc of ordersSnap.docs) {
      const o = orderDoc.data() as {
        nombre: string;
        nombreEvento?: string;
        fecha: string;
        horaInicio?: string;
        direccion?: string;
        estado?: string;
      };

      if (!o.fecha || !o.horaInicio) continue;
      if (o.estado === 'cancelado' || o.estado === 'pagado') continue;

      const eventMs = new Date(`${o.fecha}T${o.horaInicio}:00`).getTime();
      const eventName = o.nombreEvento || o.nombre;
      const subscribedUsers = orderUsers.get(orderDoc.id);
      if (!subscribedUsers) continue;

      for (const { minutes, label } of WINDOWS) {
        const notifyAt = eventMs - minutes * 60_000;
        if (Math.abs(now - notifyAt) > TOLERANCE_MS) continue;

        for (const userId of subscribedUsers) {
          const sentId = `${orderDoc.id}-${minutes}-${userId}`;
          const sentRef = db.collection('notificationsSent').doc(sentId);
          const sentDoc = await sentRef.get();
          if (sentDoc.exists) continue;

          await sentRef.set({ sentAt: Timestamp.now() });

          const subs = userSubs.get(userId);
          if (!subs) continue;

          for (const subscription of subs) {
            sends.push(
              webpush
                .sendNotification(
                  subscription,
                  JSON.stringify({
                    title: eventName,
                    body: `Empieza en ${label}${o.direccion ? ` · ${o.direccion}` : ''}`,
                    tag: `${orderDoc.id}-${minutes}`,
                    data: { ordenId: orderDoc.id },
                  }),
                )
                .catch((err: { statusCode?: number }) => {
                  if (err.statusCode === 410) {
                    db.collection('pushSubscriptions').doc(userId).delete();
                  }
                }),
            );
          }
        }
      }
    }
  }

  await Promise.allSettled(sends);
  return new Response(`sent ${sends.length} notifications`, { status: 200 });
}

export const config: Config = {
  schedule: '*/15 * * * *',
};
