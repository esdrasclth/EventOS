import React from 'react';
import { ShieldAlert } from 'lucide-react';
import styles from './NoAccess.module.css';

interface Props {
  onLogout: () => void | Promise<void>;
}

const NoAccess: React.FC<Props> = ({ onLogout }) => (
  <div className={styles.wrapper}>
    <ShieldAlert size={56} className={styles.icon} />
    <h2 className={styles.title}>Sin acceso</h2>
    <p className={styles.text}>
      Tu cuenta aún no tiene un rol asignado o está inactiva. Contacta al administrador.
    </p>
    <button className={styles.btn} onClick={() => onLogout()}>
      Cerrar sesión
    </button>
  </div>
);

export default NoAccess;
