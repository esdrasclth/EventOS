import React from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import styles from './NotificationButton.module.css';

const NotificationButton: React.FC = () => {
  const { state, subscribe } = usePushNotifications();

  if (state === 'unsupported' || state === 'loading') return null;

  if (state === 'granted') {
    return (
      <div className={styles.active}>
        <BellRing size={15} />
        <span>Recordatorios activados</span>
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <div className={styles.denied}>
        <BellOff size={15} />
        <span>Notificaciones bloqueadas en ajustes del dispositivo</span>
      </div>
    );
  }

  return (
    <button className={styles.btn} onClick={subscribe}>
      <Bell size={16} />
      Activar recordatorios del evento
    </button>
  );
};

export default NotificationButton;
