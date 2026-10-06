import React, { useState } from 'react';
import type { Cell, Employee, Issue, Week, WorkingCopy } from '../../types.ts';
import { DAYS, DAYS_SHORT } from '../../data/seed.ts';
import { ShiftCell } from './ShiftCell.tsx';
import { CellPopover } from './CellPopover.tsx';
import { requiredOff, shiftMembers, isLeave, isAbsent, cellKey } from '../../engine/core.ts';

interface RosterGridProps {
  week: Week;
  copy: WorkingCopy;
  employees: Employee[];
  issues: Issue[];
  readOnly: boolean;
  onUpdateCell: (empId: string, day: number, value: Cell) => void;
  onSetPk: (day: number, empId: string | null) => void;
  onMarkAbsentEmployee: (empId: string, day: number) => void;
  onOpenExceptionModal: (issue: Issue) => void;
  onSetCellDuty?: (empId: string, day: number, duty: 'Kasir' | 'Pramuniaga') => void;
  onSwapShift?: (emp1Id: string, emp2Id: string, day: number) => void;
}

export const RosterGrid: React.FC<RosterGridProps> = ({
  week,
  copy,
  employees,
  issues,
  readOnly,
  onUpdateCell,
  onSetPk,
  onMarkAbsentEmployee,
  onOpenExceptionModal,
  onSetCellDuty,
  onSwapShift,
}) => {
  const [selectedCell, setSelectedCell] = useState<{ empId: string; day: number } | null>(null);

  const roster = copy.roster;
  const selectedEmployee = selectedCell ? employees.find((e) => e.id === selectedCell.empId) : null;

  return (
    <div style={{ overflowX: 'auto', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
      <table className="roster-table">
        <thead>
          <tr>
            <th style={{ width: '220px' }}>Karyawan</th>
            {DAYS_SHORT.map((day, idx) => (
              <th key={day} style={{ minWidth: '70px' }}>
                <div>{day}</div>
                <div style={{ fontSize: '10px', fontWeight: 400, color: 'var(--text-dim)' }}>
                  Hari ke-{idx + 1}
                </div>
              </th>
            ))}
            <th style={{ minWidth: '80px' }}>Libur</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => {
            const cells = roster.cells[emp.id] ?? [];
            const offCount = cells.filter((c) => c === 'OFF').length;
            const reqOff = requiredOff(emp);
            const offMatch = offCount === reqOff;

            return (
              <tr key={emp.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{emp.name}</div>
                    <span className="badge badge-gender">{emp.gender}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.position}</span>
                  </div>
                </td>
                {DAYS.map((_, dayIdx) => {
                  const val = cells[dayIdx];
                  const hasLeave = isLeave(week.input, emp.id, dayIdx);
                  const hasAbsent = isAbsent(copy, emp.id, dayIdx);
                  const isPk = roster.pk[dayIdx] === emp.id;
                  const isManual = !!copy.manual[cellKey(emp.id, dayIdx)];

                  return (
                    <td key={dayIdx}>
                      <ShiftCell
                        employee={emp}
                        day={dayIdx}
                        value={val}
                        isPk={isPk}
                        isLeave={hasLeave}
                        isAbsent={hasAbsent}
                        isManual={isManual}
                        issues={issues}
                        readOnly={readOnly}
                        onClick={() => setSelectedCell({ empId: emp.id, day: dayIdx })}
                      />
                    </td>
                  );
                })}
                <td>
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: '12px',
                      color: offMatch ? 'var(--success)' : 'var(--danger)',
                    }}
                  >
                    {offCount}/{reqOff} {offMatch ? '✓' : '✕'}
                  </span>
                </td>
              </tr>
            );
          })}

          {/* Coverage Summary Rows */}
          <tr style={{ background: 'var(--bg-subtle)', fontWeight: 600 }}>
            <td>
              <span style={{ color: 'var(--shift-1-text)' }}>Shift I (Cakupan)</span>
            </td>
            {DAYS.map((_, dayIdx) => {
              const count = shiftMembers(roster, dayIdx, 'I').length;
              const req = week.input.req.I[dayIdx];
              const ok = count >= req;
              return (
                <td key={dayIdx}>
                  <span style={{ fontSize: '12px', color: ok ? 'var(--text-main)' : 'var(--danger)' }}>
                    {count}/{req} {!ok && '⚠'}
                  </span>
                </td>
              );
            })}
            <td>-</td>
          </tr>

          <tr style={{ background: 'var(--bg-subtle)', fontWeight: 600 }}>
            <td>
              <span style={{ color: 'var(--shift-2-text)' }}>Shift II (Cakupan)</span>
            </td>
            {DAYS.map((_, dayIdx) => {
              const count = shiftMembers(roster, dayIdx, 'II').length;
              const req = week.input.req.II[dayIdx];
              const ok = count >= req;
              return (
                <td key={dayIdx}>
                  <span style={{ fontSize: '12px', color: ok ? 'var(--text-main)' : 'var(--danger)' }}>
                    {count}/{req} {!ok && '⚠'}
                  </span>
                </td>
              );
            })}
            <td>-</td>
          </tr>

          <tr style={{ background: 'var(--bg-subtle)', fontSize: '11px', color: 'var(--text-muted)' }}>
            <td>Min. 1 Laki-laki per shift</td>
            {DAYS.map((_, dayIdx) => {
              const s1 = shiftMembers(roster, dayIdx, 'I').some((id) => employees.find((e) => e.id === id)?.gender === 'L');
              const s2 = shiftMembers(roster, dayIdx, 'II').some((id) => employees.find((e) => e.id === id)?.gender === 'L');
              const allMaleOk = s1 && s2;
              return (
                <td key={dayIdx}>
                  <span style={{ color: allMaleOk ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                    {allMaleOk ? '✓' : '✕'}
                  </span>
                </td>
              );
            })}
            <td>-</td>
          </tr>
        </tbody>
      </table>

      {/* Popover */}
      {selectedCell && selectedEmployee && (
        <CellPopover
          employee={selectedEmployee}
          day={selectedCell.day}
          currentValue={roster.cells[selectedCell.empId]?.[selectedCell.day]}
          currentDuty={copy.duties?.[`${selectedCell.empId}|${selectedCell.day}`]}
          isPk={roster.pk[selectedCell.day] === selectedCell.empId}
          isLeave={isLeave(week.input, selectedCell.empId, selectedCell.day)}
          isAbsent={isAbsent(copy, selectedCell.empId, selectedCell.day)}
          issues={issues}
          allEmployees={employees}
          rosterCells={roster.cells}
          onSelectValue={(val) => onUpdateCell(selectedCell.empId, selectedCell.day, val)}
          onSetDuty={(duty) => onSetCellDuty?.(selectedCell.empId, selectedCell.day, duty)}
          onTogglePk={() => {
            const currentPk = roster.pk[selectedCell.day];
            onSetPk(selectedCell.day, currentPk === selectedCell.empId ? null : selectedCell.empId);
          }}
          onMarkAbsent={() => onMarkAbsentEmployee(selectedCell.empId, selectedCell.day)}
          onOpenException={(issue) => onOpenExceptionModal(issue)}
          onSwapWith={(otherId) => onSwapShift?.(selectedCell.empId, otherId, selectedCell.day)}
          onClose={() => setSelectedCell(null)}
        />
      )}
    </div>
  );
};
