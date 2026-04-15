import React, { useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { UserCircle } from 'lucide-react';
import { auth } from '../services/firebase';
import styles from './NombreModal.module.css';

interface Props {
  onDone: (nombre: string) => void;
}

const NombreModal: React.FC<Props> = ({ onDone }) => {
  const [nombre, setNombre] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = nombre.trim();
    if (!trimmed) return;
    setSaving(true);
    setError('');
    try {
      await updateProfile(auth.currentUser!, { displayName: trimmed });
      onDone(trimmed);
    } catch {
      setError('No se pudo guardar el nombre. Intenta de nuevo.');
      setSaving(false);
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.iconWrapper}>
          <UserCircle size={36} color="var(--color-primary)" />
        </div>
        <h2 className={styles.title}>¿Cómo te llamamos?</h2>
        <p className={styles.subtitle}>
          Ingresa tu nombre para personalizar la app. Solo se hace una vez.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            className={styles.input}
            placeholder="Tu nombre completo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoFocus
            maxLength={60}
          />
          {error && <p className={styles.error}>{error}</p>}
          <button
            type="submit"
            className={styles.btn}
            disabled={saving || !nombre.trim()}
          >
            {saving ? 'Guardando...' : 'Continuar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NombreModal;
