import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext.tsx';
import type { Issue, ShiftCode } from '../types.ts';
import { RosterGrid } from '../components/grid/RosterGrid.tsx';
import { ShiftView } from '../components/grid/ShiftView.tsx';
import { IssuesPanel } from '../components/panels/IssuesPanel.tsx';
import { AbsenceDrawer } from '../components/overlays/AbsenceDrawer.tsx';
import { CrossStoreModal } from '../components/overlays/CrossStoreModal.tsx';
import { ExceptionModal } from '../components/overlays/ExceptionModal.tsx';
import { RegenerateModal } from '../components/overlays/RegenerateModal.tsx';
import { ValidationModal } from '../components/overlays/ValidationModal.tsx';
import { validate, summarize } from '../engine/validate.ts';
import { coverageTotals } from '../engine/core.ts';

export const WorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    state,
    updateCell,
    setDayPk,
    markEmployeeAbsent,
    applyRecommendation,
    setException,
    acceptShortage,
    updateNote,
    regenerateNote,
    regenerateWeek,
    withdrawSubmission,
    startChangeMode,
    discardChangeMode,
    submitChangeToAS,
    createEscalation,
    swapEmployeesShift,
    setCellDuty,
    acceptAllExceptionsWithNote,
  } = useApp();

  const week = id ? state.weeks[id] : null;

  const [viewMode, setViewMode] = useState<'employee' | 'shift'>('employee');
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true);

  // Overlay state
  const [absenceDrawerOpen, setAbsenceDrawerOpen] = useState(false);
  const [absenceInit, setAbsenceInit] = useState<{ empId?: string; day?: number; shift?: ShiftCode }>({});
  const [crossStoreModal, setCrossStoreModal] = useState<{ day: number; shift: ShiftCode } | null>(null);
  const [exceptionModalIssue, setExceptionModalIssue] = useState<Issue | null>(null);
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);
  const [validationModalOpen, setValidationModalOpen] = useState(false);

  if (!week || (!week.main && !week.change)) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <h3>Jadwal belum disusun.</h3>
        <button
          type="button"
          onClick={() => navigate(`/ps/week/${id}/setup`)}
          className="btn btn-primary"
          style={{ marginTop: '16px' }}
        >
          Mulai Penyusunan Jadwal →
        </button>
      </div>
    );
  }

  const isChangeMode = week.status === 'approved' && week.change !== null;
  const isReadOnly = week.status === 'pending' || (week.status === 'approved' && !isChangeMode) || week.status === 'change_pending';
  const activeCopy = isChangeMode ? week.change! : week.main!;

  // Validate active copy
  const issues = useMemo(() => {
    const prevInfo = id === 'w41' ? state.prevSeed : {
      label: state.weeks.w41?.label ?? '',
      offs: {},
      sundayPk: state.weeks.w41?.main?.roster.pk[6] ?? 'andi',
    };
    return validate({
      employees: state.employees,
      input: week.input,
      prev: prevInfo,
      copy: activeCopy,
      exceptions: week.exceptions,
      acceptedShortages: week.acceptedShortages,
      escalations: state.escalations.filter((x) => x.weekId === week.id),
    });
  }, [state.employees, week, activeCopy, state.escalations, id, state.prevSeed]);

  const summary = summarize(issues);
  const totals = coverageTotals(activeCopy.roster, week.input);
  const manualCount = Object.keys(activeCopy.manual).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 112px)' }}>
      {/* Top Bar for Workspace */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => navigate('/ps')}
              className="btn btn-subtle btn-sm"
            >
              ← Beranda
            </button>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
              Jadwal {week.label}
            </h2>
            <span className={`status-pill ${week.status}`}>
              {week.status === 'draft' && '● Draf'}
              {week.status === 'pending' && '● Menunggu Tinjauan AS'}
              {week.status === 'approved' && !isChangeMode && '● Disetujui AS'}
              {week.status === 'approved' && isChangeMode && '● Mode Perubahan'}
              {week.status === 'change_pending' && '● Perubahan Menunggu AS'}
            </span>
            {week.status === 'draft' && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Usulan #{week.proposalIndex}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              className="btn btn-secondary btn-sm"
            >
              {isPanelOpen ? 'Tutup Panel ◂' : 'Buka Panel ▸'}
            </button>
          </div>
        </div>

        {/* State Alerts / Banners */}
        {week.status === 'pending' && (
          <div style={{ padding: '12px 16px', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
              <span>ⓘ</span>
              <span>Jadwal telah diajukan ke Area Supervisor dan terkunci untuk ditinjau.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Tarik kembali pengajuan jadwal? Jadwal akan kembali ke Draf dan tetap tersimpan.')) {
                  withdrawSubmission(week.id);
                }
              }}
              className="btn btn-secondary btn-sm"
            >
              Tarik Kembali Pengajuan
            </button>
          </div>
        )}

        {week.lastOutcome?.type === 'rejected' && week.status === 'draft' && (
          <div style={{ padding: '12px 16px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', marginBottom: '12px', fontSize: '13px' }}>
            <div style={{ fontWeight: 700, color: 'var(--danger)' }}>
              ✕ Pengajuan Jadwal Ditolak oleh AS ({new Date(week.lastOutcome.at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})
            </div>
            <div style={{ color: 'var(--text-main)', marginTop: '2px' }}>
              Catatan perbaikan: "{week.lastOutcome.comment}"
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Jadwal tetap tersimpan. Anda dapat mengubah penugasan atau menyusun ulang sebelum mengajukan kembali.
            </div>
          </div>
        )}

        {week.status === 'approved' && !isChangeMode && (
          <div style={{ padding: '12px 16px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '13px' }}>
            <div style={{ color: 'var(--text-main)' }}>
              ✓ Jadwal telah disetujui untuk operasional toko. Perubahan ketidakhadiran dapat diajukan secara individual.
            </div>
            <button
              type="button"
              onClick={() => startChangeMode(week.id)}
              className="btn btn-primary btn-sm"
            >
              ✦ Ajukan Perubahan Jadwal
            </button>
          </div>
        )}

        {isChangeMode && (
          <div style={{ padding: '12px 16px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '13px' }}>
            <div style={{ color: '#6d28d9', fontWeight: 600 }}>
              Mode Perubahan Aktif: Silakan tandai ketidakhadiran atau sesuaikan penugasan shift yang terdampak.
            </div>
            <button
              type="button"
              onClick={() => discardChangeMode(week.id)}
              className="btn btn-subtle btn-sm"
              style={{ color: '#b91c1c' }}
            >
              Batalkan Perubahan
            </button>
          </div>
        )}

        {/* Summary Metric Strip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '13px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Cakupan: </span>
              <strong style={{ color: totals.filled >= totals.required ? 'var(--success)' : 'var(--danger)' }}>
                {totals.filled} / {totals.required}
              </strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)' }}>Kekurangan: </span>
              <strong style={{ color: summary.shortages.length === 0 ? 'var(--success)' : 'var(--danger)' }}>
                {summary.shortages.length}
              </strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)' }}>Pelanggaran: </span>
              <strong style={{ color: summary.errors.length === 0 ? 'var(--success)' : 'var(--danger)' }}>
                {summary.errors.length}
              </strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)' }}>Peringatan: </span>
              <strong style={{ color: 'var(--warning)' }}>
                {summary.warnings.length}
              </strong>
            </div>
          </div>

          {/* View Mode Radio */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', fontWeight: 600 }}>
            <span>Tampilan:</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="viewMode"
                checked={viewMode === 'employee'}
                onChange={() => setViewMode('employee')}
              />
              Per Karyawan
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="viewMode"
                checked={viewMode === 'shift'}
                onChange={() => setViewMode('shift')}
              />
              Per Shift
            </label>
          </div>
        </div>
      </div>

      {/* Main Grid & Panel Split Area */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, gap: '16px' }}>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {viewMode === 'employee' ? (
            <RosterGrid
              week={week}
              copy={activeCopy}
              employees={state.employees}
              issues={issues}
              readOnly={isReadOnly}
              onUpdateCell={(empId, day, val) => updateCell(week.id, empId, day, val)}
              onSetPk={(day, empId) => setDayPk(week.id, day, empId)}
              onMarkAbsentEmployee={(empId, day) => {
                setAbsenceInit({ empId, day });
                setAbsenceDrawerOpen(true);
              }}
              onOpenExceptionModal={(issue) => setExceptionModalIssue(issue)}
              onSetCellDuty={(empId, day, duty) => setCellDuty(week.id, empId, day, duty)}
              onSwapShift={(emp1Id, emp2Id, day) => swapEmployeesShift(week.id, emp1Id, emp2Id, day)}
            />
          ) : (
            <ShiftView
              week={week}
              copy={activeCopy}
              employees={state.employees}
              readOnly={isReadOnly}
              onFindReplacement={(day, shift) => {
                setAbsenceInit({ day, shift });
                setAbsenceDrawerOpen(true);
              }}
            />
          )}
        </div>

        {isPanelOpen && (
          <IssuesPanel
            week={week}
            issues={issues}
            onOpenExceptionModal={(issue) => setExceptionModalIssue(issue)}
            onFindReplacement={(day, shift) => {
              setAbsenceInit({ day, shift });
              setAbsenceDrawerOpen(true);
            }}
            onRequestCrossStore={(day, shift) => setCrossStoreModal({ day, shift })}
            onAcceptShortage={(slotKey, reason) => acceptShortage(week.id, slotKey, reason)}
            onUpdateNote={(note) => updateNote(week.id, note)}
            onRegenerateNote={() => regenerateNote(week.id)}
            onClose={() => setIsPanelOpen(false)}
          />
        )}
      </div>

      {/* Bottom Action Bar */}
      <div
        style={{
          marginTop: '16px',
          padding: '12px 0',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          {week.status === 'draft' && (
            <button
              type="button"
              onClick={() => setRegenerateModalOpen(true)}
              className="btn btn-secondary"
            >
              ↻ Buat Ulang Usulan
            </button>
          )}

          {!isReadOnly && (
            <button
              type="button"
              onClick={() => {
                setAbsenceInit({});
                setAbsenceDrawerOpen(true);
              }}
              className="btn btn-secondary"
            >
              Tandai Tidak Hadir
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {week.status === 'draft' && issues.some((i) => i.severity === 'error' || (i.severity === 'shortage' && !i.resolution)) && (
            <button
              type="button"
              onClick={() => {
                acceptAllExceptionsWithNote(week.id);
                setIsPanelOpen(true);
              }}
              className="btn btn-secondary"
              title="Lampirkan semua penyesuaian aturan manual sebagai catatan operasional resmi ke AS"
              style={{ color: '#d97706', borderColor: '#fde68a', background: '#fffbeb' }}
            >
              ⚑ Jadikan Catatan Operasional ({issues.filter((i) => i.severity === 'error' || (i.severity === 'shortage' && !i.resolution)).length})
            </button>
          )}

          <button
            type="button"
            onClick={() => setValidationModalOpen(true)}
            className="btn btn-secondary"
          >
            ✓ Cek Validasi
          </button>

          {week.status === 'draft' && (
            <button
              type="button"
              onClick={() => navigate(`/ps/week/${week.id}/submit`)}
              className="btn btn-primary"
            >
              Lanjut ke Kirim ke AS →
            </button>
          )}

          {isChangeMode && (
            <button
              type="button"
              onClick={() => submitChangeToAS(week.id)}
              className="btn btn-primary"
            >
              Kirim Perubahan ke AS →
            </button>
          )}
        </div>
      </div>

      {/* Overlays / Modals */}
      {absenceDrawerOpen && (
        <AbsenceDrawer
          week={week}
          copy={activeCopy}
          employees={state.employees}
          initialEmployeeId={absenceInit.empId}
          initialDay={absenceInit.day}
          initialShift={absenceInit.shift}
          onApplyRecommendation={(changes) => applyRecommendation(week.id, changes)}
          onMarkAbsent={(empId, days, reason) => markEmployeeAbsent(week.id, empId, days, reason)}
          onRequestCrossStore={(d, s) => setCrossStoreModal({ day: d, shift: s })}
          onClose={() => setAbsenceDrawerOpen(false)}
        />
      )}

      {crossStoreModal && (
        <CrossStoreModal
          day={crossStoreModal.day}
          shift={crossStoreModal.shift}
          onConfirm={(msg) => createEscalation(week.id, crossStoreModal.day, crossStoreModal.shift, 1, msg)}
          onClose={() => setCrossStoreModal(null)}
        />
      )}

      {exceptionModalIssue && (
        <ExceptionModal
          issue={exceptionModalIssue}
          onSave={(reason) => setException(week.id, exceptionModalIssue.key, reason)}
          onClose={() => setExceptionModalIssue(null)}
        />
      )}

      {regenerateModalOpen && (
        <RegenerateModal
          manualCount={manualCount}
          onConfirm={(keepLocks) => regenerateWeek(week.id, keepLocks)}
          onClose={() => setRegenerateModalOpen(false)}
        />
      )}

      {validationModalOpen && (
        <ValidationModal
          issues={issues}
          onProceedSubmit={() => navigate(`/ps/week/${week.id}/submit`)}
          onClose={() => setValidationModalOpen(false)}
        />
      )}
    </div>
  );
};
