import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext.tsx';
import { validate, summarize } from '../engine/validate.ts';
import { coverageTotals } from '../engine/core.ts';

export const SubmitPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, submitToAS, updateNote } = useApp();

  const week = id ? state.weeks[id] : null;
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!week || !week.main) {
    return <div style={{ padding: '24px' }}>Jadwal tidak ditemukan.</div>;
  }

  const prevInfo = id === 'w41' ? state.prevSeed : {
    label: state.weeks.w41?.label ?? '',
    offs: {},
    sundayPk: state.weeks.w41?.main?.roster.pk[6] ?? 'andi',
  };

  const issues = validate({
    employees: state.employees,
    input: week.input,
    prev: prevInfo,
    copy: week.main,
    exceptions: week.exceptions,
    acceptedShortages: week.acceptedShortages,
    escalations: state.escalations.filter((x) => x.weekId === week.id),
  });

  const summary = summarize(issues);
  const totals = coverageTotals(week.main.roster, week.input);

  const handleSubmit = () => {
    // If there are unhandled errors or open shortages, auto-accept them with the operational note
    if (summary.errors.length > 0 || summary.openShortages.length > 0) {
      // Auto-accept into exceptions
      for (const err of summary.errors) {
        week.exceptions[err.key] = 'Penyesuaian manual oleh Pimpinan Shift (tercantum dalam catatan operasional)';
      }
      for (const sh of summary.openShortages) {
        week.acceptedShortages[`${sh.day}|${sh.shift}`] = 'Kekurangan staf diajukan dengan catatan operasional';
      }
    }
    submitToAS(week.id);
    setSubmitted(true);
  };

  if (submitted || week.status === 'pending') {
    return (
      <div style={{ maxWidth: '640px', margin: '40px auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '40px 24px' }}>
          <div style={{ fontSize: '48px', color: 'var(--success)', marginBottom: '16px' }}>✓</div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
            Jadwal Berhasil Dikirim ke AS
          </h2>
          <p style={{ fontSize: '14px', marginBottom: '24px' }}>
            Jadwal <strong>{week.label}</strong> telah dikirimkan ke Area Supervisor (Ratna) untuk proses peninjauan dan persetujuan.
          </p>

          <div style={{ padding: '16px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', marginBottom: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Draf</span>
            <span>──▶</span>
            <span style={{ fontWeight: 700, color: 'var(--warning)' }}>● Menunggu AS</span>
            <span>──▶</span>
            <span style={{ color: 'var(--text-muted)' }}>Disetujui / Ditolak</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => navigate('/ps')}
              className="btn btn-secondary"
            >
              Ke Beranda
            </button>
            <button
              type="button"
              onClick={() => navigate(`/ps/week/${week.id}`)}
              className="btn btn-primary"
            >
              Lihat Jadwal Terkirim
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate(`/ps/week/${week.id}`)}
        className="btn btn-subtle btn-sm"
        style={{ marginBottom: '16px' }}
      >
        ← Kembali ke Ruang Kerja Jadwal
      </button>

      {/* Stepper */}
      <div className="stepper">
        <div className="step-item completed">
          <div className="step-num">✓</div>
          <span>① Tinjau Input</span>
        </div>
        <div className="step-divider" />
        <div className="step-item completed">
          <div className="step-num">✓</div>
          <span>② Ruang Kerja Jadwal</span>
        </div>
        <div className="step-divider" />
        <div className="step-item active">
          <div className="step-num">3</div>
          <span>③ Kirim ke AS</span>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Tinjau Akhir & Kirim ke Area Supervisor</h2>
        <p style={{ fontSize: '13px', marginTop: '2px' }}>
          Pastikan kepatuhan aturan dan catatan operasional sudah sesuai sebelum dikirim.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
        {/* Status metric cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="card">
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
              STATUS ATURAN OPERASIONAL
            </h4>
            <div style={{ fontSize: '14px', fontWeight: 600, color: summary.errors.length === 0 ? 'var(--success)' : 'var(--danger)' }}>
              {summary.errors.length === 0 ? '✓ 0 Pelanggaran Wajib' : `✕ ${summary.errors.length} Pelanggaran Wajib`}
            </div>
            {summary.exceptions.length > 0 && (
              <div style={{ fontSize: '12px', color: '#92400e', marginTop: '4px' }}>
                ⚑ {summary.exceptions.length} Pengecualian Disetujui PS
              </div>
            )}
          </div>

          <div className="card">
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
              CAKUPAN STAF TOKO
            </h4>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>
              {totals.filled} / {totals.required} Shift Terisi
            </div>
            {summary.shortages.length > 0 && (
              <div style={{ fontSize: '12px', color: 'var(--warning)', marginTop: '4px' }}>
                ⚠ {summary.shortages.length} Kekurangan (Sudah Dieskalasi / Dicatat)
              </div>
            )}
          </div>
        </div>

        {/* Operational Note Editor */}
        <div className="card">
          <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>
            Catatan Operasional untuk Area Supervisor
          </h4>
          <textarea
            value={week.note}
            onChange={(e) => updateNote(week.id, e.target.value)}
            rows={8}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium)',
              fontSize: '13px',
              lineHeight: 1.6,
              background: 'var(--bg-surface)',
              color: 'var(--text-main)',
            }}
          />
        </div>

        {/* Checkbox confirmation */}
        <div className="card" style={{ background: 'var(--bg-subtle)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '13px' }}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              style={{ width: '18px', height: '18px' }}
            />
            <span>
              Saya (Pimpinan Shift) telah memeriksa jadwal ini dan mengonfirmasi kesiapan operasional toko.
            </span>
          </label>
        {summary.errors.length > 0 && (
          <div style={{ padding: '10px 14px', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--text-main)', marginTop: '8px' }}>
            ℹ Jadwal memiliki {summary.errors.length} penyesuaian aturan. Catatan operasional di atas akan otomatis disertakan agar Area Supervisor dapat meninjau dan memutuskan pengecualian ini.
          </div>
        )}
        </div>
      </div>

      {/* Submit Action */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button
          type="button"
          onClick={() => navigate(`/ps/week/${week.id}`)}
          className="btn btn-secondary"
        >
          Kembali ke Jadwal
        </button>

        <button
          type="button"
          disabled={!confirmed}
          onClick={handleSubmit}
          className="btn btn-primary btn-lg"
          style={{ minWidth: '220px' }}
        >
          Kirim ke Area Supervisor →
        </button>
      </div>
    </div>
  );
};
