import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Eye, EyeOff, Send, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import styles from './Login.module.css';

type Mode = 'login' | 'reset';

const Login: React.FC = () => {
  const { user, login, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  if (user) return <Navigate to="/" replace />;

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
    setInfo('');
    setPassword('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    setInfo('');

    if (mode === 'reset') {
      setLoading(true);
      try {
        await resetPassword(email.trim());
        setInfo('Te enviamos un correo con el enlace para restablecer tu contraseña. Revisa tu bandeja (y spam).');
      } catch (err: unknown) {
        const code = (err as { code?: string }).code ?? '';
        if (code === 'auth/invalid-email') {
          setError('El correo no es válido.');
        } else if (code === 'auth/too-many-requests') {
          setError('Demasiados intentos. Intenta más tarde.');
        } else {
          setError('No se pudo enviar el correo. Verifica tu conexión.');
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Correo o contraseña incorrectos.');
      } else if (code === 'auth/too-many-requests') {
        setError('Demasiados intentos fallidos. Intenta más tarde.');
      } else {
        setError('Error al iniciar sesión. Verifica tu conexión.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroLogo}>
          <img src="/logo.png" alt="Pancho's Rentals" />
        </div>
        <h1 className={styles.heroTitle}>Pancho's Rentals</h1>
        <p className={styles.heroSubtitle}>Gestión de eventos</p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          {mode === 'login' ? 'Iniciar sesión' : 'Recuperar contraseña'}
        </h2>
        <p className={styles.cardSubtitle}>
          {mode === 'login'
            ? 'Accede con tu cuenta de empresa'
            : 'Te enviaremos un enlace para restablecerla'}
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Correo electrónico</label>
            <div className={styles.inputWrapper}>
              <Mail size={17} className={styles.inputIcon} />
              <input
                className={styles.input}
                type="email"
                placeholder="usuario@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {mode === 'login' && (
            <div className={styles.field}>
              <label className={styles.label}>Contraseña</label>
              <div className={styles.inputWrapper}>
                <Lock size={17} className={styles.inputIcon} />
                <input
                  className={styles.input}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPass((p) => !p)}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className={styles.errorBox}>
              {error}
            </div>
          )}

          {info && (
            <div className={styles.infoBox}>
              {info}
            </div>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.btnSpinner} />
            ) : mode === 'login' ? (
              <LogIn size={18} />
            ) : (
              <Send size={18} />
            )}
            {loading
              ? mode === 'login' ? 'Ingresando...' : 'Enviando...'
              : mode === 'login' ? 'Ingresar' : 'Enviar correo'}
          </button>
        </form>

        {mode === 'login' ? (
          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => switchMode('reset')}
          >
            ¿Olvidaste tu contraseña?
          </button>
        ) : (
          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => switchMode('login')}
          >
            <ArrowLeft size={14} /> Volver a iniciar sesión
          </button>
        )}

        <p className={styles.hint}>
          Las cuentas son creadas por el administrador.
        </p>
      </div>
    </div>
  );
};

export default Login;
