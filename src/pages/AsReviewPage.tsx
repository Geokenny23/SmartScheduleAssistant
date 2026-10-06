import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext.tsx';
import { STORE_NAME, PS_NAME, DAYS } from '../data/seed.ts';
import { RosterGrid } from '../components/grid/RosterGrid.tsx';
import { validate } from '../engine/validate.ts';

export const AsReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, approveSchedule, rejectSchedule, approveChange, rejectChange } = useApp();

  const week = id ? state.weeks[id] : null;

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState('');

  if (!week || (!week.main && !week.change)) {
    return <div style={{ padding: '24px' }}>Jadwal tidak ditemukan.</div>;
  }

  const isChangeReview = week.status === 'change_pending';
  const targetCopy = isChangeReview ? week.change! : week.main!;

  const issues = validate({
    employees: state.employees,
    input: week.input,
    prev: state.prevSeed,
    copy: targetCopy,
    exceptions: week.exceptions,
    acceptedShortages: week.acceptedShortages,
    escalations: state.escalations.filter((x) => x.weekId === week.id),
  });

  const handleApprove = () => {
    if (isChangeReview) {
      approveChange(week.id, 'Disetujui. Perubahan staf terverifikasi.');
    } else {
      approveSchedule(week.id, 'Disetujui. Sesuai kebutuhan operasional toko.');
    }
    navigate('/as');
  };

  const handleReject = () => {
    if (!rejectComment.trim()) {
      alert('Alasan penolakan wajib diisi untuk perbaikan oleh Pimpinan Shift.');
      return;
    }
    if (isChangeReview) {
      rejectChange(week.id, rejectComment.trim());
    } else {
      rejectSchedule(week.id, rejectComment.trim());
    }
    setRejectModalOpen(false);
    navigate('/as');
  };

  // Build diff rows for change review
  const diffRows: { empName: string; dayName: string; before: string; after: string; reason: string }[] = [];
  if (isChangeReview && week.main && week.change) {
    for (const emp of state.employees) {
      for (let d = 0; d < 7; d++) {
        const b = week.main.roster.cells[emp.id]?.[d];
        const a = week.change.roster.cells[emp.id]?.[d];
        const wasAbsent = week.change.absences[emp.id]?.includes(d);
        if (b !== a || wasAbsent) {
          diffRows.push({
            empName: emp.name,
            dayName: DAYS[d],
            before: b ?? 'Kosong',
            after: wasAbsent ? 'Tidak Hadir' : (a ?? 'Kosong'),
            reason: wasAbsent ? (week.change.absenceReasons[`${emp.id}|${d}`] ?? 'Sakit/Izin') : 'Penyesuaian pengganti',
          });
        }
      }
    }
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <button
        type="button"
        onClick={() => navigate('/as')}
        className="btn btn-subtle btn-sm"
        style={{ marginBottom: '16px' }}
      >
        ← Kembali ke Kotak Masuk
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>
            Tinjau Jadwal — {STORE_NAME}
          </h2>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Periode: <strong>{week.label}</strong> • PS: {PS_NAME}
          </div>
        </div>

        <span className={`status-pill ${week.status}`}>
          {isChangeReview ? '● Perubahan Menunggu Persetujuan' : '● Menunggu Persetujuan AS'}
        </span>
      </div>

      {/* Operational Note from PS Banner */}
      <div className="card" style={{ marginBottom: '20px', background: 'var(--bg-subtle)' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--primary)' }}>
          Catatan Operasional dari Pimpinan Shift ({PS_NAME}):
        </h4>
        <p style={{ fontSize: '13px', color: 'var(--text-main)', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
          {week.note || 'Tidak ada catatan operasional khusus.'}
        </p>
      </div>

      {/* Exceptions summary if any */}
      {Object.keys(week.exceptions).length > 0 && (
        <div style={{ padding: '14px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '13px' }}>
          <div style={{ fontWeight: 700, color: '#92400e', marginBottom: '6px' }}>
            ⚑ Permohonan Pengecualian Aturan dari PS:
          </div>
          {Object.entries(week.exceptions).map(([k, reason]) => (
            <div key={k} style={{ color: '#78350f', marginBottom: '4px' }}>
              • {k.split('|')[0]}: <em>"{reason}"</em>
            </div>
          ))}
        </div>
      )}

      {/* If Change Review: Display Diff Table */}
      {isChangeReview ? (
        <div className="card" style={{ marginBottom: '24px', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', fontWeight: 700, fontSize: '14px' }}>
            Rincian Perubahan yang Diajukan ({diffRows.length} Perubahan)
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left' }}>
                <th style={{ padding: '10px 16px' }}>Karyawan</th>
                <th style={{ padding: '10px 16px' }}>Hari</th>
                <th style={{ padding: '10px 16px' }}>Sebelumnya</th>
                <th style={{ padding: '10px 16px' }}>Menjadi</th>
                <th style={{ padding: '10px 16px' }}>Alasan / Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {diffRows.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{row.empName}</td>
                  <td style={{ padding: '12px 16px' }}>{row.dayName}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{row.before}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--primary)' }}>{row.after}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Regular Roster Review (Read-only) */
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>
            Pratinjau Jadwal Lengkap
          </h4>
          <RosterGrid
            week={week}
            copy={targetCopy}
            employees={state.employees}
            issues={issues}
            readOnly={true}
            onUpdateCell={() => {}}
            onSetPk={() => {}}
            onMarkAbsentEmployee={() => {}}
            onOpenExceptionModal={() => {}}
          />
        </div>
      )}

      {/* Bottom Decision Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
        <button
          type="button"
          onClick={() => setRejectModalOpen(true)}
          className="btn btn-secondary"
          style={{ color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
        >
          {isChangeReview ? 'Tolak Perubahan' : 'Tolak Jadwal'}
        </button>

        <button
          type="button"
          onClick={handleApprove}
          className="btn btn-primary btn-lg"
          style={{ minWidth: '180px' }}
        >
          {isChangeReview ? '✓ Setujui Perubahan' : '✓ Setujui Jadwal'}
        </button>
      </div>

      {/* Rejection Modal */}
      {rejectModalOpen && (
        <div className="modal-overlay" onClick={() => setRejectModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
              {isChangeReview ? 'Tolak Perubahan Jadwal?' : 'Tolak Pengajuan Jadwal?'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Jadwal akan dikembalikan ke status Draf. Berikan catatan atau arahan perbaikan yang jelas untuk Pimpinan Shift.
            </p>

            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              rows={4}
              placeholder="Contoh: Mohon ratakan shift II antara Budi dan Dimas, serta pastikan tidak ada libur yang berdekatan..."
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-medium)',
                fontSize: '13px',
                marginBottom: '20px',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="btn btn-secondary"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="btn btn-danger"
              >
                Konfirmasi Penolakan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
