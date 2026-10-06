import React, { useState, useMemo } from 'react';
import type { Employee, ShiftCode, Week, WorkingCopy } from '../../types.ts';
import { DAYS, ABSENCE_REASONS } from '../../data/seed.ts';
import { recommend } from '../../engine/recommend.ts';

interface AbsenceDrawerProps {
  week: Week;
  copy: WorkingCopy;
  employees: Employee[];
  initialEmployeeId?: string;
  initialDay?: number;
  initialShift?: ShiftCode;
  onApplyRecommendation: (changes: { empId: string; day: number; value: any }[]) => void;
  onMarkAbsent: (empId: string, days: number[], reason: string) => void;
  onRequestCrossStore: (day: number, shift: ShiftCode) => void;
  onClose: () => void;
}

export const AbsenceDrawer: React.FC<AbsenceDrawerProps> = ({
  week,
  copy,
  employees,
  initialEmployeeId,
  initialDay = 0,
  initialShift,
  onApplyRecommendation,
  onMarkAbsent,
  onRequestCrossStore,
  onClose,
}) => {
  // If user opened directly to find replacement for a shortage slot:
  const isDirectFind = !initialEmployeeId && initialShift !== undefined;

  const [step, setStep] = useState<number>(isDirectFind ? 3 : 1);
  const [selectedEmpId, setSelectedEmpId] = useState<string>(initialEmployeeId ?? employees[0]?.id ?? '');
  const [selectedDays, setSelectedDays] = useState<number[]>([initialDay]);
  const [reason, setReason] = useState<string>(ABSENCE_REASONS[0]);

  // Target slot to find replacement for in step 3
  const [targetDay, setTargetDay] = useState<number>(initialDay);
  const [targetShift, setTargetShift] = useState<ShiftCode>(initialShift ?? 'I');

  const selectedEmp = employees.find((e) => e.id === selectedEmpId);

  // Compute recommendations for targetDay and targetShift
  const { candidates, ineligible } = useMemo(() => {
    const ctx = {
      employees,
      input: week.input,
      prev: { label: '', offs: {}, sundayPk: null }, // context handles base
      copy,
      exceptions: week.exceptions,
      acceptedShortages: week.acceptedShortages,
      escalations: [],
    };
    return recommend(ctx, targetDay, targetShift);
  }, [employees, week, copy, targetDay, targetShift]);

  const toggleDay = (d: number) => {
    setSelectedDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort(),
    );
  };

  const handleFinishStep1 = () => {
    if (selectedDays.length === 0) {
      alert('Pilih minimal satu hari ketidakhadiran.');
      return;
    }
    // Determine the shift this employee was working on that day
    const empCell = copy.roster.cells[selectedEmpId]?.[selectedDays[0]];
    if (empCell === 'I' || empCell === 'II') {
      setTargetShift(empCell);
      setTargetDay(selectedDays[0]);
    }
    setStep(2);
  };

  const handleApplyAbsentAndSearch = () => {
    // Actually mark employee absent in the state
    onMarkAbsent(selectedEmpId, selectedDays, reason);
    setStep(3);
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
              {isDirectFind ? 'Cari Pengganti Shift' : 'Tandai Tidak Hadir'}
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {step === 1 && 'Langkah 1: Data ketidakhadiran'}
              {step === 2 && 'Langkah 2: Dampak pada jadwal'}
              {step === 3 && 'Langkah 3: Rekomendasi asisten'}
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn btn-subtle btn-sm">✕</button>
        </div>

        {/* Stepper progress */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
          <div className="stepper" style={{ marginBottom: 0 }}>
            <div className={`step-item ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>
              <div className="step-num">{step > 1 ? '✓' : '1'}</div>
              <span>Data</span>
            </div>
            <div className="step-divider" />
            <div className={`step-item ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>
              <div className="step-num">{step > 2 ? '✓' : '2'}</div>
              <span>Dampak</span>
            </div>
            <div className="step-divider" />
            <div className={`step-item ${step === 3 ? 'active' : ''}`}>
              <div className="step-num">3</div>
              <span>Pengganti</span>
            </div>
          </div>
        </div>

        {/* Step Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* STEP 1: SIAPA & KAPAN */}
          {step === 1 && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Karyawan yang berhalangan:
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '14px' }}
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.position} · {e.gender})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Hari tidak hadir:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {DAYS.map((day, idx) => {
                    const isChecked = selectedDays.includes(idx);
                    const curAssignment = copy.roster.cells[selectedEmpId]?.[idx];
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleDay(idx)}
                        style={{
                          padding: '8px 4px',
                          borderRadius: 'var(--radius-sm)',
                          border: `1px solid ${isChecked ? 'var(--primary)' : 'var(--border-subtle)'}`,
                          background: isChecked ? 'var(--primary-light)' : 'var(--bg-surface)',
                          color: isChecked ? 'var(--primary)' : 'var(--text-main)',
                          fontWeight: isChecked ? 600 : 500,
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        <div>{day}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {curAssignment ?? '—'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Alasan:
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '14px' }}
                >
                  {ABSENCE_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* STEP 2: DAMPAK */}
          {step === 2 && (
            <>
              <div style={{ padding: '16px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  Ringkasan Dampak:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div>
                    Karyawan: <strong>{selectedEmp?.name}</strong>
                  </div>
                  <div>
                    Alasan: <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{reason}</span>
                  </div>
                  <div>
                    Hari terdampak: {selectedDays.map((d) => DAYS[d]).join(', ')}
                  </div>
                </div>
              </div>

              <div style={{ padding: '14px', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
                <div style={{ fontWeight: 600, color: 'var(--warning)', marginBottom: '4px' }}>
                  ⚠ Kapasitas shift akan berkurang
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  Jika diterapkan, sel pada hari terkait akan dikosongkan dan Asisten akan segera mencari rekomendasi pengganti lokal yang memenuhi semua batasan operasional.
                </div>
              </div>
            </>
          )}

          {/* STEP 3: REKOMENDASI PENGGANTI */}
          {step === 3 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>
                  Kebutuhan: <span style={{ color: 'var(--primary)' }}>{DAYS[targetDay]} · Shift {targetShift}</span>
                </div>
                {/* Selector for other shortage days if multiple */}
                {selectedDays.length > 1 && (
                  <select
                    value={targetDay}
                    onChange={(e) => setTargetDay(Number(e.target.value))}
                    style={{ fontSize: '12px', padding: '4px' }}
                  >
                    {selectedDays.map((d) => (
                      <option key={d} value={d}>{DAYS[d]}</option>
                    ))}
                  </select>
                )}
              </div>

              {candidates.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    ✦ Asisten menemukan <strong>{candidates.length}</strong> alternatif terbaik tanpa melanggar aturan wajib:
                  </div>

                  {candidates.map((cand, idx) => {
                    const emp = employees.find((e) => e.id === cand.empId);
                    return (
                      <div
                        key={cand.empId}
                        style={{
                          padding: '16px',
                          background: 'var(--bg-surface)',
                          border: idx === 0 ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 700, fontSize: '14px' }}>{emp?.name}</span>
                              <span className="badge badge-gender">{emp?.gender}</span>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp?.position}</span>
                            </div>
                            {idx === 0 && (
                              <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>
                                ★ Paling Sesuai
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              onApplyRecommendation(cand.changes);
                              onClose();
                            }}
                          >
                            Terapkan
                          </button>
                        </div>

                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                          Solusi: {cand.summary}
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {cand.checks.map((chk, i) => (
                            <span key={i} style={{ fontSize: '11px', background: 'var(--success-bg)', color: 'var(--success)', padding: '2px 6px', borderRadius: '4px' }}>
                              ✓ {chk}
                            </span>
                          ))}
                          {cand.pkNotes.map((pn, i) => (
                            <span key={`pk-${i}`} style={{ fontSize: '11px', background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px' }}>
                              ★ {pn}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* No Candidates Empty State */
                <div style={{ textAlign: 'center', padding: '24px 16px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>∅</div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>
                    Tidak Ada Pengganti yang Memenuhi Syarat
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Semua karyawan lokal lainnya sedang cuti, libur yang tidak dapat digeser, atau terikat batasan shift & PK.
                  </p>

                  {/* Why others failed */}
                  <div style={{ textAlign: 'left', background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '12px', marginBottom: '16px' }}>
                    <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
                      Kenapa karyawan lain tidak bisa?
                    </div>
                    {ineligible.slice(0, 4).map((inel) => {
                      const emp = employees.find((e) => e.id === inel.empId);
                      return (
                        <div key={inel.empId} style={{ marginBottom: '4px' }}>
                          <strong>{emp?.name.split(' ')[0]}:</strong> <span style={{ color: 'var(--text-muted)' }}>{inel.reason}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        onClose();
                        onRequestCrossStore(targetDay, targetShift);
                      }}
                    >
                      Minta Bantuan Lintas Toko →
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={onClose}
                    >
                      Terima Kekurangan & Tambahkan Catatan
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {step === 1 && (
            <>
              <button type="button" onClick={onClose} className="btn btn-secondary">Batal</button>
              <button type="button" onClick={handleFinishStep1} className="btn btn-primary">Lanjut ke Dampak →</button>
            </>
          )}

          {step === 2 && (
            <>
              <button type="button" onClick={() => setStep(1)} className="btn btn-secondary">← Kembali</button>
              <button type="button" onClick={handleApplyAbsentAndSearch} className="btn btn-primary">
                Tandai & Cari Pengganti →
              </button>
            </>
          )}

          {step === 3 && (
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ marginLeft: 'auto' }}>
              Selesai
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
