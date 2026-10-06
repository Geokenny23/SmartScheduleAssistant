import React from 'react';
import type { Cell, Employee, Issue } from '../../types.ts';
import { DAYS } from '../../data/seed.ts';
import { canWorkShift } from '../../engine/core.ts';

interface CellPopoverProps {
  employee: Employee;
  day: number;
  currentValue: Cell;
  currentDuty?: 'Kasir' | 'Pramuniaga';
  isPk: boolean;
  isLeave: boolean;
  isAbsent: boolean;
  issues: Issue[];
  allEmployees: Employee[];
  rosterCells: Record<string, Cell[]>;
  onSelectValue: (val: Cell) => void;
  onSetDuty?: (duty: 'Kasir' | 'Pramuniaga') => void;
  onTogglePk: () => void;
  onMarkAbsent: () => void;
  onOpenException: (issue: Issue) => void;
  onSwapWith?: (targetEmpId: string) => void;
  onClose: () => void;
}

export const CellPopover: React.FC<CellPopoverProps> = ({
  employee,
  day,
  currentValue,
  currentDuty,
  isPk,
  isLeave,
  isAbsent,
  issues,
  allEmployees,
  rosterCells,
  onSelectValue,
  onSetDuty,
  onTogglePk,
  onMarkAbsent,
  onOpenException,
  onSwapWith,
  onClose,
}) => {
  const dayName = DAYS[day];
  const cellIssues = issues.filter(
    (i) => (i.empId === employee.id && (i.day === day || i.day === undefined)) ||
           (i.rule === 'PK_CHAIN' && i.empId === employee.id && i.day === day),
  );

  const canDoShift1 = canWorkShift(employee, day, 'I') && !isLeave && !isAbsent;
  const canDoShift2 = canWorkShift(employee, day, 'II') && !isLeave && !isAbsent;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{employee.name}</h3>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '8px', marginTop: '2px' }}>
              <span>{dayName}</span>
              <span>•</span>
              <span>{employee.position} ({employee.gender})</span>
              <span>•</span>
              <span>Kontrak {employee.workDays} hari</span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn btn-subtle btn-sm">✕</button>
        </div>

        {isLeave && (
          <div style={{ padding: '12px', background: 'var(--shift-leave-bg)', color: 'var(--shift-leave-text)', borderRadius: 'var(--radius-md)', fontSize: '13px', marginBottom: '16px' }}>
            ℹ Karyawan sedang cuti pada hari {dayName}. Tidak dapat dijadwalkan shift.
          </div>
        )}

        {isAbsent && (
          <div style={{ padding: '12px', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '13px', marginBottom: '16px' }}>
            ✕ Karyawan ditandai tidak hadir pada hari {dayName}.
          </div>
        )}

        {!isLeave && !isAbsent && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
              PILIH PENUGASAN:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button
                type="button"
                className={`btn ${currentValue === 'I' ? 'btn-primary' : 'btn-secondary'}`}
                disabled={!canDoShift1}
                onClick={() => {
                  onSelectValue('I');
                  onClose();
                }}
              >
                Shift I
              </button>

              <button
                type="button"
                className={`btn ${currentValue === 'II' ? 'btn-primary' : 'btn-secondary'}`}
                disabled={!canDoShift2}
                onClick={() => {
                  onSelectValue('II');
                  onClose();
                }}
              >
                Shift II
              </button>

              <button
                type="button"
                className={`btn ${currentValue === 'OFF' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  onSelectValue('OFF');
                  onClose();
                }}
              >
                Libur
              </button>
            </div>

            {/* Interchangeable Role: Kasir vs Pramuniaga for this shift */}
            {(employee.position === 'Kasir' || employee.position === 'Pramuniaga') && (currentValue === 'I' || currentValue === 'II') && (
              <div style={{ marginTop: '12px', padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600 }}>Tugas di Shift {currentValue}:</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Kasir & Pramuniaga dapat saling menggantikan</div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      className={`btn btn-sm ${(currentDuty ?? employee.position) === 'Kasir' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => onSetDuty?.('Kasir')}
                    >
                      Kasir
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${(currentDuty ?? employee.position) === 'Pramuniaga' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => onSetDuty?.('Pramuniaga')}
                    >
                      Pramuniaga
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PK Assignment Option on Shift II */}
            {currentValue === 'II' && (
              <div style={{ marginTop: '10px', padding: '12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>Tugas PK (Penutup Toko)</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Wajib membuka toko (Shift I) di hari berikutnya.
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`btn btn-sm ${isPk ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => {
                      onTogglePk();
                      onClose();
                    }}
                  >
                    {isPk ? '★ Terpilih PK' : 'Jadikan PK'}
                  </button>
                </div>
              </div>
            )}

            {/* SMART SWAP: Tukar dengan rekan pada hari yang sama */}
            {onSwapWith && (
              <div style={{ marginTop: '12px', padding: '12px', background: 'var(--info-bg)', border: '1px solid var(--info-border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--info)', marginBottom: '4px' }}>
                  ✦ Solusi Aman: Tukar Shift dengan Rekan
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Menukar shift langsung dengan rekan menjaga total staf dan kuota libur tetap seimbang tanpa memicu pelanggaran aturan.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '110px', overflowY: 'auto' }}>
                  {allEmployees
                    .filter((e) => e.id !== employee.id)
                    .map((other) => {
                      const otherVal = rosterCells[other.id]?.[day] ?? '—';
                      return (
                        <div
                          key={other.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '4px 8px',
                            background: 'var(--bg-surface)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '11px',
                          }}
                        >
                          <span><strong>{other.name.split(' ')[0]}</strong> ({other.position}): Shift <strong>{otherVal}</strong></span>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '2px 8px', fontSize: '10px' }}
                            onClick={() => {
                              onSwapWith(other.id);
                              onClose();
                            }}
                          >
                            Tukar
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Violations associated with this cell */}
        {cellIssues.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              STATUS ATURAN:
            </div>
            {cellIssues.map((issue) => (
              <div
                key={issue.key}
                style={{
                  padding: '10px',
                  background: issue.severity === 'error' ? 'var(--danger-bg)' : 'var(--warning-bg)',
                  border: `1px solid ${issue.severity === 'error' ? 'var(--danger-border)' : 'var(--warning-border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  marginBottom: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span>{issue.severity === 'error' ? '✕' : '⚠'} {issue.message}</span>
                </div>
                {issue.exception && (
                  <div style={{ marginTop: '4px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                    Pengecualian: "{issue.exception}"
                  </div>
                )}
                {issue.severity === 'error' && issue.overridable && !issue.exception && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: '8px' }}
                    onClick={() => {
                      onClose();
                      onOpenException(issue);
                    }}
                  >
                    ⚑ Jadikan Pengecualian
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Assistant Reasoning */}
        <div style={{ padding: '12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', fontSize: '12px', marginBottom: '16px' }}>
          <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '4px' }}>
            ✦ Penjelasan Asisten
          </div>
          <div style={{ color: 'var(--text-muted)' }}>
            {currentValue === 'OFF'
              ? `Libur pada ${dayName} menjaga jeda istirahat agar tidak 2 hari berturut-turut dan berbeda dari minggu lalu.`
              : currentValue === 'II'
              ? `Ditugaskan Shift II untuk memenuhi rasio staf dan rotasi shift toko.`
              : currentValue === 'I'
              ? `Ditugaskan Shift I sesuai ketersediaan dan kebutuhan minimal staf.`
              : 'Belum ada penugasan untuk sel ini.'}
          </div>
        </div>

        {/* Bottom Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {!isAbsent && (
            <button
              type="button"
              className="btn btn-subtle btn-sm"
              style={{ color: 'var(--danger)' }}
              onClick={() => {
                onClose();
                onMarkAbsent();
              }}
            >
              Tandai Tidak Hadir
            </button>
          )}
          <button type="button" onClick={onClose} className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
