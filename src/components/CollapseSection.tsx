import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './CollapseSection.module.css';

interface Props {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const CollapseSection: React.FC<Props> = ({
  title,
  icon,
  defaultOpen = false,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<string | number>(defaultOpen ? 'auto' : 0);

  useEffect(() => {
    if (!contentRef.current) return;
    if (open) {
      const h = contentRef.current.scrollHeight;
      setHeight(h);
      const timer = setTimeout(() => setHeight('auto'), 300);
      return () => clearTimeout(timer);
    } else {
      setHeight(contentRef.current.scrollHeight);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setHeight(0));
      });
    }
  }, [open]);

  return (
    <div className={styles.section}>
      <button
        className={styles.header}
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
      >
        <div className={styles.headerLeft}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <span className={styles.title}>{title}</span>
        </div>
        <ChevronDown
          size={18}
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
        />
      </button>
      <div
        ref={contentRef}
        className={styles.content}
        style={{ height, overflow: height === 'auto' ? 'visible' : 'hidden' }}
      >
        <div className={styles.inner}>{children}</div>
      </div>
    </div>
  );
};

export default CollapseSection;
