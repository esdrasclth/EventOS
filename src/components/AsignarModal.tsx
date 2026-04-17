import React, { useEffect, useState } from 'react';
import { Users, X } from 'lucide-react';
import { listUsers } from '../services/users';
import type { AppUser } from '../types';
import styles from './AsignarModal.module.css';

interface Props {
  title?: string;
  confirmLabel?: string;
  initialAsignados?: string[];
  onCancel: () => void;
  onConfirm: (asignados: string[]) => void | Promise<void>;
}

const AsignarModal: React.FC<Props> = ({
  title = 'Asignar usuarios',
  confirmLabel = 'Confirmar',
  initialAsignados = [],
  onCancel,
  onConfirm,
}) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialAsignados));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listUsers()
      .then((all) => {
        const filtered = all
          .filter((u) => u.activo && (u.role === 'staff' || u.role === 'delivery'))
          .sort((a, b) => (a.nombre || a.email).localeCompare(b.nombre || b.email));
        setUsers(filtered);
      })
      .finally(() => setLoading(false));
  }, []);

  function toggle(uid: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }

  async function handleConfirm() {
    setSaving(true);
    try {
      await onConfirm(Array.from(selected));
    } finally {
      setSaving(false);
    }
  }

  const staffUsers = users.filter((u) => u.role === 'staff');
  const deliveryUsers = users.filter((u) => u.role === 'delivery');

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <Users size={20} className={styles.titleIcon} />
            <h2 className={styles.title}>{title}</h2>
          </div>
          <button
            className={styles.closeBtn}
            onClick={onCancel}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <p className={styles.subtitle}>
          Selecciona quiénes podrán ver y gestionar esta orden.
        </p>

        {loading ? (
          <p className={styles.empty}>Cargando usuarios...</p>
        ) : users.length === 0 ? (
          <p className={styles.empty}>No hay usuarios activos para asignar.</p>
        ) : (
          <div className={styles.list}>
            {staffUsers.length > 0 && (
              <>
                <p className={styles.sectionLabel}>Staff</p>
                {staffUsers.map((u) => (
                  <UserRow
                    key={u.uid}
                    user={u}
                    checked={selected.has(u.uid)}
                    onToggle={() => toggle(u.uid)}
                  />
                ))}
              </>
            )}
            {deliveryUsers.length > 0 && (
              <>
                <p className={styles.sectionLabel}>Delivery</p>
                {deliveryUsers.map((u) => (
                  <UserRow
                    key={u.uid}
                    user={u}
                    checked={selected.has(u.uid)}
                    onToggle={() => toggle(u.uid)}
                  />
                ))}
              </>
            )}
          </div>
        )}

        <div className={styles.actions}>
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={onCancel}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleConfirm}
            disabled={saving || loading}
          >
            {saving ? 'Guardando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

interface UserRowProps {
  user: AppUser;
  checked: boolean;
  onToggle: () => void;
}

const UserRow: React.FC<UserRowProps> = ({ user, checked, onToggle }) => (
  <label className={`${styles.userRow} ${checked ? styles.userRowChecked : ''}`}>
    <input
      type="checkbox"
      checked={checked}
      onChange={onToggle}
      className={styles.checkbox}
    />
    <div className={styles.userInfo}>
      <span className={styles.userName}>{user.nombre || user.email}</span>
      <span className={styles.userEmail}>{user.email}</span>
    </div>
  </label>
);

export default AsignarModal;
