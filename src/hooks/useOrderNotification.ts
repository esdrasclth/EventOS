import { useState, useEffect, useCallback } from 'react';
import {
  setOrderNotification,
  getOrderNotification,
} from '../services/firebase';
import {
  requestAndSubscribe,
  getSubscriptionState,
} from '../services/notifications';
import {
  isOrderNotifEnabled,
  enableOrderNotif,
  disableOrderNotif,
} from '../services/notificationScheduler';

export function useOrderNotification(
  ordenId: string,
  nombreEvento: string,
  fecha: string,
  horaInicio?: string,
) {
  const [enabled, setEnabled] = useState(() => isOrderNotifEnabled(ordenId));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ordenId) return;
    getOrderNotification(ordenId).then((remote) => {
      if (remote && !enabled) {
        enableOrderNotif(ordenId, nombreEvento, fecha, horaInicio);
        setEnabled(true);
      }
    });
  }, [ordenId]);

  const ensurePushSubscription = useCallback(async (): Promise<boolean> => {
    const state = await getSubscriptionState();
    if (state === 'granted') return true;

    if (state === 'unsupported') {
      alert('Tu navegador no soporta notificaciones.');
      return false;
    }

    if (state === 'denied') {
      alert('Las notificaciones están bloqueadas. Actívalas en los ajustes de tu navegador.');
      return false;
    }

    const result = await requestAndSubscribe();
    return result === 'granted';
  }, []);

  const toggle = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    try {
      if (enabled) {
        disableOrderNotif(ordenId);
        setEnabled(false);
        await setOrderNotification(ordenId, false);
        return;
      }

      const subscribed = await ensurePushSubscription();
      if (!subscribed) return;

      enableOrderNotif(ordenId, nombreEvento, fecha, horaInicio);
      setEnabled(true);
      await setOrderNotification(ordenId, true);
    } catch {
      setEnabled(isOrderNotifEnabled(ordenId));
    } finally {
      setLoading(false);
    }
  }, [enabled, loading, ordenId, nombreEvento, fecha, horaInicio, ensurePushSubscription]);

  return { enabled, loading, toggle };
}
