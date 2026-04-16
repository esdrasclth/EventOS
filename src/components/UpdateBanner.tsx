import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';
import styles from './UpdateBanner.module.css';

const UpdateBanner: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className={styles.banner}>
      <RefreshCw size={16} className={styles.icon} />
      <span className={styles.text}>Nueva versión disponible</span>
      <button
        className={styles.updateBtn}
        onClick={() => updateServiceWorker(true)}
      >
        Actualizar
      </button>
      <button
        className={styles.closeBtn}
        onClick={() => setNeedRefresh(false)}
        aria-label="Cerrar"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default UpdateBanner;
