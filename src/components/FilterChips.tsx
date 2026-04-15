import React, { useRef } from 'react';
import styles from './FilterChips.module.css';

export interface FilterChip {
  id: string;
  label: string;
}

interface Props {
  chips: FilterChip[];
  activeId: string;
  onChange: (id: string) => void;
}

const FilterChips: React.FC<Props> = ({ chips, activeId, onChange }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className={styles.wrapper} ref={scrollRef}>
      <div className={styles.track}>
        {chips.map((chip) => (
          <button
            key={chip.id}
            className={`${styles.chip} ${chip.id === activeId ? styles.active : ''}`}
            onClick={() => onChange(chip.id)}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterChips;
