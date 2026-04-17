import React, { useState } from 'react';
import { UserPlus, X, Eye, EyeOff } from 'lucide-react';
import { createUserWithAccount } from '../services/users';
import type { UserRole } from '../types';
import styles from './CrearUsuarioModal.module.css';

interface Props {
  onCancel: () => void;
  onCreated: () => void;
}

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: 'admin',    label: 'Admin',    description: 'Acceso total y gestión' },
  { value: 'staff',    label: 'Staff',    description: 'Operación sin crear órdenes' },
  { value: 'delivery', label: 'Delivery', description: 'Solo ve órdenes asignadas' },
];

const CrearUsuarioModal: React.FC<Props> = ({ onCancel, onCreated }) => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('delivery');
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = nombre.trim();
    const em = email.trim().toLowerCase();
    if (!n || !em || !password) return;
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await createUserWithAccount(em, password, {
        nombre: n,
        role,
        activo: true,
      });
      onCreated();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      if (code === 'auth/email-already-in-use') {
        setError('Ese correo ya está registrado.');
      } else if (code === 'auth/invalid-email') {
        setError('Correo inválido.');
      } else if (code === 'auth/weak-password') {
        setError('La contraseña es muy débil.');
      } else {
        console.error('[crear-usuario] error:', err);
        setError('No se pudo crear el usuario. Intenta de nuevo.');
      }
      setSaving(false);
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <UserPlus size={20} className={styles.titleIcon} />
            <h2 className={styles.title}>Crear usuario</h2>
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
          Se creará una cuenta de acceso con el correo y contraseña indicados.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.scrollArea}>
          <label className={styles.field}>
            <span className={styles.label}>Nombre</span>
            <input
              className={styles.input}
              placeholder="Nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={60}
              autoFocus
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Correo</span>
            <input
              className={styles.input}
              type="email"
              placeholder="usuario@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Contraseña</span>
            <div className={styles.passWrap}>
              <input
                className={styles.input}
                type={showPass ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPass((p) => !p)}
                tabIndex={-1}
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>

          <div className={styles.field}>
            <span className={styles.label}>Rol</span>
            <div className={styles.roleGrid}>
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.roleCard} ${role === opt.value ? styles.roleCardActive : ''}`}
                  onClick={() => setRole(opt.value)}
                >
                  <span className={styles.roleLabel}>{opt.label}</span>
                  <span className={styles.roleDesc}>{opt.description}</span>
                </button>
              ))}
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={onCancel}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={saving || !nombre.trim() || !email.trim() || !password}
            >
              {saving ? 'Creando...' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CrearUsuarioModal;
