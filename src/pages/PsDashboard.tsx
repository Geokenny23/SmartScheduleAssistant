import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext.tsx';
import { PS_NAME } from '../data/seed.ts';
import { coverageTotals } from '../engine/core.ts';

export const PsDashboard: React.FC = () => {
  const { state } = useApp();
  const navigate = useNavigate();

  const w41 = state.weeks.w41;
  const w42 = state.weeks.w42;

  const w41Totals = w41.main ? coverageTotals(w41.main.roster, w41.input) : { filled: 42, required: 42 };
  const w42Totals = w42.main ? coverageTotals(w42.main.roster, w42.input) : null;

  const pendingEscalations = state.escalations.filter((e) => e.status === 'pending');
  const rejectedWeek = Object.values(state.weeks).find((w) => w.lastOutcome?.type === 'rejected');

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Welcome Banner */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>
          Selamat pagi, {PS_NAME} 👋
        </h1>
        <p style={{ fontSize: '14px' }}>
          Berikut ringkasan jadwal kerja toko Anda untuk minggu ini dan minggu depan.
        </p>
      </div>

      {/* Week Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
        {/* Next Week Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)' }}>
                  Minggu Depan
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: '2px' }}>{w42.label}</h3>
              </div>
              <span className={`status-pill ${w42.status}`}>
                {w42.status === 'empty' && '○ Belum dibuat'}
                {w42.status === 'draft' && '● Draf'}
                {w42.status === 'pending' && '● Menunggu AS'}
                {w42.status === 'approved' && '● Disetujui AS'}
              </span>
            </div>

            <p style={{ fontSize: '13px', marginBottom: '20px' }}>
              {w42.status === 'empty' && 'Asisten siap menyusun usulan jadwal berdasarkan ketersediaan tim dan aturan toko.'}
              {w42.status === 'draft' && `Usulan jadwal #${w42.proposalIndex} aktif. Cakupan ${w42Totals?.filled}/${w42Totals?.required} shift.`}
              {w42.status === 'pending' && 'Jadwal sedang ditinjau oleh Area Supervisor.'}
              {w42.status === 'approved' && 'Jadwal telah disetujui untuk operasional.'}
            </p>
          </div>

          <div>
            {w42.status === 'empty' ? (
              <button
                type="button"
                onClick={() => navigate('/ps/week/w42/setup')}
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
              >
                ✦ Buat Jadwal Minggu Depan →
              </button>
            ) : w42.status === 'draft' ? (
              <button
                type="button"
                onClick={() => navigate('/ps/week/w42')}
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
              >
                Lanjutkan Draf Jadwal →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/ps/week/w42')}
                className="btn btn-secondary btn-lg"
                style={{ width: '100%' }}
              >
                Lihat Jadwal
              </button>
            )}
          </div>
        </div>

        {/* Current Week Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)' }}>
                  Minggu Ini (Sedang Berjalan)
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginTop: '2px' }}>{w41.label}</h3>
              </div>
              <span className="status-pill approved">
                ● Disetujui AS
              </span>
            </div>

            <p style={{ fontSize: '13px', marginBottom: '20px' }}>
              Operasional aktif. Cakupan {w41Totals.filled}/{w41Totals.required} shift terisi. Anda dapat mengajukan perubahan jika ada ketidakhadiran mendadak.
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={() => navigate('/ps/week/w41')}
              className="btn btn-secondary btn-lg"
              style={{ width: '100%' }}
            >
              Lihat Jadwal Minggu Ini
            </button>
          </div>
        </div>
      </div>

      {/* Attention Section */}
      <div>
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>
          Perlu Perhatian
        </h3>

        {rejectedWeek && (
          <div style={{ padding: '16px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '13px' }}>
                ✕ Pengajuan Jadwal Ditolak oleh AS
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-main)', marginTop: '2px' }}>
                Catatan: "{rejectedWeek.lastOutcome?.comment}"
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/ps/week/${rejectedWeek.id}`)}
              className="btn btn-danger btn-sm"
            >
              Perbaiki Jadwal
            </button>
          </div>
        )}

        {pendingEscalations.length > 0 && (
          <div style={{ padding: '16px', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius-md)', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--warning)', fontSize: '13px' }}>
                ⇪ {pendingEscalations.length} Permintaan Bantuan Lintas Toko Menunggu AS
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Permintaan eskalasi staf sedang ditinjau oleh Area Supervisor.
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/ps/requests')}
              className="btn btn-secondary btn-sm"
            >
              Lihat Status
            </button>
          </div>
        )}

        {!rejectedWeek && pendingEscalations.length === 0 && (
          <div style={{ padding: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--success)' }}>✓</span>
            <span>Tidak ada hal yang memerlukan tindakan mendesak saat ini. Semua jadwal berjalan normal.</span>
          </div>
        )}
      </div>
    </div>
  );
};
