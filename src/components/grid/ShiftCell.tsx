import React from 'react';
import type { Cell, Employee, Issue } from '../../types.ts';

interface ShiftCellProps {
  employee: Employee;
  day: number;
  value: Cell;
  isPk: boolean;
  isLeave: boolean;
  isAbsent: boolean;
  isManual: boolean;
  issues: Issue[];
  readOnly: boolean;
  onClick: () => void;
}

export const ShiftCell: React.FC<ShiftCellProps> = ({
  employee,
  day,
  value,
  isPk,
  isLeave,
  isAbsent,
  isManual,
  issues,
  readOnly,
  onClick,
}) => {
  // Find issues directly attached to this employee & day
  const cellIssues = issues.filter(
    (i) => (i.empId === employee.id && (i.day === day || i.day === undefined)) ||
           (i.rule === 'PK_CHAIN' && i.empId === employee.id && i.day === day),
  );

  const hasError = cellIssues.some((i) => i.severity === 'error' && !i.exception);
  const hasException = cellIssues.some((i) => i.severity === 'error' && !!i.exception);
  const hasWarning = cellIssues.some((i) => i.severity === 'warning');

  let chipClass = 'shift-chip';
  let label = '—';

  if (isAbsent) {
    chipClass += ' shift-absent';
    label = 'Absen';
  } else if (isLeave) {
    chipClass += ' shift-leave';
    label = 'Cuti';
  } else if (value === 'I') {
    chipClass += ' shift-I';
    label = 'I';
  } else if (value === 'II') {
    chipClass += ' shift-II';
    label = 'II';
  } else if (value === 'OFF') {
    chipClass += ' shift-OFF';
    label = 'Libur';
  } else {
    chipClass += ' shift-empty';
  }

  const borderStyle = hasError
    ? '2px solid var(--danger)'
    : hasException
    ? '2px dashed var(--warning)'
    : hasWarning
    ? '1px solid var(--warning)'
    : undefined;

  return (
    <div
      className={chipClass}
      onClick={readOnly ? undefined : onClick}
      style={{
        border: borderStyle,
        cursor: readOnly ? 'default' : 'pointer',
      }}
      title={
        isAbsent
          ? `${employee.name} tidak hadir`
          : isLeave
          ? `${employee.name} cuti`
          : `${employee.name}: ${label}${isPk ? ' (PK penutup toko)' : ''}`
      }
    >
      {/* Markers */}
      {isManual && !isLeave && !isAbsent && <span className="chip-manual-dot" title="Diubah manual" />}
      {hasError && <span className="chip-error-icon" title="Melanggar aturan">✕</span>}

      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <span>{label}</span>
        {isPk && value === 'II' && (
          <span className="chip-pk" title="PK penutup toko (Shift II)">★</span>
        )}
      </div>
    </div>
  );
};
