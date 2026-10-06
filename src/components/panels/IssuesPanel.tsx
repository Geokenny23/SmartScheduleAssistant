import React, { useState } from 'react';
import type { Issue, ShiftCode, Week } from '../../types.ts';
import { DAYS } from '../../data/seed.ts';
import { RULE_LIST } from '../../engine/validate.ts';

interface IssuesPanelProps {
  week: Week;
  issues: Issue[];
  onOpenExceptionModal: (issue: Issue) => void;
  onFindReplacement: (day: number, shift: ShiftCode) => void;
  onRequestCrossStore: (day: number, shift: ShiftCode) => void;
  onAcceptShortage: (slotKey: string, reason: string) => void;
  onUpdateNote: (note: string) => void;
  onRegenerateNote: () => void;
  onClose: () => void;
}

export const IssuesPanel: React.FC<IssuesPanelProps> = ({
  week,
  issues,
  onOpenExceptionModal,
  onFindReplacement,
  onRequestCrossStore,
  onAcceptShortage,
  onUpdateNote,
  onRegenerateNote,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'issues' | 'shortages' | 'note' | 'activity'>('issues');

  const errors = issues.filter((i) => i.severity === 'error' && !i.exception);
  const exceptions = issues.filter((i) => i.severity === 'error' && !!i.exception);
  const warnings = issues.filter((i) => i.severity === 'warning');
  const shortages = issues.filter((i) => i.severity === 'shortage');

  return (
    <div
      style={{
        width: '380px',
        background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Tab Header */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-subtle)',
          padding: '4px',
          gap: '4px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('issues')}
          style={{
            flex: 1,
            padding: '8px 4px',
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'issues' ? 'var(--bg-surface)' : 'transparent',
            color: activeTab === 'issues' ? 'var(--primary)' : 'var(--text-muted)',
            boxShadow: activeTab === 'issues' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          Masalah ({errors.length + warnings.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('shortages')}
          style={{
            flex: 1,
            padding: '8px 4px',
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'shortages' ? 'var(--bg-surface)' : 'transparent',
            color: activeTab === 'shortages' ? 'var(--primary)' : 'var(--text-muted)',
            boxShadow: activeTab === 'shortages' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          Kekurangan ({shortages.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('note')}
          style={{
            flex: 1,
            padding: '8px 4px',
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'note' ? 'var(--bg-surface)' : 'transparent',
            color: activeTab === 'note' ? 'var(--primary)' : 'var(--text-muted)',
            boxShadow: activeTab === 'note' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          Catatan
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          style={{
            flex: 1,
            padding: '8px 4px',
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            background: activeTab === 'activity' ? 'var(--bg-surface)' : 'transparent',
            color: activeTab === 'activity' ? 'var(--primary)' : 'var(--text-muted)',
            boxShadow: activeTab === 'activity' ? 'var(--shadow-sm)' : 'none',
          }}
        >
          Aktivitas
        </button>

        <button
          type="button"
          onClick={onClose}
          className="btn btn-subtle btn-sm"
          style={{ padding: '4px 8px' }}
          title="Tutup panel"
        >
          ✕
        </button>
      </div>

      {/* Tab Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {/* TAB 1: MASALAH */}
        {activeTab === 'issues' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Hard Violations */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--danger)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>✕ Pelanggaran Wajib ({errors.length})</span>
              </div>

              {errors.length === 0 ? (
                <div style={{ padding: '12px', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-md)', fontSize: '12px' }}>
                  ✓ Tidak ada pelanggaran wajib. Semua aturan utama terpenuhi.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {errors.map((err) => (
                    <div
                      key={err.key}
                      style={{
                        padding: '10px',
                        background: 'var(--danger-bg)',
                        border: '1px solid var(--danger-border)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '12px',
                      }}
                    >
                      <div style={{ fontWeight: 600, color: 'var(--danger)', marginBottom: '4px' }}>
                        {err.message}
                      </div>
                      {err.overridable && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ marginTop: '6px', fontSize: '11px' }}
                          onClick={() => onOpenExceptionModal(err)}
                        >
                          ⚑ Jadikan Pengecualian
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Exceptions */}
            {exceptions.length > 0 && (
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#b45309', marginBottom: '8px' }}>
                  ⚑ Pengecualian Disetujui PS ({exceptions.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {exceptions.map((ex) => (
                    <div
                      key={ex.key}
                      style={{
                        padding: '10px',
                        background: '#fef3c7',
                        border: '1px solid #fde68a',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '12px',
                      }}
                    >
                      <div style={{ fontWeight: 600, color: '#92400e' }}>{ex.message}</div>
                      <div style={{ marginTop: '4px', fontStyle: 'italic', color: '#78350f' }}>
                        Alasan: "{ex.exception}"
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings (Soft) */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--warning)', marginBottom: '8px' }}>
                ⚠ Peringatan Preferensi ({warnings.length})
              </div>
              {warnings.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Tidak ada catatan preferensi.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {warnings.map((warn) => (
                    <div
                      key={warn.key}
                      style={{
                        padding: '8px 10px',
                        background: 'var(--warning-bg)',
                        border: '1px solid var(--warning-border)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '12px',
                        color: 'var(--text-main)',
                      }}
                    >
                      {warn.message}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Passed Rules Checklist */}
            <details style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--text-main)' }}>
                ▸ Daftar Aturan Operasional ({RULE_LIST.hard.length + RULE_LIST.soft.length})
              </summary>
              <div style={{ marginTop: '8px', padding: '10px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--text-main)' }}>Aturan Wajib:</div>
                <ul style={{ paddingLeft: '16px', marginBottom: '8px' }}>
                  {RULE_LIST.hard.map((r) => (
                    <li key={r} style={{ marginBottom: '2px' }}>{r}</li>
                  ))}
                </ul>
                <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--text-main)' }}>Preferensi / Hipotesis:</div>
                <ul style={{ paddingLeft: '16px' }}>
                  {RULE_LIST.soft.map((r) => (
                    <li key={r} style={{ marginBottom: '2px' }}>{r}</li>
                  ))}
                </ul>
              </div>
            </details>
          </div>
        )}

        {/* TAB 2: KEKURANGAN */}
        {activeTab === 'shortages' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {shortages.length === 0 ? (
              <div style={{ padding: '16px', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-md)', fontSize: '13px', textAlign: 'center' }}>
                ✓ Semua kebutuhan shift terpenuhi. Tidak ada kekurangan staf!
              </div>
            ) : (
              shortages.map((shortage) => {
                const day = shortage.day!;
                const shift = shortage.shift!;
                const slotK = `${day}|${shift}`;

                return (
                  <div
                    key={shortage.key}
                    style={{
                      padding: '14px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-main)' }}>
                        {DAYS[day]} · Shift {shift}
                      </span>
                      <span className="status-pill rejected" style={{ fontSize: '11px' }}>
                        Kurang {shortage.amount ?? 1} org
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                      Kapasitas staf lokal belum mencukupi untuk memenuhi batas minimum shift ini.
                    </div>

                    {shortage.resolution ? (
                      <div style={{ padding: '8px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>
                        {shortage.resolutionText}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => onFindReplacement(day, shift)}
                        >
                          ✦ Cari Pengganti Lokal
                        </button>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '11px' }}
                            onClick={() => onRequestCrossStore(day, shift)}
                          >
                            Minta Lintas Toko
                          </button>

                          <button
                            type="button"
                            className="btn btn-subtle btn-sm"
                            style={{ fontSize: '11px' }}
                            onClick={() => {
                              const reason = window.prompt('Alasan menerima kekurangan staf untuk shift ini:');
                              if (reason) onAcceptShortage(slotK, reason);
                            }}
                          >
                            Terima Catatan
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: CATATAN */}
        {activeTab === 'note' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                {week.noteEdited ? 'Diedit Manual oleh PS ✎' : '✦ Draf Otomatis Asisten'}
              </span>
              <button
                type="button"
                className="btn btn-subtle btn-sm"
                onClick={onRegenerateNote}
                title="Susun ulang catatan dari hasil validasi"
              >
                ↻ Susun Ulang
              </button>
            </div>

            <textarea
              value={week.note}
              onChange={(e) => onUpdateNote(e.target.value)}
              rows={12}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium)',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                lineHeight: 1.6,
                background: 'var(--bg-surface)',
                color: 'var(--text-main)',
                resize: 'vertical',
              }}
              placeholder="Tuliskan catatan operasional untuk Area Supervisor..."
            />

            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              Catatan ini akan dikirimkan bersama pengajuan jadwal dan terlihat oleh Area Supervisor saat meninjau.
            </div>
          </div>
        )}

        {/* TAB 4: AKTIVITAS */}
        {activeTab === 'activity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {week.activity.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Belum ada riwayat aktivitas.</div>
            ) : (
              [...week.activity].reverse().map((act, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid var(--border-subtle)',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: act.actor === 'Asisten' ? 'var(--primary)' : 'var(--text-main)' }}>
                      {act.actor === 'Asisten' ? '✦ Asisten' : act.actor}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                      {new Date(act.at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>{act.text}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
