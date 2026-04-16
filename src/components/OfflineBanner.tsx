import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import styles from './OfflineBanner.module.css';

const OfflineBanner: React.FC = () => {
  const { isOnline } = useNetworkStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [prevOnline, setPrevOnline] = useState(isOnline);

  useEffect(() => {
    // If we just came back online (was offline before), show "Conectado" briefly
    if (isOnline && !prevOnline) {
      setShowReconnected(true);
      const t = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(t);
    }
    setPrevOnline(isOnline);
  }, [isOnline]);

  if (isOnline && !showReconnected) return null;

  return (
    <div className={`${styles.banner} ${isOnline ? styles.online : styles.offline}`}>
      {isOnline ? (
        <>
          <Wifi size={15} />
          <span>Conexión restaurada · Los cambios se han sincronizado</span>
        </>
      ) : (
        <>
          <WifiOff size={15} />
          <span>Sin conexión · Los cambios se guardarán al reconectarte</span>
        </>
      )}
    </div>
  );
};

export default OfflineBanner;
