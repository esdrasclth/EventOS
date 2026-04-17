const STORAGE_KEY = 'eventos_notif_orders';

interface NotifEntry {
  ordenId: string;
  nombreEvento: string;
  fecha: string;
  horaInicio?: string;
  shownKeys: string[];
}

type NotifStore = Record<string, NotifEntry>;

function getStore(): NotifStore {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveStore(store: NotifStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function isOrderNotifEnabled(ordenId: string): boolean {
  return !!getStore()[ordenId];
}

export function enableOrderNotif(
  ordenId: string,
  nombreEvento: string,
  fecha: string,
  horaInicio?: string,
) {
  const store = getStore();
  store[ordenId] = {
    ordenId,
    nombreEvento,
    fecha,
    horaInicio,
    shownKeys: store[ordenId]?.shownKeys ?? [],
  };
  saveStore(store);
  scheduleAll();
}

export function disableOrderNotif(ordenId: string) {
  const store = getStore();
  delete store[ordenId];
  saveStore(store);
}

export function cleanupPastOrders() {
  const store = getStore();
  const now = Date.now();
  let changed = false;
  for (const [id, entry] of Object.entries(store)) {
    const eventTime = buildEventDate(entry.fecha, entry.horaInicio).getTime();
    if (eventTime < now - 3600_000) {
      delete store[id];
      changed = true;
    }
  }
  if (changed) saveStore(store);
}

function buildEventDate(fecha: string, horaInicio?: string): Date {
  if (horaInicio) {
    return new Date(`${fecha}T${horaInicio}:00`);
  }
  return new Date(`${fecha}T08:00:00`);
}

interface SchedulePoint {
  key: string;
  label: string;
  offsetMs: number;
}

const SCHEDULE_POINTS: SchedulePoint[] = [
  { key: '24h', label: 'mañana', offsetMs: 24 * 3600_000 },
  { key: '1h', label: 'en 1 hora', offsetMs: 3600_000 },
];

const activeTimers: number[] = [];

async function showLocalNotification(
  title: string,
  body: string,
  ordenId: string,
) {
  if (Notification.permission !== 'granted') return;

  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: `order-${ordenId}`,
      data: { ordenId },
    } as NotificationOptions);
  } catch {
    new Notification(title, { body, icon: '/icons/icon-192.png' });
  }
}

function markShown(ordenId: string, key: string) {
  const store = getStore();
  const entry = store[ordenId];
  if (!entry) return;
  if (!entry.shownKeys.includes(key)) {
    entry.shownKeys.push(key);
    saveStore(store);
  }
}

export function scheduleAll() {
  for (const t of activeTimers) clearTimeout(t);
  activeTimers.length = 0;

  if (Notification.permission !== 'granted') return;

  cleanupPastOrders();
  const store = getStore();
  const now = Date.now();

  for (const entry of Object.values(store)) {
    const eventTime = buildEventDate(entry.fecha, entry.horaInicio).getTime();

    for (const point of SCHEDULE_POINTS) {
      const fireAt = eventTime - point.offsetMs;
      const delay = fireAt - now;

      if (delay < -60_000) continue;
      if (entry.shownKeys.includes(point.key)) continue;

      const fire = () => {
        markShown(entry.ordenId, point.key);
        showLocalNotification(
          `🔔 ${entry.nombreEvento}`,
          `Tu evento "${entry.nombreEvento}" es ${point.label}`,
          entry.ordenId,
        );
      };

      if (delay <= 0) {
        fire();
      } else {
        const maxDelay = 2_147_483_647;
        if (delay <= maxDelay) {
          activeTimers.push(window.setTimeout(fire, delay));
        }
      }
    }
  }
}

export function initNotificationScheduler() {
  scheduleAll();

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      scheduleAll();
    }
  });
}
