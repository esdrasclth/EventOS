import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import type { Orden } from '../types';
import OrdenCard from './OrdenCard';
import styles from './OrdenesCalendario.module.css';

interface Props {
  ordenes: Orden[];
}

const ESTADO_COLOR: Record<string, string> = {
  pendiente:  '#F59E0B',
  confirmado: '#3B82F6',
  entregado:  '#14B8A6',
  retirado:   '#22C55E',
  cancelado:  '#EF4444',
};

const WEEKDAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function buildMonthCells(year: number, month: number): Date[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Date[] = [];
  const prevDays = new Date(year, month, 0).getDate();
  for (let i = firstWeekday - 1; i >= 0; i--) {
    cells.push(new Date(year, month - 1, prevDays - i));
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d));
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1];
    cells.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1));
  }
  return cells;
}

const OrdenesCalendario: React.FC<Props> = ({ ordenes }) => {
  const today = useMemo(() => new Date(), []);
  const todayISO = useMemo(() => toISODate(today), [today]);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<string | null>(todayISO);

  const ordenesPorDia = useMemo(() => {
    const map = new Map<string, Orden[]>();
    for (const o of ordenes) {
      if (!o.fecha) continue;
      const arr = map.get(o.fecha) ?? [];
      arr.push(o);
      map.set(o.fecha, arr);
    }
    return map;
  }, [ordenes]);

  // Per-day indicators (dots for single-day, bar segments for multi-day).
  // Bars are placed first so they form a continuous strip at the top of the cell.
  type Indicator =
    | { kind: 'dot'; color: string; ordenId: string }
    | { kind: 'bar'; role: 'start' | 'middle' | 'end'; color: string; ordenId: string };

  const indicadoresPorDia = useMemo(() => {
    const map = new Map<string, Indicator[]>();
    const push = (iso: string, ind: Indicator) => {
      const arr = map.get(iso) ?? [];
      arr.push(ind);
      map.set(iso, arr);
    };
    for (const o of ordenes) {
      if (!o.fecha) continue;
      const color = ESTADO_COLOR[o.estado] ?? ESTADO_COLOR.pendiente;
      const end = o.fechaFin && o.fechaFin > o.fecha ? o.fechaFin : o.fecha;
      if (end === o.fecha) {
        push(o.fecha, { kind: 'dot', color, ordenId: o.id });
        continue;
      }
      const [sy, sm, sd] = o.fecha.split('-').map(Number);
      const [ey, em, ed] = end.split('-').map(Number);
      const cur = new Date(sy, sm - 1, sd);
      const last = new Date(ey, em - 1, ed);
      while (cur <= last) {
        const iso = toISODate(cur);
        const role: 'start' | 'middle' | 'end' =
          iso === o.fecha ? 'start' : iso === end ? 'end' : 'middle';
        push(iso, { kind: 'bar', role, color, ordenId: o.id });
        cur.setDate(cur.getDate() + 1);
      }
    }
    // Sort: bars first, dots after — keeps the multi-day strip at the top.
    for (const arr of map.values()) {
      arr.sort((a, b) => (a.kind === 'bar' ? 0 : 1) - (b.kind === 'bar' ? 0 : 1));
    }
    return map;
  }, [ordenes]);

  const cells = useMemo(
    () => buildMonthCells(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  function goPrev() {
    const m = viewMonth - 1;
    if (m < 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(m);
    }
    setSelected(null);
  }

  function goNext() {
    const m = viewMonth + 1;
    if (m > 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(m);
    }
    setSelected(null);
  }

  function goToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelected(todayISO);
  }

  const selectedOrdenes = useMemo(() => {
    if (!selected) return [];
    const arr = ordenesPorDia.get(selected) ?? [];
    return [...arr].sort((a, b) => {
      const ah = a.horaInicio ?? '00:00';
      const bh = b.horaInicio ?? '00:00';
      return ah.localeCompare(bh);
    });
  }, [selected, ordenesPorDia]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.calendar}>
        <header className={styles.calHeader}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={goPrev}
            aria-label="Mes anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            className={styles.monthLabel}
            onClick={goToday}
            title="Ir a hoy"
          >
            {MONTHS[viewMonth]} {viewYear}
          </button>
          <button
            type="button"
            className={styles.navBtn}
            onClick={goNext}
            aria-label="Mes siguiente"
          >
            <ChevronRight size={20} />
          </button>
        </header>

        <div className={styles.weekdays}>
          {WEEKDAYS.map((w, i) => (
            <div key={i} className={styles.weekday}>{w}</div>
          ))}
        </div>

        <div className={styles.grid}>
          {cells.map((date) => {
            const iso = toISODate(date);
            const inMonth = date.getMonth() === viewMonth;
            const isToday = iso === todayISO;
            const isSelected = iso === selected;
            const indicators = indicadoresPorDia.get(iso) ?? [];
            const visible = indicators.slice(0, 3);
            const extra = indicators.length - visible.length;

            return (
              <button
                key={iso}
                type="button"
                className={`${styles.cell} ${!inMonth ? styles.cellOut : ''} ${isToday ? styles.cellToday : ''} ${isSelected ? styles.cellSelected : ''}`}
                onClick={() => setSelected(iso)}
              >
                <span className={styles.cellNumber}>{date.getDate()}</span>
                {visible.length > 0 && (
                  <span className={styles.indicators}>
                    {visible.map((ind, i) => {
                      if (ind.kind === 'dot') {
                        return (
                          <span key={i} className={styles.indicatorRow}>
                            <span className={styles.dot} style={{ background: ind.color }} />
                          </span>
                        );
                      }
                      const barClass =
                        ind.role === 'start' ? styles.barStart
                        : ind.role === 'end' ? styles.barEnd
                        : styles.barMid;
                      return (
                        <span
                          key={i}
                          className={`${styles.bar} ${barClass}`}
                          style={{ background: ind.color }}
                        />
                      );
                    })}
                    {extra > 0 && <span className={styles.extra}>+{extra}</span>}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.dayPanel}>
        {selected ? (
          <>
            <h3 className={styles.dayTitle}>
              {(() => {
                const [y, m, d] = selected.split('-').map(Number);
                const dt = new Date(y, m - 1, d);
                const weekday = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][dt.getDay()];
                return `${weekday} ${d} de ${MONTHS[m - 1]}`;
              })()}
            </h3>
            {selectedOrdenes.length === 0 ? (
              <div className={styles.emptyDay}>
                <CalendarIcon size={36} color="var(--color-border)" />
                <p>Sin órdenes este día</p>
              </div>
            ) : (
              <div className={styles.dayList}>
                {selectedOrdenes.map((o, i) => (
                  <OrdenCard key={o.id} orden={o} animationDelay={i * 40} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className={styles.hint}>
            <CalendarIcon size={36} color="var(--color-border)" />
            <p>Toca un día para ver las órdenes</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdenesCalendario;
