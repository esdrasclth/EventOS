import React, { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';
import styles from './UpdateBanner.module.css';

const UpdateBanner: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      // Check for updates every 60 minutes while the app is open
      setInterval(() => registration.update(), 60 * 60 * 1000);
    },
  });

  const [updating, setUpdating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!updating) return;

    // Fill progress bar over ~6 seconds, slows down near the end
    const intervals = [
      { target: 30, delay: 400 },
      { target: 55, delay: 800 },
      { target: 75, delay: 1200 },
      { target: 88, delay: 1600 },
      { target: 95, delay: 2000 },
    ];

    const timers = intervals.map(({ target, delay }) =>
      setTimeout(() => setProgress(target), delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [updating]);

  if (!needRefresh) return null;

  const handleUpdate = () => {
    setUpdating(true);
    setProgress(10);
    updateServiceWorker(true);
  };

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <div className={styles.row}>
          <RefreshCw
            size={16}
            className={`${styles.icon} ${updating ? styles.spinning : ''}`}
          />
          <span className={styles.text}>
            {updating ? 'Actualizando...' : 'Nueva versión disponible'}
          </span>
          {!updating && (
            <>
              <button className={styles.updateBtn} onClick={handleUpdate}>
                Actualizar
              </button>
              <button
                className={styles.closeBtn}
                onClick={() => setNeedRefresh(false)}
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>

        {updating && (
          <div className={styles.progressTrack}>
            <div
              className={styles.progressBar}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateBanner;
