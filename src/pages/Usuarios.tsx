import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, UserPlus, CheckCircle2, XCircle, Shield, UserCog, Truck } from 'lucide-react';
import { listUsers, updateUserRole, setUserActive } from '../services/users';
import { useAuth } from '../contexts/AuthContext';
import type { AppUser, UserRole } from '../types';
import CrearUsuarioModal from '../components/CrearUsuarioModal';
import styles from './Usuarios.module.css';

const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Admin',
  staff: 'Staff',
  delivery: 'Delivery',
};

const ROLE_ICON: Record<UserRole, React.ReactNode> = {
  admin: <Shield size={14} />,
  staff: <UserCog size={14} />,
  delivery: <Truck size={14} />,
};

const Usuarios: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCrear, setShowCrear] = useState(false);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (e) {
      console.error('[usuarios] listUsers error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? users.filter((u) =>
          (u.nombre || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q),
        )
      : users;
    const roleOrder: Record<UserRole, number> = { admin: 0, staff: 1, delivery: 2 };
    return [...base].sort((a, b) => {
      const ra = roleOrder[a.role] ?? 99;
      const rb = roleOrder[b.role] ?? 99;
      if (ra !== rb) return ra - rb;
      return (a.nombre || a.email).localeCompare(b.nombre || b.email);
    });
  }, [users, search]);

  async function handleRoleChange(uid: string, role: UserRole) {
    setBusyUid(uid);
    try {
      await updateUserRole(uid, role);
      setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role } : u)));
    } catch (e) {
      console.error('[usuarios] updateUserRole error:', e);
      alert('No se pudo actualizar el rol.');
    } finally {
      setBusyUid(null);
    }
  }

  async function handleToggleActive(u: AppUser) {
    setBusyUid(u.uid);
    try {
      await setUserActive(u.uid, !u.activo);
      setUsers((prev) =>
        prev.map((x) => (x.uid === u.uid ? { ...x, activo: !u.activo } : x)),
      );
    } catch (e) {
      console.error('[usuarios] setUserActive error:', e);
      alert('No se pudo cambiar el estado.');
    } finally {
      setBusyUid(null);
    }
  }

  function initialsFrom(u: AppUser): string {
    const base = (u.nombre || u.email || '?').trim();
    const parts = base.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() => navigate(-1)}
          aria-label="Volver"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.title}>Usuarios</h1>
        <button
          className={styles.addBtn}
          onClick={() => setShowCrear(true)}
          aria-label="Crear usuario"
        >
          <UserPlus size={20} />
        </button>
      </header>

      <div className={styles.searchWrap}>
        <Search size={16} className={styles.searchIcon} />
        <input
          className={styles.search}
          placeholder="Buscar por nombre o correo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className={styles.skeletonList}>
          {[0, 1, 2].map((i) => (
            <div key={i} className={`skeleton ${styles.skeletonRow}`} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <UserPlus size={40} color="var(--color-border)" />
          <p>{search ? 'Sin resultados' : 'No hay usuarios'}</p>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map((u) => {
            const isSelf = currentUser?.uid === u.uid;
            const busy = busyUid === u.uid;
            return (
              <div
                key={u.uid}
                className={`${styles.userCard} ${!u.activo ? styles.userCardInactive : ''}`}
              >
                <div className={styles.userTop}>
                  <div className={styles.avatar}>{initialsFrom(u)}</div>
                  <div className={styles.userMain}>
                    <div className={styles.nameRow}>
                      <span className={styles.userName}>
                        {u.nombre || '(Sin nombre)'}
                      </span>
                      <span className={`${styles.roleBadge} ${styles['role_' + u.role]}`}>
                        {ROLE_ICON[u.role]}
                        {ROLE_LABEL[u.role]}
                      </span>
                    </div>
                    <span className={styles.userEmail}>{u.email}</span>
                    {!u.activo && (
                      <span className={styles.inactiveLabel}>Inactivo</span>
                    )}
                  </div>
                </div>

                <div className={styles.userControls}>
                  <label className={styles.ctrlGroup}>
                    <span className={styles.ctrlLabel}>Rol</span>
                    <select
                      className={styles.select}
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                      disabled={busy || isSelf}
                      title={isSelf ? 'No puedes cambiar tu propio rol' : undefined}
                    >
                      <option value="admin">Admin</option>
                      <option value="staff">Staff</option>
                      <option value="delivery">Delivery</option>
                    </select>
                  </label>

                  <button
                    className={`${styles.toggleBtn} ${u.activo ? styles.toggleBtnOn : styles.toggleBtnOff}`}
                    onClick={() => handleToggleActive(u)}
                    disabled={busy || isSelf}
                    title={isSelf ? 'No puedes desactivarte a ti mismo' : undefined}
                  >
                    {u.activo ? (
                      <>
                        <CheckCircle2 size={15} />
                        Activo
                      </>
                    ) : (
                      <>
                        <XCircle size={15} />
                        Inactivo
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.bottomPad} />

      {showCrear && (
        <CrearUsuarioModal
          onCancel={() => setShowCrear(false)}
          onCreated={() => {
            setShowCrear(false);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
};

export default Usuarios;
