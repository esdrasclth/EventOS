/**
 * Netlify Scheduled Function — runs every 15 minutes
 * Checks upcoming orders and sends push notifications
 * at: 30 minutes before, 2 hours before, and 1 day before the event.
 */
import type { Config } from '@netlify/functions';
import webpush from 'web-push';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

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
// Each entry: how many minutes before the event to notify, and the label shown
const WINDOWS = [
  { minutes: 30,   label: '30 minutos' },
  { minutes: 120,  label: '2 horas'    },
  { minutes: 1440, label: '1 día'      },
];

// Half the cron interval (7.5 min) — a notification is due if the notify-at
// time falls within ±TOLERANCE of now.
const TOLERANCE_MS = 7.5 * 60 * 1000;

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler() {
  const now = Date.now();

  // Load all push subscriptions
  const subsSnap = await db.collection('pushSubscriptions').get();
  if (subsSnap.empty) return new Response('no subscribers', { status: 200 });

  // Load pending orders (not cancelled or paid)
  const ordersSnap = await db
    .collection('ordenes')
    .where('estado', 'not-in', ['cancelado', 'pagado'])
    .get();

  const sends: Promise<unknown>[] = [];

  for (const orderDoc of ordersSnap.docs) {
    const o = orderDoc.data() as {
      nombre: string;
      nombreEvento?: string;
      fecha: string;
      horaInicio?: string;
      direccion?: string;
    };

    if (!o.fecha || !o.horaInicio) continue;

    const eventMs = new Date(`${o.fecha}T${o.horaInicio}:00`).getTime();
    const eventName = o.nombreEvento || o.nombre;

    for (const { minutes, label } of WINDOWS) {
      const notifyAt = eventMs - minutes * 60_000;
      if (Math.abs(now - notifyAt) > TOLERANCE_MS) continue;

      // Deduplication: mark this notification as sent
      const sentId = `${orderDoc.id}-${minutes}`;
      const sentRef = db.collection('notificationsSent').doc(sentId);
      const sentDoc = await sentRef.get();
      if (sentDoc.exists) continue;

      await sentRef.set({ sentAt: Timestamp.now() });

      // Queue a push for each subscribed device
      for (const subDoc of subsSnap.docs) {
        const { subscription } = subDoc.data() as { subscription: webpush.PushSubscription };
        sends.push(
          webpush
            .sendNotification(
              subscription,
              JSON.stringify({
                title: eventName,
                body: `Empieza en ${label}${o.direccion ? ` · ${o.direccion}` : ''}`,
                tag: sentId,
                data: { ordenId: orderDoc.id },
              }),
            )
            .catch((err: { statusCode?: number }) => {
              // 410 = subscription expired, remove it
              if (err.statusCode === 410) {
                subDoc.ref.delete();
              }
            }),
        );
      }
    }
  }

  await Promise.allSettled(sends);
  return new Response(`sent ${sends.length} notifications`, { status: 200 });
}

export const config: Config = {
  schedule: '*/15 * * * *',
};
