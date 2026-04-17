import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ClipboardList, PlusCircle, Users, Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';
import styles from './BottomNav.module.css';

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  isAction?: boolean;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { path: '/',          icon: <Home size={22} />,         label: 'Inicio',    roles: ['admin', 'staff', 'delivery'] },
  { path: '/ordenes',   icon: <ClipboardList size={22} />,label: 'Órdenes',   roles: ['admin', 'staff', 'delivery'] },
  { path: '/nueva',     icon: <PlusCircle size={26} />,   label: 'Nueva',     roles: ['admin'], isAction: true },
  { path: '/clientes',  icon: <Users size={22} />,        label: 'Clientes',  roles: ['admin', 'staff'] },
  { path: '/actividad', icon: <Activity size={22} />,     label: 'Actividad', roles: ['admin', 'staff'] },
];

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();

  const items = NAV_ITEMS.filter((item) => role && item.roles.includes(role));

  return (
    <nav className={styles.nav}>
      {items.map((item) => {
        const isActive =
          item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);

        return (
          <button
            key={item.path}
            className={`${styles.navItem} ${isActive ? styles.active : ''} ${item.isAction ? styles.actionItem : ''}`}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
          >
            <span className={`${styles.icon} ${item.isAction ? styles.actionIcon : ''}`}>
              {item.icon}
            </span>
            {!item.isAction && (
              <span className={styles.label}>{item.label}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
