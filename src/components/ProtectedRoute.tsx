import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NoAccess from './NoAccess';
import styles from './ProtectedRoute.module.css';
import type { UserRole } from '../types';

interface Props {
  children: React.ReactNode;
  roles?: UserRole[];
}

const ProtectedRoute: React.FC<Props> = ({ children, roles }) => {
  const { user, appUser, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className={styles.splash}>
        <div className={styles.logo}>E</div>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!appUser || !appUser.activo) {
    return <NoAccess onLogout={logout} />;
  }

  if (roles && !roles.includes(appUser.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
