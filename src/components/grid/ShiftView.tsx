import React from 'react';
import type { Employee, ShiftCode, Week, WorkingCopy } from '../../types.ts';
import { DAYS, DAYS_SHORT } from '../../data/seed.ts';
import { shiftMembers } from '../../engine/core.ts';

interface ShiftViewProps {
  week: Week;
  copy: WorkingCopy;
  employees: Employee[];
  readOnly: boolean;
  onFindReplacement: (day: number, shift: ShiftCode) => void;
}

export const ShiftView: React.FC<ShiftViewProps> = ({
  week,
  copy,
  employees,
  readOnly,
  onFindReplacement,
}) => {
  const roster = copy.roster;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px' }}>
      {DAYS.map((dayName, dayIdx) => {
        const s1Members = shiftMembers(roster, dayIdx, 'I');
        const s2Members = shiftMembers(roster, dayIdx, 'II');
        const req1 = week.input.req.I[dayIdx];
        const req2 = week.input.req.II[dayIdx];
        const pkId = roster.pk[dayIdx];

        const s1Shortage = Math.max(0, req1 - s1Members.length);
        const s2Shortage = Math.max(0, req2 - s2Members.length);

        return (
          <div
            key={dayIdx}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <div style={{ fontWeight: 700, fontSize: '13px' }}>{DAYS_SHORT[dayIdx]}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{dayName}</div>
            </div>

            {/* Shift I */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--shift-1-text)' }}>
                  Shift I
                </span>
                <span style={{ fontSize: '11px', color: s1Members.length >= req1 ? 'var(--text-muted)' : 'var(--danger)', fontWeight: 600 }}>
                  {s1Members.length}/{req1}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {s1Members.map((id) => {
                  const emp = employees.find((e) => e.id === id);
                  if (!emp) return null;
                  return (
                    <div
                      key={id}
                      style={{
                        padding: '6px 8px',
                        background: 'var(--shift-1-bg)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--shift-1-text)' }}>{emp.name.split(' ')[0]}</span>
                      <span style={{ fontSize: '10px', color: 'var(--shift-1-text)', opacity: 0.8 }}>{emp.position}</span>
                    </div>
                  );
                })}

                {Array.from({ length: s1Shortage }).map((_, i) => (
                  <div
                    key={`short1-${i}`}
                    style={{
                      padding: '8px',
                      background: 'var(--danger-bg)',
                      border: '1px dashed var(--danger-border)',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: 600, marginBottom: '4px' }}>
                      — Belum Terisi
                    </div>
                    {!readOnly && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '10px', padding: '2px 6px' }}
                        onClick={() => onFindReplacement(dayIdx, 'I')}
                      >
                        ✦ Cari Pengganti
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Shift II */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--shift-2-text)' }}>
                  Shift II
                </span>
                <span style={{ fontSize: '11px', color: s2Members.length >= req2 ? 'var(--text-muted)' : 'var(--danger)', fontWeight: 600 }}>
                  {s2Members.length}/{req2}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {s2Members.map((id) => {
                  const emp = employees.find((e) => e.id === id);
                  if (!emp) return null;
                  const isPk = pkId === id;
                  return (
                    <div
                      key={id}
                      style={{
                        padding: '6px 8px',
                        background: 'var(--shift-2-bg)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--shift-2-text)' }}>{emp.name.split(' ')[0]}</span>
                        {isPk && <span className="chip-pk" title="PK penutup toko">★</span>}
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--shift-2-text)', opacity: 0.8 }}>{emp.position}</span>
                    </div>
                  );
                })}

                {Array.from({ length: s2Shortage }).map((_, i) => (
                  <div
                    key={`short2-${i}`}
                    style={{
                      padding: '8px',
                      background: 'var(--danger-bg)',
                      border: '1px dashed var(--danger-border)',
                      borderRadius: 'var(--radius-sm)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: 600, marginBottom: '4px' }}>
                      — Belum Terisi
                    </div>
                    {!readOnly && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '10px', padding: '2px 6px' }}
                        onClick={() => onFindReplacement(dayIdx, 'II')}
                      >
                        ✦ Cari Pengganti
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
